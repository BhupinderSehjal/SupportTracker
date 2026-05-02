import { useState, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetTicket, getGetTicketQueryKey,
  useUpdateTicket, useCreateMessage,
  useListUsers, useListClients, useListSites, useListJobs,
  useListTickets,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  ArrowLeft, Mail, MessageCircle, Plus, AlertTriangle,
  User, MapPin, Building2, Briefcase, Tag, Clock, Send, Lock,
  Paperclip, X, FileText, Image, Sparkles, GitMerge, Download, Loader2, AlertCircle
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  waiting_customer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  waiting_internal: "bg-purple-100 text-purple-800 border-purple-200",
  escalated: "bg-red-100 text-red-800 border-red-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-red-500 text-white",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-400 text-yellow-900",
  low: "bg-blue-100 text-blue-700",
};

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "whatsapp") return <MessageCircle className="w-4 h-4 text-green-600" />;
  if (channel === "email") return <Mail className="w-4 h-4 text-blue-600" />;
  return <Plus className="w-4 h-4 text-gray-400" />;
}

function FileIcon({ mimeType }: { mimeType: string }) {
  if (mimeType.startsWith("image/")) return <Image className="w-4 h-4 text-blue-500" />;
  return <FileText className="w-4 h-4 text-gray-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function MessageBubble({ msg }: { msg: any }) {
  const isInternal = msg.type === "internal_note";
  const isOutbound = msg.type === "outbound";

  if (isInternal) {
    return (
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-yellow-100 border border-yellow-200 flex items-center justify-center flex-shrink-0 mt-1">
          <Lock className="w-3.5 h-3.5 text-yellow-600" />
        </div>
        <div className="flex-1 max-w-2xl">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
            <p className="text-xs font-medium text-yellow-700 mb-1.5">Internal Note · {msg.senderName}</p>
            <p className="text-sm text-yellow-900 whitespace-pre-wrap">{msg.body}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 ml-1">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
        </div>
      </div>
    );
  }

  if (isOutbound) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-primary-foreground">
          {(msg.senderName ?? "A")[0]}
        </div>
        <div className="flex-1 max-w-2xl flex flex-col items-end">
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3">
            <p className="text-xs font-medium opacity-70 mb-1.5">{msg.senderName}</p>
            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mr-1">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-muted border flex items-center justify-center flex-shrink-0 mt-1">
        <ChannelIcon channel={msg.channel} />
      </div>
      <div className="flex-1 max-w-2xl">
        <div className="bg-card border rounded-lg px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground mb-1.5">{msg.senderName}</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
        </div>
        <p className="text-xs text-muted-foreground mt-1 ml-1">{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</p>
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [replyBody, setReplyBody] = useState("");
  const [replyType, setReplyType] = useState<"outbound" | "internal_note">("outbound");
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const [showMerge, setShowMerge] = useState(false);
  const [mergeTargetId, setMergeTargetId] = useState<number | null>(null);
  const [merging, setMerging] = useState(false);

  const { data: ticket, isLoading, error } = useGetTicket(id, {
    query: { enabled: !!id, queryKey: getGetTicketQueryKey(id) }
  });

  const { data: users = [] } = useListUsers();
  const { data: clients = [] } = useListClients();
  const { data: sites = [] } = useListSites();
  const { data: jobs = [] } = useListJobs();
  const { data: ticketsData } = useListTickets({});

  const updateTicket = useUpdateTicket();
  const createMessage = useCreateMessage();

  // Load attachments
  useState(() => {
    if (!id) return;
    fetch(`/api/tickets/${id}/attachments`).then(r => r.json()).then(setAttachments).catch(() => {});
  });

  async function handleUpdate(data: any) {
    await updateTicket.mutateAsync({ id, data });
    qc.invalidateQueries({ queryKey: getGetTicketQueryKey(id) });
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!replyBody.trim()) return;
    await createMessage.mutateAsync({ id, data: { body: replyBody, type: replyType } });
    setReplyBody("");
    qc.invalidateQueries({ queryKey: getGetTicketQueryKey(id) });
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploadedBy", "Agent");
      const res = await fetch(`/api/tickets/${id}/attachments`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const attachment = await res.json();
      setAttachments(prev => [...prev, attachment]);
      toast({ title: "File uploaded", description: attachment.originalName });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteAttachment(attachmentId: number) {
    await fetch(`/api/attachments/${attachmentId}`, { method: "DELETE" });
    setAttachments(prev => prev.filter(a => a.id !== attachmentId));
    toast({ title: "Attachment deleted" });
  }

  async function loadAiSuggestions() {
    setAiLoading(true);
    setShowAi(true);
    try {
      const res = await fetch(`/api/tickets/${id}/ai-suggest`);
      if (!res.ok) throw new Error("AI service unavailable");
      const data = await res.json();
      setAiSuggestions(data.suggestions ?? []);
    } catch (err: any) {
      toast({ title: "AI Error", description: err.message, variant: "destructive" });
      setShowAi(false);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleMerge() {
    if (!mergeTargetId) return;
    setMerging(true);
    try {
      const res = await fetch(`/api/tickets/${id}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetId: mergeTargetId }),
      });
      if (!res.ok) throw new Error("Merge failed");
      toast({ title: "Tickets merged successfully" });
      setShowMerge(false);
      navigate("/tickets");
    } catch (err: any) {
      toast({ title: "Merge failed", description: err.message, variant: "destructive" });
    } finally {
      setMerging(false);
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading ticket...</div>;
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button asChild className="mt-4" variant="outline"><Link href="/tickets">Back to Tickets</Link></Button>
      </div>
    );
  }

  const messages = (ticket as any).messages ?? [];
  const otherTickets = ((ticketsData as any)?.tickets ?? []).filter((t: any) => t.id !== id && t.status !== "closed");
  const slaDeadlineAt = (ticket as any).slaDeadlineAt;

  return (
    <div className="flex gap-6 h-full">
      {/* Main conversation area */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tickets"><ArrowLeft className="w-4 h-4 mr-1" /> Tickets</Link>
          </Button>
          <span className="text-muted-foreground font-mono text-sm">{ticket.ticketNumber}</span>
          {ticket.slaBreached && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded px-2 py-0.5 font-medium">
              <AlertTriangle className="w-3 h-3" /> SLA Breached
            </span>
          )}
          {slaDeadlineAt && !ticket.slaBreached && (
            <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5">
              <Clock className="w-3 h-3" /> Due {formatDistanceToNow(new Date(slaDeadlineAt), { addSuffix: true })}
            </span>
          )}
          {(ticket as any).mergedIntoId && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 border border-gray-200 rounded px-2 py-0.5">
              <GitMerge className="w-3 h-3" /> Merged
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[ticket.status] ?? ""}`}>
              {ticket.status.replace(/_/g, " ")}
            </span>
            <span className={`text-xs rounded px-2 py-0.5 font-semibold uppercase ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
              {ticket.priority}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChannelIcon channel={ticket.channel} />{ticket.channel}
            </span>
            <span className="text-xs text-muted-foreground">· {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}</span>
          </div>
        </div>

        {/* AI Suggestions Panel */}
        {showAi && (
          <div className="border border-violet-200 bg-violet-50/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium flex items-center gap-1.5 text-violet-800">
                <Sparkles className="w-4 h-4" /> AI Smart Reply Suggestions
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowAi(false)}><X className="w-3.5 h-3.5" /></Button>
            </div>
            {aiLoading ? (
              <div className="flex items-center gap-2 text-sm text-violet-600">
                <Loader2 className="w-4 h-4 animate-spin" /> Generating suggestions...
              </div>
            ) : (
              <div className="space-y-2">
                {aiSuggestions.map((s, i) => (
                  <div key={i} className="bg-white border border-violet-100 rounded-md p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{s}</p>
                    <Button size="sm" variant="outline" className="mt-2 text-xs h-7" onClick={() => { setReplyBody(s); setReplyType("outbound"); setShowAi(false); }}>
                      Use This Reply
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Conversation */}
        <div className="space-y-4 py-2">
          {ticket.description && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
          {messages.map((msg: any) => <MessageBubble key={msg.id} msg={msg} />)}
          {messages.length === 0 && !ticket.description && (
            <div className="text-center py-10 text-muted-foreground text-sm">No messages yet. Send the first reply below.</div>
          )}
        </div>

        {/* Attachments List */}
        {attachments.length > 0 && (
          <div className="border rounded-lg p-3">
            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
              <Paperclip className="w-3.5 h-3.5" /> Attachments ({attachments.length})
            </p>
            <div className="space-y-1.5">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-2 text-sm group">
                  <FileIcon mimeType={att.mimeType} />
                  <a href={att.storagePath} target="_blank" rel="noopener noreferrer" className="flex-1 text-blue-600 hover:underline truncate text-xs">
                    {att.originalName}
                  </a>
                  <span className="text-xs text-muted-foreground">{formatBytes(att.fileSize)}</span>
                  <button onClick={() => deleteAttachment(att.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-600">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reply Box */}
        {ticket.status !== "closed" && (
          <form onSubmit={handleSendReply} className="border rounded-lg overflow-hidden">
            <div className="flex items-center border-b">
              <button type="button" onClick={() => setReplyType("outbound")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${replyType === "outbound" ? "bg-background border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Send className="w-3.5 h-3.5 inline mr-1.5" /> Reply
              </button>
              <button type="button" onClick={() => setReplyType("internal_note")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${replyType === "internal_note" ? "bg-background border-b-2 border-yellow-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Internal Note
              </button>
              <div className="ml-auto flex items-center gap-1 px-2">
                <Button type="button" variant="ghost" size="sm" onClick={loadAiSuggestions} disabled={aiLoading} title="AI Smart Reply">
                  <Sparkles className="w-3.5 h-3.5 text-violet-500" />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading} title="Attach file">
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <Textarea
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              placeholder={replyType === "internal_note" ? "Write an internal note visible only to agents..." : "Write your reply to the customer..."}
              className="border-0 rounded-none min-h-[100px] resize-none focus-visible:ring-0"
            />
            <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t">
              <span className="text-xs text-muted-foreground">
                {replyType === "internal_note" ? "Visible to agents only" : `Sending via ${ticket.channel}`}
              </span>
              <Button type="submit" size="sm" disabled={!replyBody.trim() || createMessage.isPending}>
                {createMessage.isPending ? "Sending..." : replyType === "internal_note" ? "Add Note" : "Send Reply"}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Actions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select value={ticket.status} onValueChange={v => handleUpdate({ status: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["open","in_progress","waiting_customer","waiting_internal","escalated","resolved","closed"].map(s => (
                    <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
              <Select value={ticket.priority} onValueChange={v => handleUpdate({ priority: v })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["low","medium","high","urgent"].map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Assigned Agent</label>
              <Select value={String(ticket.assignedToId ?? "")} onValueChange={v => handleUpdate({ assignedToId: v ? Number(v) : null })}>
                <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Unassigned</SelectItem>
                  {(users as any[]).map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="pt-1 flex flex-col gap-2">
              <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs" onClick={() => setShowMerge(true)}>
                <GitMerge className="w-3.5 h-3.5" /> Merge into Another Ticket
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Linked Entities</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ticket.clientName && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Link href={`/clients/${ticket.clientId}`} className="text-blue-600 hover:underline truncate">{ticket.clientName}</Link>
              </div>
            )}
            {ticket.siteName && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticket.siteName}</span>
              </div>
            )}
            {ticket.jobTitle && (
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticket.jobTitle}</span>
              </div>
            )}
            {ticket.employeeName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{ticket.employeeName}</span>
              </div>
            )}
            {!ticket.clientName && !ticket.siteName && !ticket.jobTitle && !ticket.employeeName && (
              <p className="text-xs text-muted-foreground">No entities linked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Details</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            {(ticket.tags ?? []).length > 0 && (
              <div>
                <p className="font-medium mb-1.5 text-foreground/70">Tags</p>
                <div className="flex flex-wrap gap-1">
                  {(ticket.tags ?? []).map((tag: string) => (
                    <span key={tag} className="bg-muted rounded px-2 py-0.5 text-xs">{tag}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="text-foreground">{format(new Date(ticket.createdAt), "MMM d, yyyy HH:mm")}</span>
              </div>
              {slaDeadlineAt && (
                <div className="flex justify-between">
                  <span>SLA Due</span>
                  <span className={ticket.slaBreached ? "text-red-600 font-medium" : "text-foreground"}>
                    {format(new Date(slaDeadlineAt), "MMM d HH:mm")}
                  </span>
                </div>
              )}
              {ticket.firstResponseAt && (
                <div className="flex justify-between">
                  <span>First response</span>
                  <span className="text-foreground">{format(new Date(ticket.firstResponseAt), "MMM d HH:mm")}</span>
                </div>
              )}
              {ticket.resolvedAt && (
                <div className="flex justify-between">
                  <span>Resolved</span>
                  <span className="text-green-600 font-medium">{format(new Date(ticket.resolvedAt), "MMM d HH:mm")}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Messages</span>
                <span className="text-foreground">{ticket.messageCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Attachments</span>
                <span className="text-foreground">{attachments.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merge Dialog */}
      <Dialog open={showMerge} onOpenChange={setShowMerge}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GitMerge className="w-4 h-4" /> Merge Ticket</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2 text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>This ticket will be closed and all its messages moved to the target ticket. This cannot be undone.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Merge into</label>
              <Select value={mergeTargetId ? String(mergeTargetId) : ""} onValueChange={v => setMergeTargetId(Number(v))}>
                <SelectTrigger><SelectValue placeholder="Select target ticket..." /></SelectTrigger>
                <SelectContent>
                  {otherTickets.map((t: any) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.ticketNumber} — {t.subject.slice(0, 40)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMerge(false)}>Cancel</Button>
            <Button onClick={handleMerge} disabled={!mergeTargetId || merging} className="gap-1.5">
              {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitMerge className="w-4 h-4" />}
              Merge Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
