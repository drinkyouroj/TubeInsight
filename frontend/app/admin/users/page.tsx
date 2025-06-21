"use client";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from 'next/navigation';

// Import permissions system
import { UserRole, Permission, hasPermission, canModifyUser } from '@/utils/permissions';

// Initialize Supabase client
const supabase = createClient();

type UserStatus = 'active' | 'suspended' | 'banned';

interface User {
  id: string;
  email?: string | null;
  full_name?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at: string;
  updated_at?: string;
}

interface Pagination {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

interface ApiResponse<T> {
  data: T[];
  pagination: Pagination;
  error?: {
    message: string;
    code?: string;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const router = useRouter();

  const fetchCurrentUserRole = useCallback(async () => {
    try {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/users');
        return null; // Return null to prevent further execution
      }
      
      setCurrentUserId(user.id);
      
      // Get user profile to determine role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw new Error('Failed to get user permissions');
      }
      
      const role = profile?.role as UserRole;
      setCurrentUserRole(role);
      return role;
    } catch (err) {
      console.error('Error getting current user role:', err);
      return null;
    }
  }, []);

  const fetchUsers = useCallback(async (page: number, perPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(perPage),
      });
      const response = await fetch(`/api/admin/users?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${await response.text()}`);
      }
      
      const data: ApiResponse<User> = await response.json();
      
      // Debug log to see API response format
      console.log('API response data:', JSON.stringify(data, null, 2));
      
      if (data && data.data) {
        // Map response to ensure we have the email field
        const usersWithFixedFields = data.data.map(user => ({
          ...user,
          // Make sure email is accessible
          email: user.email || null
        }));
        
        setUsers(usersWithFixedFields);
        setPagination(data.pagination);
      } else {
        setUsers([]);
        setError('No data returned from server');
      }
    } catch (err: any) {
      console.error('Error fetching users:', err);
      const errorMessage = err?.message || 'Failed to load users';
      setError(errorMessage);
      
      // If it's an authentication error, redirect to login
      if (err?.status === 401) {
        router.push('/login?redirect=/admin/users');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchCurrentUserRole]);

  const updateUserAttribute = async (userId: string, attribute: string, newValue: string, displayName: string) => {
    try {
      // Don't allow users to modify their own role or status
      if (userId === currentUserId) {
        throw new Error(`You cannot change your own ${displayName}`);
      }

      setUpdating(prev => ({ ...prev, [`${userId}-${attribute}`]: true }));
      setError(null);
      
      const url = `/api/admin/users/${userId}/${attribute}`;
      
      console.log(`Updating ${displayName} for user ${userId} to ${newValue}`, { url });
      
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login?redirect=/admin/users');
        return; // Return to prevent further execution
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        router.push('/login?redirect=/admin/users');
        return;
      }
      const { access_token } = sessionData.session;
      
      // Log the token being used (first 10 chars only for security)
      const tokenPreview = access_token.substring(0, 10) + '...';
      console.log(`Using auth token starting with: ${tokenPreview}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`,
        },
        body: JSON.stringify({ [attribute]: newValue }),
      });

      console.log(`${displayName} update response status: ${response.status}`);
      
      // Get response as text first
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
        console.log('Parsed response data:', responseData);
      } catch (parseErr) {
        console.warn('Failed to parse response as JSON:', parseErr);
        responseData = { raw: responseText };
      }
      
      if (!response.ok) {
        const errorMessage = responseData?.error?.message || 
                             responseData?.message || 
                             `Failed to update user ${displayName} (${response.status})`;
        throw new Error(errorMessage);
      }
      
      console.log(`${displayName} update successful`);
      
      // Refresh the user list
      await fetchUsers(1, 20);
      
      // Show success message
      setError(null);
      
    } catch (err: any) {
      console.error(`Error updating user ${displayName}:`, err);
      const errorMessage = err?.message || `Failed to update user ${displayName}`;
      setError(errorMessage);
    } finally {
      setUpdating(prev => ({ ...prev, [`${userId}-${attribute}`]: false }));
    }
  };
  
  const updateUserRole = (userId: string, newRole: UserRole) => {
    return updateUserAttribute(userId, 'role', newRole, 'role');
  };
  
  const updateUserStatus = (userId: string, newStatus: UserStatus) => {
    return updateUserAttribute(userId, 'status', newStatus, 'status');
  };

  useEffect(() => {
    fetchUsers(1, 20);
  }, [fetchUsers]);

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              className="ml-4"
              onClick={() => fetchUsers(1, 20)}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={() => fetchUsers(1, 20)} disabled={loading}>
          Refresh
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.email || <span className="text-gray-400 italic">No email</span>}
                  </div>
                  {user.full_name && (
                    <div className="text-sm text-gray-500">{user.full_name}</div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Role dropdown - only show if user has permission to modify roles */}
                  {hasPermission(currentUserRole || UserRole.USER, Permission.MODIFY_USER_ROLE) && 
                   canModifyUser(currentUserRole || UserRole.USER, user.role) && 
                   user.id !== currentUserId ? (
                    <div>
                      <select
                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        value={user.role}
                        onChange={(e) => {
                          const role = e.target.value as UserRole;
                          updateUserRole(user.id, role);
                        }}
                        disabled={updating[`${user.id}-role`]}
                      >
                        <option value={UserRole.USER}>User</option>
                        <option value={UserRole.ANALYST}>Analyst</option>
                        <option value={UserRole.CONTENT_MODERATOR}>Content Moderator</option>
                        <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                      </select>
                      {updating[`${user.id}-role`] && (
                        <div className="mt-2 text-xs text-blue-500">Updating...</div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-800">
                      {user.role}
                      {!canModifyUser(currentUserRole || UserRole.USER, user.role) && 
                        currentUserRole !== UserRole.SUPER_ADMIN && (
                          <div className="text-xs text-gray-500 mt-1">(Cannot modify this role)</div>
                      )}
                      {user.id === currentUserId && (
                        <div className="text-xs text-gray-500 mt-1">(Your account)</div>
                      )}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {/* Status dropdown - only show if user has permission to modify status */}
                  {hasPermission(currentUserRole || UserRole.USER, Permission.MODIFY_USER_STATUS) && 
                   canModifyUser(currentUserRole || UserRole.USER, user.role) &&
                   user.id !== currentUserId ? (
                    <div>
                      <select
                        className={`block w-full pl-3 pr-10 py-2 text-sm border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md
                          ${user.status === 'active' ? 'bg-green-50 text-green-800' : 
                            user.status === 'suspended' ? 'bg-yellow-50 text-yellow-800' : 
                            'bg-red-50 text-red-800'}`}
                        value={user.status}
                        onChange={(e) => {
                          const status = e.target.value as UserStatus;
                          updateUserStatus(user.id, status);
                        }}
                        disabled={updating[`${user.id}-status`]}
                      >
                        <option value="active" className="bg-green-50 text-green-800">Active</option>
                        <option value="suspended" className="bg-yellow-50 text-yellow-800">Suspended</option>
                        <option value="banned" className="bg-red-50 text-red-800">Banned</option>
                      </select>
                      {updating[`${user.id}-status`] && (
                        <div className="mt-2 text-xs text-blue-500">Updating...</div>
                      )}
                    </div>
                  ) : (
                    <div className={`text-sm ${user.status === 'active' ? 'text-green-600' : 
                                           user.status === 'suspended' ? 'text-yellow-600' : 
                                           'text-red-600'}`}>
                      {user.status}
                      {user.id === currentUserId && (
                        <div className="text-xs text-gray-500 mt-1">(Your account)</div>
                      )}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => console.log('View details:', user.id)}
                    disabled={updating[`${user.id}-role`] || updating[`${user.id}-status`]}
                  >
                    Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
