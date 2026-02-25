import Brand from "../model/brandModel.js";
import User from "../model/userModel.js";
import mongoose from "mongoose";

/**
 * Middleware to check if user has access to a specific brand
 * @param {String} brandIdParam - The name of the route parameter containing the brand ID
 */
export function requireBrandAccess(brandIdParam = 'brandId') {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: "Unauthorized - User not authenticated" });
      }

      // Admins/Owners have access to all brands
      if (req.user.isAdmin) {
        return next();
      }

      // Get the brand ID from route parameters
      const brandId = req.params[brandIdParam];

      if (!brandId) {
        return res.status(400).json({ message: "Brand ID is required" });
      }

      // Check if user has access to this brand
      const user = await User.findById(req.user.id).populate('brands');

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Admins have access to all brands
      if (user.isAdmin) {
        return next();
      }

      // Check if the brand is in the user's assigned brands
      const hasBrandAccess = user.brands && user.brands.some(b => {
        const bId = b.brand?._id || b.brand || b;
        return bId.toString() === brandId;
      });

      if (!hasBrandAccess) {
        return res.status(403).json({
          message: "Access denied. You don't have permission to access this brand."
        });
      }

      next();
    } catch (error) {
      console.error("Error checking brand access:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
}

/**
 * Middleware to filter data based on user's brand access
 * This adds a brandFilter property to the request object
 */
export async function applyBrandFilter(req, res, next) {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }

    const { 'x-brand-id': headerBrandId } = req.headers;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isAdmin = user.isAdmin;

    // If a specific brand is selected in the header
    if (headerBrandId) {
      // Verify user has access to this brand
      if (isAdmin) {
        // Admin/Owner can access any brand
        req.brandFilter = { brand: headerBrandId };
        return next();
      }

      // Regular user must have explicit access
      const hasAccess = user.brands && user.brands.some(b => {
        const bId = b.brand?._id || b.brand || b;
        return bId.toString() === headerBrandId;
      });

      if (hasAccess) {
        req.brandFilter = { brand: headerBrandId };
        req.user = user;
        return next();
      } else {
        return res.status(403).json({ message: "Access denied to selected brand." });
      }
    }

    // Default behavior if NO brand is selected (All Brands view)
    if (isAdmin) {
      console.log(`[DEBUG] applyBrandFilter: User is Global Admin, no filter`);
      req.brandFilter = {}; // No filter for owners/admins seeing "All Brands"
      req.user = user;
      return next();
    }

    // For regular users, filter by their assigned brands
    // If they select "All Brands", they should only see data for brands they are assigned to
    if (user.brands && user.brands.length > 0) {
      const brandIds = user.brands
        .map(b => (b.brand?._id || b.brand || b))
        .filter(id => id); // Remove any nulls

      const objectIdBrands = brandIds.map(id => {
        try {
          return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
        } catch (e) {
          console.error(`[ERROR] Invalid Brand ID in user.brands: ${id}`);
          return null;
        }
      }).filter(id => id);

      console.log(`[DEBUG] applyBrandFilter: Applying $in filter for brands: ${objectIdBrands.join(', ')}`);
      req.brandFilter = { brand: { $in: objectIdBrands } };
    } else {
      console.warn(`[WARN] applyBrandFilter: User has no brands assigned!`);
      // If user has no brands assigned, they can't see any brand-specific data
      req.brandFilter = { _id: null }; // This will match nothing
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error applying brand filter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/**
 * Check if user has access to a specific brand
 * @param {Object} user - The user object
 * @param {String} brandId - The brand ID to check access for
 * @returns {Boolean} - True if user has access, false otherwise
 */
export async function userHasBrandAccess(user, brandId) {
  try {
    // Check if user object is valid
    if (!user || !user.id) {
      return false;
    }

    // Admins have access to all brands
    if (user.isAdmin) {
      return true;
    }

    // For regular users, check their assigned brands
    const dbUser = await User.findById(user.id).populate('brands');

    if (!dbUser) {
      return false;
    }

    // Check if the brand is in the user's assigned brands
    return dbUser.brands && dbUser.brands.some(b => {
      const bId = b.brand?._id || b.brand || b;
      return bId.toString() === brandId;
    });
  } catch (error) {
    console.error("Error checking brand access:", error);
    return false;
  }
}

export default {
  requireBrandAccess,
  applyBrandFilter,
  userHasBrandAccess
};