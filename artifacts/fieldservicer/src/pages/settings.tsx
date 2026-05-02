import { useState } from "react";
import { useListUsers, getListUsersQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Shield, Mail, Ticket, Webhook, Clock, Zap, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

const SLA_DEFAULTS = [
  { priority: "Urgent", firstResponse: "2 hours", resolution: "8 hours", color: "text-red-600" },
  { priority: "High", firstResponse: "4 hours", resolution: "24 hours", color: "text-orange-600" },
  { priority: "Medium", firstResponse: "8 hours", resolution: "48 hours", color: "text-yellow-600" },
  { priority: "Low", firstResponse: "24 hours", resolution: "72 hours", color: "text-blue-600" },
];

const WEBHOOK_EVENTS = ["ticket.created", "ticket.resolved", "reply.sent", "sla.breached", "*"];

function AgentsTab({ users }: { users: any[] }) {
  return (
    <div className="space-y-4">
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
              { role: "Admin", color: "bg-red-100 text-red-800 border-red-200", perms: ["Full system access", "Manage agents and roles", "View all tickets", "Access reports", "System configuration", "Manage automation rules", "Configure webhooks"] },
              { role: "Manager", color: "bg-purple-100 text-purple-800 border-purple-200", perms: ["View and manage all tickets", "Assign and escalate", "View reports", "Manage automation rules", "View webhooks"] },
              { role: "Agent", color: "bg-blue-100 text-blue-800 border-blue-200", perms: ["View and manage assigned tickets", "Reply to customers", "Add internal notes", "Upload attachments", "Link entities to tickets"] },
              { role: "Viewer", color: "bg-gray-100 text-gray-600 border-gray-200", perms: ["Read-only access to tickets", "View reports", "No reply or edit access"] },
            ].map(({ role, color, perms }) => (
              <div key={role} className="border rounded-lg p-3">
                <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${color}`}>{role}</span>
                <ul className="mt-2 space-y-0.5">
                  {perms.map(p => (
                    <li key={p} className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-muted-foreground/50 flex-shrink-0" />{p}
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

function SlaTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4" /> SLA Policy Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2.5">
              <div>Priority</div>
              <div>First Response</div>
              <div>Resolution Time</div>
              <div>Actions</div>
            </div>
            {SLA_DEFAULTS.map(sla => (
              <div key={sla.priority} className="grid grid-cols-4 px-4 py-3 border-b items-center hover:bg-muted/30">
                <span className={`font-semibold text-sm ${sla.color}`}>{sla.priority}</span>
                <span className="text-sm">{sla.firstResponse}</span>
                <span className="text-sm">{sla.resolution}</span>
                <Button variant="outline" size="sm" className="w-fit">Edit</Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">SLA deadlines are automatically calculated when a ticket is created based on its priority. Breached tickets are flagged in red across the interface.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SLA Escalation Rules</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { trigger: "50% of SLA elapsed", action: "Notify assigned agent via in-app notification", active: true },
              { trigger: "75% of SLA elapsed", action: "Notify agent + manager via in-app notification", active: true },
              { trigger: "SLA breached", action: "Auto-escalate ticket status + notify manager", active: true },
              { trigger: "24h no response after breach", action: "Escalate to Admin + flag as critical", active: false },
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${rule.active ? "bg-green-500" : "bg-gray-300"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">When: {rule.trigger}</p>
                  <p className="text-xs text-muted-foreground">Then: {rule.action}</p>
                </div>
                <Badge variant={rule.active ? "default" : "secondary"}>{rule.active ? "Active" : "Inactive"}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function WebhooksTab() {
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: ["ticket.created"], secret: "", active: true });
  const { toast } = useToast();

  useState(() => {
    fetch("/api/webhooks").then(r => r.json()).then(data => { setWebhooks(data); setLoading(false); }).catch(() => setLoading(false));
  });

  async function save() {
    if (!form.name || !form.url) { toast({ title: "Name and URL are required", variant: "destructive" }); return; }
    const res = await fetch("/api/webhooks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (res.ok) {
      const hook = await res.json();
      setWebhooks(w => [hook, ...w]);
      setShowForm(false);
      setForm({ name: "", url: "", events: ["ticket.created"], secret: "", active: true });
      toast({ title: "Webhook created" });
    }
  }

  async function deleteHook(id: number) {
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setWebhooks(w => w.filter(h => h.id !== id));
    toast({ title: "Webhook deleted" });
  }

  async function toggleHook(id: number, active: boolean) {
    await fetch(`/api/webhooks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) });
    setWebhooks(w => w.map(h => h.id === id ? { ...h, active } : h));
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Webhook className="w-4 h-4" /> Outbound Webhooks</CardTitle>
            <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Add Webhook</Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <div className="mb-4 p-4 border rounded-lg bg-muted/30 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Name</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Webhook" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">URL *</label>
                  <Input value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://your-endpoint.com/hook" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Event</label>
                <Select value={form.events[0]} onValueChange={v => setForm(f => ({ ...f, events: [v] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{WEBHOOK_EVENTS.map(e => <SelectItem key={e} value={e}>{e === "*" ? "All events (*)" : e}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Secret (optional)</label>
                <Input value={form.secret} onChange={e => setForm(f => ({ ...f, secret: e.target.value }))} placeholder="Sent as X-Webhook-Secret header" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={save}>Save Webhook</Button>
                <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : webhooks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No webhooks configured</p>
            </div>
          ) : (
            <div className="space-y-2">
              {webhooks.map(hook => (
                <div key={hook.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${hook.active ? "bg-green-500" : "bg-gray-300"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{hook.name}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{hook.url}</p>
                    <div className="flex gap-1 mt-1">{hook.events.map((e: string) => <Badge key={e} variant="secondary" className="text-xs px-1.5 py-0">{e}</Badge>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toggleHook(hook.id, !hook.active)}>{hook.active ? "Disable" : "Enable"}</Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteHook(hook.id)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-100 bg-blue-50/40">
        <CardContent className="p-4 text-sm text-blue-800">
          <p className="font-medium mb-2">Supported Events</p>
          <div className="grid grid-cols-2 gap-1 text-xs">
            {[["ticket.created", "New ticket created"], ["ticket.resolved", "Ticket resolved"], ["reply.sent", "Agent reply sent"], ["sla.breached", "SLA deadline breached"], ["*", "All events"]].map(([e, d]) => (
              <div key={e}><code className="bg-blue-100 px-1 rounded">{e}</code> — {d}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Settings() {
  const { data: users = [] } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage agents, SLA policies, webhooks, and system configuration</p>
      </div>

      <Tabs defaultValue="agents">
        <TabsList className="mb-4">
          <TabsTrigger value="agents" className="gap-1.5"><Users className="w-3.5 h-3.5" /> Agents</TabsTrigger>
          <TabsTrigger value="sla" className="gap-1.5"><Clock className="w-3.5 h-3.5" /> SLA Rules</TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-1.5"><Webhook className="w-3.5 h-3.5" /> Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="agents"><AgentsTab users={users as any[]} /></TabsContent>
        <TabsContent value="sla"><SlaTab /></TabsContent>
        <TabsContent value="webhooks"><WebhooksTab /></TabsContent>
      </Tabs>
    </div>
  );
}
