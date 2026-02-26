"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePickerField } from "@/components/ui/date-picker-field";
import {
  LayoutDashboard,
  UserCircle,
  Plus,
  Check,
  X,
  Calendar,
  Clock,
  Users,
  TrendingUp,
  Sun,
  Moon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { cn } from "@/lib/utils";

const SPECIALIZATIONS = ["Strength", "Yoga", "CrossFit", "HIIT", "Pilates", "General", "Other"];
const SHIFT_OPTIONS = [
  { value: "MORNING", label: "Morning" },
  { value: "EVENING", label: "Evening" },
  { value: "CUSTOM", label: "Custom" },
];
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

type Trainer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  shift: string;
  shiftCustom: string | null;
  weeklyOff: string[] | null;
  salaryType: string;
  joiningDate: string | null;
  profilePhoto: string | null;
  createdAt: string;
  attendanceCount?: number;
  todayStatus?: "PRESENT" | "ABSENT" | "LATE" | null;
  monthSummary?: { present: number; absent: number; late: number; percent: number };
};

type AttendanceRecord = {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  checkInTime: string | null;
  checkOutTime: string | null;
};

type Stats = {
  totalTrainers: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  attendancePercent: number;
};

const defaultAddForm = {
  fullName: "",
  phone: "",
  email: "",
  specialization: "",
  shift: "MORNING",
  shiftCustom: "",
  weeklyOff: [] as string[],
  salaryType: "FIXED",
  joiningDate: "" as string | Date | undefined,
  profilePhoto: "",
};

