/**
 * Frontend role helper functions
 * Provides utilities for checking user roles and permissions
 */

// Administrative roles (full system access)
const ADMIN_ROLES = ['Owner'];

// Managerial roles (can manage teams and resources)
const MANAGER_ROLES = ['Owner', 'Brand Manager', 'Manager', 'Academic Coordinator'];

// Finance roles
const ACCOUNTANT_ROLES = ['Owner', 'Accounts Executive', 'Brand Manager'];

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

  if (isAdmin(user)) return true;

  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.some(role => MANAGER_ROLES.includes(role));
}

/**
 * Check if user has academic coordinator privileges
 */
export function isAcademicCoordinator(user) {
  if (!user) return false;
  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.includes('Academic Coordinator');
}

/**
 * Check if user has owner privileges (Owner role only)
 */
export function isOwner(user) {
  if (!user) return false;

  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.includes('Owner');
}

/**
 * Check if user has counselor privileges
 */
export function isCounsellor(user) {
  if (!user) return false;

  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.includes('Counsellor') || rolesArray.includes('Counselor') || rolesArray.includes('Academic Counsellor') || rolesArray.includes('Academic Coordinator');
}

/**
 * Get all user roles as an array
 */
export function getUserRoles(user) {
  if (!user) return [];

  const userRoles = user.roles || [];
  return Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
}

/**
 * Check if user has accountant privileges
 */
export function isAccountant(user) {
  if (!user) return false;

  // Admins are also accountants in this context
  if (isAdmin(user)) return true;

  const userRoles = user.roles || [];
  const rolesArray = Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
  return rolesArray.some(role => ACCOUNTANT_ROLES.includes(role));
}

/*
 * Check if user is the designated developer (by email)
 */
export function isDeveloper(user) {
  return user?.email === 'cmabdulkareem@gmail.com';
}
