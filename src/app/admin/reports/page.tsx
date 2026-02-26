import { ReportsAdminSection } from "./reports-admin-section";

export const dynamic = "force-dynamic";

export default function AdminReportsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">
          Subscription revenue and gym growth export
        </p>
      </div>
      <ReportsAdminSection />
    </div>
  );
}
