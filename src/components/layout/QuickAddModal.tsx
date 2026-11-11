"use client";

import React, { useState } from "react";
import {
  X,
  CheckSquare,
  Calendar,
  Flame,
  Target,
  StickyNote,
  Clock,
  Tag,
  AlertCircle,
  Bell,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { TaskCategory, Priority, RecurrenceType, HabitFrequency, PreferredTime, GoalType } from "@/types";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "task" | "event" | "habit" | "goal" | "note";
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

export function QuickAddModal({
  isOpen,
  onClose,
  defaultTab = "task",
}: QuickAddModalProps) {
  const [activeTab, setActiveTab] = useState<"task" | "event" | "habit" | "goal" | "note">(defaultTab);

  // Task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDate, setTaskDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [taskStartTime, setTaskStartTime] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [taskPriority, setTaskPriority] = useState<Priority>("medium");
  const [taskCategory, setTaskCategory] = useState<TaskCategory>("Personal");
  const [taskReminder, setTaskReminder] = useState(true);
  const [taskRecurrence, setTaskRecurrence] = useState<RecurrenceType>("none");
  const [taskDuration, setTaskDuration] = useState(30);

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventDate, setEventDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [eventStartTime, setEventStartTime] = useState("10:00");
  const [eventEndTime, setEventEndTime] = useState("11:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState<TaskCategory>("Work");
  const [eventReminder, setEventReminder] = useState(true);

  // Habit form state
  const [habitName, setHabitName] = useState("");
  const [habitDesc, setHabitDesc] = useState("");
  const [habitCategory, setHabitCategory] = useState<TaskCategory>("Personal");
  const [habitFrequency, setHabitFrequency] = useState<HabitFrequency>("daily");
  const [habitTarget, setHabitTarget] = useState(1);
  const [habitUnit, setHabitUnit] = useState("times");
  const [habitPreferredTime, setHabitPreferredTime] = useState<PreferredTime>("morning");

  // Goal form state
  const [goalTitle, setGoalTitle] = useState("");
  const [goalDesc, setGoalDesc] = useState("");
  const [goalType, setGoalType] = useState<GoalType>("monthly");
  const [goalDate, setGoalDate] = useState(format(new Date(Date.now() + 30 * 86400000), "yyyy-MM-dd"));
  const [goalPriority, setGoalPriority] = useState<Priority>("high");
  const [goalCategory, setGoalCategory] = useState<TaskCategory>("DevOps Learning");

  // Note form state
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const [noteCategory, setNoteCategory] = useState("Personal");
  const [notePinned, setNotePinned] = useState(false);

  if (!isOpen) return null;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    await db.tasks.add({
      title: taskTitle.trim(),
      description: taskDesc.trim(),
      date: taskDate,
      startTime: taskStartTime || undefined,
      dueTime: taskDueTime || undefined,
      priority: taskPriority,
      category: taskCategory,
      completed: false,
      reminder: taskReminder,
      recurrence: taskRecurrence,
      estimatedDuration: Number(taskDuration) || 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setTaskTitle("");
    setTaskDesc("");
    onClose();
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    await db.events.add({
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location: eventLocation.trim() || undefined,
      category: eventCategory,
      reminder: eventReminder,
      recurrence: "none",
      createdAt: new Date().toISOString(),
    });

    setEventTitle("");
    setEventDesc("");
    onClose();
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;

    await db.habits.add({
      name: habitName.trim(),
      description: habitDesc.trim(),
      category: habitCategory,
      frequency: habitFrequency,
      targetDaysPerWeek: habitFrequency === "daily" ? 7 : habitFrequency === "weekdays" ? 5 : 2,
      targetValue: Number(habitTarget) || 1,
      unit: habitUnit.trim() || "times",
      preferredTime: habitPreferredTime,
      status: "active",
      createdAt: new Date().toISOString(),
    });

    setHabitName("");
    setHabitDesc("");
    onClose();
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle.trim()) return;

    await db.goals.add({
      title: goalTitle.trim(),
      description: goalDesc.trim(),
      type: goalType,
      targetDate: goalDate,
      priority: goalPriority,
      progress: 0,
      status: "in-progress",
      category: goalCategory,
      milestones: [],
      createdAt: new Date().toISOString(),
    });

    setGoalTitle("");
    setGoalDesc("");
    onClose();
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    await db.notes.add({
      title: noteTitle.trim(),
      content: noteContent.trim(),
      category: noteCategory,
      pinned: notePinned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setNoteTitle("");
    setNoteContent("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] animate-fade-in">
        {/* Header Tabs */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-border bg-muted/20">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-[85%] no-scrollbar">
            <button
              onClick={() => setActiveTab("task")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "task"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Task
            </button>
            <button
              onClick={() => setActiveTab("event")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "event"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Calendar className="w-3.5 h-3.5" /> Event
            </button>
            <button
              onClick={() => setActiveTab("habit")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "habit"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Flame className="w-3.5 h-3.5" /> Habit
            </button>
            <button
              onClick={() => setActiveTab("goal")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "goal"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <Target className="w-3.5 h-3.5" /> Goal
            </button>
            <button
              onClick={() => setActiveTab("note")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap",
                activeTab === "note"
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <StickyNote className="w-3.5 h-3.5" /> Note
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Forms */}
        <div className="p-5 overflow-y-auto flex-1">
          {/* TASK FORM */}
          {activeTab === "task" && (
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deploy Kubernetes Ingress Controller"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Description / Sub-tasks
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or key steps..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={taskDueTime}
                    onChange={(e) => setTaskDueTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Priority
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={taskReminder}
                    onChange={(e) => setTaskReminder(e.target.checked)}
                    className="rounded border-border text-brand-500 focus:ring-brand-500"
                  />
                  <span>Send notification reminder</span>
                </label>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={taskDuration}
                    onChange={(e) => setTaskDuration(Number(e.target.value))}
                    className="w-14 px-2 py-1 rounded-lg bg-background border border-border text-xs text-center"
                  />
                  <span>mins</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all"
                >
                  Create Task
                </button>
              </div>
            </form>
          )}

          {/* EVENT FORM */}
          {activeTab === "event" && (
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Architecture Sync or Sprint Planning"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Start
                  </label>
                  <input
                    type="time"
                    value={eventStartTime}
                    onChange={(e) => setEventStartTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    End
                  </label>
                  <input
                    type="time"
                    value={eventEndTime}
                    onChange={(e) => setEventEndTime(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Location / Meeting Link (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Google Meet, Zoom, or Office"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={eventCategory}
                  onChange={(e) => setEventCategory(e.target.value as TaskCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          )}

          {/* HABIT FORM */}
          {activeTab === "habit" && (
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Habit Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Read 30 Mins, DevOps Hands-on, Drink 3L Water"
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Why is this important? (Description)
                </label>
                <input
                  type="text"
                  placeholder="Keep sharp, build discipline, compound knowledge"
                  value={habitDesc}
                  onChange={(e) => setHabitDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Frequency
                  </label>
                  <select
                    value={habitFrequency}
                    onChange={(e) => setHabitFrequency(e.target.value as HabitFrequency)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  >
                    <option value="daily">Daily (7 days)</option>
                    <option value="weekdays">Weekdays (Mon-Fri)</option>
                    <option value="weekends">Weekends (Sat-Sun)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Preferred Time
                  </label>
                  <select
                    value={habitPreferredTime}
                    onChange={(e) => setHabitPreferredTime(e.target.value as PreferredTime)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  >
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    <option value="anytime">Anytime</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={habitTarget}
                    onChange={(e) => setHabitTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    placeholder="times, mins, pages, ml"
                    value={habitUnit}
                    onChange={(e) => setHabitUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all"
                >
                  Add Habit
                </button>
              </div>
            </form>
          )}

          {/* GOAL FORM */}
          {activeTab === "goal" && (
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master CKA Certification & Kubernetes GitOps"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Description & Motivation
                </label>
                <textarea
                  rows={2}
                  placeholder="What does success look like?"
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Timeframe
                  </label>
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as GoalType)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
                  >
                    <option value="daily">Daily Goal</option>
                    <option value="weekly">Weekly Goal</option>
                    <option value="monthly">Monthly Goal</option>
                    <option value="long-term">Long-Term Goal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all"
                >
                  Save Goal
                </button>
              </div>
            </form>
          )}

          {/* NOTE FORM */}
          {activeTab === "note" && (
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Quick DevOps snippet or idea"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Content (Markdown supported)
                </label>
                <textarea
                  rows={4}
                  placeholder="Type anything you need to remember quickly..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-mono resize-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={notePinned}
                    onChange={(e) => setNotePinned(e.target.checked)}
                    className="rounded border-border text-brand-500"
                  />
                  <span>Pin to top</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] transition-all"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
