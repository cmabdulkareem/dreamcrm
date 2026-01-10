import Brand from "../model/brandModel.js";
import User from "../model/userModel.js";
import mongoose from "mongoose";

// Create a new brand
export const createBrand = async (req, res) => {
  try {
    // Only admins can create brands
    if (!req.user.isAdmin && !req.user.roles.includes('Owner') && !req.user.roles.includes('Admin')) {
      return res.status(403).json({
        message: "Access denied. Only administrators can create brands."
      });
    }

    const { name, description, code, address, phone, email } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: "Brand name is required." });
    }

    if (!code) {
      return res.status(400).json({ message: "Brand code is required." });
    }

    // Check if brand already exists
    const existingBrand = await Brand.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBrand) {
      return res.status(400).json({ message: "A brand with this name already exists." });
    }

    // Check if brand code already exists
    const existingCode = await Brand.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: "A brand with this code already exists." });
    }

    // Create new brand
    const newBrand = new Brand({
      name,
      description: description || "",
      code: code.toUpperCase(),
      themeColor: req.body.themeColor || "#ED1164",
      address: address || "",
      phone: phone || "",
      email: email || "",
      createdBy: req.user.id
    });

    await newBrand.save();

    return res.status(201).json({
      message: "Brand created successfully",
      brand: newBrand
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get all brands
export const getAllBrands = async (req, res) => {
  try {
    const brands = await Brand.find().sort({ name: 1 });

    return res.status(200).json({
      brands
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get brand by ID
export const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brand ID." });
    }

    const brand = await Brand.findById(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    return res.status(200).json({
      brand
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Update brand
export const updateBrand = async (req, res) => {
  try {
    // Only admins can update brands
    if (!req.user.isAdmin && !req.user.roles.includes('Owner') && !req.user.roles.includes('Admin')) {
      return res.status(403).json({
        message: "Access denied. Only administrators can update brands."
      });
    }

    const { id } = req.params;
    const { name, description, code, isActive, address, phone, email } = req.body;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brand ID." });
    }

    // Find brand
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    // Check if another brand with the same name exists
    if (name && name !== brand.name) {
      const existingBrand = await Brand.findOne({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingBrand) {
        return res.status(400).json({ message: "A brand with this name already exists." });
      }

      brand.name = name;
    }

    // Check if another brand with the same code exists
    if (code && code.toUpperCase() !== brand.code) {
      const existingCode = await Brand.findOne({
        code: code.toUpperCase(),
        _id: { $ne: id }
      });

      if (existingCode) {
        return res.status(400).json({ message: "A brand with this code already exists." });
      }

      brand.code = code.toUpperCase();
    }

    // Update fields
    if (description !== undefined) brand.description = description;
    if (req.body.themeColor !== undefined) brand.themeColor = req.body.themeColor;
    if (isActive !== undefined) brand.isActive = isActive;
    if (address !== undefined) brand.address = address;
    if (phone !== undefined) brand.phone = phone;
    if (email !== undefined) brand.email = email;
    brand.updatedAt = Date.now();

    await brand.save();

    return res.status(200).json({
      message: "Brand updated successfully",
      brand
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete brand
export const deleteBrand = async (req, res) => {
  try {
    // Only owners can delete brands
    if (!req.user.roles.includes('Owner')) {
      return res.status(403).json({
        message: "Access denied. Only owners can delete brands."
      });
    }

    const { id } = req.params;

    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid brand ID." });
    }

    // Check if brand exists
    const brand = await Brand.findById(id);
    if (!brand) {
      return res.status(404).json({ message: "Brand not found." });
    }

    // Check if brand is assigned to any users
    const userCount = await User.countDocuments({ brands: id });
    if (userCount > 0) {
      return res.status(400).json({
        message: "Cannot delete brand. It is assigned to one or more users."
      });
    }

    // Delete brand
    await Brand.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Brand deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Assign brands to user
export const assignBrandsToUser = async (req, res) => {
  try {
    // Only admins and owners can assign brands
    const isAdminUser = req.user.isAdmin ||
      req.user.roles.includes('Owner') ||
      req.user.roles.includes('Admin');

    if (!isAdminUser) {
      return res.status(403).json({
        message: "Access denied. Only administrators can assign brands."
      });
    }

    const { userId, brandIds } = req.body;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Validate brand IDs
    if (!Array.isArray(brandIds)) {
      return res.status(400).json({ message: "Brand IDs must be an array." });
    }

    for (const brandId of brandIds) {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res.status(400).json({ message: `Invalid brand ID: ${brandId}` });
      }
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Check if all brands exist
    const brands = await Brand.find({ _id: { $in: brandIds } });
    if (brands.length !== brandIds.length) {
      return res.status(400).json({ message: "One or more brands not found." });
    }

    // Assign brands to user
    user.brands = brandIds;
    await user.save();

    return res.status(200).json({
      message: "Brands assigned to user successfully",
      user
    });
  } catch (error) {
    console.error("Error assigning brands to user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get brands assigned to a user
export const getUserBrands = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }

    // Check if user exists and populate brands
    const user = await User.findById(userId).populate('brands');

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      brands: user.brands || []
    });
  } catch (error) {
    console.error("Error fetching user brands:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};