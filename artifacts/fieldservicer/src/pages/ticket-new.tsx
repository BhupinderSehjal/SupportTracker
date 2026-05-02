import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateTicket, useListClients, useListSites, useListEmployees, useListJobs, useListContacts, useListUsers, useListTags } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TicketNew() {
  const [, navigate] = useLocation();
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [channel, setChannel] = useState("manual");
  const [priority, setPriority] = useState("medium");
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [jobId, setJobId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");

  const { data: clients = [] } = useListClients();
  const { data: sites = [] } = useListSites({ clientId: clientId ? Number(clientId) : undefined } as any);
  const { data: employees = [] } = useListEmployees();
  const { data: jobs = [] } = useListJobs({ clientId: clientId ? Number(clientId) : undefined } as any);
  const { data: users = [] } = useListUsers();

  const createTicket = useCreateTicket();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim()) return;
    const result = await createTicket.mutateAsync({
      data: {
        subject,
        description: description || undefined,
        channel: channel as any,
        priority: priority as any,
        clientId: clientId ? Number(clientId) : undefined,
        siteId: siteId ? Number(siteId) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined,
        jobId: jobId ? Number(jobId) : undefined,
        assignedToId: assignedToId ? Number(assignedToId) : undefined,
      }
    });
    navigate(`/tickets/${(result as any).id}`);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/tickets"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Ticket</h1>
          <p className="text-sm text-muted-foreground">Create a new support ticket</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader><CardTitle className="text-base">Ticket Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of the issue" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Full details about the issue..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Channel</Label>
                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Link to Entities</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <Select value={clientId} onValueChange={v => { setClientId(v === "none" ? "" : v); setSiteId(""); setJobId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Site</Label>
                <Select value={siteId} onValueChange={v => setSiteId(v === "none" ? "" : v)} disabled={!clientId}>
                  <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {sites.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Job / Work Order</Label>
                <Select value={jobId} onValueChange={v => setJobId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select job" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {jobs.map((j: any) => <SelectItem key={j.id} value={String(j.id)}>{j.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Employee</Label>
                <Select value={employeeId} onValueChange={v => setEmployeeId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Assignment</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              <Label>Assign to Agent</Label>
              <Select value={assignedToId} onValueChange={v => setAssignedToId(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {users.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name} — {u.role}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={!subject.trim() || createTicket.isPending}>
            {createTicket.isPending ? "Creating..." : "Create Ticket"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/tickets">Cancel</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
