import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListTickets, getListTicketsQueryKey,
  useListUsers, getListUsersQueryKey,
  useListClients, getListClientsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Mail, MessageCircle, Plus, Search, SlidersHorizontal, Clock, AlertTriangle, User
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-orange-100 text-orange-800 border-orange-200",
  waiting_customer: "bg-yellow-100 text-yellow-800 border-yellow-200",
  waiting_internal: "bg-purple-100 text-purple-800 border-purple-200",
  escalated: "bg-red-100 text-red-800 border-red-200",
  resolved: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In Progress",
  waiting_customer: "Waiting Customer",
  waiting_internal: "Waiting Internal",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
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

export default function Tickets() {
  const [, navigate] = useLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [channel, setChannel] = useState("all");
  const [page, setPage] = useState(1);

  const params: Record<string, string | number> = { page, limit: 25 };
  if (search) params.search = search;
  if (status !== "all") params.status = status;
  if (priority !== "all") params.priority = priority;
  if (channel !== "all") params.channel = channel;

  const { data, isLoading } = useListTickets(params as any, {
    query: { queryKey: getListTicketsQueryKey(params as any) }
  });

  const tickets = data?.tickets ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} total tickets</p>
        </div>
        <Button asChild>
          <Link href="/tickets/new">
            <Plus className="w-4 h-4 mr-2" /> New Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-9"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
            <SelectItem value="waiting_internal">Waiting Internal</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={v => { setPriority(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priority</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channel} onValueChange={v => { setChannel(v); setPage(1); }}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Ticket List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2.5">
          <div className="w-8"></div>
          <div>Subject</div>
          <div className="w-32 text-center">Status</div>
          <div className="w-20 text-center">Priority</div>
          <div className="w-32 text-center">Assigned</div>
          <div className="w-28 text-right">Created</div>
        </div>

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 border-b items-center animate-pulse">
              <div className="w-8 h-4 bg-muted rounded" />
              <div className="space-y-1.5">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
              <div className="w-32 flex justify-center"><div className="h-5 w-20 bg-muted rounded-full" /></div>
              <div className="w-20 flex justify-center"><div className="h-5 w-14 bg-muted rounded" /></div>
              <div className="w-32 flex justify-center"><div className="h-4 w-20 bg-muted rounded" /></div>
              <div className="w-28 flex justify-end"><div className="h-4 w-20 bg-muted rounded" /></div>
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="font-medium">No tickets found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 border-b items-center cursor-pointer hover:bg-muted/30 transition-colors"
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <div className="w-8 flex items-center gap-1.5">
                <ChannelIcon channel={ticket.channel} />
              </div>
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  {ticket.slaBreached && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 border border-red-200 rounded px-1.5 py-0.5 font-medium">
                      <AlertTriangle className="w-3 h-3" /> SLA
                    </span>
                  )}
                  <span className="font-medium text-sm text-foreground truncate">{ticket.subject}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{ticket.ticketNumber}</span>
                  {ticket.clientName && <><span>·</span><span>{ticket.clientName}</span></>}
                  {ticket.siteName && <><span>·</span><span>{ticket.siteName}</span></>}
                  {(ticket.tags ?? []).length > 0 && (
                    <>
                      <span>·</span>
                      {(ticket.tags ?? []).slice(0, 2).map(tag => (
                        <span key={tag} className="bg-muted rounded px-1.5 py-0.5">{tag}</span>
                      ))}
                    </>
                  )}
                </div>
              </div>
              <div className="w-32 flex justify-center">
                <span className={`text-xs border rounded-full px-2.5 py-0.5 font-medium ${STATUS_COLORS[ticket.status] ?? ""}`}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
              <div className="w-20 flex justify-center">
                <span className={`text-xs rounded px-2 py-0.5 font-semibold uppercase ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="w-32 flex justify-center items-center gap-1.5 text-xs text-muted-foreground">
                {ticket.assignedToName ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {ticket.assignedToName[0]}
                    </div>
                    <span className="truncate max-w-[80px]">{ticket.assignedToName}</span>
                  </>
                ) : (
                  <span className="text-orange-500 font-medium">Unassigned</span>
                )}
              </div>
              <div className="w-28 text-right text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
