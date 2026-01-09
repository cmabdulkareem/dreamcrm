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
 */
export function hasRole(user, role) {
  if (!user || !user.roles) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && ADMIN_EQUIVALENT_ROLES.includes(role)) {
    return true;
  }

  // Check roles array
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return userRoles.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user, roles) {
  if (!user || !user.roles) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && roles.some(role => ADMIN_EQUIVALENT_ROLES.includes(role))) {
    return true;
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has admin privileges (Owner or Admin role, or isAdmin flag)
 */
export function isAdmin(user) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  // Check for admin roles
  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return userRoles.some(role => ADMIN_ROLES.includes(role));
}

/**
 * Check if user has manager privileges
 */
export function isManager(user) {
  if (!user) return false;

  // Admins are also managers
  if (isAdmin(user)) return true;

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return userRoles.some(role => MANAGER_ROLES.includes(role));
}

/**
 * Check if user has counselor privileges
 */
export function isCounsellor(user) {
  if (!user) return false;

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  return userRoles.includes('Counsellor') || userRoles.includes('Counselor');
}

/**
 * Get user's highest role level
 */
export function getHighestRoleLevel(user) {
  if (!user || !user.roles) return Infinity;

  const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles];
  let minLevel = Infinity;

  userRoles.forEach(role => {
    const level = ROLE_HIERARCHY[role];
    if (level && level < minLevel) {
      minLevel = level;
    }
  });

  return minLevel === Infinity ? 17 : minLevel; // Default to General level
}

/**
 * Middleware to check if user has admin privileges
 */
export function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isAdmin(req.user)) {
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

    if (!hasAnyRole(req.user, allowedRoles)) {
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

  if (!isManager(req.user)) {
    return res.status(403).json({ message: "Access denied. Manager privileges required." });
  }

  next();
}

