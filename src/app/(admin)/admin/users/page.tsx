import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import type { IUser } from "@/types";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  OWNER: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
};

export default async function AdminUsersPage() {
  await connectDB();
  const docs = await User.find().sort({ createdAt: -1 }).lean();
  const users: IUser[] = JSON.parse(JSON.stringify(docs));

  const counts = {
    ADMIN: users.filter((u) => u.role === "ADMIN").length,
    OWNER: users.filter((u) => u.role === "OWNER").length,
    CUSTOMER: users.filter((u) => u.role === "CUSTOMER").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">{users.length} total users</p>
      </div>

      {/* Summary */}
      <div className="flex gap-3 flex-wrap">
        {(["ADMIN", "OWNER", "CUSTOMER"] as const).map((role) => (
          <div key={role} className={`rounded-full px-3 py-1 text-xs font-semibold ${roleColors[role]}`}>
            {counts[role]} {role.charAt(0) + role.slice(1).toLowerCase()}s
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground uppercase tracking-wide">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, i) => (
                <tr key={user._id} className={i % 2 === 0 ? "bg-white" : "bg-muted/20"}>
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${roleColors[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
