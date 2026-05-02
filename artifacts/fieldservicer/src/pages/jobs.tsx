import { useState } from "react";
import { useListJobs, getListJobsQueryKey, useCreateJob, useListClients, useListSites } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Briefcase, Ticket, Calendar } from "lucide-react";
import { format } from "date-fns";

const JOB_STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  active: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

export default function Jobs() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("job");
  const [clientId, setClientId] = useState("");
  const [siteId, setSiteId] = useState("");

  const params: any = {};
  if (search) params.search = search;
  if (statusFilter !== "all") params.status = statusFilter;

  const { data: jobs = [], refetch } = useListJobs(params, { query: { queryKey: getListJobsQueryKey(params) } });
  const { data: clients = [] } = useListClients();
  const { data: sites = [] } = useListSites(clientId ? { clientId: Number(clientId) } as any : undefined);
  const createJob = useCreateJob();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createJob.mutateAsync({ data: { title, type: type as any, clientId: clientId ? Number(clientId) : undefined, siteId: siteId ? Number(siteId) : undefined } });
    setOpen(false); setTitle(""); setType("job"); setClientId(""); setSiteId("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs & Work Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{jobs.length} total</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Job</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Job</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Title *</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="work_order">Work Order</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Client</Label>
                <Select value={clientId} onValueChange={v => { setClientId(v === "none" ? "" : v); setSiteId(""); }}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {clientId && (
                <div className="space-y-1.5"><Label>Site</Label>
                  <Select value={siteId} onValueChange={v => setSiteId(v === "none" ? "" : v)}>
                    <SelectTrigger><SelectValue placeholder="Select site" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {sites.map((s: any) => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!title || createJob.isPending}>
                  {createJob.isPending ? "Saving..." : "Create Job"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {jobs.map((job: any) => (
          <div key={job.id} className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">{job.title}</p>
                  <p className="text-xs text-muted-foreground font-mono">{job.jobNumber}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs border rounded px-1.5 py-0.5 text-muted-foreground">{job.type === "work_order" ? "Work Order" : "Job"}</span>
                <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${JOB_STATUS_COLORS[job.status] ?? ""}`}>
                  {job.status}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
              {job.clientName && <span>{job.clientName}</span>}
              {job.siteName && <><span>·</span><span>{job.siteName}</span></>}
              {job.scheduledAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(job.scheduledAt), "MMM d, yyyy")}
                </span>
              )}
              <span className={`flex items-center gap-1 ml-auto ${job.openTicketCount > 0 ? "text-orange-600 font-medium" : ""}`}>
                <Ticket className="w-3 h-3" /> {job.openTicketCount} open
              </span>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <div className="col-span-2 py-16 text-center text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No jobs found</p>
          </div>
        )}
      </div>
    </div>
  );
}
