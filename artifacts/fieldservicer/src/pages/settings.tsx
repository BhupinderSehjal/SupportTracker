import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Shield, Mail, Ticket } from "lucide-react";

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800 border-red-200",
  manager: "bg-purple-100 text-purple-800 border-purple-200",
  agent: "bg-blue-100 text-blue-800 border-blue-200",
  viewer: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_DOT: Record<string, string> = {
  online: "bg-green-500",
  busy: "bg-yellow-500",
  offline: "bg-gray-400",
};

export default function Settings() {
  const { data: users = [] } = useListUsers({
    query: { queryKey: getListUsersQueryKey() }
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage agents, roles, and system configuration</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Support Agents
            </CardTitle>
            <span className="text-sm text-muted-foreground">{users.length} agents</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user: any) => (
              <div key={user.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/30">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                    {user.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background ${STATUS_DOT[user.status] ?? "bg-gray-400"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="w-3 h-3" /> {user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${ROLE_COLORS[user.role] ?? ""}`}>
                    {user.role}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ticket className="w-3 h-3" /> {user.assignedTicketCount} open
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="w-4 h-4" /> Role Permissions</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            {[
              { role: "Admin", color: "bg-red-100 text-red-800 border-red-200", perms: ["Full system access", "Manage agents and roles", "View all tickets", "Access reports", "System configuration"] },
              { role: "Manager", color: "bg-purple-100 text-purple-800 border-purple-200", perms: ["View and manage all tickets", "Assign and escalate", "View reports", "Manage team settings"] },
              { role: "Agent", color: "bg-blue-100 text-blue-800 border-blue-200", perms: ["View and manage assigned tickets", "Reply to customers", "Add internal notes", "Link entities to tickets"] },
              { role: "Viewer", color: "bg-gray-100 text-gray-600 border-gray-200", perms: ["Read-only access to tickets", "View reports", "No reply or edit access"] },
            ].map(({ role, color, perms }) => (
              <div key={role} className="border rounded-lg p-3">
                <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${color}`}>{role}</span>
                <ul className="mt-2 space-y-0.5">
                  {perms.map(p => (
                    <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
