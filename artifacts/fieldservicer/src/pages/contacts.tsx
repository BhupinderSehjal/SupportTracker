import { useState } from "react";
import { useListContacts, getListContactsQueryKey, useCreateContact, useListClients } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Contact2, Mail, Phone, Building2 } from "lucide-react";

export default function Contacts() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientId, setClientId] = useState("");

  const { data: contacts = [], refetch } = useListContacts(
    search ? { search } : undefined,
    { query: { queryKey: getListContactsQueryKey(search ? { search } : undefined) } }
  );
  const { data: clients = [] } = useListClients();
  const createContact = useCreateContact();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createContact.mutateAsync({ data: { name, email: email || undefined, phone: phone || undefined, clientId: clientId ? Number(clientId) : undefined } });
    setOpen(false); setName(""); setEmail(""); setPhone(""); setClientId("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contacts</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{contacts.length} contacts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Contact</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Contact</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Client</Label>
                <Select value={clientId} onValueChange={v => setClientId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Select client (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clients.map((c: any) => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!name || createContact.isPending}>{createContact.isPending ? "Saving..." : "Add Contact"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {contacts.map((contact: any) => (
          <div key={contact.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                {contact.name[0]}
              </div>
              <div>
                <p className="font-semibold text-sm">{contact.name}</p>
                {contact.clientName && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="w-3 h-3" />{contact.clientName}</p>
                )}
              </div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {contact.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {contact.email}</p>}
              {contact.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {contact.phone}</p>}
            </div>
          </div>
        ))}
        {contacts.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <Contact2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No contacts found</p>
          </div>
        )}
      </div>
    </div>
  );
}
