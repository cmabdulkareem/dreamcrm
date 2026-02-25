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
        month
      };

      if (req.brandFilter) {
        // If brand filter is present, apply it
        // If brand filter is {}, it matches all brands
        // If brand filter is { brand: ID }, matches that brand
        // If brand filter is { brand: { $in: [] } }, matches those
        Object.assign(query, req.brandFilter);
      }

      const matchingTargets = await monthlyTargetModel.find(query);
      const totalRevenue = matchingTargets.reduce((sum, t) => sum + (t.targetRevenue || 0), 0);

      // If we have mixed targets, we can't easily return a single _id for editing.
      // If there is exactly one target, we return its _id.
      // Otherwise null (which means check frontend behavior for editing).
      const singleId = matchingTargets.length === 1 ? matchingTargets[0]._id : null;

      targets.push({
        year,
        month,
        targetRevenue: matchingTargets.length > 0 ? totalRevenue : null, // If no targets found, return null so frontend defaults
        _id: singleId
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
      month: parseInt(month)
    };

    if (req.brandFilter) {
      Object.assign(query, req.brandFilter);
    }

    const matchingTargets = await monthlyTargetModel.find(query);

    if (matchingTargets.length === 0) {
      return res.status(404).json({ message: "Target not found for this month." });
    }

    const totalRevenue = matchingTargets.reduce((sum, t) => sum + (t.targetRevenue || 0), 0);
    const singleId = matchingTargets.length === 1 ? matchingTargets[0]._id : null;

    // Construct a composite target object
    const target = {
      year: parseInt(year),
      month: parseInt(month),
      targetRevenue: totalRevenue,
      _id: singleId
    };

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
    const brandId = req.headers['x-brand-id'];
    // Check if user is Owner or Admin
    const userIsOwner = isOwner(req.user, brandId);
    const userIsAdmin = isAdmin(req.user, brandId);

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

    // Validate Brand context
    if (!req.brandFilter || !req.brandFilter.brand || typeof req.brandFilter.brand !== 'string') {
      return res.status(400).json({
        message: "Targets must be set for a specific brand. Please select a brand first."
      });
    }

    const filterBrandId = req.brandFilter.brand;

    const query = {
      year: parseInt(year),
      month: parseInt(month),
      brand: filterBrandId
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
        brand: brandId,
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
    const brandId = req.headers['x-brand-id'];
    // Check if user is Owner or Admin
    const userIsOwner = isOwner(req.user, brandId);
    const userIsAdmin = isAdmin(req.user, brandId);

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

