import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Play, Zap, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const TRIGGER_LABELS: Record<string, string> = {
  ticket_created: "Ticket Created",
  ticket_updated: "Ticket Updated",
  message_received: "Message Received",
  sla_breached: "SLA Breached",
  status_changed: "Status Changed",
  priority_changed: "Priority Changed",
};

const ACTION_LABELS: Record<string, string> = {
  set_priority: "Set Priority",
  set_status: "Set Status",
  assign_agent: "Assign Agent",
  add_tags: "Add Tag",
};

const CONDITION_FIELDS = ["channel", "priority", "status"];
const OPERATORS = ["equals", "not_equals", "contains"];

function useAutomationRules() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchRules() {
    setLoading(true);
    try {
      const res = await fetch("/api/automation-rules");
      if (!res.ok) throw new Error("Failed to load");
      setRules(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useState(() => { fetchRules(); });

  return { rules, loading, error, refresh: fetchRules };
}

export default function Automation() {
  const { rules, loading, refresh } = useAutomationRules();
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerType: "ticket_created",
    conditions: [{ field: "channel", operator: "equals", value: "email" }],
    actions: [{ type: "set_priority", value: "high" }],
    active: true,
  });
  const { toast } = useToast();

  async function saveRule() {
    if (!form.name) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Automation rule created" });
      setShowForm(false);
      setForm({ name: "", description: "", triggerType: "ticket_created", conditions: [{ field: "channel", operator: "equals", value: "email" }], actions: [{ type: "set_priority", value: "high" }], active: true });
      refresh();
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  }

  async function toggleRule(id: number, active: boolean) {
    await fetch(`/api/automation-rules/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    refresh();
  }

  async function deleteRule(id: number) {
    await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
    refresh();
  }

  function addCondition() {
    setForm(f => ({ ...f, conditions: [...f.conditions, { field: "channel", operator: "equals", value: "" }] }));
  }
  function removeCondition(i: number) {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, idx) => idx !== i) }));
  }
  function updateCondition(i: number, key: string, value: string) {
    setForm(f => ({ ...f, conditions: f.conditions.map((c, idx) => idx === i ? { ...c, [key]: value } : c) }));
  }
  function addAction() {
    setForm(f => ({ ...f, actions: [...f.actions, { type: "set_priority", value: "high" }] }));
  }
  function removeAction(i: number) {
    setForm(f => ({ ...f, actions: f.actions.filter((_, idx) => idx !== i) }));
  }
  function updateAction(i: number, key: string, value: string) {
    setForm(f => ({ ...f, actions: f.actions.map((a, idx) => idx === i ? { ...a, [key]: value } : a) }));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Automation Engine</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Create rules that trigger actions automatically based on ticket events</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Rule
        </Button>
      </div>

      {/* New Rule Form */}
      {showForm && (
        <Card className="border-violet-200 bg-violet-50/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="w-4 h-4 text-violet-600" /> New Automation Rule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Rule Name *</label>
                <Input placeholder="e.g. Auto-escalate urgent tickets" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Trigger</label>
                <Select value={form.triggerType} onValueChange={v => setForm(f => ({ ...f, triggerType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Description (optional)</label>
              <Input placeholder="Describe what this rule does" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            {/* Conditions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conditions (ALL must match)</label>
                <Button variant="outline" size="sm" onClick={addCondition}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {form.conditions.length === 0 && <p className="text-xs text-muted-foreground py-2">No conditions — rule will always run on trigger</p>}
              {form.conditions.map((cond, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Select value={cond.field} onValueChange={v => updateCondition(i, "field", v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{CONDITION_FIELDS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={cond.operator} onValueChange={v => updateCondition(i, "operator", v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>{OPERATORS.map(o => <SelectItem key={o} value={o}>{o.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="flex-1" placeholder="value" value={cond.value} onChange={e => updateCondition(i, "value", e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => removeCondition(i)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions (executed in order)</label>
                <Button variant="outline" size="sm" onClick={addAction}><Plus className="w-3 h-3 mr-1" /> Add</Button>
              </div>
              {form.actions.map((action, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <Select value={action.type} onValueChange={v => updateAction(i, "type", v)}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(ACTION_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input className="flex-1" placeholder="value (e.g. high, open, 1)" value={action.value} onChange={e => updateAction(i, "value", e.target.value)} />
                  <Button variant="ghost" size="sm" onClick={() => removeAction(i)}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={saveRule} disabled={saving}>{saving ? "Saving..." : "Create Rule"}</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading rules...</div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-muted-foreground">No automation rules yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create rules to automatically assign, tag, escalate, or respond to tickets</p>
            <Button className="mt-4" onClick={() => setShowForm(true)}>Create First Rule</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((rule: any) => (
            <Card key={rule.id} className={rule.active ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rule.active ? "bg-violet-100" : "bg-gray-100"}`}>
                    <Zap className={`w-4 h-4 ${rule.active ? "text-violet-600" : "text-gray-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{rule.name}</span>
                      <Badge variant="outline" className="text-xs">{TRIGGER_LABELS[rule.triggerType] ?? rule.triggerType}</Badge>
                      {rule.active
                        ? <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-2 py-0.5"><CheckCircle2 className="w-3 h-3" /> Active</span>
                        : <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-0.5"><XCircle className="w-3 h-3" /> Inactive</span>
                      }
                    </div>
                    {rule.description && <p className="text-xs text-muted-foreground mt-0.5">{rule.description}</p>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{(rule.conditions as any[]).length} condition{(rule.conditions as any[]).length !== 1 ? "s" : ""}</span>
                      <span>{(rule.actions as any[]).length} action{(rule.actions as any[]).length !== 1 ? "s" : ""}</span>
                      <span className="flex items-center gap-1"><Play className="w-3 h-3" /> {rule.runCount ?? 0} runs</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => toggleRule(rule.id, !rule.active)}>
                      {rule.active ? "Disable" : "Enable"}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
