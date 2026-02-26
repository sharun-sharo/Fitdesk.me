"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User, Bell, Search, Plus, UserPlus, CreditCard, CalendarX, FileText } from "lucide-react";
import { DashboardSidebarTrigger } from "./dashboard-sidebar";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

type ActivityItem = {
  type: "new_client" | "payment_received" | "subscription_expired" | "invoice_generated";
  label: string;
  timestamp: string;
  id?: string;
};

const ACTIVITY_ICONS = {
  new_client: UserPlus,
  payment_received: CreditCard,
  subscription_expired: CalendarX,
  invoice_generated: FileText,
};
const ACTIVITY_COLORS = {
  new_client: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  payment_received: "text-primary bg-primary/10",
  subscription_expired: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  invoice_generated: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
};

type Props = { gymName: string; userName: string; userEmail: string };

export function DashboardHeader({ gymName, userName, userEmail }: Props) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [activityOpen, setActivityOpen] = useState(false);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (!activityOpen) return;
    setActivityLoading(true);
    fetch("/api/dashboard/recent-activity")
      .then((res) => res.json())
      .then((data) => setRecentActivity(data.recentActivity ?? []))
      .catch(() => setRecentActivity([]))
      .finally(() => setActivityLoading(false));
  }, [activityOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) router.push(`/dashboard/clients?search=${encodeURIComponent(q)}`);
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-end gap-3 border-b border-border/50 bg-background/80 px-4 lg:px-6 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <DashboardSidebarTrigger />
      <div className="hidden lg:block min-w-0 shrink-0 mr-auto">
        <h2 className="font-semibold truncate text-base text-foreground">{gymName}</h2>
      </div>
      <form
        onSubmit={handleSearchSubmit}
        className="hidden sm:block w-full max-w-xs"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            placeholder="Search clients…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-lg bg-muted/50 border-border/50 w-full"
            aria-label="Search clients"
          />
        </div>
      </form>
      <div className="flex items-center gap-2 shrink-0">
        <Button asChild size="sm" className="rounded-lg gap-1.5 font-semibold h-9">
          <Link href="/dashboard/payments">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add payment</span>
          </Link>
        </Button>
        <DropdownMenu open={activityOpen} onOpenChange={setActivityOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-lg h-9 w-9" aria-label="Recent activity">
              <Bell className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 rounded-xl p-0" sideOffset={8}>
            <div className="px-3 py-2.5 border-b border-border/50">
              <p className="text-sm font-semibold text-foreground">Recent activity</p>
              <p className="text-xs text-muted-foreground mt-0.5">Latest updates</p>
            </div>
            <div className="max-h-[320px] overflow-auto">
              {activityLoading ? (
                <div className="py-6 text-center text-sm text-muted-foreground">Loading…</div>
              ) : recentActivity.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">No recent activity</div>
              ) : (
                <ul className="py-1">
                  {recentActivity.map((a, i) => {
                    const Icon = ACTIVITY_ICONS[a.type];
                    const colorClass = ACTIVITY_COLORS[a.type];
                    const href =
                      a.type === "new_client" || a.type === "subscription_expired"
                        ? `/dashboard/clients${a.id ? `/${a.id}` : ""}`
                        : a.type === "payment_received"
                          ? "/dashboard/payments"
                          : "/dashboard/reports";
                    return (
                      <li key={`${a.type}-${a.timestamp}-${i}`}>
                        <Link
                          href={href}
                          className="flex gap-3 px-3 py-2.5 hover:bg-muted/70 transition-colors rounded-none"
                          onClick={() => setActivityOpen(false)}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                            {Icon && <Icon className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{a.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 rounded-lg h-9 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:inline-block truncate max-w-[120px] text-sm font-medium">
                {userName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-xl">
            <div className="px-2 py-1.5 text-sm text-muted-foreground truncate">
              {userEmail}
            </div>
            <DropdownMenuItem
              onClick={() => router.push("/dashboard/settings")}
              className="rounded-lg"
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="rounded-lg">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
