"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Timer,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Coffee,
  Sparkles,
  Link as LinkIcon,
  Volume2,
  Sliders,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { FocusSessionType, Task } from "@/types";
import { format, parseISO } from "date-fns";
import { cn, formatTime } from "@/lib/utils";
import { playTimerFinishSound } from "@/lib/notifications";
import confetti from "canvas-confetti";

export function FocusView() {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [sessionType, setSessionType] = useState<FocusSessionType>("pomodoro");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [linkedTaskId, setLinkedTaskId] = useState<number | undefined>(undefined);
  const [sessionNotes, setSessionNotes] = useState("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Available tasks to link
  const tasks = useLiveQuery(
    async () => {
      return await db.tasks.where("date").equals(todayStr).toArray();
    },
    [todayStr],
    []
  );

  // Completed sessions today
  const todaySessions = useLiveQuery(
    async () => {
      return await db.focusSessions
        .filter((s) => s.startedAt.startsWith(todayStr))
        .reverse()
        .sortBy("startedAt");
    },
    [todayStr],
    []
  );

  // Switch session preset
  const handleSelectPreset = (type: FocusSessionType, mins: number) => {
    setIsRunning(false);
    setSessionType(type);
    setDurationMinutes(mins);
    setTimeLeft(mins * 60);
  };

  // Timer tick effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleCompleteSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Handle completion
  const handleCompleteSession = async () => {
    setIsRunning(false);
    playTimerFinishSound();

    const linkedTask = tasks.find((t) => t.id === linkedTaskId);

    await db.focusSessions.add({
      taskId: linkedTaskId,
      taskTitle: linkedTask?.title || (sessionType === "pomodoro" ? "Deep Focus Block" : "Break Session"),
      type: sessionType,
      durationMinutes,
      completedDurationSeconds: durationMinutes * 60,
      completed: true,
      notes: sessionNotes.trim() || undefined,
      startedAt: new Date(Date.now() - durationMinutes * 60000).toISOString(),
      endedAt: new Date().toISOString(),
    });

    try {
      confetti({
        particleCount: 50,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    // Reset to preset
    setTimeLeft(durationMinutes * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(durationMinutes * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalDurationSeconds = durationMinutes * 60;
  const progressRatio = totalDurationSeconds > 0 ? (totalDurationSeconds - timeLeft) / totalDurationSeconds : 0;
  const strokeDashoffset = 880 - 880 * progressRatio;

  // Calculate total focus time today in minutes
  const totalFocusMinutesToday = todaySessions
    ? todaySessions
        .filter((s) => s.completed && s.type === "pomodoro")
        .reduce(
          (acc, s) => acc + (s.completedDurationSeconds ? Math.floor(s.completedDurationSeconds / 60) : s.durationMinutes),
          0
        )
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Timer className="w-6 h-6 text-brand-500" />
            <span>Focus Mode & Pomodoro Timer</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Single-task with deep concentration. Eliminate multitasking and distractions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-semibold flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>Today: {totalFocusMinutesToday} mins logged</span>
          </div>
        </div>
      </div>

      {/* Main Timer Display Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Timer Core (7 cols) */}
        <div className="lg:col-span-7 rounded-3xl p-6 sm:p-8 bg-card border border-border shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
          {/* Preset Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border text-xs font-semibold mb-6">
            <button
              onClick={() => handleSelectPreset("pomodoro", 25)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all",
                sessionType === "pomodoro"
                  ? "bg-card text-brand-500 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Focus (25m)
            </button>
            <button
              onClick={() => handleSelectPreset("short-break", 5)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all",
                sessionType === "short-break"
                  ? "bg-card text-emerald-500 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Short Break (5m)
            </button>
            <button
              onClick={() => handleSelectPreset("long-break", 15)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl transition-all",
                sessionType === "long-break"
                  ? "bg-card text-cyan-500 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Long Break (15m)
            </button>
          </div>

          {/* Big Circular Clock */}
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
              <circle
                cx="150"
                cy="150"
                r="140"
                className="stroke-muted/40"
                strokeWidth="12"
                fill="transparent"
              />
              <circle
                cx="150"
                cy="150"
                r="140"
                className={cn(
                  "transition-all duration-1000 ease-linear",
                  sessionType === "pomodoro"
                    ? "stroke-brand-500"
                    : sessionType === "short-break"
                    ? "stroke-emerald-500"
                    : "stroke-cyan-500"
                )}
                strokeWidth="12"
                strokeDasharray={880}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute flex flex-col items-center">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-tight font-mono text-foreground">
                {formattedTime}
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-muted-foreground mt-2">
                {sessionType === "pomodoro" ? "Deep Focus" : "Recovery Break"}
              </span>
            </div>
          </div>

          {/* Action Buttons: Play/Pause/Reset */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={handleReset}
              className="p-3.5 rounded-2xl bg-muted hover:bg-muted/80 text-foreground transition-all"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className={cn(
                "px-8 py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl flex items-center gap-2.5 transition-all active:scale-95",
                isRunning
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-500/25"
                  : "bg-brand-600 hover:bg-brand-500 shadow-brand-500/30"
              )}
            >
              {isRunning ? (
                <>
                  <Pause className="w-5 h-5 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" /> Start Focus
                </>
              )}
            </button>
          </div>

          {/* Link to Task Selector */}
          <div className="w-full max-w-sm mt-6 pt-5 border-t border-border flex items-center gap-2">
            <LinkIcon className="w-4 h-4 text-brand-500 shrink-0" />
            <select
              value={linkedTaskId || ""}
              onChange={(e) => setLinkedTaskId(e.target.value ? Number(e.target.value) : undefined)}
              className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs"
            >
              <option value="">(Optional) Link session to a task...</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* History and Stats (5 cols) */}
        <div className="lg:col-span-5 rounded-3xl p-6 bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-bold text-base text-foreground">Today&apos;s Focus Log</h3>
              <span className="text-xs font-mono font-medium text-muted-foreground">
                {todaySessions ? todaySessions.length : 0} completed
              </span>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {!todaySessions || todaySessions.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">
                  <Coffee className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p>No focus sessions recorded yet today.</p>
                  <p className="mt-1">Click Start to record your first 25-minute sprint!</p>
                </div>
              ) : (
                todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-3 rounded-2xl bg-muted/30 border border-border flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                            session.type === "pomodoro"
                              ? "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          )}
                        >
                          {session.type}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {format(parseISO(session.startedAt), "hh:mm a")}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                        {session.taskTitle}
                      </h4>
                    </div>

                    <span className="text-xs font-bold text-foreground font-mono">
                      {session.durationMinutes}m
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-border mt-4 text-xs text-muted-foreground flex items-center justify-between">
            <span>25 min focus + 5 min rest = 1 Pomodoro cycle</span>
            <Volume2 className="w-4 h-4 text-brand-500" />
          </div>
        </div>
      </div>
    </div>
  );
}
