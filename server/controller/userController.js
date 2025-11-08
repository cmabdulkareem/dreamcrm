import userModel from "../model/userModel.js";
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

// Sign in user
export const signInUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await userModel.findOne({ email });
    if (!user) return res.status(401).json({ message: "User not found" });

    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ message: "Invalid password" });

    if (user.accountStatus !== "Active") {
      return res.status(403).json({ message: "Account not approved yet" });
    }

    const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, roles: user.roles, avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null },
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
    const user = await userModel.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({
      user: { id: user._id, fullName: user.fullName, email: user.email, phone: user.phone, roles: user.roles, avatar: user.avatar ? `${req.protocol}://${req.get('host')}${user.avatar}` : null, isAdmin: user.isAdmin },
      role: user.roles
    });
  } catch (error) {
    console.error("AuthCheck error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find();
    return res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
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
      location
    } = req.body;

    // Basic required fields validation
    if (!fullName || !email || !phone) {
      return res.status(400).json({ message: "Full name, email, and phone are required." });
    }

    // Email validation
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    // Find user by ID
    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if the requesting user is an admin or updating their own profile
    const isAdmin = req.user.isAdmin || (Array.isArray(req.user.roles) && req.user.roles.includes('Admin')) || (typeof req.user.roles === 'string' && req.user.roles === 'Admin');
    const isOwnProfile = req.user.id === id;

    // If user is updating their own profile, only allow Instagram and location updates
    if (isOwnProfile && !isAdmin) {
      // Only update Instagram and location for non-admin users editing their own profile
      user.instagram = instagram ?? user.instagram;
      user.location = location ?? user.location;
    } else {
      // Admins can update all fields
      user.employeeCode = employeeCode ?? user.employeeCode;
      user.fullName = fullName ?? user.fullName;
      user.email = email ?? user.email;
      user.phone = phone ?? user.phone;
      user.gender = gender ?? user.gender;

      // Handle dates
      if (dob) {
        const dobDate = new Date(dob);
        if (isNaN(dobDate)) {
          return res.status(400).json({ message: "Invalid date of birth." });
        }
        user.dob = dobDate;
      }

      if (joiningDate) {
        const joiningDateObj = new Date(joiningDate);
        if (isNaN(joiningDateObj)) {
          return res.status(400).json({ message: "Invalid joining date." });
        }
        user.joiningDate = joiningDateObj;
      }

      user.department = department ?? user.department;
      user.designation = designation ?? user.designation;
      user.employmentType = employmentType ?? user.employmentType;
      user.accountStatus = accountStatus ?? user.accountStatus;
      user.roles = roles ?? user.roles;
      user.company = company ?? user.company;
      user.instagram = instagram ?? user.instagram;
      user.location = location ?? user.location;
    }

    // Save updated user
    await user.save();

    return res.status(200).json({
      message: "User updated successfully.",
      user
    });

  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.clearCookie("token");
    return res.status(200).json({ message: "Logout successful." });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({ message: "Server error. Please try again." });
  }
};