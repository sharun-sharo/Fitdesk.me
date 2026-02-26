"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  CreditCard,
  Settings,
  FileText,
  Menu,
  CalendarRange,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const mainNav = [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }];
const managementNav = [
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/trainers", label: "Trainers", icon: UserCircle },
  { href: "/dashboard/subscriptions", label: "Subscriptions", icon: CalendarRange },
  { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/dashboard/invoices", label: "Invoice", icon: FileText },
  { href: "/dashboard/insights", label: "AI Insights", icon: Sparkles },
  { href: "/dashboard/reports", label: "Reports", icon: FileBarChart },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const MOBILE_SIDEBAR_EVENT = "toggle-mobile-sidebar";

export function DashboardSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen((o) => !o);
    window.addEventListener(MOBILE_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(MOBILE_SIDEBAR_EVENT, handler);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border/50 bg-card shadow-sm transition-[width,transform] duration-300 ease-in-out",
          mobileOpen ? "w-64 translate-x-0" : cn(collapsed ? "w-[72px]" : "w-64", "-translate-x-full lg:translate-x-0")
        )}
      >
      <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4">
        {!collapsed && (
          <Link
            href="/dashboard"
            className="logo-brand group flex items-center gap-3 outline-none rounded-lg py-1 pr-2 transition-all duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="logo-dot flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              <Dumbbell className="h-6 w-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-slate-800 dark:text-slate-100">FitDesk</span>
              <span className="text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]">.me</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/dashboard"
            className="logo-brand flex justify-center w-full rounded-lg outline-none transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="logo-dot flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Dumbbell className="h-6 w-6" />
            </span>
          </Link>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-4" aria-label="Main navigation">
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-section-label">Main</p>
          )}
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-xl"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
              </Link>
            );
          })}
        </div>
        <div className="space-y-1">
          {!collapsed && (
            <p className="px-3 mb-1.5 text-section-label">Management</p>
          )}
          {managementNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-xl"
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="shrink-0 border-t border-border/50 p-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground flex lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-full rounded-lg text-muted-foreground hover:bg-muted/70 hover:text-foreground hidden lg:flex"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
    </>
  );
}

export function DashboardSidebarTrigger() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-lg lg:hidden shrink-0"
      onClick={() => window.dispatchEvent(new CustomEvent(MOBILE_SIDEBAR_EVENT))}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
