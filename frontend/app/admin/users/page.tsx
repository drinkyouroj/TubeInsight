"use client";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// Initialize Supabase client
const supabase = createClient();

type UserRole = 'user' | 'analyst' | 'content_moderator' | 'super_admin';
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construct the base URL
      const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const url = new URL(`${baseUrl}/v1/admin/users`);
      
      // Add query parameters
      const params = new URLSearchParams();
      params.append('page', '1');
      params.append('per_page', '20');
      
      url.search = params.toString();
      
      console.log('Fetching users from:', url.toString());
      
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.data.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}\n${errorText}`);
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
        window.location.href = '/login?redirect=/admin/users';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserAttribute = async (userId: string, attribute: string, newValue: string, displayName: string) => {
    try {
      setUpdating(prev => ({ ...prev, [`${userId}-${attribute}`]: true }));
      setError(null);
      
      const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const url = `${baseUrl}/v1/admin/users/${userId}/${attribute}`;
      
      console.log(`Updating ${displayName} for user ${userId} to ${newValue}`, { url });
      
      // Get fresh session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }
      
      // Log the token being used (first 10 chars only for security)
      const tokenPreview = session.access_token.substring(0, 10) + '...';
      console.log(`Using auth token starting with: ${tokenPreview}`);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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
      await fetchUsers();
      
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
    fetchUsers();
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
              onClick={() => fetchUsers()}
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
        <Button onClick={fetchUsers} disabled={loading}>
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
                  <select
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    value={user.role}
                    onChange={(e) => {
                      const role = e.target.value as UserRole;
                      updateUserRole(user.id, role);
                    }}
                    disabled={updating[user.id]}
                  >
                    <option value="user">User</option>
                    <option value="analyst">Analyst</option>
                    <option value="content_moderator">Content Moderator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
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
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {updating[`${user.id}-role`] ? 'Updating role...' : ''}
                  {updating[`${user.id}-status`] ? 'Updating status...' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}