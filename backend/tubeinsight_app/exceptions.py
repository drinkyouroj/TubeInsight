"""Custom exceptions for the TubeInsight application."""

class InvalidRoleError(ValueError):
    """Raised when an invalid role is provided."""
    pass

class AuthenticationError(Exception):
    """Raised when there's an authentication error."""
    pass

class AuthorizationError(Exception):
    """Raised when a user is not authorized to perform an action."""
    pass

class ResourceNotFoundError(Exception):
    """Raised when a requested resource is not found."""
    pass

class DatabaseError(Exception):
    """Raised when there's an error with database operations."""
    pass
