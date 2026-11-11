"use client";

import React, { useState } from "react";
import {
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Circle,
  Clock,
  Calendar,
  AlertTriangle,
  Copy,
  Trash2,
  Edit2,
  RotateCcw,
  ArrowRight,
  MoreVertical,
  ChevronDown,
  X,
  Sparkles,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { Task, Priority, TaskCategory, RecurrenceType } from "@/types";
import { format, isPast, parseISO, isToday, addDays } from "date-fns";
import { cn, formatFriendlyDate, formatTime, getCategoryBadgeClass, getPriorityBadgeClass } from "@/lib/utils";
import confetti from "canvas-confetti";

interface TasksViewProps {
  onOpenQuickAdd: (tab?: "task") => void;
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

const PRIORITIES: Priority[] = ["urgent", "high", "medium", "low"];

export function TasksView({ onOpenQuickAdd }: TasksViewProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "pending" | "completed" | "overdue">("all");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "title">("date");

  // Edit task modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Undo state
  const [lastCompletedTask, setLastCompletedTask] = useState<Task | null>(null);

  // Query all tasks
  const tasks = useLiveQuery(
    async () => {
      return await db.tasks.toArray();
    },
    [],
    []
  );

  // Overdue tasks: pending and date < today
  const overdueTasks = tasks.filter((t) => !t.completed && t.date < todayStr);

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchCat = task.category.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchCat) return false;
    }

    // Category
    if (selectedCategory !== "All" && task.category !== selectedCategory) {
      return false;
    }

    // Priority
    if (selectedPriority !== "All" && task.priority !== selectedPriority) {
      return false;
    }

    // Status
    if (selectedStatus === "pending") {
      return !task.completed;
    }
    if (selectedStatus === "completed") {
      return task.completed;
    }
    if (selectedStatus === "overdue") {
      return !task.completed && task.date < todayStr;
    }

    return true;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "priority") {
      const priorityOrder: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    if (sortBy === "title") {
      return a.title.localeCompare(b.title);
    }
    // Default date
    return a.date.localeCompare(b.date);
  });

  // Toggle completion
  const handleToggleComplete = async (task: Task) => {
    if (!task.id) return;
    const nextCompleted = !task.completed;
    await db.tasks.update(task.id, {
      completed: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString(),
    });

    if (nextCompleted) {
      setLastCompletedTask(task);
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch (e) {}
    } else {
      setLastCompletedTask(null);
    }
  };

  // Undo completion
  const handleUndo = async () => {
    if (!lastCompletedTask?.id) return;
    await db.tasks.update(lastCompletedTask.id, {
      completed: false,
      completedAt: undefined,
      updatedAt: new Date().toISOString(),
    });
    setLastCompletedTask(null);
  };

  // Duplicate task
  const handleDuplicate = async (task: Task) => {
    const { id, ...rest } = task;
    await db.tasks.add({
      ...rest,
      title: `${rest.title} (Copy)`,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete task
  const handleDelete = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this task?")) {
      await db.tasks.delete(id);
    }
  };

  // Move overdue tasks to today
  const handleMoveOverdueToToday = async () => {
    for (const task of overdueTasks) {
      if (task.id) {
        await db.tasks.update(task.id, {
          date: todayStr,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  };

  // Save edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask || !editingTask.id) return;

    await db.tasks.put({
      ...editingTask,
      updatedAt: new Date().toISOString(),
    });
    setEditingTask(null);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Daily Task Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-mono font-medium">
              {tasks.filter((t) => !t.completed).length} Pending
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Organize, prioritize, and conquer your daily commitments
          </p>
        </div>

        <button
          onClick={() => onOpenQuickAdd("task")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/25 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Overdue Tasks Alert Banner */}
      {overdueTasks.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div>
              <span className="font-bold">
                {overdueTasks.length} Overdue Task{overdueTasks.length > 1 ? "s" : ""}
              </span>
              <p className="text-muted-foreground text-[11px] mt-0.5">
                Tasks from previous days that were not finished yet.
              </p>
            </div>
          </div>
          <button
            onClick={handleMoveOverdueToToday}
            className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm self-start sm:self-auto transition-all"
          >
            Move All to Today
          </button>
        </div>
      )}

      {/* Undo Toast */}
      {lastCompletedTask && (
        <div className="p-3 rounded-2xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-between text-xs animate-fade-in">
          <span className="text-foreground font-medium">
            Task completed: <strong>{lastCompletedTask.title}</strong>
          </span>
          <button
            onClick={handleUndo}
            className="flex items-center gap-1 font-semibold text-brand-500 hover:underline px-2 py-1 rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Undo
          </button>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-card border border-border shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks by title, note, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            {(["all", "pending", "completed", "overdue"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all",
                  selectedStatus === st
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Second Filter Row: Category, Priority, Sort */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-background border border-border text-foreground text-xs"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-background border border-border text-foreground text-xs"
            >
              <option value="All">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-muted-foreground">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg bg-background border border-border text-foreground text-xs font-medium"
            >
              <option value="date">Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-card border border-dashed border-border">
            <CheckCircle2 className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-semibold text-base text-foreground">No tasks found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto mb-4">
              {searchQuery || selectedCategory !== "All" || selectedPriority !== "All"
                ? "Try adjusting your filters or search terms."
                : "You don't have any tasks in this view. Enjoy the moment or plan something new!"}
            </p>
            <button
              onClick={() => onOpenQuickAdd("task")}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md transition-all"
            >
              + Create a Task
            </button>
          </div>
        ) : (
          sortedTasks.map((task) => {
            const isOverdue = !task.completed && task.date < todayStr;
            return (
              <div
                key={task.id}
                className={cn(
                  "p-4 rounded-2xl border transition-all relative group bg-card",
                  task.completed
                    ? "opacity-65 border-border/60 bg-muted/20"
                    : isOverdue
                    ? "border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60"
                    : "border-border hover:border-brand-500/40 hover:shadow-sm"
                )}
              >
                <div className="flex items-start gap-3">
                  {/* Complete Checkbox */}
                  <button
                    onClick={() => handleToggleComplete(task)}
                    className="mt-0.5 text-muted-foreground hover:text-brand-500 shrink-0 transition-colors"
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4
                        className={cn(
                          "text-sm font-semibold text-foreground truncate",
                          task.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                            getPriorityBadgeClass(task.priority)
                          )}
                        >
                          {task.priority}
                        </span>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingTask(task)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Edit task"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(task)}
                            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                            title="Duplicate task"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="p-1 rounded-md text-muted-foreground hover:text-rose-500 hover:bg-muted"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {task.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-2 mt-2.5 text-[11px] text-muted-foreground">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full border text-[10px] font-medium",
                          getCategoryBadgeClass(task.category)
                        )}
                      >
                        {task.category}
                      </span>

                      <span
                        className={cn(
                          "flex items-center gap-1 font-mono",
                          isOverdue ? "text-amber-600 dark:text-amber-400 font-semibold" : ""
                        )}
                      >
                        <Calendar className="w-3 h-3" />
                        {formatFriendlyDate(task.date)}
                      </span>

                      {task.startTime && (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-cyan-500" />
                          {formatTime(task.startTime)}
                          {task.dueTime ? ` - ${formatTime(task.dueTime)}` : ""}
                        </span>
                      )}

                      {task.estimatedDuration && (
                        <span>• Est: {task.estimatedDuration}m</span>
                      )}

                      {task.notes && (
                        <span className="italic text-muted-foreground/80 truncate max-w-xs">
                          • Note: {task.notes}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingTask(null)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-10 p-5 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-bold text-base text-foreground">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.date}
                    onChange={(e) => setEditingTask({ ...editingTask, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={editingTask.dueTime || ""}
                    onChange={(e) => setEditingTask({ ...editingTask, dueTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={editingTask.priority}
                    onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={editingTask.category}
                    onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as TaskCategory })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Est. Duration (m)
                  </label>
                  <input
                    type="number"
                    value={editingTask.estimatedDuration || 30}
                    onChange={(e) => setEditingTask({ ...editingTask, estimatedDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Actual Spent (m)
                  </label>
                  <input
                    type="number"
                    value={editingTask.actualDuration || 0}
                    onChange={(e) => setEditingTask({ ...editingTask, actualDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Private Notes
                </label>
                <input
                  type="text"
                  value={editingTask.notes || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
