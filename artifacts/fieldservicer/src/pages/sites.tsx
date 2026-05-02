import { useState } from "react";
import { useListSites, getListSitesQueryKey, useCreateSite, useListClients } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MapPin, Ticket, Building2 } from "lucide-react";

export default function Sites() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [clientId, setClientId] = useState("");

  const { data: sites = [], refetch } = useListSites(
    search ? { search } : undefined,
    { query: { queryKey: getListSitesQueryKey(search ? { search } : undefined) } }
  );
  const { data: clients = [] } = useListClients();
  const createSite = useCreateSite();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createSite.mutateAsync({ data: { name, address: address || undefined, clientId: Number(clientId) } });
    setOpen(false); setName(""); setAddress(""); setClientId("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sites</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{sites.length} sites</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Site</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Site</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Client *</Label>
                <Select value={clientId} onValueChange={setClientId}>
                  <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>
                    {clients.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Address</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!name || !clientId || createSite.isPending}>
                  {createSite.isPending ? "Saving..." : "Add Site"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search sites..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-0 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2.5">
          <div>Site</div>
          <div className="w-40">Client</div>
          <div className="w-28 text-center">Status</div>
          <div className="w-28 text-right">Open Tickets</div>
        </div>
        {sites.map((site: any) => (
          <div key={site.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-0 px-4 py-3 border-b items-center hover:bg-muted/30">
            <div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">{site.name}</span>
              </div>
              {site.address && <p className="text-xs text-muted-foreground mt-0.5 ml-6">{site.address}</p>}
            </div>
            <div className="w-40 text-sm text-muted-foreground flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> {site.clientName}
            </div>
            <div className="w-28 flex justify-center">
              <Badge variant={site.status === "active" ? "default" : "secondary"} className="text-xs">{site.status}</Badge>
            </div>
            <div className="w-28 text-right text-sm">
              <span className={site.openTicketCount > 0 ? "text-orange-600 font-semibold" : "text-muted-foreground"}>
                {site.openTicketCount} open
              </span>
            </div>
          </div>
        ))}
        {sites.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <MapPin className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No sites found</p>
          </div>
        )}
      </div>
    </div>
  );
}
