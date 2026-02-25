/**
 * Frontend role helper functions
 * Provides utilities for checking user roles and permissions
 */

// Administrative roles (full system access)
export const ADMIN_ROLES = ['Owner'];

// HR Roles
export const HR_ROLES = ['Owner', 'HR', 'HR Manager'];

// Managerial roles (can manage teams and resources)
export const MANAGER_ROLES = ['Owner', 'Brand Manager', 'Manager', 'Academic Coordinator', 'HR Manager', 'HR'];

// Finance roles
export const ACCOUNTANT_ROLES = ['Owner', 'Accounts Executive', 'Brand Manager'];

/**
 * Check if user has a specific role
 * @param {Object} user - The user object
 * @param {String} role - The role to check for
 * @param {String} brandId - Optional brand ID context
 */
export function hasRole(user, role, brandId = null) {
  if (!user) return false;

  // Check isAdmin flag for backward compatibility
  if (user.isAdmin && ADMIN_ROLES.includes(role)) {
    return true;
  }

  // Attempt to resolve brandId from localStorage if not explicitly provided
  let effectiveBrandId = brandId;
  if (!effectiveBrandId && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem("selectedBrand");
      if (saved) {
        const brand = JSON.parse(saved);
        effectiveBrandId = brand._id || brand.id;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check brand-specific roles
  if (effectiveBrandId && user.brands) {
    const brandAssoc = user.brands.find(b => (b.brand?._id || b.brand || b).toString() === effectiveBrandId.toString());
    if (brandAssoc && brandAssoc.roles) {
      return brandAssoc.roles.includes(role);
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

  return ADMIN_ROLES.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has manager privileges
 */
export function isManager(user, brandId = null) {
  if (!user) return false;

  if (isAdmin(user, brandId)) return true;

  return MANAGER_ROLES.some(role => hasRole(user, role, brandId));
}

/**
 * Check if user has academic coordinator privileges
 */
export function isAcademicCoordinator(user, brandId = null) {
  return hasRole(user, 'Academic Coordinator', brandId);
}

/**
 * Check if user has owner privileges (Owner role only)
 */
export function isOwner(user, brandId = null) {
  return hasRole(user, 'Owner', brandId);
}

/**
 * Check if user has Owner role in at least one brand.
 * These users can access the All Brands combined view for their brands.
 */
export function isAnyOwner(user) {
  if (!user || !Array.isArray(user.brands) || user.brands.length === 0) return false;
  return user.brands.some(b => Array.isArray(b.roles) && b.roles.includes('Owner'));
}

/**
 * Check if user has counselor privileges
 */
export function isCounsellor(user, brandId = null) {
  const COUNSELLOR_ROLES = ['Counsellor', 'Counselor', 'Academic Counsellor', 'Academic Coordinator'];
  return hasAnyRole(user, COUNSELLOR_ROLES, brandId);
}

/**
 * Get all user roles as an array (optionally for a specific brand)
 */
export function getUserRoles(user, brandId = null) {
  if (!user) return [];

  // Attempt to resolve brandId from localStorage if not explicitly provided
  let effectiveBrandId = brandId;
  if (!effectiveBrandId && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem("selectedBrand");
      if (saved) {
        const brand = JSON.parse(saved);
        effectiveBrandId = brand._id || brand.id;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // If brand context is provided, return ONLY roles for that brand
  if (effectiveBrandId && user.brands) {
    const brandAssoc = user.brands.find(b => (b.brand?._id || b.brand || b).toString() === effectiveBrandId.toString());
    if (brandAssoc && brandAssoc.roles) return brandAssoc.roles;
    return []; // No roles in this brand context
  }

  // Fallback to global roles only if no brand context is specified
  const userRoles = user.roles || [];
  return Array.isArray(userRoles) ? userRoles : (typeof userRoles === 'string' ? [userRoles] : []);
}

/**
 * Check if user has accountant privileges
 */
export function isAccountant(user, brandId = null) {
  if (!user) return false;

  // Admins are also accountants in this context
  if (isAdmin(user, brandId)) return true;

  const rolesArray = getUserRoles(user, brandId);
  return rolesArray.some(role => ACCOUNTANT_ROLES.includes(role));
}

/*
 * Check if user is the designated developer (by email)
 */
export function isDeveloper(user) {
  return user?.email === 'cmabdulkareem@gmail.com';
}

/**
 * Check if user has HR privileges
 */
export function isHR(user, brandId = null) {
  if (!user) return false;

  if (isAdmin(user, brandId)) return true;

  const rolesArray = getUserRoles(user, brandId);
  return rolesArray.some(role => HR_ROLES.includes(role));
}
