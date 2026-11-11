"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Moon,
  Sun,
  Download,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
} from "lucide-react";
import { getGreeting, cn } from "@/lib/utils";
import { db } from "@/lib/db";
import { useLiveQuery } from "dexie-react-hooks";
import { promptPWAInstall } from "@/lib/pwa";

interface HeaderProps {
  onOpenQuickAdd: () => void;
  onOpenNotifications: () => void;
  onNavigateToSettings: () => void;
  canInstallPwa?: boolean;
}

export function Header({
  onOpenQuickAdd,
  onOpenNotifications,
  onNavigateToSettings,
  canInstallPwa,
}: HeaderProps) {
  const [time, setTime] = useState<Date | null>(null);
  const [isDark, setIsDark] = useState(true);

  // Live query for unread notifications
  const unreadCount = useLiveQuery(
    async () => {
      return await db.notifications.where("isRead").equals(0).count();
    },
    [],
    0
  );

  useEffect(() => {
    setTime(new Date());
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("dark")) {
      root.classList.remove("dark");
      setIsDark(false);
    } else {
      root.classList.add("dark");
      setIsDark(true);
    }
  };

  const { greeting } = getGreeting("Tehseen");

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 sm:px-6 py-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Greeting & Current Date */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <span>{greeting}</span>
              <span className="inline-block animate-pulse">✨</span>
            </h1>
          </div>
          <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5">
            <span className="flex items-center gap-1 font-medium">
              <CalendarIcon className="w-3.5 h-3.5 text-brand-500" />
              {time ? time.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric", year: "numeric" }) : "Loading date..."}
            </span>
            <span className="hidden sm:inline-block">•</span>
            <span className="hidden sm:flex items-center gap-1 font-mono text-xs text-foreground/80">
              <Clock className="w-3.5 h-3.5 text-cyan-500" />
              {time ? time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "00:00:00"}
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* PWA Install Button (if available) */}
          {canInstallPwa && (
            <button
              onClick={() => promptPWAInstall()}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500/10 text-brand-500 dark:text-brand-400 border border-brand-500/20 hover:bg-brand-500/20 transition-all shadow-sm"
              title="Install Tehseen OS as Native App"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* Quick Add Button */}
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-md shadow-brand-500/25 active:scale-95 transition-all"
            title="Quick Add Task, Event, Habit or Note"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Quick Add</span>
          </button>

          {/* Notification Center Trigger */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            title="Notifications and Reminders"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
          </button>

          {/* Profile / Avatar */}
          <button
            onClick={onNavigateToSettings}
            className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-inner ring-2 ring-border hover:ring-brand-500 transition-all ml-1"
            title="Tehseen Profile & Settings"
          >
            T
          </button>
        </div>
      </div>
    </header>
  );
}
