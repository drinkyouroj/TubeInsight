"""
Role-based permissions module for TubeInsight.

This module defines the permissions for each role in the system.
"""
from typing import Dict, List, Set
from enum import Enum

# Role hierarchy
class UserRole(str, Enum):
    USER = 'user'
    ANALYST = 'analyst'
    CONTENT_MODERATOR = 'content_moderator'
    SUPER_ADMIN = 'super_admin'

# Role hierarchy for comparisons
ROLE_HIERARCHY = {
    UserRole.USER: 0,
    UserRole.ANALYST: 1,
    UserRole.CONTENT_MODERATOR: 2, 
    UserRole.SUPER_ADMIN: 3
}

# Define permissions by capability
class Permissions:
    # User management permissions
    VIEW_USERS = "view_users"
    MODIFY_USER_ROLE = "modify_user_role"
    MODIFY_USER_STATUS = "modify_user_status"
    
    # Analytics permissions
    VIEW_ANALYTICS = "view_analytics"
    VIEW_API_USAGE = "view_api_usage"
    
    # System health permissions
    VIEW_SYSTEM_HEALTH = "view_system_health"
    
    # Content moderation permissions
    MODERATE_CONTENT = "moderate_content"
    
    # Analysis permissions
    VIEW_ANALYSES = "view_analyses"
    CREATE_ANALYSES = "create_analyses"
    EDIT_ANALYSES = "edit_analyses"
    DELETE_ANALYSES = "delete_analyses"

# Define which permissions each role has
ROLE_PERMISSIONS: Dict[str, Set[str]] = {
    UserRole.USER: {
        Permissions.VIEW_ANALYSES,
        Permissions.CREATE_ANALYSES,
        Permissions.EDIT_ANALYSES,  # Users can edit their own analyses
        Permissions.DELETE_ANALYSES,  # Users can delete their own analyses
    },
    UserRole.ANALYST: {
        Permissions.VIEW_ANALYSES,
        Permissions.CREATE_ANALYSES,
        Permissions.EDIT_ANALYSES,
        Permissions.DELETE_ANALYSES,
        Permissions.VIEW_ANALYTICS,
        Permissions.VIEW_API_USAGE,
    },
    UserRole.CONTENT_MODERATOR: {
        Permissions.VIEW_ANALYSES,
        Permissions.CREATE_ANALYSES,
        Permissions.EDIT_ANALYSES,
        Permissions.DELETE_ANALYSES,
        Permissions.VIEW_ANALYTICS,
        Permissions.VIEW_API_USAGE,
        Permissions.VIEW_USERS,
        Permissions.MODIFY_USER_STATUS,  # Can modify status but not roles
        Permissions.MODERATE_CONTENT,
    },
    UserRole.SUPER_ADMIN: {
        Permissions.VIEW_ANALYSES,
        Permissions.CREATE_ANALYSES,
        Permissions.EDIT_ANALYSES,
        Permissions.DELETE_ANALYSES,
        Permissions.VIEW_ANALYTICS, 
        Permissions.VIEW_API_USAGE,
        Permissions.VIEW_USERS,
        Permissions.MODIFY_USER_ROLE,
        Permissions.MODIFY_USER_STATUS,
        Permissions.VIEW_SYSTEM_HEALTH,
        Permissions.MODERATE_CONTENT,
    }
}

def get_user_permissions(role: str) -> Set[str]:
    """
    Get the set of permissions for a specific role.
    
    Args:
        role: The user role
    
    Returns:
        Set of permission strings for the role
    """
    return ROLE_PERMISSIONS.get(role, set())

def has_permission(user_role: str, required_permission: str) -> bool:
    """
    Check if a user with the given role has a specific permission.
    
    Args:
        user_role: The user's role
        required_permission: The permission to check
        
    Returns:
        True if the user has the permission, False otherwise
    """
    user_permissions = get_user_permissions(user_role)
    return required_permission in user_permissions

def is_role_at_least(user_role: str, min_role: str) -> bool:
    """
    Check if a user role meets or exceeds a minimum required role level.
    
    Args:
        user_role: The user's role
        min_role: The minimum required role
        
    Returns:
        True if the user's role meets or exceeds the minimum, False otherwise
    """
    user_level = ROLE_HIERARCHY.get(user_role, 0)
    min_level = ROLE_HIERARCHY.get(min_role, 0)
    return user_level >= min_level

def can_modify_user(modifier_role: str, target_user_role: str) -> bool:
    """
    Check if a user with modifier_role can modify a user with target_user_role.
    
    Rules:
    - super_admin can modify anyone
    - content_moderator can only modify users with lower roles (and not super_admins)
    - others cannot modify users
    
    Args:
        modifier_role: Role of the user attempting to modify another user
        target_user_role: Role of the user being modified
        
    Returns:
        True if modification is allowed, False otherwise
    """
    if modifier_role == UserRole.SUPER_ADMIN:
        return True
        
    if modifier_role == UserRole.CONTENT_MODERATOR:
        # content_moderator can't modify users with equal or higher roles
        return ROLE_HIERARCHY.get(modifier_role, 0) > ROLE_HIERARCHY.get(target_user_role, 0)
        
    return False
