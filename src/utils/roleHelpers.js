/**
 * Frontend role helper functions
 * Provides utilities for checking user roles and permissions
 */

// Administrative roles (full system access)
const ADMIN_ROLES = ['Owner', 'Admin'];

// Managerial roles (can manage teams and resources)
const MANAGER_ROLES = ['Owner', 'Admin', 'Center Head / Manager', 'Manager'];

/**
 * Check if user has a specific role
 */
export function hasRole(user, role) {
  if (!user) return false;
  
  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && ADMIN_ROLES.includes(role)) {
    return true;
  }
  
  // Check roles array
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.includes(role);
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user, roles) {
  if (!user) return false;
  
  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && roles.some(role => ADMIN_ROLES.includes(role))) {
    return true;
  }
  
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return roles.some(role => rolesArray.includes(role));
}

/**
 * Check if user has admin privileges (Owner or Admin role, or isAdmin flag)
 */
export function isAdmin(user) {
  if (!user) return false;
  
  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;
  
  // Check for admin roles
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.some(role => ADMIN_ROLES.includes(role));
}

/**
 * Check if user has manager privileges
 */
export function isManager(user) {
  if (!user) return false;
  
  // Admins are also managers
  if (isAdmin(user)) return true;
  
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.some(role => MANAGER_ROLES.includes(role));
}

/**
 * Check if user has counselor privileges
 */
export function isCounsellor(user) {
  if (!user) return false;
  
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.includes('Counsellor') || rolesArray.includes('Counselor');
}

/**
 * Get all user roles as an array
 */
export function getUserRoles(user) {
  if (!user) return [];
  
  const userRoles = user.roles || [];
  return Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
}

