"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Calendar,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Plus,
  Play,
  TrendingUp,
  Award,
  ChevronRight,
  BookOpen,
  Pin,
  HelpCircle,
  X,
  Target,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { calculateProductivityScore } from "@/lib/scoring";
import { ProductivityScoreBreakdown, Task, Habit, CalendarEvent, QuickNote } from "@/types";
import { format, subDays, isToday, parseISO } from "date-fns";
import { cn, formatFriendlyDate, formatTime, getCategoryBadgeClass, getPriorityBadgeClass } from "@/lib/utils";
import confetti from "canvas-confetti";
import { NavTab } from "../layout/Sidebar";

const MOTIVATION_QUOTES = [
  { quote: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { quote: "Focus is a muscle. The more you protect your attention, the stronger your output becomes.", author: "Deep Work Principle" },
  { quote: "Small daily improvements over time compound into stunning results.", author: "Robin Sharma" },
  { quote: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { quote: "Code, automate, iterate. Relentless consistency beats sporadic genius.", author: "DevOps Philosophy" },
];

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
  onOpenQuickAdd: (tab?: "task" | "event" | "habit" | "note") => void;
}

export function DashboardView({ onNavigate, onOpenQuickAdd }: DashboardViewProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [scoreData, setScoreData] = useState<ProductivityScoreBreakdown | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate quote daily
  useEffect(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    setQuoteIndex(dayOfYear % MOTIVATION_QUOTES.length);
  }, []);

  // Fetch live tasks for today
  const todayTasks = useLiveQuery(
    async () => {
      return await db.tasks.where("date").equals(todayStr).toArray();
    },
    [todayStr],
    []
  );

  // Fetch live habits and today's habit logs
  const activeHabits = useLiveQuery(
    async () => {
      return await db.habits.where("status").equals("active").toArray();
    },
    [],
    []
  );

  const todayHabitLogs = useLiveQuery(
    async () => {
      return await db.habitLogs.where("date").equals(todayStr).toArray();
    },
    [todayStr],
    []
  );

  // Fetch upcoming events (today and next 7 days)
  const upcomingEvents = useLiveQuery(
    async () => {
      return await db.events
        .where("date")
        .aboveOrEqual(todayStr)
        .sortBy("date");
    },
    [todayStr],
    []
  );

  // Fetch pinned notes
  const pinnedNotes = useLiveQuery(
    async () => {
      return await db.notes.where("pinned").equals(1).toArray();
    },
    [],
    []
  );

  // Calculate live productivity score
  useEffect(() => {
    async function loadScore() {
      const res = await calculateProductivityScore(todayStr);
      setScoreData(res);
    }
    loadScore();
  }, [todayTasks, todayHabitLogs, todayStr]);

  // Handle task completion toggle
  const toggleTaskCompletion = async (task: Task) => {
    if (!task.id) return;
    const nextCompleted = !task.completed;
    await db.tasks.update(task.id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });

    if (nextCompleted) {
      try {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.8 },
          colors: ["#6366f1", "#10b981", "#06b6d4"],
        });
      } catch (e) {}
    }
  };

  // Handle habit check toggle
  const toggleHabit = async (habit: Habit) => {
    if (!habit.id) return;
    const existingLog = todayHabitLogs.find((l) => l.habitId === habit.id);

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
    }
  };

  const completedTasksCount = todayTasks.filter((t) => t.completed).length;
  const remainingTasksCount = todayTasks.length - completedTasksCount;
  const taskProgress = todayTasks.length > 0 ? Math.round((completedTasksCount / todayTasks.length) * 100) : 0;

  // Build combined daily schedule timeline (tasks with startTime + events)
  const scheduledItems = [
    ...todayTasks
      .filter((t) => t.startTime)
      .map((t) => ({
        type: "task" as const,
        id: t.id,
        title: t.title,
        time: t.startTime!,
        dueTime: t.dueTime,
        endTime: t.dueTime,
        category: t.category,
        priority: t.priority,
        completed: t.completed,
        location: undefined as string | undefined,
      })),
    ...upcomingEvents
      .filter((e) => e.date === todayStr)
      .map((e) => ({
        type: "event" as const,
        id: e.id,
        title: e.title,
        time: e.startTime,
        endTime: e.endTime,
        category: e.category,
        location: e.location,
        color: e.color,
      })),
  ].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP HERO: Productivity Score, Quick Stats, & Motivation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Productivity Score Card (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-br from-card via-card to-brand-500/5 border border-border shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-36 h-36 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-bold text-sm text-foreground">Productivity Score</h3>
                <p className="text-xs text-muted-foreground">Calculated from verified daily data</p>
              </div>
            </div>
            <button
              onClick={() => setShowBreakdownModal(true)}
              className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="See transparent calculation"
            >
              <HelpCircle className="w-4 h-4 text-brand-500" />
              <span className="hidden sm:inline">Formula</span>
            </button>
          </div>

          {/* Big Score Display */}
          <div className="flex items-center gap-6 my-4">
            <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
              {/* SVG Ring Progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-muted"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="stroke-brand-500 transition-all duration-1000 ease-out"
                  strokeWidth="8"
                  strokeDasharray={264}
                  strokeDashoffset={264 - (264 * (scoreData?.totalScore || 0)) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-extrabold text-foreground tracking-tight">
                  {scoreData?.totalScore ?? 0}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  / 100
                </span>
              </div>
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tasks (50%)</span>
                <span className="font-semibold text-foreground">{scoreData?.taskScore ?? 0} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Habits (25%)</span>
                <span className="font-semibold text-foreground">{scoreData?.habitScore ?? 0} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Focus (15%)</span>
                <span className="font-semibold text-foreground">{scoreData?.focusScore ?? 0} pts</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Reflection (10%)</span>
                <span className="font-semibold text-foreground">{scoreData?.reflectionScore ?? 0} pts</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-xl border border-border/60">
            {scoreData?.summary || "Log your tasks and habits to boost your performance score."}
          </p>
        </div>

        {/* Quick Stats Grid & Daily Motivation (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-4">
          {/* 3 Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Completed Tasks */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-emerald-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Completed
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">{completedTasksCount}</span>
                <span className="text-xs text-muted-foreground ml-1.5">tasks</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-3">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${taskProgress}%` }}
                />
              </div>
            </div>

            {/* Remaining Tasks */}
            <div className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-amber-500 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Remaining
                </span>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className="text-2xl font-bold text-foreground">{remainingTasksCount}</span>
                <span className="text-xs text-muted-foreground ml-1.5">tasks</span>
              </div>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-[11px] text-brand-500 font-semibold hover:underline flex items-center gap-0.5 mt-2"
              >
                View all tasks <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Focus Session Trigger */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-brand-500/10 border border-brand-500/20 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-brand-500 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider">Deep Work</span>
                <Play className="w-4 h-4 fill-current" />
              </div>
              <p className="text-xs text-muted-foreground mb-2">Pomodoro focus block</p>
              <button
                onClick={() => onNavigate("focus")}
                className="w-full py-1.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Play className="w-3 h-3 fill-current" /> Start 25m Timer
              </button>
            </div>
          </div>

          {/* Daily Motivation Box */}
          <div className="p-4 rounded-2xl bg-card border border-border shadow-sm relative overflow-hidden flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block mb-0.5">
                Daily Motivation
              </span>
              <p className="text-xs sm:text-sm font-medium italic text-foreground/90">
                &ldquo;{MOTIVATION_QUOTES[quoteIndex].quote}&rdquo;
              </p>
              <span className="text-[11px] text-muted-foreground mt-1 block">
                — {MOTIVATION_QUOTES[quoteIndex].author}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MIDDLE ROW: Today's Tasks & Today's Habits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Tasks Checklist (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-foreground">Today&apos;s Planned Tasks</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-mono font-medium text-muted-foreground">
                {completedTasksCount}/{todayTasks.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenQuickAdd("task")}
                className="p-1.5 rounded-lg text-brand-500 hover:bg-brand-500/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Add Task for Today"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
              <button
                onClick={() => onNavigate("tasks")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                Manage <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border rounded-2xl">
              <p className="text-xs text-muted-foreground mb-3">No tasks scheduled for today yet.</p>
              <button
                onClick={() => onOpenQuickAdd("task")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors"
              >
                + Plan a Task
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-2xl border transition-all group",
                    task.completed
                      ? "bg-muted/20 border-border/50 opacity-60"
                      : "bg-background border-border hover:border-brand-500/40"
                  )}
                >
                  <button
                    onClick={() => toggleTaskCompletion(task)}
                    className="mt-0.5 text-muted-foreground hover:text-brand-500 shrink-0 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs sm:text-sm font-semibold truncate",
                          task.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </span>
                      <span
                        className={cn(
                          "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0",
                          getPriorityBadgeClass(task.priority)
                        )}
                      >
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                          getCategoryBadgeClass(task.category)
                        )}
                      >
                        {task.category}
                      </span>

                      {task.startTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          {formatTime(task.startTime)}
                          {task.dueTime ? ` - ${formatTime(task.dueTime)}` : ""}
                        </span>
                      )}

                      {task.estimatedDuration && (
                        <span>• {task.estimatedDuration}m</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Today's Habits Widget (5 Cols) */}
        <div className="lg:col-span-5 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-foreground">Today&apos;s Habits</h3>
              </div>
              <button
                onClick={() => onNavigate("habits")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
              >
                Track <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {activeHabits.length === 0 ? (
                <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                  <p className="text-xs text-muted-foreground mb-3">No active habits defined.</p>
                  <button
                    onClick={() => onOpenQuickAdd("habit")}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-500/10 text-amber-500"
                  >
                    + Create Habit
                  </button>
                </div>
              ) : (
                activeHabits.map((habit) => {
                  const log = todayHabitLogs.find((l) => l.habitId === habit.id);
                  const isDone = Boolean(log?.completed);
                  return (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabit(habit)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all",
                        isDone
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400"
                          : "bg-background border-border hover:border-amber-500/40 text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <button className="text-muted-foreground group-hover:text-amber-500">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-amber-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                        <div>
                          <span className={cn("text-xs sm:text-sm font-semibold block", isDone && "line-through opacity-80")}>
                            {habit.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {habit.targetValue} {habit.unit} • {habit.preferredTime}
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-lg bg-card border border-border">
                        {isDone ? "Done" : "Pending"}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>Habits build long-term momentum</span>
            <button
              onClick={() => onOpenQuickAdd("habit")}
              className="text-amber-500 hover:underline font-semibold"
            >
              + Add New Habit
            </button>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: Today's Timeline Schedule, Upcoming Events & Quick Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Today's Schedule Timeline (7 Cols) */}
        <div className="lg:col-span-7 rounded-3xl p-5 sm:p-6 bg-card border border-border shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-base text-foreground">Today&apos;s Daily Timeline</h3>
            </div>
            <button
              onClick={() => onNavigate("calendar")}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
            >
              Calendar <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {scheduledItems.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-border rounded-2xl">
              <p className="text-xs text-muted-foreground mb-3">
                No events or timed tasks scheduled for today.
              </p>
              <button
                onClick={() => onOpenQuickAdd("event")}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-500/10 text-brand-500"
              >
                + Schedule an Event
              </button>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {scheduledItems.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3 group">
                  <div
                    className={cn(
                      "absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-card",
                      item.type === "event" ? "bg-cyan-500" : item.completed ? "bg-emerald-500" : "bg-brand-500"
                    )}
                  />
                  <div className="flex-1 p-3 rounded-2xl bg-muted/30 border border-border/60 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-card border border-border font-semibold text-foreground">
                          {formatTime(item.time)}
                          {item.endTime ? ` - ${formatTime(item.endTime)}` : ""}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                            item.type === "event"
                              ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                              : "bg-brand-500/10 text-brand-600 dark:text-brand-400"
                          )}
                        >
                          {item.type}
                        </span>
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", getCategoryBadgeClass(item.category))}>
                        {item.category}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-foreground mt-2">
                      {item.title}
                    </h4>

                    {item.location && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        📍 {item.location}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Notes & Evening Reflection (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Quick Notes Widget */}
          <div className="rounded-3xl p-5 bg-card border border-border shadow-sm flex-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-brand-500" />
                <h3 className="font-bold text-sm text-foreground">Pinned Notes</h3>
              </div>
              <button
                onClick={() => onOpenQuickAdd("note")}
                className="text-xs text-brand-500 hover:underline font-semibold"
              >
                + Note
              </button>
            </div>

            {pinnedNotes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4 text-center">
                Pin important thoughts or DevOps commands here.
              </p>
            ) : (
              <div className="space-y-2">
                {pinnedNotes.slice(0, 2).map((note) => (
                  <div
                    key={note.id}
                    onClick={() => onNavigate("notes")}
                    className="p-3 rounded-2xl bg-muted/40 border border-border hover:border-brand-500/40 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-foreground truncate">{note.title}</span>
                      <span className="text-[10px] text-muted-foreground px-1.5 py-0.5 rounded bg-card border border-border">
                        {note.category}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 font-mono">
                      {note.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evening Review / Reality Check Card */}
          <div className="rounded-3xl p-5 bg-gradient-to-br from-indigo-900/20 via-card to-purple-900/20 border border-indigo-500/20 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block mb-0.5">
                Night Ritual
              </span>
              <h4 className="font-bold text-sm text-foreground">Daily Reality Check & Journal</h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                Review your achievements and tomorrow&apos;s targets
              </p>
            </div>
            <button
              onClick={() => onNavigate("journal")}
              className="px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition-all shrink-0"
            >
              Start Review
            </button>
          </div>
        </div>
      </div>

      {/* Transparent Score Breakdown Modal */}
      {showBreakdownModal && scoreData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowBreakdownModal(false)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 shadow-2xl z-10 animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-brand-500" />
                <h3 className="font-bold text-base text-foreground">Score Breakdown</h3>
              </div>
              <button
                onClick={() => setShowBreakdownModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span>1. Task Completion (50% max)</span>
                  <span className="text-brand-500">{scoreData.taskScore} / 50 pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scoreData.taskDetails.completed} completed of {scoreData.taskDetails.total} planned ({scoreData.taskDetails.percentage}%)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span>2. Habit Consistency (25% max)</span>
                  <span className="text-amber-500">{scoreData.habitScore} / 25 pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scoreData.habitDetails.completed} completed of {scoreData.habitDetails.total} active ({scoreData.habitDetails.percentage}%)
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span>3. Deep Focus Sessions (15% max)</span>
                  <span className="text-emerald-500">{scoreData.focusScore} / 15 pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scoreData.focusDetails.minutesSpent} mins logged of {scoreData.focusDetails.targetMinutes} mins target
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-muted/40 border border-border">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground mb-1">
                  <span>4. Daily Reflection (10% max)</span>
                  <span className="text-cyan-500">{scoreData.reflectionScore} / 10 pts</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {scoreData.reflectionDetails.completed ? "Evening journal or reality check recorded." : "Not completed yet for today."}
                </p>
              </div>

              {scoreData.isRestDay && (
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400">
                  🌴 Note: Today is configured as a Scheduled Rest Day. Focus target is halved to avoid burnout.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-between">
              <span className="font-bold text-sm text-foreground">Total Today:</span>
              <span className="text-xl font-extrabold text-brand-500">{scoreData.totalScore} / 100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
