"use client";

import React, { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Award,
  PieChart as PieIcon,
  Filter,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import {
  format,
  subDays,
  parseISO,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isSameDay,
} from "date-fns";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6", "#64748b"];

export function AnalyticsView() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [reportRange, setReportRange] = useState<"7d" | "30d" | "month">("7d");

  // Query all data
  const tasks = useLiveQuery(async () => await db.tasks.toArray(), [], []);
  const habits = useLiveQuery(async () => await db.habits.toArray(), [], []);
  const habitLogs = useLiveQuery(async () => await db.habitLogs.toArray(), [], []);
  const focusSessions = useLiveQuery(async () => await db.focusSessions.toArray(), [], []);
  const goals = useLiveQuery(async () => await db.goals.toArray(), [], []);

  // Determine date intervals based on selected range
  let intervalDays: Date[] = [];
  if (reportRange === "7d") {
    intervalDays = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });
  } else if (reportRange === "30d") {
    intervalDays = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
  } else {
    intervalDays = eachDayOfInterval({
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date()),
    });
  }

  // 1. Daily Trend Data (Tasks completed vs planned, and Focus minutes)
  const trendData = intervalDays.map((day) => {
    const dStr = format(day, "yyyy-MM-dd");
    const dayTasks = tasks.filter((t) => t.date === dStr);
    const completedTasks = dayTasks.filter((t) => t.completed).length;
    const totalTasks = dayTasks.length;

    const dayFocus = focusSessions.filter((s) => s.startedAt.startsWith(dStr) && s.completed);
    const focusMinutes = dayFocus.reduce(
      (acc, s) => acc + (s.completedDurationSeconds ? Math.floor(s.completedDurationSeconds / 60) : s.durationMinutes),
      0
    );

    const dayHabits = habitLogs.filter((l) => l.date === dStr && l.completed).length;

    // Approximate daily productivity score
    let score = 0;
    if (totalTasks > 0) score += (completedTasks / totalTasks) * 50;
    else score += 40;
    score += Math.min(25, dayHabits * 5);
    score += Math.min(15, (focusMinutes / 50) * 15);
    score = Math.min(100, Math.round(score));

    return {
      date: format(day, "MMM d"),
      fullDate: dStr,
      planned: totalTasks,
      completed: completedTasks,
      habitsDone: dayHabits,
      focusMinutes,
      score,
    };
  });

  // 2. Category Distribution
  const categoryCount: Record<string, number> = {};
  tasks.forEach((t) => {
    categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
  });
  const categoryPieData = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
  }));

  // Aggregated Stats
  const totalTasksRange = trendData.reduce((acc, d) => acc + d.planned, 0);
  const totalCompletedRange = trendData.reduce((acc, d) => acc + d.completed, 0);
  const totalFocusMinsRange = trendData.reduce((acc, d) => acc + d.focusMinutes, 0);
  const avgProductivityScore = Math.round(
    trendData.reduce((acc, d) => acc + d.score, 0) / (trendData.length || 1)
  );
  const overallCompletionRate = totalTasksRange > 0 ? Math.round((totalCompletedRange / totalTasksRange) * 100) : 100;

  // Find most productive day
  const bestDay = [...trendData].sort((a, b) => b.score - a.score)[0];

  // CSV Export
  const exportToCSV = () => {
    const headers = ["Date,Planned Tasks,Completed Tasks,Habits Done,Focus Minutes,Productivity Score\n"];
    const rows = trendData.map(
      (d) => `${d.fullDate},${d.planned},${d.completed},${d.habitsDone},${d.focusMinutes},${d.score}\n`
    );
    const blob = new Blob([...headers, ...rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tehseen-os-report-${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            <span>Productivity Analytics & Reports</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Transparent metrics and actionable trends derived from your daily data
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Range Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs font-semibold">
            <button
              onClick={() => setReportRange("7d")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                reportRange === "7d" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              7 Days
            </button>
            <button
              onClick={() => setReportRange("30d")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                reportRange === "30d" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              30 Days
            </button>
            <button
              onClick={() => setReportRange("month")}
              className={cn(
                "px-3 py-1.5 rounded-lg transition-all",
                reportRange === "month" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              This Month
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground text-xs font-semibold shadow-sm transition-all"
            title="Export CSV Report"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-brand-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Avg Score
            </span>
            <Award className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{avgProductivityScore}</span>
            <span className="text-xs text-muted-foreground">/ 100</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            Best day: {bestDay?.date} ({bestDay?.score} pts)
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-emerald-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Completion Rate
            </span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">{overallCompletionRate}%</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {totalCompletedRange} of {totalTasksRange} tasks completed
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-cyan-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Focus Time
            </span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {(totalFocusMinsRange / 60).toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">hrs</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {totalFocusMinsRange} deep work minutes
          </span>
        </div>

        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between text-amber-500 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Goals
            </span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {goals.filter((g) => g.status === "in-progress").length}
            </span>
            <span className="text-xs text-muted-foreground">in flight</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-2 block">
            {goals.filter((g) => g.status === "completed").length} goals accomplished
          </span>
        </div>
      </div>

      {/* Main Charts: Task Completion & Productivity Score Trajectory */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Productivity Score Trajectory Chart (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Productivity Score Trajectory</h3>
              <p className="text-xs text-muted-foreground">Calculated daily discipline score (0 - 100)</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "0.75rem",
                    border: "1px solid #27272a",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#6366f1" }}
                  activeDot={{ r: 6 }}
                  name="Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Task Completion Bar Chart (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Tasks Output</h3>
              <p className="text-xs text-muted-foreground">Planned vs Completed</p>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "0.75rem",
                    border: "1px solid #27272a",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="planned" fill="#3f3f46" radius={[4, 4, 0, 0]} name="Planned" />
                <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Charts Row: Focus Distribution & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Category Distribution (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Task Category Allocation</h3>
              <p className="text-xs text-muted-foreground">Where your energy is directed</p>
            </div>
          </div>

          <div className="h-64 w-full">
            {categoryPieData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                No task category data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      borderRadius: "0.75rem",
                      border: "1px solid #27272a",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                    formatter={(value) => <span className="text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Deep Focus Sessions Volume (6 Cols) */}
        <div className="lg:col-span-6 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base text-foreground">Deep Focus Volume</h3>
              <p className="text-xs text-muted-foreground">Focus minutes per day</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderRadius: "0.75rem",
                    border: "1px solid #27272a",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`${val} mins`, "Focus Time"]}
                />
                <Bar dataKey="focusMinutes" fill="#06b6d4" radius={[6, 6, 0, 0]} name="Focus Minutes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
