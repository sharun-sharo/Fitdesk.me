# FitDesk Admin – Structure & Components

Premium Super Admin control center structure after redesign.

---

## Folder structure

```
src/
├── app/
│   ├── admin/
│   │   ├── layout.tsx              # Admin layout (sidebar + header + max-width main)
│   │   ├── page.tsx                # Dashboard → DashboardView
│   │   ├── gym-owners/
│   │   │   └── page.tsx            # Uses GymOwnersList (fetch + filters + pagination)
│   │   ├── subscriptions/
│   │   │   └── subscriptions-list.tsx
│   │   └── reports/
│   │       └── reports-admin-section.tsx  # Date range + XLSX/CSV export
│   └── api/
│       └── admin/
│           ├── dashboard/route.ts  # KPIs, charts data, activity feed
│           ├── gym-owners/route.ts  # GET (list + filters) + POST (create)
│           ├── gyms/[id]/route.ts  # PATCH (isActive, subscription)
│           ├── subscription-plans/route.ts
│           └── reports/
│               ├── subscriptions/route.ts  # XLSX + CSV, date filter
│               └── gyms/route.ts
├── components/
│   ├── admin/                      # Admin-specific UI
│   │   ├── dashboard-view.tsx      # Fetches dashboard API, KPIs, charts, activity
│   │   ├── kpi-card.tsx            # Animated counter + optional growth %
│   │   ├── activity-feed.tsx       # Recent activity list
│   │   ├── gym-owners-list.tsx     # Search, filters, pagination, quick actions
│   │   ├── add-gym-owner-form.tsx
│   │   └── assign-plan-form.tsx
│   ├── charts/                     # Recharts wrappers
│   │   ├── revenue-line-chart.tsx  # Area chart, last 12 months
│   │   ├── gym-growth-chart.tsx    # Bar chart
│   │   └── subscription-pie-chart.tsx
│   ├── layouts/
│   │   ├── admin-sidebar.tsx       # Collapsible, hover states, rounded-xl
│   │   └── admin-header.tsx        # Sticky, glassmorphism, dark mode toggle
│   └── providers/
│       └── theme-provider.tsx      # Dark/light, localStorage
└── lib/
    ├── export-xlsx.ts              # exportToXLSX, exportToCSV, reportFilename
    └── utils.ts
```

---

## Key UI details

- **Layout:** Sticky header with backdrop blur, max-width main content (`max-w-7xl`), gradient background.
- **Sidebar:** Collapsible, rounded nav items, hover translate.
- **Dashboard:** KPI row with animated counters and growth %, revenue line chart, gym growth bar chart, subscription pie chart, activity feed, expiring-subscriptions alert banner.
- **Gym Owners:** Client-side list with search, status (Active/Inactive), plan filter, pagination, row hover, quick-actions dropdown (Assign plan, Activate/Deactivate).
- **Reports:** Optional date range, export as XLSX or CSV, loading state on buttons.
- **Theme:** Dark mode toggle in header; theme persisted in `localStorage` and applied via `document.documentElement.classList`.

---

## API usage

- `GET /api/admin/dashboard` – Returns KPIs, revenueOverTime, gymGrowth, subscriptionDistribution, recentActivity, lifetimeRevenue.
- `GET /api/admin/gym-owners?page=&limit=&search=&status=&planId=` – Paginated, filterable list.
- `POST /api/admin/gym-owners` – Create gym owner + gym (+ optional plan).
- `PATCH /api/admin/gyms/[id]` – Update isActive, subscriptionPlanId, dates.
- `GET /api/admin/reports/subscriptions?export=xlsx|csv&start=&end=` – Export with optional date range.
- `GET /api/admin/reports/gyms?export=xlsx|csv&start=&end=` – Same pattern.

---

## Reusable pieces

- **Charts:** `RevenueLineChart`, `GymGrowthChart`, `SubscriptionPieChart` in `components/charts/`.
- **KPI card:** `KpiCard` with optional growth % and delayed count animation.
- **Activity feed:** `ActivityFeed` for list of events with icon and time.
- **Forms:** `AddGymOwnerForm`, `AssignPlanForm` used by gym-owners list.
