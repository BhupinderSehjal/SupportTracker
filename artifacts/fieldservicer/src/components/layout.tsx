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
  Plus
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
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col flex-shrink-0 border-r border-sidebar-border">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border/50">
          <div className="font-bold text-lg tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center">
              <Ticket className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            FieldServicer
          </div>
        </div>

        <div className="p-4">
          <Button asChild className="w-full justify-start bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground">
            <Link href="/tickets/new">
              <Plus className="mr-2 h-4 w-4" />
              New Ticket
            </Link>
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer text-sm font-medium ${
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium">
              OP
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-none">Ops Admin</span>
              <span className="text-xs text-sidebar-foreground/60">online</span>
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
