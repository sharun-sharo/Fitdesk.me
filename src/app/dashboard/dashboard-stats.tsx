import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, IndianRupee, UserCheck, UserX } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Props = {
  totalClients: number;
  clientsThisMonth: number;
  clientsLastMonth: number;
  clientsThisYear: number;
  clientsAllTime: number;
  activeClients: number;
  expiredClients: number;
  revenueThisMonth: number;
};

export function DashboardStats({
  totalClients,
  clientsThisMonth,
  clientsLastMonth,
  clientsThisYear,
  clientsAllTime,
  activeClients,
  expiredClients,
  revenueThisMonth,
}: Props) {
  const stats = [
    {
      title: "Total Clients",
      value: totalClients,
      icon: Users,
      description: "All time",
    },
    {
      title: "Joined This Month",
      value: clientsThisMonth,
      icon: TrendingUp,
      description: `Last month: ${clientsLastMonth}`,
    },
    {
      title: "Joined This Year",
      value: clientsThisYear,
      icon: Users,
      description: `Total: ${clientsAllTime}`,
    },
    {
      title: "Revenue (This Month)",
      value: formatCurrency(revenueThisMonth),
      icon: IndianRupee,
      description: "From payments",
    },
    {
      title: "Active",
      value: activeClients,
      icon: UserCheck,
      description: "Subscription active",
    },
    {
      title: "Expired",
      value: expiredClients,
      icon: UserX,
      description: "Need renewal",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.title} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
