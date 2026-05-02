import React from "react";
import { Link } from "wouter";
import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetTicketTrends, getGetTicketTrendsQueryKey,
  useGetChannelBreakdown, getGetChannelBreakdownQueryKey,
  useGetRecentActivity, getGetRecentActivityQueryKey,
  useGetAgentStats, getGetAgentStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, CheckCircle2, TicketIcon, TrendingUp, Mail, MessageCircle, Plus, AlertTriangle } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Executive overview of support operations.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-3 w-[120px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const channelTotal = channels.reduce((s: number, c: any) => s + c.count, 0) || 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Executive overview of support operations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <TicketIcon className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalOpen ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary?.urgentOpen ?? 0} urgent, {summary?.unassignedOpen ?? 0} unassigned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalInProgress ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Actively being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escalated</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalEscalated ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA Compliance</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.slaComplianceRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg response: {summary?.avgResponseTimeMinutes ?? 0} mins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Ticket Volume (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">
                No trend data yet
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {channels.map((c: any) => {
              const pct = Math.round((c.count / channelTotal) * 100);
              return (
                <div key={c.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium capitalize">
                      {CHANNEL_ICON[c.channel]}
                      {c.channel}
                    </span>
                    <span className="text-sm text-muted-foreground">{c.count} tickets · {pct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${c.channel === "whatsapp" ? "bg-green-500" : c.channel === "email" ? "bg-blue-500" : "bg-violet-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {channels.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No channel data</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Recent Activity + Agent Stats */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <Link href="/tickets" className="text-xs text-blue-600 hover:underline">View all →</Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activity.slice(0, 8).map((item: any) => (
              <Link key={item.id} href={`/tickets/${item.ticketId}`}>
                <div className="flex items-start gap-3 hover:bg-muted/30 rounded p-1.5 -mx-1.5 transition-colors cursor-pointer">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0 ${PRIORITY_DOT[item.priority] ?? "bg-gray-400"}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.subject}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.action} · {item.clientName ?? "No client"} · {formatDistanceToNow(new Date(item.at), { addSuffix: true })}
                    </p>
                  </div>
                  {item.slaBreached && <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />}
                </div>
              </Link>
            ))}
            {activity.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm font-medium">Agent Workload</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {agentStats.slice(0, 5).map((stat: any) => (
              <div key={stat.agentId} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {stat.agentName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{stat.agentName}</span>
                    <span className="text-xs text-muted-foreground ml-2">{stat.openTickets} open</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${stat.openTickets > 5 ? "bg-red-500" : stat.openTickets > 2 ? "bg-orange-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min((stat.openTickets / 10) * 100, 100)}%` }}
                    />
                  </div>
                </div>
                {stat.resolvedToday > 0 && (
                  <span className="text-xs text-green-600 font-medium flex-shrink-0">+{stat.resolvedToday} today</span>
                )}
              </div>
            ))}
            {agentStats.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">No agent data</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
