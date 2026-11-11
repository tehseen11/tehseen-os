"use client";

import React from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Flame,
  BarChart3,
  Target,
  Timer,
  BookOpen,
  StickyNote,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { format } from "date-fns";

export type NavTab =
  | "dashboard"
  | "tasks"
  | "calendar"
  | "habits"
  | "reports"
  | "goals"
  | "focus"
  | "journal"
  | "notes"
  | "settings";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd");

  // Query pending tasks count for today
  const pendingTasksCount = useLiveQuery(
    async () => {
      return await db.tasks
        .where("date")
        .equals(todayStr)
        .and((t) => !t.completed)
        .count();
    },
    [todayStr],
    0
  );

  // Query active habits count
  const activeHabitsCount = useLiveQuery(
    async () => {
      return await db.habits.where("status").equals("active").count();
    },
    [],
    0
  );

  const navItems = [
    {
      id: "dashboard" as NavTab,
      label: "Dashboard",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "tasks" as NavTab,
      label: "My Tasks",
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
      badgeColor: "bg-brand-500 text-white",
    },
    {
      id: "calendar" as NavTab,
      label: "Calendar",
      icon: Calendar,
      badge: null,
    },
    {
      id: "habits" as NavTab,
      label: "Habits",
      icon: Flame,
      badge: activeHabitsCount > 0 ? `${activeHabitsCount}` : null,
      badgeColor: "bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20",
    },
    {
      id: "reports" as NavTab,
      label: "Productivity Reports",
      icon: BarChart3,
      badge: null,
    },
    {
      id: "goals" as NavTab,
      label: "My Goals",
      icon: Target,
      badge: null,
    },
    {
      id: "focus" as NavTab,
      label: "Focus Mode",
      icon: Timer,
      badge: "25m",
      badgeColor: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
    },
    {
      id: "journal" as NavTab,
      label: "Daily Journal",
      icon: BookOpen,
      badge: null,
    },
    {
      id: "notes" as NavTab,
      label: "Quick Notes",
      icon: StickyNote,
      badge: null,
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-border bg-card/60 backdrop-blur-md transition-all duration-300 relative select-none",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-border">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-black tracking-wider text-sm">
              T
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1">
                Tehseen OS
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-brand-500/10 text-brand-500 border border-brand-500/20">
                  Pro
                </span>
              </span>
              <span className="text-[11px] text-muted-foreground truncate">
                Life & Productivity
              </span>
            </div>
          </div>
        )}

        {isCollapsed && (
          <div className="mx-auto w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 font-black text-sm">
            T
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-sm transition-all text-left group relative",
                isActive
                  ? "bg-brand-500/15 text-brand-600 dark:text-brand-400 font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-brand-600 dark:text-brand-400" : "text-muted-foreground group-hover:text-foreground"
                )}
              />

              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0",
                        item.badgeColor || "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}

              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-brand-500 rounded-r-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-3 border-t border-border">
        {!isCollapsed ? (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <div className="truncate">
              <span className="block font-medium text-foreground">Local-First Storage</span>
              <span className="text-[10px]">Private & IndexedDB backed</span>
            </div>
          </div>
        ) : (
          <div className="flex justify-center" title="Local-First Storage Active">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
        )}
      </div>
    </aside>
  );
}
