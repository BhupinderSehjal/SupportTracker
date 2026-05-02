import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Ticket,
  Users,
  MapPin,
  Briefcase,
  Contact2,
  BarChart3,
  Settings,
  Truck,
  Plus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Ticket, label: "Tickets", href: "/tickets" },
  { icon: Users, label: "Clients", href: "/clients" },
  { icon: MapPin, label: "Sites", href: "/sites" },
  { icon: Briefcase, label: "Jobs", href: "/jobs" },
  { icon: Users, label: "Employees", href: "/employees" },
  { icon: Truck, label: "Vendors", href: "/vendors" },
  { icon: Contact2, label: "Contacts", href: "/contacts" },
  { icon: BarChart3, label: "Reports", href: "/reports" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-sidebar-border/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)" }}>
              <Zap className="w-4.5 h-4.5 text-white" fill="white" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              Field<span className="font-extrabold">Servicer</span>
            </span>
          </div>
        </div>

        {/* New Ticket CTA */}
        <div className="px-4 pt-5 pb-3">
          <Button
            asChild
            className="w-full justify-start font-semibold rounded-xl shadow-none border-0 text-white"
            style={{ background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)" }}
          >
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-sm font-medium ${
                    active
                      ? "bg-sidebar-accent text-white"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-white"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-violet-300" : "text-sidebar-foreground/50"}`} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User profile */}
        <div className="p-4 border-t border-sidebar-border/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg, #818CF8 0%, #A78BFA 100%)" }}>
              OA
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-none text-white">Ops Admin</span>
              <span className="text-xs text-sidebar-foreground/50 mt-0.5">online</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-auto p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
