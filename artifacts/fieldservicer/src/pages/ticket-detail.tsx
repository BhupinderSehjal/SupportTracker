import { useState } from "react";
import { useParams, Link, useLocation } from "wouter";
import {
  useGetTicket, getGetTicketQueryKey,
  useUpdateTicket, useCreateMessage,
  useListUsers, useListClients, useListSites, useListJobs,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft, Mail, MessageCircle, Plus, AlertTriangle,
  User, MapPin, Building2, Briefcase, Tag, Clock, Send, Lock
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

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
          <p className="text-xs text-muted-foreground mt-1 ml-1">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>
    );
  }

  if (isOutbound) {
    return (
      <div className="flex gap-3 flex-row-reverse">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-1 text-xs font-bold text-primary-foreground">
          {msg.senderName[0]}
        </div>
        <div className="flex-1 max-w-2xl flex flex-col items-end">
          <div className="bg-primary text-primary-foreground rounded-lg px-4 py-3">
            <p className="text-xs font-medium opacity-70 mb-1.5">{msg.senderName}</p>
            <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1 mr-1">
            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
          </p>
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
        <p className="text-xs text-muted-foreground mt-1 ml-1">
          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

export default function TicketDetail() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [replyBody, setReplyBody] = useState("");
  const [replyType, setReplyType] = useState<"outbound" | "internal_note">("outbound");

  const { data: ticket, isLoading, error } = useGetTicket(id, {
    query: { enabled: !!id, queryKey: getGetTicketQueryKey(id) }
  });

  const { data: users = [] } = useListUsers();
  const { data: clients = [] } = useListClients();
  const { data: sites = [] } = useListSites();
  const { data: jobs = [] } = useListJobs();

  const updateTicket = useUpdateTicket();
  const createMessage = useCreateMessage();

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading ticket...
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/tickets">Back to Tickets</Link>
        </Button>
      </div>
    );
  }

  const messages = (ticket as any).messages ?? [];

  return (
    <div className="flex gap-6 h-full">
      {/* Main conversation area */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tickets"><ArrowLeft className="w-4 h-4 mr-1" /> Tickets</Link>
          </Button>
          <span className="text-muted-foreground font-mono text-sm">{ticket.ticketNumber}</span>
          {ticket.slaBreached && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded px-2 py-0.5 font-medium">
              <AlertTriangle className="w-3 h-3" /> SLA Breached
            </span>
          )}
        </div>

        <div>
          <h1 className="text-xl font-bold tracking-tight">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[ticket.status] ?? ""}`}>
              {ticket.status.replace(/_/g, " ")}
            </span>
            <span className={`text-xs rounded px-2 py-0.5 font-semibold uppercase ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
              {ticket.priority}
            </span>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ChannelIcon channel={ticket.channel} />
              {ticket.channel}
            </span>
            <span className="text-xs text-muted-foreground">
              · {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Conversation */}
        <div className="space-y-4 py-2">
          {ticket.description && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Description</p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}
          {messages.map((msg: any) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          {messages.length === 0 && !ticket.description && (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No messages yet. Send the first reply below.
            </div>
          )}
        </div>

        {/* Reply Box */}
        {ticket.status !== "closed" && (
          <form onSubmit={handleSendReply} className="border rounded-lg overflow-hidden">
            <div className="flex border-b">
              <button
                type="button"
                onClick={() => setReplyType("outbound")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${replyType === "outbound" ? "bg-background border-b-2 border-primary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Send className="w-3.5 h-3.5 inline mr-1.5" /> Reply
              </button>
              <button
                type="button"
                onClick={() => setReplyType("internal_note")}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${replyType === "internal_note" ? "bg-background border-b-2 border-yellow-500 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Lock className="w-3.5 h-3.5 inline mr-1.5" /> Internal Note
              </button>
            </div>
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
                  {users.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Linked Entities</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {ticket.clientName && (
              <div className="flex items-center gap-2 text-sm">
                <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <Link href={`/clients/${ticket.clientId}`} className="text-blue-600 hover:underline truncate">
                  {ticket.clientName}
                </Link>
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
            {!ticket.clientName && !ticket.siteName && !ticket.jobTitle && (
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
