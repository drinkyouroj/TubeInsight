// frontend/app/admin/users/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { authFetch } from "@/utils/api";

type User = {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  status: string;
  created_at?: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authFetch('/api/admin/users');
      setUsers(Array.isArray(data) ? data : data.users || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUpdating(prev => ({ ...prev, [userId]: true }));
      await authFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });
      await fetchUsers(); // Refresh the list
    } catch (err: any) {
      setError(`Failed to update user role: ${err?.message || 'Unknown error'}`);
      console.error('Error updating user role:', err);
    } finally {
      setUpdating(prev => ({ ...prev, [userId]: false }));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
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
                    {user.email}
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