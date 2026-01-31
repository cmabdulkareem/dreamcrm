import userModel from "../model/userModel.js";
import brandModel from "../model/brandModel.js"; // Ensure Brand model is registered
import mongoose from "mongoose";

// Helper to get base URL with correct protocol (checking for proxy)
const getBaseUrl = (req) => {
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  return `${protocol}://${req.get('host')}`;
};
import { hashPassword } from "../helpers/hashPassword.js";
import { comparePassword } from "../helpers/comparePassword.js";
import { validateEmail } from "../validators/validateEmail.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { isAdmin, isOwner, isManager } from "../utils/roleHelpers.js";
import crypto from "crypto";
import { getFrontendUrl } from "../utils/urlHelper.js";
dotenv.config();

// Student Signup (Student Portal)
export const studentSignup = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required." });

    const lowerEmail = email.toLowerCase();

    // 1. Check if email exists in Student records
    const studentModels = await import("../model/studentModel.js");
    const Student = studentModels.default;
    const studentRecord = await Student.findOne({ email: new RegExp(`^${lowerEmail}$`, 'i') });

    if (!studentRecord) {
      return res.status(404).json({ message: "No student record found with this email. Please contact administration." });
    }

    // 2. Check if User account already exists
    let user = await userModel.findOne({ email: lowerEmail });

    // Generate random password
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    password += "A1a!";
    const hashedPassword = await hashPassword(password);

    if (user) {
      // If user exists, check if they are already a student
      if (user.roles.includes("Student")) {
        // Reset password and resend
        user.password = hashedPassword;
        await user.save();

        // Send email
        const emailService = await import('../utils/emailService.js');
        await emailService.default.sendStudentCredentialsEmail(user, password);

        return res.status(200).json({ message: "Credentials reset and sent to your email." });
      } else {
        // User exists but not a student (e.g. Staff). 
        // For now, prevent overwriting staff accounts via this public route.
        return res.status(400).json({ message: "An account exists but is not marked as a Student. Please contact admin." });
      }
    }

    // 4. Create User if not exists
    const newUser = new userModel({
      fullName: studentRecord.fullName,
      email: lowerEmail,
      phone: studentRecord.phone1,
      password: hashedPassword,
      consent: true,
      accountStatus: "Active",
      roles: ["Student"],
      designation: "Student",
      gender: studentRecord.gender || "notDisclosed",
      dob: studentRecord.dob,
      dob: studentRecord.dob,
      location: studentRecord.place || "Unknown",
      mustChangePassword: true // Force password change for new student accounts
    });

    await newUser.save();

    // 5. Send credentials via email
    try {
      const emailService = await import('../utils/emailService.js');
      await emailService.default.sendStudentCredentialsEmail(newUser, password);
    } catch (emailError) {
      console.error("Failed to send student credentials:", emailError);
      // We still return success but maybe warn?
    }

    return res.status(201).json({ message: "Account created! Check your email for login credentials." });

  } catch (error) {
    console.error("Student signup error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Signup user (Admin/General)
export const signUpUser = async (req, res) => {
  try {
    const { fullName, email, phone, password, consent } = req.body;

    if (!fullName || !email || !phone || !password || consent === undefined) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Check if this is the first user
    const userCount = await userModel.countDocuments();
    const isFirstUser = userCount === 0;

    const hashedPassword = await hashPassword(password);

    const newUser = new userModel({
      fullName,
      email,
      phone,
      password: hashedPassword,
      consent,
      // Auto-approve first user and make them admin
      accountStatus: isFirstUser ? "Active" : "Pending",
      isAdmin: isFirstUser,
      roles: isFirstUser ? ["Owner"] : ["General"]
    });

    await newUser.save();

    // Send welcome email to the new user
    try {
      const emailService = await import('../utils/emailService.js');
      await emailService.default.sendWelcomeEmail(newUser);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
    }

    return res.status(201).json({
      message: "User created successfully",
      isFirstUser
    });
  } catch (error) {
    console.error("Signup error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get users for dropdown (filtered by brand and/or roles)
export const getUsersForDropdown = async (req, res) => {
  try {
    const { brandId, roles, scope } = req.query;

    // Build query object
    const query = {};

    // Only include active users in assignment dropdowns
    query.accountStatus = 'Active';

    // Filter by roles if provided
    if (roles) {
      const roleArray = roles.split(',').map(r => r.trim());
      query.roles = { $in: roleArray };
    }

    // Fetch only necessary user information for dropdown
    const users = await userModel.find(query, {
      _id: 1,
      fullName: 1,
      email: 1,
      avatar: 1,
      gender: 1,
      bloodGroup: 1,
      country: 1,
      state: 1,
      reportingHead: 1,
      instagram: 1,
      location: 1,
      dob: 1,
      designation: 1,
      brands: 1,
      roles: 1 // Include roles
    });

    // Filter users by brand if brandId is provided
    // (We do this in JS because brands involves array matching which can be tricky if not all users have brands array populated/consistent)
    let filteredUsers = users;

    // Check for global scope access (Admin/Owner/Manager only)
    const canAccessGlobal = isAdmin(req.user) || isOwner(req.user) || isManager(req.user);
    if (scope === 'global' && canAccessGlobal) {
      // If scope is global and user has permission, do NOT filter by brand
      filteredUsers = users;
    } else if (brandId) {
      filteredUsers = users.filter(user => {
        const userBrandIds = (user.brands || []).map(b => b.toString());
        return userBrandIds.includes(brandId);
      });
    }

    // Format avatar URLs if they exist
    const formattedUsers = filteredUsers.map(user => ({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      country: user.country,
      state: user.state,
      reportingHead: user.reportingHead,
      instagram: user.instagram,
      location: user.location,
      dob: user.dob,
      designation: user.designation,
      brands: user.brands || [],
      roles: user.roles || []
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
    const user = await userModel.findOne({ email }).populate('reportingHead', 'fullName email').populate('brands');
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
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        email: user.email
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
      token, // Return token for debugging/fallback
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isAdmin: user.isAdmin,
        avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null,
        bloodGroup: user.bloodGroup,
        country: user.country,
        state: user.state,
        reportingHead: user.reportingHead,
        instagram: user.instagram,
        location: user.location,
        gender: user.gender,
        dob: user.dob,
        designation: user.designation,
        accountStatus: user.accountStatus,
        employeeCode: user.employeeCode, // Include employeeCode
        mustChangePassword: user.mustChangePassword, // Include flag
        brands: user.brands || [] // Include brands in login response
      },
      role: user.roles
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Reset password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Check if token and new password are provided
    if (!token || !newPassword) {
      return res.status(400).json({ message: "Token and new password are required" });
    }

    // Hash the token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token and check if it's not expired
    const user = await userModel.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset token is invalid or has expired" });
    }

    // Validate password strength
    if (newPassword.length < 8 ||
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}/.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, and include uppercase, lowercase, number, and special character."
      });
    }

    // Hash and set new password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    return res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Change Password (Logged in user)
export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Validate password strength again (optional but good practice)
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};':"\\|,.<>/?]).{8,}/.test(newPassword)) {
      return res.status(400).json({
        message: "Password must be at least 8 characters long, and include uppercase, lowercase, number, and special character."
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.mustChangePassword = false; // Turn off the flag

    await user.save();

    return res.status(200).json({ message: "Password updated successfully." });

  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Auth check
export const authCheck = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).populate('reportingHead', 'fullName email').populate('brands');
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if account is active
    if (user.accountStatus !== "Active") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    // Refresh token to ensure latest roles/permissions are in the session
    const token = jwt.sign(
      {
        id: user._id,
        roles: user.roles,
        isAdmin: user.isAdmin,
        fullName: user.fullName,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    });

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        roles: user.roles,
        isAdmin: user.isAdmin,
        avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null,
        bloodGroup: user.bloodGroup,
        country: user.country,
        state: user.state,
        reportingHead: user.reportingHead,
        instagram: user.instagram,
        location: user.location,
        gender: user.gender,
        dob: user.dob,
        designation: user.designation,
        accountStatus: user.accountStatus,
        employeeCode: user.employeeCode, // Include employeeCode
        brands: user.brands || [] // Include brand information
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
    console.log("getAllUsers called. User:", req.user ? { id: req.user.id, roles: req.user.roles, isAdmin: req.user.isAdmin } : "No user");

    // Check if user is admin (backward compatible)
    if (!isAdmin(req.user)) {
      console.log("getAllUsers: Access denied. isAdmin returned false.");
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    const users = await userModel.find()
      .populate('reportingHead', 'fullName email')
      .populate('brands')
      .sort({ createdAt: -1 });
    console.log(`getAllUsers: Found ${users.length} users.`);

    // Format users with absolute avatar URLs
    const formattedUsers = users.map(user => ({
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      roles: user.roles,
      isAdmin: user.isAdmin,
      location: user.location,
      instagram: user.instagram,
      gender: user.gender,
      dob: user.dob,
      designation: user.designation,
      bloodGroup: user.bloodGroup,
      country: user.country,
      state: user.state,
      reportingHead: user.reportingHead,
      brands: user.brands || [], // Include brand information
      avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null,
      accountStatus: user.accountStatus,
      // Added missing employee fields
      employeeCode: user.employeeCode,
      department: user.department,
      employmentType: user.employmentType,
      joiningDate: user.joiningDate,
      company: user.company,
      createdAt: user.createdAt,
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

    // Validate that ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID format." });
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
      isAdmin: isAdminValue,
      bloodGroup,
      country,
      state,
      reportingHead,
      brands // Add brands to destructuring
    } = req.body;

    // Find user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the requesting user is an admin or updating their own profile
    const isAdminUser = req.user.isAdmin || (req.user.roles && req.user.roles.includes('Owner'));
    const isOwnProfile = req.user.id === id;

    // Regular users can update their own profile information
    // Only log the fields that are actually being updated
    const updateFields = {};
    if (instagram !== undefined) updateFields.instagram = instagram;
    if (location !== undefined) updateFields.location = location;
    if (bloodGroup !== undefined) updateFields.bloodGroup = bloodGroup;
    if (country !== undefined) updateFields.country = country;
    if (state !== undefined) updateFields.state = state;
    if (designation !== undefined) updateFields.designation = designation;
    if (gender !== undefined) updateFields.gender = gender;
    if (dob !== undefined) updateFields.dob = dob;

    if (isOwnProfile && !isAdminUser) {
      // Update personal information fields
      if (fullName !== undefined) user.fullName = fullName;
      if (email !== undefined) user.email = email.toLowerCase(); // Apply lowercase conversion
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      if (dob !== undefined) {
        if (dob === null || dob === "") {
          user.dob = null;
        } else {
          // Validate date format before parsing
          if (!/\d{4}-\d{2}-\d{2}/.test(dob) && !/\d{4}-\d{2}-\d{2}T/.test(dob)) {
            console.warn('Invalid date format for dob:', dob);
            // Don't fail the request, just don't update the date
          } else {
            try {
              user.dob = new Date(dob);
            } catch (dateError) {
              console.error('Error parsing date of birth:', dateError);
              // Don't fail the request, just don't update the date
            }
          }
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
        user.designation = designation;
      }
      if (employmentType !== undefined) user.employmentType = employmentType;
      if (joiningDate !== undefined) {
        if (joiningDate === null || joiningDate === "") {
          user.joiningDate = null;
        } else {
          // Validate date format before parsing
          if (!/\d{4}-\d{2}-\d{2}/.test(joiningDate) && !/\d{4}-\d{2}-\d{2}T/.test(joiningDate)) {
            console.warn('Invalid date format for joiningDate:', joiningDate);
            // Don't fail the request, just don't update the date
          } else {
            try {
              user.joiningDate = new Date(joiningDate);
            } catch (dateError) {
              console.error('Error parsing joining date:', dateError);
              // Don't fail the request, just don't update the date
            }
          }
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
          // Validate that reportingHead is a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(reportingHead)) {
            user.reportingHead = reportingHead;
          } else {
            console.warn('Invalid reportingHead ID provided:', reportingHead);
            // Don't fail the request, just don't update the reportingHead
          }
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
        const emailValidationError = validateEmail(email);
        if (emailValidationError) {
          return res.status(400).json({ message: emailValidationError });
        }
        // Convert email to lowercase to match schema behavior
        const lowerCaseEmail = email.toLowerCase();
        // Check if email is already taken by another user
        const existingUser = await userModel.findOne({ email: lowerCaseEmail, _id: { $ne: id } });
        if (existingUser) {
          return res.status(400).json({ message: "Email is already taken by another user." });
        }
      }

      // Update personal information fields
      if (fullName !== undefined) user.fullName = fullName;
      if (email !== undefined) user.email = email.toLowerCase(); // Apply lowercase conversion
      if (phone !== undefined) user.phone = phone;
      if (gender !== undefined) user.gender = gender;
      if (dob !== undefined) {
        if (dob === null || dob === "") {
          user.dob = null;
        } else {
          // Validate date format before parsing
          if (!/\d{4}-\d{2}-\d{2}/.test(dob) && !/\d{4}-\d{2}-\d{2}T/.test(dob)) {
            console.warn('Invalid date format for dob:', dob);
            // Don't fail the request, just don't update the date
          } else {
            try {
              user.dob = new Date(dob);
            } catch (dateError) {
              console.error('Error parsing date of birth:', dateError);
              // Don't fail the request, just don't update the date
            }
          }
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
        user.designation = designation;
      }
      if (employmentType !== undefined) user.employmentType = employmentType;
      if (joiningDate !== undefined) {
        if (joiningDate === null || joiningDate === "") {
          user.joiningDate = null;
        } else {
          // Validate date format before parsing
          if (!/\d{4}-\d{2}-\d{2}/.test(joiningDate) && !/\d{4}-\d{2}-\d{2}T/.test(joiningDate)) {
            console.warn('Invalid date format for joiningDate:', joiningDate);
            // Don't fail the request, just don't update the date
          } else {
            try {
              const joiningDateObj = new Date(joiningDate);
              if (isNaN(joiningDateObj)) {
                return res.status(400).json({ message: "Invalid joining date." });
              }
              user.joiningDate = joiningDateObj;
            } catch (dateError) {
              console.error('Error parsing joining date:', dateError);
              return res.status(400).json({ message: "Invalid joining date format." });
            }
          }
        }
      }

      // Update work information fields
      if (employeeCode !== undefined) user.employeeCode = employeeCode;
      if (department !== undefined) user.department = department;
      if (designation !== undefined) {
        user.designation = designation;
      }
      if (employmentType !== undefined) user.employmentType = employmentType;
      if (company !== undefined) user.company = company;

      // Update account status (admin only)
      if (accountStatus !== undefined) user.accountStatus = accountStatus;

      // Only admins can update roles and admin status
      if (roles !== undefined) user.roles = roles;
      if (isAdminValue !== undefined) user.isAdmin = isAdminValue;

      // Update personal details
      if (bloodGroup !== undefined) user.bloodGroup = bloodGroup;
      if (country !== undefined) user.country = country;
      if (state !== undefined) user.state = state;
      if (location !== undefined) user.location = location;

      // Update brand associations
      if (brands !== undefined) {
        // Validate that brands is an array
        if (!Array.isArray(brands)) {
          return res.status(400).json({ message: "Brands must be an array of brand IDs." });
        }

        // Validate each brand ID
        for (const brandId of brands) {
          if (!mongoose.Types.ObjectId.isValid(brandId)) {
            return res.status(400).json({ message: `Invalid brand ID: ${brandId}` });
          }
        }

        user.brands = brands;
      }

      // Update social information
      if (instagram !== undefined) user.instagram = instagram;

      // Update reporting structure
      if (reportingHead !== undefined) {
        // Handle the case where reportingHead is null or empty string
        if (reportingHead === null || reportingHead === "") {
          user.reportingHead = null;
        } else {
          // Validate that reportingHead is a valid ObjectId
          if (mongoose.Types.ObjectId.isValid(reportingHead)) {
            user.reportingHead = reportingHead;
          } else {
            return res.status(400).json({ message: "Invalid reporting head ID." });
          }
        }
      }
    } else {
      return res.status(403).json({ message: "Access denied. You can only update your own profile." });
    }

    // Save updated user
    await user.save();

    // Populate reportingHead for the response
    await user.populate('reportingHead', 'fullName email');

    // Format user data for response
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
      avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null,
      bloodGroup: user.bloodGroup,
      country: user.country,
      state: user.state,
      reportingHead: user.reportingHead
    };


    return res.status(200).json({
      message: "User updated successfully.",
      user: updatedUser
    });

  } catch (error) {
    console.error("Update user error:", error);
    // Provide more specific error message based on error type
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error: " + error.message });
    } else if (error.name === 'CastError') {
      return res.status(400).json({ message: "Invalid data format: " + error.message });
    } else if (error.code === 11000) {
      // Duplicate key error
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ message: `Duplicate ${duplicateField}. This ${duplicateField} is already taken.` });
    } else {
      return res.status(500).json({ message: "Server error. Please try again." });
    }
  }
};

// Assign roles to user (admin only)
export const assignRoles = async (req, res) => {
  try {
    const { id } = req.params;
    const { roles, isAdmin: isAdminValue, accountStatus, brands } = req.body;

    // Check if requesting user is admin
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update roles and admin status
    if (roles) {
      user.roles = roles;
    }

    if (isAdminValue !== undefined) {
      user.isAdmin = isAdminValue;
    }

    // Update account status if provided
    if (accountStatus !== undefined) {
      user.accountStatus = accountStatus;
    }

    // Update brands if provided
    if (brands !== undefined) {
      user.brands = brands;
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
        accountStatus: user.accountStatus,
        brands: user.brands
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
      avatar: user.avatar ? `${getBaseUrl(req)}${user.avatar}` : null
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

// Get online users
export const getOnlineUsers = async (req, res) => {
  try {
    const { getOnlineUsers } = await import('../utils/onlineStatusManager.js');
    const onlineUsers = getOnlineUsers();
    return res.status(200).json({ onlineUsers });
  } catch (error) {
    console.error("Error getting online users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if requesting user is admin (backward compatible)
    if (!isAdmin(req.user)) {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    // Prevent deletion of self
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
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ message: "If your email exists in our system, you will receive a password reset link shortly." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token expiration (1 hour)
    const resetPasswordExpires = Date.now() + 60 * 60 * 1000;

    // Save token and expiration to user
    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();


    // Send response immediately to prevent timeout
    res.status(200).json({ message: "Password reset link sent to your email." });

    // Validate email configuration
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('ERROR: Email credentials (EMAIL_USER or EMAIL_PASS) are not configured!');
      return;
    }

    // Get frontend URL dynamically from CORS config based on request origin
    const frontendUrl = getFrontendUrl(req);
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const emailService = await import('../utils/emailService.js');

    // Send email in background without blocking response
    emailService.default.sendPasswordResetEmail(user, resetUrl)
      .then(() => {
      })
      .catch((emailError) => {
        console.error('❌ Failed to send password reset email to:', user.email);
        console.error('Email error details:', emailError.message);
        console.error('Full error:', emailError);
        // Note: We've already responded to the user, so we just log the error
        // In production, you might want to implement a retry mechanism or queue
      });

  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
