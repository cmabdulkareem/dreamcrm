import monthlyTargetModel from "../model/monthlyTargetModel.js";
import { isAdmin, isOwner } from "../utils/roleHelpers.js";

// Get monthly targets (for current month and upcoming 3 months)
export const getMonthlyTargets = async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Get targets for current month and next 3 months
    const targets = [];
    for (let i = 0; i < 4; i++) {
      const month = (currentMonth + i) % 12;
      const year = currentMonth + i >= 12 ? currentYear + 1 : currentYear;

      const query = {
        year,
        month,
        ...(req.brandFilter?.brand ? { brand: req.brandFilter.brand } : { brand: null })
      };

      const target = await monthlyTargetModel.findOne(query);
      targets.push({
        year,
        month,
        targetRevenue: target?.targetRevenue || null,
        _id: target?._id || null
      });
    }

    return res.status(200).json({
      targets,
      message: "Monthly targets retrieved successfully."
    });
  } catch (error) {
    console.error("Error fetching monthly targets:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Get target for a specific month
export const getTargetByMonth = async (req, res) => {
  try {
    const { year, month } = req.params;

    const query = {
      year: parseInt(year),
      month: parseInt(month),
      ...(req.brandFilter?.brand ? { brand: req.brandFilter.brand } : { brand: null })
    };

    const target = await monthlyTargetModel.findOne(query);

    if (!target) {
      return res.status(404).json({ message: "Target not found for this month." });
    }

    return res.status(200).json({
      target,
      message: "Target retrieved successfully."
    });
  } catch (error) {
    console.error("Error fetching target:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Create or update monthly target (Owner and Admin only)
export const setMonthlyTarget = async (req, res) => {
  try {
    // Check if user is Owner or Admin
    const userIsOwner = isOwner(req.user);
    const userIsAdmin = isAdmin(req.user);

    if (!userIsOwner && !userIsAdmin) {
      return res.status(403).json({
        message: "Access denied. Only Owner and Admin can set monthly targets."
      });
    }

    const { year, month, targetRevenue } = req.body;

    // Validation
    if (!year || month === undefined || !targetRevenue) {
      return res.status(400).json({
        message: "Year, month, and targetRevenue are required."
      });
    }

    if (month < 0 || month > 11) {
      return res.status(400).json({
        message: "Month must be between 0 and 11."
      });
    }

    if (targetRevenue < 0) {
      return res.status(400).json({
        message: "Target revenue must be a positive number."
      });
    }

    const query = {
      year: parseInt(year),
      month: parseInt(month),
      ...(req.brandFilter?.brand ? { brand: req.brandFilter.brand } : { brand: null })
    };

    // Find existing target or create new one
    const existingTarget = await monthlyTargetModel.findOne(query);

    if (existingTarget) {
      // Update existing target
      existingTarget.targetRevenue = targetRevenue;
      existingTarget.updatedBy = req.user.id;
      await existingTarget.save();

      return res.status(200).json({
        target: existingTarget,
        message: "Monthly target updated successfully."
      });
    } else {
      // Create new target
      const newTarget = new monthlyTargetModel({
        year: parseInt(year),
        month: parseInt(month),
        targetRevenue,
        brand: req.brandFilter?.brand || null,
        createdBy: req.user.id,
        updatedBy: req.user.id
      });

      await newTarget.save();

      return res.status(201).json({
        target: newTarget,
        message: "Monthly target created successfully."
      });
    }
  } catch (error) {
    console.error("Error setting monthly target:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Target already exists for this month and brand."
      });
    }
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Delete monthly target (Owner and Admin only)
export const deleteMonthlyTarget = async (req, res) => {
  try {
    // Check if user is Owner or Admin
    const userIsOwner = isOwner(req.user);
    const userIsAdmin = isAdmin(req.user);

    if (!userIsOwner && !userIsAdmin) {
      return res.status(403).json({
        message: "Access denied. Only Owner and Admin can delete monthly targets."
      });
    }

    const { id } = req.params;

    const target = await monthlyTargetModel.findByIdAndDelete(id);

    if (!target) {
      return res.status(404).json({ message: "Target not found." });
    }

    return res.status(200).json({
      message: "Monthly target deleted successfully."
    });
  } catch (error) {
    console.error("Error deleting monthly target:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

