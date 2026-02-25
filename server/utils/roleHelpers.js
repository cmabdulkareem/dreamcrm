/**
 * Backend role helper functions
 * Provides utilities for checking user roles and permissions
 */

/**
 * Check if user has admin, manager, or counselor privileges
 * Maintains backward compatibility with isAdmin flag
 * @param {Object} user - User object
 * @param {String} brandId - Optional brand ID context
 */
export function hasAdminOrManagerOrCounsellorAccess(user, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  const BRAND_ADMIN_ROLES = ['Owner', 'Brand Manager', 'Manager', 'Counsellor', 'Counselor'];

  // Check brand-specific roles
  if (brandId && user.brands) {
    const brandAssoc = user.brands.find(b => (b.brand?._id || b.brand || b).toString() === brandId);
    if (brandAssoc && brandAssoc.roles) {
      if (BRAND_ADMIN_ROLES.some(role => brandAssoc.roles.includes(role))) return true;
    }
  }

  return false;
}

/**
 * Check if user has admin privileges (Owner or Admin role, or isAdmin flag)
 */
export function isAdmin(user, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin) return true;

  return hasRole(user, 'Owner', brandId);
}

/**
 * Check if user has owner privileges (Owner role)
 */
export function isOwner(user, brandId = null) {
  if (!user) return false;
  return hasRole(user, 'Owner', brandId);
}

/**
 * Check if user has a specific role
 */
export function hasRole(user, role, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && (role === 'Owner' || role === 'Admin')) {
    return true;
  }

  // Check brand-specific roles
  if (brandId && user.brands) {
    const brandAssoc = user.brands.find(b => (b.brand?._id || b.brand || b).toString() === brandId);
    if (brandAssoc && brandAssoc.roles) {
      return brandAssoc.roles.includes(role);
    }
  }

  return false;
}

export function hasAnyRole(user, roles, brandId = null) {
  if (!user) return false;
  return roles.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has manager privileges (Owner, Admin, Brand Manager, Manager, Academic Coordinator)
 */
export function isManager(user, brandId = null) {
  if (!user) return false;

  if (isAdmin(user, brandId)) return true;

  const MANAGER_ROLES = ['Brand Manager', 'Owner', 'Manager', 'Academic Coordinator'];
  return hasAnyRole(user, MANAGER_ROLES, brandId);
}

/**
 * Check if user has academic coordinator privileges
 */
export function isAcademicCoordinator(user, brandId = null) {
  return hasRole(user, 'Academic Coordinator', brandId);
}

/**
 * Check if user has instructor privileges (Instructor role)
 */
export function isInstructor(user, brandId = null) {
  return hasRole(user, 'Instructor', brandId);
}


/**
 * Check if user has counsellor privileges
 */
export function isCounsellor(user, brandId = null) {
  if (!user) return false;
  const COUNSELLOR_ROLES = ['Counsellor', 'Counselor', 'Academic Counsellor', 'Academic Coordinator'];
  return hasAnyRole(user, COUNSELLOR_ROLES, brandId);
}

/**
 * Check if user is the designated developer (by email)
 */
export function isDeveloper(user) {
  return user?.email === 'cmabdulkareem@gmail.com';
}
