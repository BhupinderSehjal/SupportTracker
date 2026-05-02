import React from "react";
import { Link } from "wouter";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetTicketTrends, getGetTicketTrendsQueryKey,
  useGetChannelBreakdown, getGetChannelBreakdownQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetAgentStats, getGetAgentStatsQueryKey,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, CheckCircle2, TicketIcon, TrendingUp, Mail, MessageCircle, Plus, AlertTriangle, Users } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, formatDistanceToNow } from "date-fns";

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  email: <Mail className="w-3.5 h-3.5 text-blue-500" />,
  whatsapp: <MessageCircle className="w-3.5 h-3.5 text-green-500" />,
  manual: <Plus className="w-3.5 h-3.5 text-gray-400" />,
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-yellow-400",
  low: "bg-blue-400",
};

interface KpiCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  gradient: string;
}

function KpiCard({ label, value, sub, icon, gradient }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider leading-none">{label}</p>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: gradient }}
        >
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 leading-none mb-1.5">{value}</div>
      <p className="text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });
  const { data: trends = [] } = useGetTicketTrends({
    query: { queryKey: getGetTicketTrendsQueryKey() }
  });
  const { data: channels = [] } = useGetChannelBreakdown({
    query: { queryKey: getGetChannelBreakdownQueryKey() }
  });
  const { data: activity = [] } = useGetRecentActivity({
    query: { queryKey: getGetRecentActivityQueryKey() }
  });
  const { data: agentStats = [] } = useGetAgentStats({
    query: { queryKey: getGetAgentStatsQueryKey() }
  });

  const trendData = trends.map((t: any) => ({
    ...t,
    date: format(new Date(t.date), "MMM d"),
  }));

  const channelTotal = channels.reduce((s: number, c: any) => s + c.count, 0) || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-1">Executive overview of support operations.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <Skeleton className="h-3 w-24 mb-4" />
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1">Executive overview of support operations.</p>
      </div>

      {/* KPI Cards — 4-column row matching portal.fieldservicer.com style */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Open Tickets"
          value={summary?.totalOpen ?? 0}
          sub={`${summary?.urgentOpen ?? 0} urgent · ${summary?.unassignedOpen ?? 0} unassigned`}
          gradient="linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)"
          icon={<TicketIcon className="w-4.5 h-4.5" style={{ color: "#7C3AED" }} />}
        />
        <KpiCard
          label="In Progress"
          value={summary?.totalInProgress ?? 0}
          sub="Actively being worked on"
          gradient="linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)"
          icon={<Clock className="w-4.5 h-4.5" style={{ color: "#D97706" }} />}
        />
        <KpiCard
          label="Escalated"
          value={summary?.totalEscalated ?? 0}
          sub="Requires immediate attention"
          gradient="linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)"
          icon={<AlertCircle className="w-4.5 h-4.5" style={{ color: "#DC2626" }} />}
        />
        <KpiCard
          label="SLA Compliance"
          value={`${summary?.slaComplianceRate ?? 0}%`}
          sub={`Avg response: ${summary?.avgResponseTimeMinutes ?? 0} mins`}
          gradient="linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%)"
          icon={<CheckCircle2 className="w-4.5 h-4.5" style={{ color: "#16A34A" }} />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-7">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-violet-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Ticket Volume (7 Days)</h2>
          </div>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} allowDecimals={false} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "8px",
                    fontSize: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,.07)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line type="monotone" dataKey="created" stroke="#7C3AED" name="Created" strokeWidth={2.5} dot={{ r: 3, fill: "#7C3AED" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="resolved" stroke="#22C55E" name="Resolved" strokeWidth={2.5} dot={{ r: 3, fill: "#22C55E" }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No trend data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 lg:col-span-3">
          <h2 className="font-semibold text-gray-900 text-sm mb-4">Channel Breakdown</h2>
          <div className="space-y-4">
            {channels.map((c: any) => {
              const pct = Math.round((c.count / channelTotal) * 100);
              const barColor = c.channel === "whatsapp" ? "#22C55E" : c.channel === "email" ? "#6366F1" : "#A78BFA";
              return (
                <div key={c.channel}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="flex items-center gap-1.5 text-sm font-medium capitalize text-gray-700">
                      {CHANNEL_ICON[c.channel]}
                      {c.channel}
                    </span>
                    <span className="text-xs text-gray-400">{c.count} tickets · {pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                  </div>
                </div>
              );
            })}
            {channels.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No channel data</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity + Agent Workload */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-sm">Recent Activity</h2>
            <Link href="/tickets" className="text-xs text-violet-600 hover:underline font-medium">View all →</Link>
          </div>
          <div className="space-y-2">
            {activity.slice(0, 8).map((item: any) => (
              <Link key={item.id} href={`/tickets/${item.ticketId}`}>
                <div className="flex items-start gap-3 hover:bg-gray-50 rounded-lg px-2 py-2 -mx-2 transition-colors cursor-pointer">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${PRIORITY_DOT[item.priority] ?? "bg-gray-300"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {item.action} · {item.clientName ?? "No client"} · {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </p>
                  </div>
                  {item.slaBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                </div>
              </Link>
            ))}
            {activity.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No recent activity</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-violet-600" />
            <h2 className="font-semibold text-gray-900 text-sm">Agent Workload</h2>
          </div>
          <div className="space-y-3">
            {agentStats.slice(0, 5).map((stat: any) => (
              <div key={stat.agentId} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}
                >
                  {stat.agentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800 truncate">{stat.agentName}</span>
                    <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{stat.openTickets} open</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((stat.openTickets / 10) * 100, 100)}%`,
                        background: stat.openTickets > 5 ? "#EF4444" : stat.openTickets > 2 ? "#F97316" : "#22C55E",
                      }}
                    />
                  </div>
                </div>
                {stat.resolvedToday > 0 && (
                  <span className="text-xs text-green-600 font-semibold flex-shrink-0">+{stat.resolvedToday} today</span>
                )}
              </div>
            ))}
            {agentStats.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">No agent data</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
