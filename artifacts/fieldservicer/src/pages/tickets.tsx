import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  useListTickets, getListTicketsQueryKey,
} from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Mail, MessageCircle, Plus, Search, SlidersHorizontal, AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-50 text-blue-700 border border-blue-200",
  in_progress: "bg-orange-50 text-orange-700 border border-orange-200",
  waiting_customer: "bg-yellow-50 text-yellow-700 border border-yellow-200",
  waiting_internal: "bg-violet-50 text-violet-700 border border-violet-200",
  escalated: "bg-red-50 text-red-700 border border-red-200",
  resolved: "bg-green-50 text-green-700 border border-green-200",
  closed: "bg-gray-100 text-gray-600 border border-gray-200",
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
  if (channel === "email") return <Mail className="w-4 h-4 text-blue-500" />;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-400 mt-0.5">{total} total tickets</p>
        </div>
        <Button
          asChild
          className="bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-semibold"
        >
          <Link href="/tickets/new">
            <Plus className="w-4 h-4 mr-2" /> Add New
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            className="pl-9 border-gray-200 rounded-lg"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
          <SelectTrigger className="w-44 border-gray-200 rounded-lg">
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
          <SelectTrigger className="w-36 border-gray-200 rounded-lg">
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
          <SelectTrigger className="w-36 border-gray-200 rounded-lg">
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

      {/* Ticket Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Dark table header — matches portal.fieldservicer.com */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] bg-gray-900 text-white text-xs font-semibold uppercase tracking-wider px-4 py-3">
          <div className="w-8"></div>
          <div>Subject</div>
          <div className="w-36 text-center">Status</div>
          <div className="w-20 text-center">Priority</div>
          <div className="w-32 text-center">Assigned</div>
          <div className="w-28 text-right">Created</div>
        </div>

        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 border-b border-gray-50 items-center animate-pulse">
              <div className="w-8 h-4 bg-gray-100 rounded" />
              <div className="space-y-1.5">
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="w-36 flex justify-center"><div className="h-5 w-24 bg-gray-100 rounded-full" /></div>
              <div className="w-20 flex justify-center"><div className="h-5 w-14 bg-gray-100 rounded" /></div>
              <div className="w-32 flex justify-center"><div className="h-4 w-20 bg-gray-100 rounded" /></div>
              <div className="w-28 flex justify-end"><div className="h-4 w-20 bg-gray-100 rounded" /></div>
            </div>
          ))
        ) : tickets.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <SlidersHorizontal className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-600">No tickets found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          tickets.map((ticket, idx) => (
            <div
              key={ticket.id}
              className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-0 px-4 py-3 border-b border-gray-50 items-center cursor-pointer hover:bg-violet-50/40 transition-colors ${idx % 2 === 1 ? "bg-gray-50/50" : ""}`}
              onClick={() => navigate(`/tickets/${ticket.id}`)}
            >
              <div className="w-8 flex items-center">
                <ChannelIcon channel={ticket.channel} />
              </div>
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  {ticket.slaBreached && (
                    <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 rounded px-1.5 py-0.5 font-semibold">
                      <AlertTriangle className="w-3 h-3" /> SLA
                    </span>
                  )}
                  <span className="font-semibold text-sm text-gray-800 truncate">{ticket.subject}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
                  <span className="font-mono text-gray-500">{ticket.ticketNumber}</span>
                  {ticket.clientName && <><span>·</span><span>{ticket.clientName}</span></>}
                  {ticket.siteName && <><span>·</span><span>{ticket.siteName}</span></>}
                  {(ticket.tags ?? []).length > 0 && (
                    <>
                      <span>·</span>
                      {(ticket.tags ?? []).slice(0, 2).map(tag => (
                        <span key={tag} className="bg-gray-100 rounded px-1.5 py-0.5 text-gray-500">{tag}</span>
                      ))}
                    </>
                  )}
                </div>
              </div>
              <div className="w-36 flex justify-center">
                <span className={`text-xs rounded-full px-2.5 py-0.5 font-semibold ${STATUS_COLORS[ticket.status] ?? ""}`}>
                  {STATUS_LABELS[ticket.status] ?? ticket.status}
                </span>
              </div>
              <div className="w-20 flex justify-center">
                <span className={`text-xs rounded px-2 py-0.5 font-bold uppercase tracking-wide ${PRIORITY_COLORS[ticket.priority] ?? ""}`}>
                  {ticket.priority}
                </span>
              </div>
              <div className="w-32 flex justify-center items-center gap-1.5 text-xs text-gray-500">
                {ticket.assignedToName ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center text-[10px] font-bold text-violet-700">
                      {ticket.assignedToName[0]}
                    </div>
                    <span className="truncate max-w-[80px]">{ticket.assignedToName}</span>
                  </>
                ) : (
                  <span className="text-orange-500 font-semibold">Unassigned</span>
                )}
              </div>
              <div className="w-28 text-right text-xs text-gray-400">
                {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 25 && (
        <div className="flex items-center justify-between text-sm text-gray-400 bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
          <span>Showing {(page - 1) * 25 + 1}–{Math.min(page * 25, total)} of {total}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="rounded-lg">← Previous</Button>
            <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage(p => p + 1)} className="rounded-lg">Next →</Button>
          </div>
        </div>
      )}
    </div>
  );
}
