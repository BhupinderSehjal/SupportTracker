import {
  useGetDashboardSummary, getGetDashboardSummaryQueryKey,
  useGetTicketTrends, getGetTicketTrendsQueryKey,
  useGetChannelBreakdown, getGetChannelBreakdownQueryKey,
  useGetSlaSummary, getGetSlaSummaryQueryKey,
  useGetAgentStats, getGetAgentStatsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from "recharts";
import { format } from "date-fns";

const CHANNEL_COLORS: Record<string, string> = {
  email: "#3b82f6",
  whatsapp: "#25d366",
  manual: "#8b5cf6",
};

export default function Reports() {
  const { data: summary } = useGetDashboardSummary({ query: { queryKey: getGetDashboardSummaryQueryKey() } });
  const { data: trends = [] } = useGetTicketTrends({ query: { queryKey: getGetTicketTrendsQueryKey() } });
  const { data: channels = [] } = useGetChannelBreakdown({ query: { queryKey: getGetChannelBreakdownQueryKey() } });
  const { data: sla } = useGetSlaSummary({ query: { queryKey: getGetSlaSummaryQueryKey() } });
  const { data: agentStats = [] } = useGetAgentStats({ query: { queryKey: getGetAgentStatsQueryKey() } });

  const trendData = trends.map((t: any) => ({
    ...t,
    date: format(new Date(t.date), "MMM d"),
  }));

  const pieData = channels.map((c: any) => ({
    name: c.channel.charAt(0).toUpperCase() + c.channel.slice(1),
    value: c.count,
    fill: CHANNEL_COLORS[c.channel] ?? "#6b7280",
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Support performance analytics</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Open", value: summary?.totalOpen ?? 0 },
          { label: "Resolved", value: summary?.totalResolved ?? 0 },
          { label: "Avg Response Time", value: `${summary?.avgResponseTimeMinutes ?? 0} min` },
          { label: "SLA Compliance", value: `${summary?.slaComplianceRate ?? 0}%` },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <p className="text-2xl font-bold">{kpi.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Ticket Volume (7 Days)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="created" stroke="#3b82f6" name="Created" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="resolved" stroke="#22c55e" name="Resolved" strokeWidth={2} dot={{ r: 3 }} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Channel Breakdown</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SLA Summary */}
      {sla && (
        <Card>
          <CardHeader><CardTitle className="text-base">SLA Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-4">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{sla.complianceRate}%</p>
                <p className="text-xs text-muted-foreground mt-1">Compliance Rate</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{sla.compliant}</p>
                <p className="text-xs text-muted-foreground mt-1">Compliant</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{sla.breached}</p>
                <p className="text-xs text-muted-foreground mt-1">Breached</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{sla.atRisk}</p>
                <p className="text-xs text-muted-foreground mt-1">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Agent Performance */}
      <Card>
        <CardHeader><CardTitle className="text-base">Agent Performance</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <div className="grid grid-cols-4 bg-muted/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wide px-4 py-2.5">
              <div>Agent</div>
              <div className="text-center">Open Tickets</div>
              <div className="text-center">Resolved Today</div>
              <div className="text-center">Avg Response</div>
            </div>
            {agentStats.map((stat: any) => (
              <div key={stat.agentId} className="grid grid-cols-4 px-4 py-3 border-b items-center hover:bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {stat.agentName[0]}
                  </div>
                  <span className="text-sm font-medium">{stat.agentName}</span>
                </div>
                <div className="text-center">
                  <span className={`text-sm font-semibold ${stat.openTickets > 5 ? "text-orange-600" : "text-foreground"}`}>
                    {stat.openTickets}
                  </span>
                </div>
                <div className="text-center">
                  <span className="text-sm font-semibold text-green-600">{stat.resolvedToday}</span>
                </div>
                <div className="text-center">
                  <span className="text-sm text-muted-foreground">
                    {stat.avgResponseMinutes > 0 ? `${stat.avgResponseMinutes} min` : "—"}
                  </span>
                </div>
              </div>
            ))}
            {agentStats.length === 0 && (
              <div className="py-8 text-center text-muted-foreground text-sm">No agent data</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
