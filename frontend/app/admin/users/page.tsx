"use client";
import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/users`)
      .then(async (res) => {
        if (!res.ok) {
          let errorText = "Failed to fetch users";
          try {
            // Try to parse as JSON first, as it might be a structured error from the API route
            const errorJson = await res.clone().json(); // Clone because .json() consumes the body
            errorText = errorJson.error || JSON.stringify(errorJson);
          } catch (jsonError) {
            // If JSON parsing fails, it's likely HTML or other non-JSON text
            errorText = await res.text(); // Get the raw text
            console.error("Raw error response from /api/admin/users:", errorText);
          }
          throw new Error(errorText);
        }
        return res.json();
      })
      .then((data) => {
        setUsers(data.users || data); // adapt to your backend response shape
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">User Management</h1>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {loading ? (
        <div>Loading users...</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr>
              <th className="border px-2 py-1">ID</th>
              <th className="border px-2 py-1">Email</th>
              <th className="border px-2 py-1">Name</th>
              <th className="border px-2 py-1">Role</th>
              <th className="border px-2 py-1">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4">No users found.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-2 py-1">{user.id}</td>
                  <td className="border px-2 py-1">{user.email}</td>
                  <td className="border px-2 py-1">{user.full_name || "-"}</td>
                  <td className="border px-2 py-1">{user.role}</td>
                  <td className="border px-2 py-1">{user.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}