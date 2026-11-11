"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Edit2,
  Trash2,
  X,
  Sparkles,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Goal, GoalType, GoalStatus, Priority, TaskCategory, Milestone } from "@/types";
import { format, parseISO } from "date-fns";
import { cn, formatFriendlyDate, getCategoryBadgeClass, getPriorityBadgeClass } from "@/lib/utils";
import confetti from "canvas-confetti";

interface GoalsViewProps {
  onOpenQuickAdd: (tab?: "goal") => void;
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

export function GoalsView({ onOpenQuickAdd }: GoalsViewProps) {
  const [selectedType, setSelectedType] = useState<string>("all");
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");

  const goals = useLiveQuery(
    async () => {
      return await db.goals.toArray();
    },
    [],
    []
  );

  const filteredGoals = goals.filter((g) => {
    if (selectedType !== "all" && g.type !== selectedType) return false;
    return true;
  });

  // Toggle milestone completion
  const handleToggleMilestone = async (goal: Goal, milestoneId: string) => {
    if (!goal.id) return;
    const updatedMilestones = goal.milestones.map((m) =>
      m.id === milestoneId ? { ...m, completed: !m.completed } : m
    );

    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = updatedMilestones.length > 0 ? Math.round((completedCount / updatedMilestones.length) * 100) : goal.progress;
    const status: GoalStatus = progress === 100 ? "completed" : "in-progress";

    await db.goals.update(goal.id, {
      milestones: updatedMilestones,
      progress,
      status,
    });

    if (progress === 100) {
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  };

  // Add milestone to existing goal
  const handleAddMilestone = async (goal: Goal) => {
    if (!goal.id || !newMilestoneTitle.trim()) return;
    const newM: Milestone = {
      id: `m_${Date.now()}`,
      title: newMilestoneTitle.trim(),
      completed: false,
    };
    const updatedMilestones = [...goal.milestones, newM];
    const completedCount = updatedMilestones.filter((m) => m.completed).length;
    const progress = Math.round((completedCount / updatedMilestones.length) * 100);

    await db.goals.update(goal.id, {
      milestones: updatedMilestones,
      progress,
    });
    setNewMilestoneTitle("");
  };

  // Delete goal
  const handleDeleteGoal = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this goal?")) {
      await db.goals.delete(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-brand-500" />
            <span>Goals & Personal Development</span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Turn ambitious visions into measurable milestones and steady execution
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAdd("goal")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Type Filters */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: "all", label: "All Goals" },
          { id: "daily", label: "Daily" },
          { id: "weekly", label: "Weekly" },
          { id: "monthly", label: "Monthly" },
          { id: "long-term", label: "Long-Term" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedType(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
              selectedType === tab.id
                ? "bg-brand-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredGoals.length === 0 ? (
          <div className="col-span-2 p-12 text-center rounded-3xl bg-card border border-dashed border-border">
            <Target className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-base text-foreground">No goals in this category</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Set clear targets to stay focused and track your career and life progression.
            </p>
            <button
              onClick={() => onOpenQuickAdd("goal")}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
            >
              + Create a Goal
            </button>
          </div>
        ) : (
          filteredGoals.map((goal) => {
            const isCompleted = goal.status === "completed" || goal.progress === 100;
            return (
              <div
                key={goal.id}
                className={cn(
                  "p-5 sm:p-6 rounded-3xl border bg-card transition-all relative flex flex-col justify-between group",
                  isCompleted
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-border hover:border-brand-500/40 hover:shadow-sm"
                )}
              >
                <div>
                  {/* Category & Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-medium", getCategoryBadgeClass(goal.category))}>
                        {goal.category}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {goal.type}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-muted"
                        title="Delete Goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Target Date */}
                  <h3 className="text-base font-bold text-foreground">{goal.title}</h3>
                  {goal.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {goal.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground font-mono">
                    <Calendar className="w-3.5 h-3.5 text-brand-500" />
                    <span>Target: {formatFriendlyDate(goal.targetDate)}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className={isCompleted ? "text-emerald-500 font-bold" : "text-brand-500 font-bold"}>
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all duration-700",
                          isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-brand-600 to-indigo-500"
                        )}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Milestones Checklist */}
                  <div className="mt-4 pt-3 border-t border-border/60 space-y-2">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      Milestones ({goal.milestones.filter((m) => m.completed).length}/{goal.milestones.length})
                    </span>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {goal.milestones.map((m) => (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMilestone(goal, m.id)}
                          className={cn(
                            "flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-all",
                            m.completed
                              ? "bg-muted/30 border-border/40 text-muted-foreground line-through"
                              : "bg-background border-border hover:border-brand-500/40 text-foreground"
                          )}
                        >
                          {m.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                          )}
                          <span className="truncate">{m.title}</span>
                        </div>
                      ))}
                    </div>

                    {/* Add Milestone Inline */}
                    <div className="flex items-center gap-2 mt-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add a new milestone..."
                        value={newMilestoneTitle}
                        onChange={(e) => setNewMilestoneTitle(e.target.value)}
                        className="flex-1 px-3 py-1.5 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddMilestone(goal);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleAddMilestone(goal)}
                        className="px-2.5 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
