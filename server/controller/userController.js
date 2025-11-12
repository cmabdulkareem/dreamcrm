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
    const users = await userModel.find({}, { _id: 1, fullName: 1, email: 1, avatar: 1 });
    
    // Format avatar URLs if they exist
    const formattedUsers = users.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null
    }));
    
    return res.status(200).json({ users: formattedUsers });
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

    // Set cookie with more compatible settings for production
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Only secure in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-site cookies in production
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
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
    const user = await userModel.findById(req.user.id).populate('reportingHead', 'fullName email');
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if account is active
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
    
    // Prevent password updates through this endpoint for security reasons
    if (req.body.password !== undefined) {
      return res.status(400).json({ message: "Password cannot be updated through this endpoint. Please use the change password functionality." });
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
      // Admins can update all fields except password
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
    // Mark user as offline before logout
    if (req.user && req.user.id) {
      const { markUserOffline } = await import('../utils/onlineStatusManager.js');
      markUserOffline(req.user.id);
    }
    
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Mark user as online
export const markUserOnlineStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { markUserOnline } = await import('../utils/onlineStatusManager.js');
    const user = await userModel.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Mark user as online with user data
    markUserOnline(req.user.id, {
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null
    });
    
    return res.status(200).json({ message: "User marked as online" });
  } catch (error) {
    console.error("Error marking user as online:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Mark user as offline
export const markUserOfflineStatus = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { markUserOffline } = await import('../utils/onlineStatusManager.js');
    markUserOffline(req.user.id);
    
    return res.status(200).json({ message: "User marked as offline" });
  } catch (error) {
    console.error("Error marking user as offline:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Handle offline beacon (for page unload)
export const handleOfflineBeacon = async (req, res) => {
  try {
    // This endpoint handles sendBeacon requests during page unload
    // Try to get userId from token first (if available), then from request body
    let userId = null;
    
    // Try to verify token if available
    try {
      const token = req.cookies?.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.substring(7) : null);
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      }
    } catch (err) {
      // Token not available or invalid, try request body
    }
    
    // Fallback to request body if token not available
    if (!userId && req.body && req.body.userId) {
      userId = req.body.userId;
    }
    
    if (userId) {
      const { markUserOffline } = await import('../utils/onlineStatusManager.js');
      markUserOffline(userId);
    }
    
    // Always return 200 for beacon requests (they don't wait for response)
    return res.status(200).json({ message: "Offline status updated" });
  } catch (error) {
    console.error("Error handling offline beacon:", error);
    // Still return 200 to not break the beacon
    return res.status(200).json({ message: "Offline status updated" });
  }
};

// Get all online users
export const getOnlineUsers = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const { getOnlineUsers: getOnlineUsersList } = await import('../utils/onlineStatusManager.js');
    const onlineUsersList = getOnlineUsersList();
    
    return res.status(200).json({ onlineUsers: onlineUsersList });
  } catch (error) {
    console.error("Error fetching online users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }
    
    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    
    // Find and delete user
    const user = await userModel.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    return res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
