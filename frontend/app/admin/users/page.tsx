// frontend/app/admin/users/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { authFetch } from "@/utils/api";

type User = {
  id: string;
  email?: string;  // Made optional to match UserProfile
  full_name?: string | null;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  // Define types for the API response
  interface Pagination {
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
  }

  interface ApiResponse<T> {
    data: T;
    pagination: Pagination;
  }

  interface UserProfile {
    id: string;
    email?: string;
    full_name?: string | null;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
  }

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
      
      // Add filters if needed
      // if (searchTerm) params.append('search', searchTerm);
      // if (roleFilter) params.append('role', roleFilter);
      
      url.search = params.toString();
      
      console.log('Fetching users from:', url.toString());
      
      const response = await authFetch<ApiResponse<UserProfile[]>>(url.toString());
      console.log('Fetched users data:', response);
      
      if (response && response.data) {
        // Convert UserProfile[] to User[] by ensuring all required fields are present
        const userData: User[] = response.data.map(profile => ({
          id: profile.id,
          email: profile.email || undefined,
          full_name: profile.full_name || undefined,
          role: profile.role,
          status: profile.status,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }));
        
        setUsers(userData);
        setPagination(response.pagination);
      } else {
        setUsers([]);
        setError('No data returned from server');
      }
    } catch (err: any) {
      const errorMessage = err?.data?.error || err?.message || 'Failed to fetch users';
      setError(errorMessage);
      console.error('Error fetching users:', err);
      
      // If it's an authentication error, redirect to login
      if (err?.status === 401) {
        window.location.href = '/login?redirect=/admin/users';
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      
      const baseUrl = (process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '');
      const url = `${baseUrl}/v1/admin/users/${userId}/role`;
      
      console.log(`Updating role for user ${userId} to ${newRole}`);
      
      await authFetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      
      // Show success message
      setError(null);
      
      // Refresh the user list
      await fetchUsers();
      
      // Show success toast/notification
      // You might want to use a proper toast/notification library
      alert(`Successfully updated user role to ${newRole}`);
      
    } catch (err: any) {
      const errorMessage = err?.data?.error || err?.message || 'Failed to update user role';
      setError(errorMessage);
      console.error('Error updating user role:', err);
      
      // Show error toast/notification
      alert(`Error: ${errorMessage}`);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
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
                    onChange={(e) => updateUserRole(user.id, e.target.value)}
                    disabled={updating[user.id]}
                  >
                    <option value="user">User</option>
                    <option value="analyst">Analyst</option>
                    <option value="content_moderator">Content Moderator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {updating[user.id] ? 'Updating...' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}