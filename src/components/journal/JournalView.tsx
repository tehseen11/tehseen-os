"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Sparkles,
  Save,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Award,
  ChevronRight,
  Smile,
  Meh,
  Frown,
  Zap,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { JournalEntry, DailyRealityCheck, Mood } from "@/types";
import { format, parseISO, subDays } from "date-fns";
import { cn, formatFriendlyDate } from "@/lib/utils";
import confetti from "canvas-confetti";

export function JournalView() {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const [activeTab, setActiveTab] = useState<"journal" | "realityCheck" | "history">("journal");

  // Journal form state
  const [accomplished, setAccomplished] = useState("");
  const [learned, setLearned] = useState("");
  const [challenges, setChallenges] = useState("");
  const [improvement, setImprovement] = useState("");
  const [thoughts, setThoughts] = useState("");
  const [tomorrowPriorities, setTomorrowPriorities] = useState("");
  const [mood, setMood] = useState<Mood>("good");
  const [isSavedToast, setIsSavedToast] = useState(false);

  // Reality Check form state
  const [missedReason, setMissedReason] = useState("");
  const [biggestWin, setBiggestWin] = useState("");
  const [realityLearned, setRealityLearned] = useState("");
  const [realityImprovement, setRealityImprovement] = useState("");

  // Load today's tasks and habits for auto-population
  const todayTasks = useLiveQuery(
    async () => {
      return await db.tasks.where("date").equals(todayStr).toArray();
    },
    [todayStr],
    []
  );

  // Load existing today's journal entry
  const existingJournal = useLiveQuery(
    async () => {
      return await db.journalEntries.where("date").equals(todayStr).first();
    },
    [todayStr]
  );

  // Load existing today's reality check
  const existingRealityCheck = useLiveQuery(
    async () => {
      return await db.realityChecks.where("date").equals(todayStr).first();
    },
    [todayStr]
  );

  // Load all past journal entries for history
  const allJournals = useLiveQuery(
    async () => {
      return await db.journalEntries.reverse().sortBy("date");
    },
    [],
    []
  );

  // Populate state if existing journal exists
  useEffect(() => {
    if (existingJournal) {
      setAccomplished(existingJournal.accomplished || "");
      setLearned(existingJournal.learned || "");
      setChallenges(existingJournal.challenges || "");
      setImprovement(existingJournal.improvement || "");
      setThoughts(existingJournal.thoughts || "");
      setTomorrowPriorities(existingJournal.tomorrowPriorities || "");
      setMood(existingJournal.mood || "good");
    }
  }, [existingJournal]);

  // Populate reality check if existing
  useEffect(() => {
    if (existingRealityCheck) {
      setMissedReason(existingRealityCheck.reasonForMissed || "");
      setBiggestWin(existingRealityCheck.biggestAchievement || "");
      setRealityLearned(existingRealityCheck.keyLearning || "");
      setRealityImprovement(existingRealityCheck.improvementTomorrow || "");
    }
  }, [existingRealityCheck]);

  // Save Journal
  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (existingJournal && existingJournal.id) {
      await db.journalEntries.update(existingJournal.id, {
        accomplished,
        learned,
        challenges,
        improvement,
        thoughts,
        tomorrowPriorities,
        mood,
        updatedAt: new Date().toISOString(),
      });
    } else {
      await db.journalEntries.add({
        date: todayStr,
        accomplished,
        learned,
        challenges,
        improvement,
        thoughts,
        tomorrowPriorities,
        mood,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);

    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (e) {}
  };

  // Save Reality Check
  const handleSaveRealityCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    const plannedTasks = todayTasks.length;
    const completedTasks = todayTasks.filter((t) => t.completed).length;
    const missedTasks = plannedTasks - completedTasks;
    const missedSummary = todayTasks
      .filter((t) => !t.completed)
      .map((t) => t.title)
      .join(", ");

    const payload: DailyRealityCheck = {
      date: todayStr,
      plannedTasksCount: plannedTasks,
      completedTasksCount: completedTasks,
      missedTasksCount: missedTasks,
      missedTasksSummary: missedSummary || "None! All planned tasks completed.",
      reasonForMissed: missedReason || "N/A",
      biggestAchievement: biggestWin,
      keyLearning: realityLearned,
      improvementTomorrow: realityImprovement,
      productivityScore: plannedTasks > 0 ? Math.round((completedTasks / plannedTasks) * 100) : 100,
      savedAt: new Date().toISOString(),
    };

    if (existingRealityCheck && existingRealityCheck.id) {
      await db.realityChecks.update(existingRealityCheck.id, payload);
    } else {
      await db.realityChecks.add(payload);
    }

    setIsSavedToast(true);
    setTimeout(() => setIsSavedToast(false), 3000);
  };

  const plannedCount = todayTasks.length;
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const missedTasksList = todayTasks.filter((t) => !t.completed);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-500" />
            <span>Daily Journal & Reality Check</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Private end-of-day introspection, lessons learned, and honest performance review
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-2xl border border-border text-xs font-semibold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab("journal")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all",
              activeTab === "journal"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Daily Reflection
          </button>
          <button
            onClick={() => setActiveTab("realityCheck")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all",
              activeTab === "realityCheck"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Reality Check Wizard
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl transition-all",
              activeTab === "history"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Past Entries
          </button>
        </div>
      </div>

      {isSavedToast && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4" />
          <span>Journal reflection saved to local storage!</span>
        </div>
      )}

      {/* 1. DAILY JOURNAL TAB */}
      {activeTab === "journal" && (
        <form onSubmit={handleSaveJournal} className="space-y-5">
          {/* Mood Selector Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-card border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                Today&apos;s Mood & Energy
              </span>
              <p className="text-xs text-muted-foreground">How was your headspace and focus overall today?</p>
            </div>
            <div className="flex items-center gap-2">
              {[
                { id: "great", label: "Great", icon: Zap, color: "text-amber-500" },
                { id: "good", label: "Good", icon: Smile, color: "text-emerald-500" },
                { id: "neutral", label: "Neutral", icon: Meh, color: "text-blue-500" },
                { id: "tired", label: "Tired", icon: Frown, color: "text-purple-500" },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMood(m.id as Mood)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all",
                      isSelected
                        ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                        : "bg-muted/30 border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5", !isSelected && m.color)} />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prompt 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-emerald-500 block">
                1. What I accomplished today
              </label>
              <textarea
                rows={3}
                placeholder="Key wins, completed deliverables, or milestones..."
                value={accomplished}
                onChange={(e) => setAccomplished(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-cyan-500 block">
                2. What I learned today
              </label>
              <textarea
                rows={3}
                placeholder="Technical insights, DevOps lessons, personal revelations..."
                value={learned}
                onChange={(e) => setLearned(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Prompt 3 & 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-rose-500 block">
                3. What went wrong / Friction points
              </label>
              <textarea
                rows={3}
                placeholder="Blockers, distractions, delays, or challenges encountered..."
                value={challenges}
                onChange={(e) => setChallenges(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-amber-500 block">
                4. What I could improve tomorrow
              </label>
              <textarea
                rows={3}
                placeholder="Actionable steps to avoid repeat bottlenecks..."
                value={improvement}
                onChange={(e) => setImprovement(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          {/* Prompt 5 & 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-brand-500 block">
                5. Important thoughts & reflections
              </label>
              <textarea
                rows={3}
                placeholder="Freewheeling personal thoughts, gratitude, ideas..."
                value={thoughts}
                onChange={(e) => setThoughts(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>

            <div className="p-5 rounded-3xl bg-card border border-border shadow-sm space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-indigo-400 block">
                6. Tomorrow&apos;s Top Priorities
              </label>
              <textarea
                rows={3}
                placeholder="What must happen tomorrow before anything else?"
                value={tomorrowPriorities}
                onChange={(e) => setTomorrowPriorities(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Journal Entry</span>
            </button>
          </div>
        </form>
      )}

      {/* 2. REALITY CHECK WIZARD TAB */}
      {activeTab === "realityCheck" && (
        <form onSubmit={handleSaveRealityCheck} className="space-y-5">
          {/* Data-Driven Summary Banner */}
          <div className="p-5 rounded-3xl bg-card border border-border shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-brand-500" />
              <h3 className="font-bold text-sm text-foreground">
                Automated Daily Reality Assessment
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-2xl bg-muted/40 border border-border/60">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Planned Tasks
                </span>
                <span className="text-xl font-bold text-foreground">{plannedCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] uppercase font-bold block">Actually Completed</span>
                <span className="text-xl font-bold">{completedCount}</span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                <span className="text-[10px] uppercase font-bold block">Missed / Unfinished</span>
                <span className="text-xl font-bold">{missedTasksList.length}</span>
              </div>
              <div className="p-3 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400">
                <span className="text-[10px] uppercase font-bold block">Completion Rate</span>
                <span className="text-xl font-bold">
                  {plannedCount > 0 ? Math.round((completedCount / plannedCount) * 100) : 100}%
                </span>
              </div>
            </div>

            {missedTasksList.length > 0 && (
              <div className="mt-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-xs">
                <span className="font-semibold text-rose-500 block mb-1">
                  Missed Tasks from Today:
                </span>
                <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                  {missedTasksList.map((t) => (
                    <li key={t.id}>{t.title}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Introspection Questions */}
          <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1">
                Why did you miss any unfinished tasks? (Be honest with yourself)
              </label>
              <textarea
                rows={2}
                placeholder="Poor time estimation, unexpected meetings, procrastination, fatigue..."
                value={missedReason}
                onChange={(e) => setMissedReason(e.target.value)}
                className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-emerald-500 mb-1">
                What was your single biggest achievement today?
              </label>
              <input
                type="text"
                placeholder="e.g. Mastered Kubernetes Helm deployment and solved ingress certs"
                value={biggestWin}
                onChange={(e) => setBiggestWin(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-cyan-500 mb-1">
                  Core Lesson Learned
                </label>
                <textarea
                  rows={2}
                  placeholder="One sentence key takeaway..."
                  value={realityLearned}
                  onChange={(e) => setRealityLearned(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">
                  Single Shift for Tomorrow
                </label>
                <textarea
                  rows={2}
                  placeholder="What one thing will you do differently tomorrow?"
                  value={realityImprovement}
                  onChange={(e) => setRealityImprovement(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-background border border-border text-foreground text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
              >
                <Save className="w-4 h-4" /> Save Reality Check Summary
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 3. HISTORY TAB */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {allJournals.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-card border border-dashed border-border text-xs text-muted-foreground">
              No historical journal entries recorded yet. Complete your first reflection today!
            </div>
          ) : (
            allJournals.map((entry) => (
              <div
                key={entry.id}
                className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <span className="font-bold text-sm text-foreground">
                      {formatFriendlyDate(entry.date)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">({entry.date})</span>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-semibold uppercase">
                    Mood: {entry.mood}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {entry.accomplished && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <strong className="text-emerald-500 block mb-0.5">Accomplished:</strong>
                      <p className="text-foreground/90">{entry.accomplished}</p>
                    </div>
                  )}

                  {entry.learned && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <strong className="text-cyan-500 block mb-0.5">Learned:</strong>
                      <p className="text-foreground/90">{entry.learned}</p>
                    </div>
                  )}

                  {entry.challenges && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <strong className="text-rose-500 block mb-0.5">Friction / Challenges:</strong>
                      <p className="text-foreground/90">{entry.challenges}</p>
                    </div>
                  )}

                  {entry.improvement && (
                    <div className="p-3 rounded-2xl bg-muted/30 border border-border/50">
                      <strong className="text-amber-500 block mb-0.5">Improvement:</strong>
                      <p className="text-foreground/90">{entry.improvement}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
