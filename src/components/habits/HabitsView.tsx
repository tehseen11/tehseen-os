"use client";

import React, { useState } from "react";
import {
  Flame,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  X,
  Target,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Habit, HabitLog, TaskCategory, HabitFrequency, PreferredTime } from "@/types";
import { format, subDays, eachDayOfInterval, parseISO, isSameDay } from "date-fns";
import { cn, getCategoryBadgeClass } from "@/lib/utils";
import confetti from "canvas-confetti";

interface HabitsViewProps {
  onOpenQuickAdd: (tab?: "habit") => void;
}

const CATEGORIES: TaskCategory[] = [
  "Personal",
  "Work",
  "DevOps Learning",
  "Technical Learning",
  "Health & Fitness",
  "Family",
  "Other",
];

export function HabitsView({ onOpenQuickAdd }: HabitsViewProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<number | null>(null);

  // Fetch all habits and logs
  const habits = useLiveQuery(
    async () => {
      return await db.habits.toArray();
    },
    [],
    []
  );

  const habitLogs = useLiveQuery(
    async () => {
      return await db.habitLogs.toArray();
    },
    [],
    []
  );

  const activeHabits = habits.filter((h) => h.status === "active");

  // Calculate streaks for a habit
  const getStreakStats = (habitId?: number) => {
    if (!habitId) return { current: 0, best: 0, completionRate: 0 };
    const logs = habitLogs.filter((l) => l.habitId === habitId && l.completed);
    const completedDates = new Set(logs.map((l) => l.date));

    // Current streak: count backwards from today/yesterday
    let currentStreak = 0;
    let checkDate = new Date();
    // If not completed today yet, check if completed yesterday to keep streak alive
    const todayCompleted = completedDates.has(todayStr);
    if (!todayCompleted) {
      checkDate = subDays(checkDate, 1);
    }

    while (completedDates.has(format(checkDate, "yyyy-MM-dd"))) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    }

    // Best streak: look at all logs in chronological order
    const sortedDates = Array.from(completedDates).sort();
    let bestStreak = 0;
    let tempStreak = 0;
    let prevDate: Date | null = null;

    for (const dStr of sortedDates) {
      const d = parseISO(dStr);
      if (prevDate) {
        const diffDays = Math.round((d.getTime() - prevDate.getTime()) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      prevDate = d;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    }

    // 30-day completion rate
    const last30Days = eachDayOfInterval({ start: subDays(new Date(), 29), end: new Date() });
    const completedIn30 = last30Days.filter((d) => completedDates.has(format(d, "yyyy-MM-dd"))).length;
    const completionRate = Math.round((completedIn30 / 30) * 100);

    return { current: currentStreak, best: Math.max(bestStreak, currentStreak), completionRate };
  };

  // Toggle habit for today
  const handleToggleHabit = async (habit: Habit) => {
    if (!habit.id) return;
    const existingLog = habitLogs.find((l) => l.habitId === habit.id && l.date === todayStr);

    if (existingLog && existingLog.id) {
      await db.habitLogs.update(existingLog.id, {
        completed: !existingLog.completed,
        value: !existingLog.completed ? habit.targetValue : 0,
        completedAt: new Date().toISOString(),
      });
    } else {
      await db.habitLogs.add({
        habitId: habit.id,
        date: todayStr,
        completed: true,
        value: habit.targetValue,
        completedAt: new Date().toISOString(),
      });

      try {
        confetti({
          particleCount: 30,
          spread: 50,
          origin: { y: 0.75 },
          colors: ["#f59e0b", "#10b981", "#6366f1"],
        });
      } catch (e) {}
    }
  };

  // Delete habit
  const handleDeleteHabit = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this habit? Historical logs will be archived.")) {
      await db.habits.delete(id);
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHabit || !editingHabit.id) return;
    await db.habits.put(editingHabit);
    setEditingHabit(null);
  };

  // 60-day contribution heatmap dates
  const heatmapDays = eachDayOfInterval({
    start: subDays(new Date(), 59),
    end: new Date(),
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500" />
            <span>Habits & Routine Consistency</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Compound small daily habits into extraordinary long-term discipline
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAdd("habit")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-amber-500/20 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Global Consistency Heatmap: GitHub-style 60-Day Matrix */}
      <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Global Consistency Matrix</h3>
              <p className="text-xs text-muted-foreground">Historical 60-day habit completion record</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span>Less</span>
            <span className="w-2.5 h-2.5 rounded bg-muted" />
            <span className="w-2.5 h-2.5 rounded bg-amber-500/30" />
            <span className="w-2.5 h-2.5 rounded bg-amber-500/60" />
            <span className="w-2.5 h-2.5 rounded bg-amber-500" />
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2 pt-2">
          <div className="grid grid-flow-col grid-rows-7 gap-1.5 w-max">
            {heatmapDays.map((day) => {
              const dStr = format(day, "yyyy-MM-dd");
              // Count how many habits completed on this day
              const count = habitLogs.filter((l) => l.date === dStr && l.completed).length;
              let bg = "bg-muted/60";
              if (count >= 4) bg = "bg-amber-500 text-white";
              else if (count >= 2) bg = "bg-amber-500/70";
              else if (count === 1) bg = "bg-amber-500/35";

              return (
                <div
                  key={dStr}
                  className={cn(
                    "w-3.5 h-3.5 rounded-sm transition-transform hover:scale-125 cursor-pointer",
                    bg
                  )}
                  title={`${dStr}: ${count} habit(s) completed`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Habits Grid with Streaks and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeHabits.map((habit) => {
          const stats = getStreakStats(habit.id);
          const todayLog = habitLogs.find((l) => l.habitId === habit.id && l.date === todayStr);
          const isDoneToday = Boolean(todayLog?.completed);

          return (
            <div
              key={habit.id}
              className={cn(
                "p-5 rounded-3xl border transition-all relative flex flex-col justify-between bg-card group",
                isDoneToday
                  ? "border-amber-500/40 bg-amber-500/5 shadow-sm"
                  : "border-border hover:border-amber-500/30"
              )}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                      getCategoryBadgeClass(habit.category)
                    )}
                  >
                    {habit.category}
                  </span>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditingHabit(habit)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-muted"
                      title="Delete Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Habit Title & Target */}
                <h4 className="text-base font-bold text-foreground">{habit.name}</h4>
                {habit.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {habit.description}
                  </p>
                )}

                {/* Target Specs */}
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-mono">
                    <Target className="w-3.5 h-3.5 text-brand-500" />
                    {habit.targetValue} {habit.unit}
                  </span>
                  <span>• {habit.frequency}</span>
                  <span>• {habit.preferredTime}</span>
                </div>

                {/* Streaks Card */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-2xl bg-muted/40 border border-border/60 text-center">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Streak
                    </span>
                    <span className="text-base font-extrabold text-amber-500 flex items-center justify-center gap-0.5">
                      <Flame className="w-3.5 h-3.5 fill-current" /> {stats.current}d
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Best
                    </span>
                    <span className="text-base font-extrabold text-foreground">
                      {stats.best}d
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      30d Rate
                    </span>
                    <span className="text-base font-extrabold text-emerald-500">
                      {stats.completionRate}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete for Today Toggle Button */}
              <div className="mt-5 pt-3 border-t border-border/60">
                <button
                  onClick={() => handleToggleHabit(habit)}
                  className={cn(
                    "w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]",
                    isDoneToday
                      ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                      : "bg-muted hover:bg-muted/80 text-foreground border border-border"
                  )}
                >
                  {isDoneToday ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" /> Completed for Today
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4" /> Mark Complete Today
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Habit Modal */}
      {editingHabit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingHabit(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl p-5 shadow-2xl z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-bold text-base text-foreground">Edit Habit</h3>
              <button
                onClick={() => setEditingHabit(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Habit Name
                </label>
                <input
                  type="text"
                  required
                  value={editingHabit.name}
                  onChange={(e) => setEditingHabit({ ...editingHabit, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={editingHabit.description || ""}
                  onChange={(e) => setEditingHabit({ ...editingHabit, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    value={editingHabit.targetValue}
                    onChange={(e) => setEditingHabit({ ...editingHabit, targetValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={editingHabit.unit}
                    onChange={(e) => setEditingHabit({ ...editingHabit, unit: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingHabit(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-md"
                >
                  Save Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
