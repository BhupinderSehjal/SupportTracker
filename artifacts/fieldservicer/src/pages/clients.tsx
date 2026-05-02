import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useListClients, getListClientsQueryKey, useCreateClient } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Building2, Ticket, MapPin } from "lucide-react";
import { useState as useDialogState } from "react";

export default function Clients() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [industry, setIndustry] = useState("");

  const { data: clients = [], refetch } = useListClients(
    search ? { search } : undefined,
    { query: { queryKey: getListClientsQueryKey(search ? { search } : undefined) } }
  );

  const createClient = useCreateClient();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createClient.mutateAsync({ data: { name, email: email || undefined, phone: phone || undefined, industry: industry || undefined } });
    setOpen(false); setName(""); setEmail(""); setPhone(""); setIndustry("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.length} clients</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Client</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Client name" required /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="contact@client.com" /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1-555-0000" /></div>
              <div className="space-y-1.5"><Label>Industry</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Construction, HVAC..." /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!name || createClient.isPending}>
                  {createClient.isPending ? "Saving..." : "Add Client"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {clients.map((client: any) => (
          <div
            key={client.id}
            className="border rounded-lg p-4 bg-card hover:shadow-sm transition-shadow cursor-pointer"
            onClick={() => navigate(`/clients/${client.id}`)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{client.name}</p>
                  {client.industry && <p className="text-xs text-muted-foreground">{client.industry}</p>}
                </div>
              </div>
              <Badge variant={client.status === "active" ? "default" : "secondary"} className="text-xs">
                {client.status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {client.siteCount ?? 0} sites
              </span>
              <span className="flex items-center gap-1">
                <Ticket className="w-3 h-3" />
                <span className={client.openTicketCount > 0 ? "text-orange-600 font-medium" : ""}>
                  {client.openTicketCount ?? 0} open tickets
                </span>
              </span>
            </div>
            {client.email && <p className="text-xs text-muted-foreground mt-2 truncate">{client.email}</p>}
          </div>
        ))}
      </div>

      {clients.length === 0 && !search && (
        <div className="py-16 text-center text-muted-foreground">
          <Building2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No clients yet</p>
          <p className="text-sm mt-1">Add your first client to get started</p>
        </div>
      )}
    </div>
  );
}
