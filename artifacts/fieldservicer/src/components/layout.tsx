import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Zap, Bell, Mail, ChevronDown, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tickets", href: "/tickets" },
  { label: "Clients", href: "/clients" },
  { label: "Sites", href: "/sites" },
  { label: "Jobs", href: "/jobs" },
  { label: "Employees", href: "/employees" },
  { label: "Vendors", href: "/vendors" },
  { label: "Contacts", href: "/contacts" },
  { label: "Channels", href: "/channels" },
  { label: "Automation", href: "/automation" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

const NOTIF_TYPE_COLORS: Record<string, string> = {
  ticket_created: "bg-blue-500",
  ticket_assigned: "bg-violet-500",
  ticket_escalated: "bg-red-500",
  ticket_resolved: "bg-green-500",
  sla_breach: "bg-orange-500",
  new_message: "bg-cyan-500",
  automation_triggered: "bg-purple-500",
  mention: "bg-pink-500",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location, navigate] = useLocation();
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    if (href === "/dashboard") return location === "/" || location === "/dashboard";
    return location === href || location.startsWith(href + "/");
  }

  // Poll for notification count every 15s
  useEffect(() => {
    async function fetchCount() {
      try {
        const res = await fetch("/api/notifications/count");
        if (res.ok) { const d = await res.json(); setUnreadCount(d.count ?? 0); }
      } catch {}
    }
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  // Load notifications when panel opens
  useEffect(() => {
    if (!showNotifs) return;
    fetch("/api/notifications?limit=20")
      .then(r => r.json())
      .then(setNotifications)
      .catch(() => {});
  }, [showNotifs]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function markRead(id: number) {
    await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    setNotifications(n => n.map(x => x.id === id ? { ...x, read: true } : x));
    setUnreadCount(c => Math.max(0, c - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications/read-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    setNotifications(n => n.map(x => ({ ...x, read: true })));
    setUnreadCount(0);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center h-14 px-6 gap-6">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}>
                <Zap className="w-4 h-4 text-white" fill="white" />
              </div>
              <span className="font-bold text-[15px] text-gray-900 tracking-tight">
                Field<span style={{ color: "#7C3AED" }}>Servicer</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-1 flex-1 overflow-x-auto scrollbar-none">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${active ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifs && (
                <div className="absolute right-0 top-10 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <span className="font-semibold text-sm">Notifications</span>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-violet-600 hover:underline">Mark all read</button>
                      )}
                      <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-muted-foreground">No notifications</div>
                    ) : notifications.map((n: any) => (
                      <div
                        key={n.id}
                        onClick={() => { markRead(n.id); if (n.ticketId) { setShowNotifs(false); navigate(`/tickets/${n.ticketId}`); } }}
                        className={`flex gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!n.read ? "bg-blue-50/50" : ""}`}
                      >
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${NOTIF_TYPE_COLORS[n.type] ?? "bg-gray-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!n.read ? "font-semibold" : "font-medium"} leading-snug`}>{n.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{n.body}</p>
                          <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
                        </div>
                        {!n.read && (
                          <button
                            onClick={e => { e.stopPropagation(); markRead(n.id); }}
                            className="text-gray-300 hover:text-green-500 flex-shrink-0 mt-1"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-700">Ops Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}>
                OA
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
