"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckCircle2,
  Circle,
  Tag,
  Trash2,
  Edit2,
  X,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { CalendarEvent, Task, TaskCategory, RecurrenceType } from "@/types";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  parseISO,
  isToday,
} from "date-fns";
import { cn, formatFriendlyDate, formatTime, getCategoryBadgeClass } from "@/lib/utils";

interface CalendarViewProps {
  onOpenQuickAdd: (tab?: "event") => void;
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

export function CalendarView({ onOpenQuickAdd }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [calendarMode, setCalendarMode] = useState<"month" | "week" | "day">("month");

  // Create event modal state
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // New event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventStartTime, setEventStartTime] = useState("10:00");
  const [eventEndTime, setEventEndTime] = useState("11:00");
  const [eventLocation, setEventLocation] = useState("");
  const [eventCategory, setEventCategory] = useState<TaskCategory>("Work");
  const [eventColor, setEventColor] = useState("#6366f1");

  // Fetch all events and tasks
  const events = useLiveQuery(
    async () => {
      return await db.events.toArray();
    },
    [],
    []
  );

  const tasks = useLiveQuery(
    async () => {
      return await db.tasks.toArray();
    },
    [],
    []
  );

  // Date intervals for Month View
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startDate, end: endDate });

  // Date intervals for Week View
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Selected date activities
  const selectedDateEvents = events.filter((e) => e.date === selectedDate);
  const selectedDateTasks = tasks.filter((t) => t.date === selectedDate);

  // Handlers for month/week navigation
  const prevPeriod = () => {
    if (calendarMode === "month") setCurrentDate(subMonths(currentDate, 1));
    else if (calendarMode === "week") setCurrentDate(subWeeks(currentDate, 1));
  };

  const nextPeriod = () => {
    if (calendarMode === "month") setCurrentDate(addMonths(currentDate, 1));
    else if (calendarMode === "week") setCurrentDate(addWeeks(currentDate, 1));
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(format(now, "yyyy-MM-dd"));
  };

  // Add event
  const handleSaveNewEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;

    await db.events.add({
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      date: selectedDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      location: eventLocation.trim() || undefined,
      category: eventCategory,
      reminder: true,
      recurrence: "none",
      color: eventColor,
      createdAt: new Date().toISOString(),
    });

    setEventTitle("");
    setEventDesc("");
    setIsAddEventOpen(false);
  };

  // Delete event
  const handleDeleteEvent = async (id?: number) => {
    if (!id) return;
    if (window.confirm("Delete this event?")) {
      await db.events.delete(id);
    }
  };

  // Combined timeline items for selected date
  const combinedTimeline = [
    ...selectedDateEvents.map((e) => ({
      type: "event" as const,
      id: e.id,
      title: e.title,
      description: e.description,
      startTime: e.startTime,
      endTime: e.endTime,
      category: e.category,
      location: e.location,
      color: e.color || "#6366f1",
    })),
    ...selectedDateTasks.map((t) => ({
      type: "task" as const,
      id: t.id,
      title: t.title,
      description: t.description,
      startTime: t.startTime || "09:00",
      endTime: t.dueTime,
      category: t.category,
      completed: t.completed,
      priority: t.priority,
      location: undefined as string | undefined,
      color: "#6366f1",
    })),
  ].sort((a, b) => a.startTime.localeCompare(b.startTime));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-brand-500/10 text-brand-500">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {format(currentDate, "MMMM yyyy")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Smart schedule, events & timeline synchronization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border text-xs font-semibold">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setCalendarMode(mode)}
                className={cn(
                  "px-3 py-1.5 rounded-lg capitalize transition-all",
                  calendarMode === mode
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevPeriod}
              className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 rounded-xl bg-card border border-border hover:bg-muted text-xs font-semibold text-foreground"
            >
              Today
            </button>
            <button
              onClick={nextPeriod}
              className="p-2 rounded-xl bg-card border border-border hover:bg-muted text-foreground"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Event</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Calendar on Left (8 cols) & Date Inspector on Right (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Calendar View Container (8 cols) */}
        <div className="lg:col-span-8 rounded-3xl p-5 bg-card border border-border shadow-sm flex flex-col">
          {/* MONTH MODE */}
          {calendarMode === "month" && (
            <div>
              {/* Day headers */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {monthDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isSelected = selectedDate === dayStr;
                  const isCurrentDay = isToday(day);

                  // Count activities on this day
                  const dayEvents = events.filter((e) => e.date === dayStr);
                  const dayTasks = tasks.filter((t) => t.date === dayStr);
                  const hasActivities = dayEvents.length > 0 || dayTasks.length > 0;

                  return (
                    <button
                      key={dayStr}
                      onClick={() => setSelectedDate(dayStr)}
                      className={cn(
                        "h-20 sm:h-24 p-1.5 rounded-2xl flex flex-col justify-between text-left border transition-all relative overflow-hidden",
                        isSelected
                          ? "bg-brand-500/10 border-brand-500 ring-2 ring-brand-500/30"
                          : isCurrentDay
                          ? "border-brand-500/60 bg-card"
                          : isCurrentMonth
                          ? "border-border/60 bg-muted/20 hover:border-brand-500/40 hover:bg-muted/40"
                          : "border-transparent bg-muted/10 opacity-35"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center",
                            isCurrentDay
                              ? "bg-brand-500 text-white"
                              : isSelected
                              ? "text-brand-500"
                              : "text-foreground"
                          )}
                        >
                          {format(day, "d")}
                        </span>

                        {hasActivities && (
                          <div className="flex gap-1">
                            {dayEvents.length > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            )}
                            {dayTasks.length > 0 && (
                              <span className="w-1.5 h-1.5 rounded-full bg-brand-500" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Mini preview chips on larger screens */}
                      <div className="hidden sm:flex flex-col gap-0.5 overflow-hidden">
                        {dayEvents.slice(0, 1).map((ev) => (
                          <span
                            key={ev.id}
                            className="text-[9px] font-medium truncate px-1 py-0.5 rounded bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border border-cyan-500/20"
                          >
                            {ev.title}
                          </span>
                        ))}
                        {dayTasks.slice(0, 1).map((t) => (
                          <span
                            key={t.id}
                            className={cn(
                              "text-[9px] font-medium truncate px-1 py-0.5 rounded border",
                              t.completed
                                ? "line-through opacity-50 bg-muted text-muted-foreground"
                                : "bg-brand-500/10 text-brand-500 dark:text-brand-400 border-brand-500/20"
                            )}
                          >
                            {t.title}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK MODE */}
          {calendarMode === "week" && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => {
                const dayStr = format(day, "yyyy-MM-dd");
                const isSelected = selectedDate === dayStr;
                const isCurrentDay = isToday(day);
                const dayEvents = events.filter((e) => e.date === dayStr);
                const dayTasks = tasks.filter((t) => t.date === dayStr);

                return (
                  <div
                    key={dayStr}
                    onClick={() => setSelectedDate(dayStr)}
                    className={cn(
                      "p-3 rounded-2xl border min-h-[350px] flex flex-col cursor-pointer transition-all",
                      isSelected
                        ? "bg-brand-500/10 border-brand-500"
                        : isCurrentDay
                        ? "bg-card border-brand-500/50"
                        : "bg-muted/20 border-border/60 hover:bg-muted/40"
                    )}
                  >
                    <div className="text-center pb-2 border-b border-border mb-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                        {format(day, "EEE")}
                      </span>
                      <span
                        className={cn(
                          "text-sm font-extrabold inline-block w-7 h-7 rounded-full leading-7 text-center mt-1",
                          isCurrentDay ? "bg-brand-500 text-white" : "text-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                    </div>

                    <div className="flex-1 space-y-1.5 overflow-y-auto">
                      {dayEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[10px] font-semibold truncate"
                          title={ev.title}
                        >
                          📅 {ev.title}
                        </div>
                      ))}
                      {dayTasks.map((t) => (
                        <div
                          key={t.id}
                          className={cn(
                            "p-1.5 rounded-lg border text-[10px] font-semibold truncate",
                            t.completed
                              ? "line-through opacity-50 bg-muted text-muted-foreground"
                              : "bg-brand-500/10 text-brand-500 dark:text-brand-400 border-brand-500/20"
                          )}
                          title={t.title}
                        >
                          ✓ {t.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* DAY MODE */}
          {calendarMode === "day" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm font-bold text-foreground">
                  Schedule for {formatFriendlyDate(selectedDate)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {combinedTimeline.length} total activities
                </span>
              </div>

              {combinedTimeline.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-10">
                  No activities scheduled for this date.
                </p>
              ) : (
                <div className="space-y-3">
                  {combinedTimeline.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-muted/30 border border-border flex items-start justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={cn(
                              "text-[10px] uppercase font-bold px-2 py-0.5 rounded",
                              item.type === "event"
                                ? "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20"
                                : "bg-brand-500/10 text-brand-500 border border-brand-500/20"
                            )}
                          >
                            {item.type}
                          </span>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            {formatTime(item.startTime)} {item.endTime ? `- ${formatTime(item.endTime)}` : ""}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        )}
                      </div>
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", getCategoryBadgeClass(item.category))}>
                        {item.category}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Date Inspector & Action Hub (4 cols) */}
        <div className="lg:col-span-4 rounded-3xl p-5 bg-card border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-brand-500 tracking-wider">
                  Selected Date
                </span>
                <h3 className="text-base font-bold text-foreground">
                  {formatFriendlyDate(selectedDate)}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedDate}
                </span>
              </div>
              <button
                onClick={() => setIsAddEventOpen(true)}
                className="p-2 rounded-xl bg-brand-500/10 text-brand-500 hover:bg-brand-500/20 transition-colors"
                title="Add event for this date"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Combined Timeline for Selected Date */}
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {combinedTimeline.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-xs">
                  <p>Nothing planned for this date yet.</p>
                  <button
                    onClick={() => setIsAddEventOpen(true)}
                    className="mt-3 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-500 font-semibold"
                  >
                    + Schedule Activity
                  </button>
                </div>
              ) : (
                combinedTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-3 rounded-2xl border transition-all",
                      item.type === "event"
                        ? "bg-cyan-500/5 border-cyan-500/25"
                        : "bg-muted/30 border-border"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            "w-2 h-2 rounded-full",
                            item.type === "event" ? "bg-cyan-500" : "bg-brand-500"
                          )}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {formatTime(item.startTime)}
                          {item.endTime ? ` - ${formatTime(item.endTime)}` : ""}
                        </span>
                      </div>

                      {item.type === "event" && (
                        <button
                          onClick={() => handleDeleteEvent(item.id)}
                          className="text-muted-foreground hover:text-rose-500 p-1"
                          title="Delete Event"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-foreground">
                      {item.title}
                    </h4>

                    {item.type === "event" && item.location && (
                      <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-brand-500" />
                        <span>{item.location}</span>
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border", getCategoryBadgeClass(item.category))}>
                        {item.category}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">
                        {item.type}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsAddEventOpen(false)} />
          <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl z-10 p-5 max-h-[90vh] overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-border mb-4">
              <h3 className="font-bold text-base text-foreground">Add New Event</h3>
              <button
                onClick={() => setIsAddEventOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewEvent} className="space-y-4">
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
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Agenda, notes, or objectives..."
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Start Time
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
                    End Time
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
                  Location / Meeting Link
                </label>
                <input
                  type="text"
                  placeholder="e.g. Google Meet, Zoom, Office"
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

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-xs font-medium hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-md"
                >
                  Schedule Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
