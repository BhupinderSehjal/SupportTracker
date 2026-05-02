import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, MessageCircle, CheckCircle2, ExternalLink, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export default function Channels() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [emailForm, setEmailForm] = useState({ fromEmail: "customer@example.com", fromName: "John Customer", subject: "HVAC unit not working at Site B", body: "Hi, the HVAC unit at our main office has stopped working. It was serviced last month. Please urgently dispatch a technician.", priority: "high" });
  const [waForm, setWaForm] = useState({ fromPhone: "+441234567890", fromName: "Jane Smith", message: "Hi, our fire alarm system triggered this morning but no one came to check. Please follow up urgently.", priority: "urgent" });
  const [emailResult, setEmailResult] = useState<any>(null);
  const [waResult, setWaResult] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);

  async function simulateEmail(e: React.FormEvent) {
    e.preventDefault();
    setSendingEmail(true);
    try {
      const res = await fetch("/api/simulate/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const data = await res.json();
      setEmailResult(data);
      toast({ title: "Email ticket created!", description: `Ticket ${data.ticket.ticketNumber} created` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSendingEmail(false); }
  }

  async function simulateWhatsApp(e: React.FormEvent) {
    e.preventDefault();
    setSendingWa(true);
    try {
      const res = await fetch("/api/simulate/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(waForm),
      });
      if (!res.ok) throw new Error("Simulation failed");
      const data = await res.json();
      setWaResult(data);
      toast({ title: "WhatsApp ticket created!", description: `Ticket ${data.ticket.ticketNumber} created` });
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSendingWa(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Channel Simulator</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Simulate inbound Email and WhatsApp messages to test ticket creation, auto-linking, and automation rules</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Email Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                <Mail className="w-4 h-4 text-blue-600" />
              </div>
              Simulate Inbound Email
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simulateEmail} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">From Email *</label>
                  <Input value={emailForm.fromEmail} onChange={e => setEmailForm(f => ({ ...f, fromEmail: e.target.value }))} placeholder="customer@company.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">From Name</label>
                  <Input value={emailForm.fromName} onChange={e => setEmailForm(f => ({ ...f, fromName: e.target.value }))} placeholder="John Doe" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Subject *</label>
                <Input value={emailForm.subject} onChange={e => setEmailForm(f => ({ ...f, subject: e.target.value }))} placeholder="Support request subject" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Email Body</label>
                <Textarea value={emailForm.body} onChange={e => setEmailForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Message content..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Priority</label>
                <Select value={emailForm.priority} onValueChange={v => setEmailForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={sendingEmail}>
                <Mail className="w-4 h-4 mr-2" />{sendingEmail ? "Sending..." : "Simulate Inbound Email"}
              </Button>
            </form>

            {emailResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm font-medium mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Ticket Created Successfully
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Ticket #:</strong> {emailResult.ticket.ticketNumber}</p>
                  <p><strong>Channel:</strong> Email</p>
                  <p><strong>SLA Deadline:</strong> {emailResult.ticket.slaDeadlineAt ? new Date(emailResult.ticket.slaDeadlineAt).toLocaleString() : "N/A"}</p>
                  {emailResult.autoLinkedClient && <p className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Auto-linked to client</p>}
                  {emailResult.autoLinkedContact && <p className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Auto-linked to contact</p>}
                </div>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => navigate(`/tickets/${emailResult.ticket.id}`)}>
                  <ExternalLink className="w-3 h-3 mr-1" /> View Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WhatsApp Simulation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-green-600" />
              </div>
              Simulate WhatsApp Message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={simulateWhatsApp} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Phone Number *</label>
                  <Input value={waForm.fromPhone} onChange={e => setWaForm(f => ({ ...f, fromPhone: e.target.value }))} placeholder="+441234567890" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Sender Name</label>
                  <Input value={waForm.fromName} onChange={e => setWaForm(f => ({ ...f, fromName: e.target.value }))} placeholder="Jane Smith" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Message *</label>
                <Textarea value={waForm.message} onChange={e => setWaForm(f => ({ ...f, message: e.target.value }))} rows={5} placeholder="WhatsApp message content..." />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium">Priority</label>
                <Select value={waForm.priority} onValueChange={v => setWaForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["low", "medium", "high", "urgent"].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={sendingWa}>
                <MessageCircle className="w-4 h-4 mr-2" />{sendingWa ? "Sending..." : "Simulate WhatsApp Message"}
              </Button>
            </form>

            {waResult && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-green-800 text-sm font-medium mb-2">
                  <CheckCircle2 className="w-4 h-4" /> Ticket Created Successfully
                </div>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Ticket #:</strong> {waResult.ticket.ticketNumber}</p>
                  <p><strong>Channel:</strong> WhatsApp</p>
                  <p><strong>SLA Deadline:</strong> {waResult.ticket.slaDeadlineAt ? new Date(waResult.ticket.slaDeadlineAt).toLocaleString() : "N/A"}</p>
                  {waResult.autoLinkedContact && <p className="flex items-center gap-1 text-green-600"><CheckCircle2 className="w-3 h-3" /> Auto-linked to contact</p>}
                </div>
                <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={() => navigate(`/tickets/${waResult.ticket.id}`)}>
                  <ExternalLink className="w-3 h-3 mr-1" /> View Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info panel */}
      <Card className="border-blue-100 bg-blue-50/40">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How Channel Simulation Works</p>
              <ul className="space-y-0.5 text-xs text-blue-700">
                <li>• Each simulation creates a real ticket in the system with an SLA deadline based on priority</li>
                <li>• Email domain is matched against client email domains for auto-linking</li>
                <li>• Phone number is matched against contact records for auto-linking</li>
                <li>• Automation rules are evaluated and executed automatically after ticket creation</li>
                <li>• Outbound webhooks fire for all registered <code>ticket.created</code> listeners</li>
                <li>• In-app notifications are created for all agents</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
