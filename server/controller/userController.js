import userModel from "../model/userModel.js";
import mongoose from "mongoose";
import { hashPassword } from "../helpers/hashPassword.js";
import { comparePassword } from "../helpers/comparePassword.js";
import {validateEmail} from "../validators/validateEmail.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

// Signup user
export const signUpUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, consent } = req.body;

    if (!fullName || !email || !phone || !password || consent === undefined) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await hashPassword(password);

    const newUser = new userModel({
      fullName, email, phone, password: hashedPassword, consent
    });

    await newUser.save();

    return res.status(201).json({ message: "Account created successfully." });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Get users for reporting head dropdown (accessible to all authenticated users)
export const getUsersForDropdown = async (req, res) => {
  try {
    // Fetch only necessary user information for dropdown
    const users = await userModel.find({}, { _id: 1, fullName: 1, email: 1 });
    
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users for dropdown:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Sign in user
export const signInUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email }).populate('reportingHead', 'fullName email');
    if (!user) return res.status(401).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

    if (user.accountStatus !== "Active") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    // Create token with user roles and admin status
    const token = jwt.sign(
      { 
        id: user._id, 
        roles: user.roles,
        isAdmin: user.isAdmin
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: "1d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        phone: user.phone, 
        roles: user.roles, 
        isAdmin: user.isAdmin,
        avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null,
        bloodGroup: user.bloodGroup,
        country: user.country,
        state: user.state,
        reportingHead: user.reportingHead,
        instagram: user.instagram,
        location: user.location
      },
      role: user.roles
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Auth check
export const authCheck = async (req, res) => {
  try {
    console.log('Auth check called with user ID:', req.user.id);
    const user = await userModel.findById(req.user.id).populate('reportingHead', 'fullName email');
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if account is active
    console.log('Account status:', user.accountStatus);
    if (user.accountStatus !== "Active") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    return res.status(200).json({
      user: { 
        id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        phone: user.phone, 
        roles: user.roles, 
        isAdmin: user.isAdmin,
        avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null,
        bloodGroup: user.bloodGroup,
        country: user.country,
        state: user.state,
        reportingHead: user.reportingHead,
        instagram: user.instagram,
        location: user.location
      },
      role: user.roles
    });
  } catch (error) {
    console.error("AuthCheck error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    const users = await userModel.find().populate('reportingHead', 'fullName email');
    
    // Format users with absolute avatar URLs
    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null
    }));
    
    return res.status(200).json({ users: formattedUsers });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update user (admin or own profile)
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id) {
      return res.status(400).json({ message: "User ID is required." });
    }
    const {
      employeeCode,
      fullName,
      email,
      phone,
      gender,
      dob,
      department,
      designation,
      employmentType,
      joiningDate,
      accountStatus,
      roles,
      company,
      instagram,
      location,
      isAdmin,
      bloodGroup,
      country,
      state,
      reportingHead
    } = req.body;

    // Find user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the requesting user is an admin or updating their own profile
    const isAdminUser = req.user.isAdmin;
    const isOwnProfile = req.user.id === id;

    // Regular users can update their own profile information
    console.log('Regular user updating profile:', { fullName, email, phone, gender, dob, bloodGroup, country, state, location, employeeCode, department, designation, employmentType, joiningDate, company, instagram, reportingHead });
    if (isOwnProfile && !isAdminUser) {
      // Update personal information fields
      if (fullName !== undefined) user.fullName = fullName;
      if (email !== undefined) user.email = email;
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      if (dob !== undefined) {
        if (dob === null || dob === "") {
          user.dob = null;
        } else {
          user.dob = new Date(dob);
        }
      }
      if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
      if (country !== undefined) user.country = country;
      if (state !== undefined) user.state = state;
      if (location !== undefined) user.location = location;
      
      // Update work information fields
      if (employeeCode !== undefined) user.employeeCode = employeeCode;
      if (department !== undefined) user.department = department;
      if (designation !== undefined) {
        console.log('Updating designation from', user.designation, 'to', designation);
        user.designation = designation;
      }
      if (employmentType !== undefined) user.employmentType = employmentType;
      if (joiningDate !== undefined) {
        if (joiningDate === null || joiningDate === "") {
          user.joiningDate = null;
        } else {
          user.joiningDate = new Date(joiningDate);
        }
      }
      if (company !== undefined) user.company = company;
      
      // Update social information fields
      if (instagram !== undefined) user.instagram = instagram;
      
      // Removed duplicate field updates
      if (reportingHead !== undefined) {
        // Handle the case where reportingHead is null or empty string
        if (reportingHead === null || reportingHead === "") {
          user.reportingHead = null;
        } else {
          user.reportingHead = reportingHead;
        }
      }
    } else if (isAdminUser) {
      // Admins can update all fields
      // Basic required fields validation
      if (fullName !== undefined && (!fullName || !email || !phone)) {
        return res.status(400).json({ message: "Full name, email, and phone are required." });
      }

      // Email validation
      if (email !== undefined) {
        const emailError = validateEmail(email);
        if (emailError) {
          return res.status(400).json({ message: emailError });
        }
        user.email = email;
      }

      // Update personal information fields
      if (fullName !== undefined) user.fullName = fullName;
      if (email !== undefined) {
        const emailError = validateEmail(email);
        if (emailError) {
          return res.status(400).json({ message: emailError });
        }
        user.email = email;
      }
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      
      // Handle dates
      if (dob !== undefined) {
        if (dob === null || dob === "") {
          user.dob = null;
        } else {
          const dobDate = new Date(dob);
          if (isNaN(dobDate)) {
            return res.status(400).json({ message: "Invalid date of birth." });
          }
          user.dob = dobDate;
        }
      }
      
      if (joiningDate !== undefined) {
        if (joiningDate === null || joiningDate === "") {
          user.joiningDate = null;
        } else {
          const joiningDateObj = new Date(joiningDate);
          if (isNaN(joiningDateObj)) {
            return res.status(400).json({ message: "Invalid joining date." });
          }
          user.joiningDate = joiningDateObj;
        }
      }
      
      // Update work information fields
      if (employeeCode !== undefined) user.employeeCode = employeeCode;
      if (department !== undefined) user.department = department;
      if (designation !== undefined) {
        console.log('Admin updating designation from', user.designation, 'to', designation);
        user.designation = designation;
      }
      if (employmentType !== undefined) user.employmentType = employmentType;
      if (company !== undefined) user.company = company;
      
      // Update account status (admin only)
      if (accountStatus !== undefined) user.accountStatus = accountStatus;
      
      // Only admins can update roles and admin status
      if (roles !== undefined) user.roles = roles;
      if (isAdmin !== undefined) user.isAdmin = isAdmin;
      
      // Update personal details
      if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
      if (country !== undefined) user.country = country;
      if (state !== undefined) user.state = state;
      if (location !== undefined) user.location = location;
      
      // Update social information
      if (instagram !== undefined) user.instagram = instagram;
      
      // Update reporting structure
      if (reportingHead !== undefined) {
        // Handle the case where reportingHead is null or empty string
        if (reportingHead === null || reportingHead === "") {
          user.reportingHead = null;
        } else {
          user.reportingHead = reportingHead;
        }
      }
    } else {
      return res.status(403).json({ message: "Access denied. You can only update your own profile information." });
    }

    // Save updated user
    console.log('Saving user with designation:', user.designation);
    await user.save();
    console.log('User saved. Designation is now:', user.designation);

    // Populate reportingHead before returning
    await user.populate('reportingHead', 'fullName email');
    
    // Return updated user data
    const updatedUser = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      isAdmin: user.isAdmin,
      department: user.department,
      designation: user.designation,
      accountStatus: user.accountStatus,
      instagram: user.instagram,
      location: user.location,
      gender: user.gender,
      dob: user.dob,
      joiningDate: user.joiningDate,
      employmentType: user.employmentType,
      company: user.company,
      employeeCode: user.employeeCode,
      avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null,
      bloodGroup: user.bloodGroup,
      country: user.country,
      state: user.state,
      reportingHead: user.reportingHead
    };
    
    console.log('Returning updated user with designation:', updatedUser.designation);

    return res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Assign roles to user (admin only)
export const assignRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles, isAdmin, accountStatus } = req.body;

    // Check if requesting user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // Find user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update roles and admin status
    if (roles) {
      user.roles = roles;
    }
    
    if (isAdmin !== undefined) {
      user.isAdmin = isAdmin;
    }
    
    // Update account status if provided
    if (accountStatus) {
      user.accountStatus = accountStatus;
    }

    // Save updated user
    await user.save();

    return res.status(200).json({
      message: "User roles updated successfully.",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        roles: user.roles,
        isAdmin: user.isAdmin,
        accountStatus: user.accountStatus
      }
    });

  } catch (error) {
    console.error("Assign roles error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: "lax"
    });
    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};