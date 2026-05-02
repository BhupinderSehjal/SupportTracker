import { useState } from "react";
import { useListVendors, getListVendorsQueryKey, useCreateVendor } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, Truck, Mail, Phone } from "lucide-react";

export default function Vendors() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState("");

  const { data: vendors = [], refetch } = useListVendors(
    search ? { search } : undefined,
    { query: { queryKey: getListVendorsQueryKey(search ? { search } : undefined) } }
  );
  const createVendor = useCreateVendor();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createVendor.mutateAsync({ data: { name, email: email || undefined, phone: phone || undefined, category: category || undefined } });
    setOpen(false); setName(""); setEmail(""); setPhone(""); setCategory("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{vendors.length} vendors</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Vendor</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. HVAC Parts, Electrical" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!name || createVendor.isPending}>{createVendor.isPending ? "Saving..." : "Add Vendor"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search vendors..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor: any) => (
          <div key={vendor.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <Truck className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{vendor.name}</p>
                  {vendor.category && <p className="text-xs text-muted-foreground">{vendor.category}</p>}
                </div>
              </div>
              <Badge variant={vendor.status === "active" ? "default" : "secondary"} className="text-xs">{vendor.status}</Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {vendor.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {vendor.email}</p>}
              {vendor.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {vendor.phone}</p>}
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Truck className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No vendors found</p>
          </div>
        )}
      </div>
    </div>
  );
}
