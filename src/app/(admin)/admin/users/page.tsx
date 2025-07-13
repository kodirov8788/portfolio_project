import { supabaseAdmin } from "@/lib/supabase/server";
import { UserProfile } from "@/types/database";

export default async function AdminUsersPage() {
  const { data, error } = await supabaseAdmin
    .from("user_profiles")
    .select("id, full_name, email, username, created_at")
    .order("created_at", { ascending: false });
  const users = (data || []) as UserProfile[];

  return (
    <main className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Users</h1>
      {error && <div className="text-red-500 mb-4">{error.message}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 text-left">Full Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Username</th>
              <th className="px-4 py-2 text-left">Created At</th>
            </tr>
          </thead>
          <tbody>
            {users && users.length > 0 ? (
              users.map((user: UserProfile) => (
                <tr key={user.id} className="border-t">
                  <td className="px-4 py-2">{user.full_name || "-"}</td>
                  <td className="px-4 py-2">{user.email}</td>
                  <td className="px-4 py-2">{user.username || "-"}</td>
                  <td className="px-4 py-2">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
