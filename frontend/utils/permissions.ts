/**
 * Permission utilities for role-based access control
 */

// User roles from most restricted to most powerful
export enum UserRole {
  USER = 'user',
  ANALYST = 'analyst',
  CONTENT_MODERATOR = 'content_moderator',
  SUPER_ADMIN = 'super_admin'
}

// Define role hierarchy for comparisons
export const ROLE_HIERARCHY: Record<string, number> = {
  [UserRole.USER]: 0,
  [UserRole.ANALYST]: 1,
  [UserRole.CONTENT_MODERATOR]: 2,
  [UserRole.SUPER_ADMIN]: 3
};

// Define permissions by capability
export enum Permission {
  // User management permissions
  VIEW_USERS = "view_users",
  MODIFY_USER_ROLE = "modify_user_role",
  MODIFY_USER_STATUS = "modify_user_status",
  
  // Analytics permissions
  VIEW_ANALYTICS = "view_analytics",
  VIEW_API_USAGE = "view_api_usage",
  
  // System health permissions
  VIEW_SYSTEM_HEALTH = "view_system_health",
  
  // Content moderation permissions
  MODERATE_CONTENT = "moderate_content",
  
  // Analysis permissions
  VIEW_ANALYSES = "view_analyses",
  CREATE_ANALYSES = "create_analyses",
  EDIT_ANALYSES = "edit_analyses",
  DELETE_ANALYSES = "delete_analyses"
}

// Define which permissions each role has
export const ROLE_PERMISSIONS: Record<string, Set<Permission>> = {
  [UserRole.USER]: new Set([
    Permission.VIEW_ANALYSES,
    Permission.CREATE_ANALYSES,
    Permission.EDIT_ANALYSES,  // Users can edit their own analyses
    Permission.DELETE_ANALYSES,  // Users can delete their own analyses
  ]),
  
  [UserRole.ANALYST]: new Set([
    Permission.VIEW_ANALYSES,
    Permission.CREATE_ANALYSES,
    Permission.EDIT_ANALYSES,
    Permission.DELETE_ANALYSES,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_API_USAGE,
  ]),
  
  [UserRole.CONTENT_MODERATOR]: new Set([
    Permission.VIEW_ANALYSES,
    Permission.CREATE_ANALYSES,
    Permission.EDIT_ANALYSES,
    Permission.DELETE_ANALYSES,
    Permission.VIEW_ANALYTICS,
    Permission.VIEW_API_USAGE,
    Permission.VIEW_USERS,
    Permission.MODIFY_USER_STATUS,  // Can modify status but not roles
    Permission.MODERATE_CONTENT,
  ]),
  
  [UserRole.SUPER_ADMIN]: new Set([
    Permission.VIEW_ANALYSES,
    Permission.CREATE_ANALYSES,
    Permission.EDIT_ANALYSES,
    Permission.DELETE_ANALYSES,
    Permission.VIEW_ANALYTICS, 
    Permission.VIEW_API_USAGE,
    Permission.VIEW_USERS,
    Permission.MODIFY_USER_ROLE,
    Permission.MODIFY_USER_STATUS,
    Permission.VIEW_SYSTEM_HEALTH,
    Permission.MODERATE_CONTENT,
  ])
};

/**
 * Check if a user with the given role has a specific permission
 * 
 * @param userRole The user's role
 * @param permission The permission to check for
 * @returns True if the user has the permission, false otherwise
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[userRole];
  return permissions ? permissions.has(permission) : false;
}

/**
 * Check if a user role meets or exceeds a minimum required role level
 * 
 * @param userRole The user's role
 * @param minRole The minimum required role
 * @returns True if the user's role meets or exceeds the minimum, false otherwise
 */
export function isRoleAtLeast(userRole: string, minRole: string): boolean {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const minLevel = ROLE_HIERARCHY[minRole] || 0;
  return userLevel >= minLevel;
}

/**
 * Check if a user with modifier_role can modify a user with target_user_role
 * 
 * Rules:
 * - super_admin can modify anyone
 * - content_moderator can only modify users with lower roles (and not super_admins)
 * - others cannot modify users
 * 
 * @param modifierRole Role of the user attempting to modify another user
 * @param targetUserRole Role of the user being modified
 * @returns True if modification is allowed, false otherwise
 */
export function canModifyUser(modifierRole: string, targetUserRole: string): boolean {
  if (modifierRole === UserRole.SUPER_ADMIN) {
    return true;
  }
  
  if (modifierRole === UserRole.CONTENT_MODERATOR) {
    // content_moderator can't modify users with equal or higher roles
    return (ROLE_HIERARCHY[modifierRole] || 0) > (ROLE_HIERARCHY[targetUserRole] || 0);
  }
  
  return false;
}
