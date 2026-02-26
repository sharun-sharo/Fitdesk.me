import Link from "next/link";
import { Suspense } from "react";
import { ClientsTable } from "./clients-table";
import { ClientsHeader } from "./clients-header";
import { ClientStatsSection } from "./client-stats-section";
import { Skeleton } from "@/components/ui/skeleton";
import { LayoutDashboard } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ClientsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* Header */}
      <div className="space-y-4">
        <nav
          className="flex items-center gap-2 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground font-medium">Clients</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Manage your gym members and subscriptions
            </p>
          </div>
          <ClientsHeader />
        </div>
      </div>

      {/* Stats */}
      <section aria-label="Client statistics">
        <ClientStatsSection />
      </section>

      {/* Table */}
      <section aria-label="Clients list">
        <Suspense fallback={<ClientsTableSkeleton />}>
          <ClientsTable />
        </Suspense>
      </section>
    </div>
  );
}

function ClientsTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-10 flex-1 min-w-[200px] rounded-xl" />
        <Skeleton className="h-10 w-[140px] rounded-xl" />
        <Skeleton className="h-10 w-[140px] rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
    </div>
  );
}
