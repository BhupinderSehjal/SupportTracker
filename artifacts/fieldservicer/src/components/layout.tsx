import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Ticket, Users, MapPin, Briefcase,
  Contact2, BarChart3, Settings, Truck, Zap,
  Bell, Mail, ChevronDown,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Tickets", href: "/tickets" },
  { label: "Clients", href: "/clients" },
  { label: "Sites", href: "/sites" },
  { label: "Jobs", href: "/jobs" },
  { label: "Employees", href: "/employees" },
  { label: "Vendors", href: "/vendors" },
  { label: "Contacts", href: "/contacts" },
  { label: "Reports", href: "/reports" },
  { label: "Settings", href: "/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  function isActive(href: string) {
    if (href === "/dashboard") return location === "/" || location === "/dashboard";
    return location === href || location.startsWith(href + "/");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F7FB]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center h-14 px-6 gap-6">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 flex-shrink-0 cursor-pointer">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}
              >
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
                  <span
                    className={`
                      whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all
                      ${active
                        ? "bg-violet-600 text-white"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <Bell className="w-4 h-4" />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
              <Mail className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
              <span className="text-sm font-medium text-gray-700">Ops Admin</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #6366F1 0%, #A855F7 100%)" }}
              >
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
