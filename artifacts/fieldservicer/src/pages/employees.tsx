import { useState } from "react";
import { useListEmployees, getListEmployeesQueryKey, useCreateEmployee } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, Plus, UserCircle2, Mail, Phone } from "lucide-react";

export default function Employees() {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");

  const { data: employees = [], refetch } = useListEmployees(
    search ? { search } : undefined,
    { query: { queryKey: getListEmployeesQueryKey(search ? { search } : undefined) } }
  );
  const createEmployee = useCreateEmployee();

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    await createEmployee.mutateAsync({ data: { name, email: email || undefined, phone: phone || undefined, role: role || undefined } });
    setOpen(false); setName(""); setEmail(""); setPhone(""); setRole("");
    refetch();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employees</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{employees.length} field employees</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" /> New Employee</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Employee</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="space-y-1.5"><Label>Name *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div className="space-y-1.5"><Label>Role</Label><Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. HVAC Technician" /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={!name || createEmployee.isPending}>{createEmployee.isPending ? "Saving..." : "Add Employee"}</Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search employees..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {employees.map((emp: any) => (
          <div key={emp.id} className="border rounded-lg p-4 bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-sm text-primary">
                {emp.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-semibold text-sm">{emp.name}</p>
                {emp.role && <p className="text-xs text-muted-foreground">{emp.role}</p>}
              </div>
              <Badge variant={emp.status === "active" ? "default" : "secondary"} className="ml-auto text-xs">{emp.status}</Badge>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              {emp.email && <p className="flex items-center gap-1.5"><Mail className="w-3 h-3" /> {emp.email}</p>}
              {emp.phone && <p className="flex items-center gap-1.5"><Phone className="w-3 h-3" /> {emp.phone}</p>}
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-3 py-16 text-center text-muted-foreground">
            <UserCircle2 className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No employees found</p>
          </div>
        )}
      </div>
    </div>
  );
}
