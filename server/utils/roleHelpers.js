/**
 * Backend role helper functions
 * Provides utilities for checking user roles and permissions
 */

/**
 * Check if user has admin, manager, or counselor privileges
 * Maintains backward compatibility with isAdmin flag
 * As per requirements: existing functionalities should work for admin, manager, and counselor
 */
export function hasAdminOrManagerOrCounsellorAccess(user) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  // Check roles array
  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);

  // Admin roles (Owner, Academic Coordinator)
  if (userRoles.includes('Owner')) return true;

  // Manager roles (Brand Manager, Manager)
  if (userRoles.includes('Brand Manager') || userRoles.includes('Manager')) return true;

  // Counselor role
  if (userRoles.includes('Counsellor') || userRoles.includes('Counselor')) return true;

  return false;
}

/**
 * Check if user has admin privileges (Owner or Admin role, or isAdmin flag)
 */
export function isAdmin(user) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  // Check roles array
  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);

  // Admin roles
  return userRoles.includes('Owner');
}

/**
 * Check if user has owner privileges (Owner role)
 */
export function isOwner(user) {
  if (!user) return false;

  // Check roles array
  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);

  return userRoles.includes('Owner');
}

/**
 * Check if user has a specific role
 */
export function hasRole(user, role) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility with Admin role
  if (user.isAdmin && (role === 'Owner')) {
    return true;
  }

  // Check roles array
  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);
  return userRoles.includes(role);
}

export function hasAnyRole(user, roles) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && (roles.includes('Owner'))) {
    return true;
  }

  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);
  return roles.some(role => userRoles.includes(role));
}

/**
 * Check if user has manager privileges (Owner, Admin, Brand Manager, Manager)
 */
export function isManager(user) {
  if (!user) return false;

  if (isAdmin(user)) return true;

  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);

  return userRoles.includes('Brand Manager') || userRoles.includes('Owner') || userRoles.includes('Manager') || userRoles.includes('Academic Coordinator');
}

/**
 * Check if user has instructor privileges (Instructor role)
 */
export function isInstructor(user) {
  if (!user) return false;

  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);
  return userRoles.includes('Instructor');
}


/**
 * Check if user has counsellor privileges
 */
export function isCounsellor(user) {
  if (!user) return false;

  const userRoles = Array.isArray(user.roles) ? user.roles : (typeof user.roles === 'string' ? [user.roles] : []);
  return userRoles.includes('Counsellor') || userRoles.includes('Counselor');
}
