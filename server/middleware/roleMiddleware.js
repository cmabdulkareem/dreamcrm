/**
 * Role-based access control middleware
 * Provides helpers for checking user roles and permissions
 */

// Role hierarchy - higher roles inherit permissions of lower roles
const ROLE_HIERARCHY = {
  'Owner': 1,
  'Brand Manager': 2,
  'Academic Coordinator': 3,
  'Counsellor': 4,
  'Marketing / Social Media Executive': 6,
  'Instructor': 7,
  'Placement Officer': 8,
  'Lab Assistant': 9,
  'CADD Club Support': 10,
  'Accounts Executive': 11,
  'Front Office / Receptionist': 12,
  'IT Support': 13,
  'Event Coordinator': 14,
  'Housekeeping / Office Assistant': 15,
  'PRO': 16,
  'General': 17
};

// Administrative roles (full system access)
const ADMIN_ROLES = ['Owner'];

// Managerial roles (can manage teams and resources)
const MANAGER_ROLES = ['Owner', 'Brand Manager', 'Academic Coordinator'];

// Roles that should be treated as admin for backward compatibility
const ADMIN_EQUIVALENT_ROLES = ['Owner'];

/**
 * Check if user has a specific role
 * @param {Object} user - The user object
 * @param {String} role - The role to check for
 * @param {String} brandId - Optional brand ID to check brand-specific roles
 */
export function hasRole(user, role, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && ADMIN_EQUIVALENT_ROLES.includes(role)) {
    return true;
  }

  // Check brand-specific roles if brandId is provided
  if (brandId && user.brands) {
    const brandAssociation = user.brands.find(b => {
      const bId = b.brand?._id || b.brand || b;
      return bId.toString() === brandId;
    });

    if (brandAssociation && brandAssociation.roles) {
      return brandAssociation.roles.includes(role);
    }
  }

  return false;
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user, roles, brandId = null) {
  if (!user) return false;
  return roles.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has admin privileges (Owner or Admin role, or isAdmin flag)
 */
export function isAdmin(user, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  // Check for admin roles
  return ADMIN_ROLES.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has manager privileges
 */
export function isManager(user, brandId = null) {
  if (!user) return false;

  // Admins are also managers
  if (isAdmin(user, brandId)) return true;

  return MANAGER_ROLES.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has counselor privileges
 */
export function isCounsellor(user, brandId = null) {
  if (!user) return false;
  return hasRole(user, 'Counsellor', brandId) || hasRole(user, 'Counselor', brandId);
}

/**
 * Get user's highest role level
 */
export function getHighestRoleLevel(user, brandId = null) {
  if (!user) return Infinity;

  let userRoles = [];
  if (brandId && user.brands) {
    const brandAssoc = user.brands.find(b => (b.brand?._id || b.brand || b).toString() === brandId);
    if (brandAssoc && brandAssoc.roles) userRoles = brandAssoc.roles;
  } else if (user.brands && user.brands.length > 0) {
    // If no brandId, check ALL brands for highest role
    user.brands.forEach(b => {
      if (b.roles) userRoles = [...userRoles, ...b.roles];
    });
  }

  if (userRoles.length === 0) return 17; // General level

  let minLevel = 17;
  userRoles.forEach(role => {
    const level = ROLE_HIERARCHY[role];
    if (level && level < minLevel) {
      minLevel = level;
    }
  });

  return minLevel;
}

/**
 * Middleware to check if user has admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const brandId = req.headers['x-brand-id'];
  if (!isAdmin(req.user, brandId)) {
    return res.status(403).json({ message: "Access denied. Admin privileges required." });
  }

  next();
}

/**
 * Middleware to check if user has any of the specified roles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const brandId = req.headers['x-brand-id'];
    if (!hasAnyRole(req.user, allowedRoles, brandId)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
}

/**
 * Middleware to check if user has manager privileges
 */
export function requireManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const brandId = req.headers['x-brand-id'];
  if (!isManager(req.user, brandId)) {
    return res.status(403).json({ message: "Access denied. Manager privileges required." });
  }

  next();
}

