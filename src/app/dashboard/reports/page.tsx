import { getSession } from "@/lib/auth";
import { ReportsSection } from "./reports-section";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const session = await getSession();
  if (!session?.gymId) return null;

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground">
          Export revenue and client data by date range. Preview before downloading.
        </p>
      </div>
      <ReportsSection />
    </div>
  );
}
