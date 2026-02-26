"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Shield,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

const ADMIN_MOBILE_SIDEBAR_EVENT = "toggle-admin-mobile-sidebar";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/gym-owners", label: "Gym Owners", icon: Users },
  { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
  { href: "/admin/reports", label: "Reports", icon: FileBarChart },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setMobileOpen((o) => !o);
    window.addEventListener(ADMIN_MOBILE_SIDEBAR_EVENT, handler);
    return () => window.removeEventListener(ADMIN_MOBILE_SIDEBAR_EVENT, handler);
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
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-border/50 bg-card/80 shadow-sm backdrop-blur-sm transition-[width,transform] duration-300 ease-out",
          mobileOpen ? "w-64 translate-x-0" : cn(collapsed ? "w-[72px]" : "w-64", "-translate-x-full lg:translate-x-0")
        )}
      >
      <div className="flex h-16 shrink-0 items-center border-b border-border/50 px-4">
        {!collapsed && (
          <Link
            href="/admin"
            className="logo-brand group flex items-center gap-3 outline-none rounded-xl py-1.5 pr-2 transition-all duration-300 hover:scale-[1.03] focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="logo-dot flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/15">
              <Shield className="h-6 w-6" />
            </span>
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-slate-800 dark:text-slate-100">FitDesk</span>
              <span className="text-primary transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(124,58,237,0.4)]">.me</span>
              <span className="text-slate-800 dark:text-slate-100"> Admin</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <Link
            href="/admin"
            className="logo-brand flex justify-center w-full rounded-xl transition-transform duration-300 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
          >
            <span className="logo-dot flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Shield className="h-6 w-6" />
            </span>
          </Link>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Admin navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card",
                isActive
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive ? "bg-primary-foreground/20" : "bg-muted/50"
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="shrink-0 border-t border-border/50 p-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground flex lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-full rounded-xl text-muted-foreground hover:bg-muted/70 hover:text-foreground hidden lg:flex"
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

export function AdminSidebarTrigger() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 rounded-xl lg:hidden shrink-0"
      onClick={() => window.dispatchEvent(new CustomEvent(ADMIN_MOBILE_SIDEBAR_EVENT))}
      aria-label="Open menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
}