export default function TrainersPage() {
  const { toast } = useToast();
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm, setAddForm] = useState(defaultAddForm);
  const [search, setSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<string>("all");
  const [specFilter, setSpecFilter] = useState<string>("all");
  const [statusTodayFilter, setStatusTodayFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("name");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [attendanceByTrainer, setAttendanceByTrainer] = useState<Record<string, AttendanceRecord[]>>({});
  const [attendanceLoading, setAttendanceLoading] = useState<Record<string, boolean>>({});

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/trainers/stats");
      if (!res.ok) return;
      const data = await res.json();
      setStats(data);
    } catch {
      setStats(null);
    }
  }, []);

  const fetchTrainers = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      if (shiftFilter !== "all") params.set("shift", shiftFilter);
      if (specFilter !== "all") params.set("specialization", specFilter);
      if (statusTodayFilter !== "all") params.set("statusToday", statusTodayFilter);
      params.set("sort", sort);
      const res = await fetch(`/api/dashboard/trainers?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      setTrainers(data.trainers ?? []);
    } catch {
      setTrainers([]);
    } finally {
      setLoading(false);
    }
  }, [search, shiftFilter, specFilter, statusTodayFilter, sort]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setLoading(true);
    fetchTrainers();
  }, [fetchTrainers]);

  async function handleAddTrainer(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.fullName.trim()) {
      toast({ title: "Full name is required", variant: "destructive" });
      return;
    }
    setAddSaving(true);
    try {
      const res = await fetch("/api/dashboard/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: addForm.fullName.trim(),
          phone: addForm.phone.trim() || null,
          email: addForm.email.trim() || null,
          specialization: addForm.specialization || null,
          shift: addForm.shift,
          shiftCustom: addForm.shiftCustom.trim() || null,
          weeklyOff: addForm.weeklyOff.length ? addForm.weeklyOff : null,
          salaryType: addForm.salaryType,
          joiningDate: addForm.joiningDate ? (typeof addForm.joiningDate === "string" ? addForm.joiningDate : format(addForm.joiningDate as Date, "yyyy-MM-dd")) : null,
          profilePhoto: addForm.profilePhoto.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: data.error || "Failed to add trainer", variant: "destructive" });
        return;
      }
      toast({ title: "Trainer added", variant: "success" });
      setAddOpen(false);
      setAddForm(defaultAddForm);
      fetchTrainers();
      fetchStats();
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setAddSaving(false);
    }
  }

  const fetchAttendance = useCallback(async (trainerId: string, from?: string, to?: string) => {
    setAttendanceLoading((prev) => ({ ...prev, [trainerId]: true }));
    try {
      const end = to ? new Date(to) : new Date();
      const start = from ? new Date(from) : (() => { const d = new Date(end); d.setDate(d.getDate() - 13); return d; })();
      const fromStr = from ?? start.toISOString().slice(0, 10);
      const toStr = to ?? end.toISOString().slice(0, 10);
      const res = await fetch(
        `/api/dashboard/trainers/${trainerId}/attendance?from=${fromStr}&to=${toStr}`
      );
      if (!res.ok) return;
      const data = await res.json();
      setAttendanceByTrainer((prev) => ({ ...prev, [trainerId]: data.attendance ?? [] }));
    } finally {
      setAttendanceLoading((prev) => ({ ...prev, [trainerId]: false }));
    }
  }, []);

  async function markAttendance(trainerId: string, date: string, status: "PRESENT" | "ABSENT" | "LATE") {
    try {
      const res = await fetch(`/api/dashboard/trainers/${trainerId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, status }),
      });
      if (!res.ok) {
        toast({ title: "Failed to update attendance", variant: "destructive" });
        return;
      }
      const data = await res.json();
      setAttendanceByTrainer((prev) => {
        const list = prev[trainerId] ?? [];
        const idx = list.findIndex((r) => r.date === date);
        const newRecord = { id: data.id, date: data.date, status: data.status, checkInTime: data.checkInTime, checkOutTime: data.checkOutTime };
        if (idx >= 0) {
          const next = [...list];
          next[idx] = newRecord;
          return { ...prev, [trainerId]: next };
        }
        return { ...prev, [trainerId]: [...list, newRecord].sort((a, b) => a.date.localeCompare(b.date)) };
      });
      fetchTrainers();
      fetchStats();
      toast({ title: `Marked ${status.toLowerCase()}`, variant: "success" });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  }

  async function bulkMarkPresent() {
    if (selectedIds.size === 0) {
      toast({ title: "Select at least one trainer", variant: "destructive" });
      return;
    }
    const today = new Date().toISOString().slice(0, 10);
    try {
      const res = await fetch("/api/dashboard/trainers/attendance/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: today, trainerIds: Array.from(selectedIds) }),
      });
      if (!res.ok) {
        toast({ title: "Failed to mark attendance", variant: "destructive" });
        return;
      }
      toast({ title: `Marked ${selectedIds.size} as present`, variant: "success" });
      setSelectedIds(new Set());
      fetchTrainers();
      fetchStats();
      selectedIds.forEach((id) => {
        fetchAttendance(id);
      });
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          <span aria-hidden>/</span>
          <span className="text-foreground font-medium">Trainers</span>
        </nav>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trainers</h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Add trainers and track their attendance
            </p>
          </div>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-xl gap-2 shadow-md shrink-0">
                <Plus className="h-5 w-5" />
                Add trainer
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add trainer</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddTrainer} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="fullName">Full name *</Label>
                    <Input
                      id="fullName"
                      value={addForm.fullName}
                      onChange={(e) => setAddForm((f) => ({ ...f, fullName: e.target.value }))}
                      placeholder="e.g. John Doe"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={addForm.phone}
                      onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                      placeholder="Optional"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={addForm.email}
                      onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="Optional"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specialization</Label>
                    <Select value={addForm.specialization || "all"} onValueChange={(v) => setAddForm((f) => ({ ...f, specialization: v === "all" ? "" : v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">None</SelectItem>
                        {SPECIALIZATIONS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Shift</Label>
                    <Select value={addForm.shift} onValueChange={(v) => setAddForm((f) => ({ ...f, shift: v }))}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SHIFT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {addForm.shift === "CUSTOM" && (
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="shiftCustom">Custom shift (e.g. 10 AM - 2 PM)</Label>
                      <Input
                        id="shiftCustom"
                        value={addForm.shiftCustom}
                        onChange={(e) => setAddForm((f) => ({ ...f, shiftCustom: e.target.value }))}
                        placeholder="10 AM - 2 PM"
                        className="rounded-xl"
                      />
                    </div>
                  )}
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Weekly off days</Label>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map((day) => (
                        <Button
                          key={day}
                          type="button"
                          variant={addForm.weeklyOff.includes(day) ? "default" : "outline"}
                          size="sm"
                          className="rounded-lg"
                          onClick={() =>
                            setAddForm((f) => ({
                              ...f,
                              weeklyOff: f.weeklyOff.includes(day) ? f.weeklyOff.filter((d) => d !== day) : [...f.weeklyOff, day],
                            }))
                          }
                        >
                          {day.slice(0, 2)}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Salary type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="salaryType"
                          checked={addForm.salaryType === "FIXED"}
                          onChange={() => setAddForm((f) => ({ ...f, salaryType: "FIXED" }))}
                          className="rounded-full"
                        />
                        <span className="text-sm">Fixed</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="salaryType"
                          checked={addForm.salaryType === "PER_SESSION"}
                          onChange={() => setAddForm((f) => ({ ...f, salaryType: "PER_SESSION" }))}
                          className="rounded-full"
                        />
                        <span className="text-sm">Per session</span>
                      </label>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Joining date</Label>
                    <DatePickerField
                      value={addForm.joiningDate}
                      onChange={(d) => setAddForm((f) => ({ ...f, joiningDate: d ?? "" }))}
                      placeholder="Optional"
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="profilePhoto">Profile photo URL</Label>
                    <Input
                      id="profilePhoto"
                      value={addForm.profilePhoto}
                      onChange={(e) => setAddForm((f) => ({ ...f, profilePhoto: e.target.value }))}
                      placeholder="Optional URL"
                      className="rounded-xl"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setAddOpen(false)} className="rounded-xl">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addSaving} className="rounded-xl">
                    {addSaving ? "Saving…" : "Save"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      {stats !== null && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total trainers</p>
                <p className="text-2xl font-semibold">{stats.totalTrainers}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-2">
                <Check className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Present today</p>
                <p className="text-2xl font-semibold">{stats.presentToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-rose-500/10 p-2">
                <X className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent today</p>
                <p className="text-2xl font-semibold">{stats.absentToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/10 p-2">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Late today</p>
                <p className="text-2xl font-semibold">{stats.lateToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/10 p-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance %</p>
                <p className="text-2xl font-semibold">{stats.attendancePercent}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters + bulk */}
      {trainers.length > 0 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search by name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-xl max-w-[200px]"
            />
            <Select value={shiftFilter} onValueChange={setShiftFilter}>
              <SelectTrigger className="rounded-xl w-[130px]">
                <SelectValue placeholder="Shift" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shifts</SelectItem>
                {SHIFT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={specFilter} onValueChange={setSpecFilter}>
              <SelectTrigger className="rounded-xl w-[140px]">
                <SelectValue placeholder="Specialization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {SPECIALIZATIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusTodayFilter} onValueChange={setStatusTodayFilter}>
              <SelectTrigger className="rounded-xl w-[140px]">
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="rounded-xl w-[140px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="joinDate">Join date</SelectItem>
                <SelectItem value="attendance">Attendance %</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <Button size="sm" className="rounded-xl gap-1.5" onClick={bulkMarkPresent}>
                <Check className="h-4 w-4" />
                Mark {selectedIds.size} as present
              </Button>
            )}
          </div>
        </div>
      )}

      <Card className="rounded-2xl border-border/50 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          ) : trainers.length === 0 ? (
            <div className="py-16 px-6 text-center text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No trainers yet</p>
              <p className="text-sm mt-1">Add your first trainer to start tracking attendance.</p>
              <Button variant="default" className="mt-4 rounded-xl" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add trainer
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {trainers.map((trainer) => (
                <TrainerCard
                  key={trainer.id}
                  trainer={trainer}
                  today={today}
                  attendance={attendanceByTrainer[trainer.id] ?? []}
                  attendanceLoading={attendanceLoading[trainer.id]}
                  onLoadAttendance={fetchAttendance}
                  onMarkAttendance={(date, status) => markAttendance(trainer.id, date, status)}
                  selected={selectedIds.has(trainer.id)}
                  onToggleSelect={() =>
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(trainer.id)) next.delete(trainer.id);
                      else next.add(trainer.id);
                      return next;
                    })
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TrainerCard({
  trainer,
  today,
  attendance,
  attendanceLoading,
  onLoadAttendance,
  onMarkAttendance,
  selected,
  onToggleSelect,
}: {
  trainer: Trainer;
  today: string;
  attendance: AttendanceRecord[];
  attendanceLoading: boolean;
  onLoadAttendance: (id: string, from?: string, to?: string) => void;
  onMarkAttendance: (date: string, status: "PRESENT" | "ABSENT" | "LATE") => void;
  selected: boolean;
  onToggleSelect: () => void;
}) {
  const [showAttendance, setShowAttendance] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const todayRecord = attendance.find((r) => r.date === today);
  const monthSummary = trainer.monthSummary ?? { present: 0, absent: 0, late: 0, percent: 0 };

  useEffect(() => {
    if (!showAttendance || attendance.length > 0 || attendanceLoading) return;
    onLoadAttendance(trainer.id);
  }, [showAttendance, attendance.length, attendanceLoading, onLoadAttendance, trainer.id]);

  const initial = trainer.fullName.trim().slice(0, 2).toUpperCase();

  return (
    <div className="p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4 flex-1 min-w-0">
          <label className="flex items-center gap-2 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggleSelect}
              className="rounded border-input"
            />
          </label>
          <div className="rounded-full h-12 w-12 shrink-0 overflow-hidden bg-muted flex items-center justify-center border border-border">
            {trainer.profilePhoto ? (
              <img src={trainer.profilePhoto} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">{initial}</span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-lg">{trainer.fullName}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              {[trainer.phone, trainer.email].filter(Boolean).join(" · ") || "No contact"}
            </p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {trainer.specialization && (
                <Badge variant="secondary" className="rounded-md text-xs">
                  {trainer.specialization}
                </Badge>
              )}
              <Badge variant="outline" className="rounded-md text-xs gap-1">
                {trainer.shift === "MORNING" && <Sun className="h-3 w-3" />}
                {trainer.shift === "EVENING" && <Moon className="h-3 w-3" />}
                {trainer.shift === "CUSTOM" ? (trainer.shiftCustom || "Custom") : trainer.shift === "MORNING" ? "Morning" : "Evening"}
              </Badge>
              {trainer.todayStatus && (
                <Badge
                  variant={trainer.todayStatus === "PRESENT" ? "success" : trainer.todayStatus === "LATE" ? "warning" : "destructive"}
                  className="rounded-md text-xs"
                >
                  {trainer.todayStatus}
                </Badge>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <div className="flex-1 max-w-[120px] h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    monthSummary.percent >= 80 ? "bg-emerald-500" : monthSummary.percent >= 50 ? "bg-amber-500" : "bg-rose-500"
                  )}
                  style={{ width: `${monthSummary.percent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{monthSummary.percent}% this month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month: Present {monthSummary.present} · Absent {monthSummary.absent} · Late {monthSummary.late}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl gap-2" onClick={() => setShowAttendance((s) => !s)}>
            <Calendar className="h-4 w-4" />
            Attendance
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => {
              setCalendarOpen(true);
              const now = new Date();
              onLoadAttendance(trainer.id, format(startOfMonth(now), "yyyy-MM-dd"), format(endOfMonth(now), "yyyy-MM-dd"));
            }}
          >
            View calendar
          </Button>
        </div>
      </div>

      {showAttendance && (
        <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium">Today ({format(new Date(today), "MMM d, yyyy")}):</span>
            <Button size="sm" variant={todayRecord?.status === "PRESENT" ? "default" : "outline"} className="rounded-lg gap-1.5" onClick={() => onMarkAttendance(today, "PRESENT")}>
              <Check className="h-4 w-4" />
              Present
            </Button>
            <Button size="sm" variant={todayRecord?.status === "ABSENT" ? "destructive" : "outline"} className="rounded-lg gap-1.5" onClick={() => onMarkAttendance(today, "ABSENT")}>
              <X className="h-4 w-4" />
              Absent
            </Button>
            <Button size="sm" variant={todayRecord?.status === "LATE" ? "secondary" : "outline"} className="rounded-lg gap-1.5" onClick={() => onMarkAttendance(today, "LATE")}>
              <Clock className="h-4 w-4" />
              Late
            </Button>
          </div>
          {attendanceLoading ? (
            <Skeleton className="h-24 w-full rounded-xl" />
          ) : attendance.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Recent attendance</p>
              <ul className="text-sm space-y-1">
                {attendance.slice(-14).reverse().map((r) => (
                  <li key={r.id} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-24">{format(new Date(r.date), "MMM d, yyyy")}</span>
                    <span className={cn(r.status === "PRESENT" && "text-emerald-600", r.status === "ABSENT" && "text-rose-600", r.status === "LATE" && "text-amber-600")}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Attendance — {trainer.fullName}</DialogTitle>
          </DialogHeader>
          <AttendanceCalendar
            trainerId={trainer.id}
            attendance={attendance}
            loading={attendanceLoading}
            onMark={onMarkAttendance}
            onMonthChange={(month) =>
              onLoadAttendance(trainer.id, format(startOfMonth(month), "yyyy-MM-dd"), format(endOfMonth(month), "yyyy-MM-dd"))
            }
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AttendanceCalendar({
  trainerId,
  attendance,
  loading,
  onMark,
  onMonthChange,
}: {
  trainerId: string;
  attendance: AttendanceRecord[];
  loading: boolean;
  onMark: (date: string, status: "PRESENT" | "ABSENT" | "LATE") => void;
  onMonthChange: (month: Date) => void;
}) {
  const [month, setMonth] = useState(new Date());
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  const days = eachDayOfInterval({ start, end });
  const statusByDate: Record<string, "PRESENT" | "ABSENT" | "LATE"> = {};
  attendance.forEach((r) => { statusByDate[r.date] = r.status; });
  const firstDow = start.getDay();
  const padding = Array(firstDow).fill(null);

  const goPrev = () => {
    const m = new Date(month.getFullYear(), month.getMonth() - 1);
    setMonth(m);
    onMonthChange(m);
  };
  const goNext = () => {
    const m = new Date(month.getFullYear(), month.getMonth() + 1);
    setMonth(m);
    onMonthChange(m);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={goPrev} className="rounded-lg">
          Previous
        </Button>
        <span className="font-medium">{format(month, "MMMM yyyy")}</span>
        <Button variant="outline" size="sm" onClick={goNext} className="rounded-lg">
          Next
        </Button>
      </div>
      {loading ? (
        <Skeleton className="h-48 w-full rounded-xl" />
      ) : (
        <div className="grid grid-cols-7 gap-1 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
            <div key={d} className="text-xs font-medium text-muted-foreground py-1">{d}</div>
          ))}
          {padding.map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {days.map((day) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const status = statusByDate[dateStr];
            return (
              <div key={dateStr} className="flex flex-col items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = status === "PRESENT" ? "ABSENT" : status === "ABSENT" ? "LATE" : "PRESENT";
                    onMark(dateStr, next);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-lg text-sm font-medium flex items-center justify-center transition",
                    status === "PRESENT" && "bg-emerald-500 text-white",
                    status === "ABSENT" && "bg-rose-500 text-white",
                    status === "LATE" && "bg-amber-500 text-white",
                    !status && "bg-muted hover:bg-muted/80"
                  )}
                >
                  {format(day, "d")}
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500" /> Present</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-rose-500" /> Absent</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500" /> Late</span>
      </div>
    </div>
  );
}
