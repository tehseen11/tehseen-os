"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  Flame,
  MoreHorizontal,
  BarChart3,
  Target,
  Timer,
  BookOpen,
  StickyNote,
  Settings,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NavTab } from "./Sidebar";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { format } from "date-fns";

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export function BottomNav({ currentTab, onSelectTab }: BottomNavProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const todayStr = format(new Date(), "yyyy-MM-dd");

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

  const primaryTabs = [
    { id: "dashboard" as NavTab, label: "Home", icon: LayoutDashboard },
    {
      id: "tasks" as NavTab,
      label: "Tasks",
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? pendingTasksCount : null,
    },
    { id: "habits" as NavTab, label: "Habits", icon: Flame },
    { id: "calendar" as NavTab, label: "Calendar", icon: Calendar },
  ];

  const moreTabs = [
    { id: "reports" as NavTab, label: "Reports & Analytics", icon: BarChart3, desc: "Performance & trends" },
    { id: "goals" as NavTab, label: "My Goals", icon: Target, desc: "Milestones & targets" },
    { id: "focus" as NavTab, label: "Focus Mode", icon: Timer, desc: "Pomodoro timer" },
    { id: "journal" as NavTab, label: "Daily Journal", icon: BookOpen, desc: "Reflections & reality check" },
    { id: "notes" as NavTab, label: "Quick Notes", icon: StickyNote, desc: "Ideas & cheatsheets" },
    { id: "settings" as NavTab, label: "Settings", icon: Settings, desc: "Backups & preferences" },
  ];

  const isMoreActive = moreTabs.some((t) => t.id === currentTab);

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-lg border-t border-border px-2 py-1.5 flex items-center justify-around safe-area-pb">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setIsMoreOpen(false);
                onSelectTab(tab.id);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative",
                isActive ? "text-brand-500 font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-5 h-5", isActive && "stroke-[2.5]")} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-brand-500 text-[9px] font-bold text-white shadow-sm ring-1 ring-background">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && <div className="w-1 h-1 rounded-full bg-brand-500 mt-0.5" />}
            </button>
          );
        })}

        {/* More Tab */}
        <button
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative",
            isMoreActive ? "text-brand-500 font-semibold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className={cn("w-5 h-5", isMoreActive && "stroke-[2.5]")} />
          <span className="text-[10px] mt-1 tracking-tight">More</span>
          {isMoreActive && <div className="w-1 h-1 rounded-full bg-brand-500 mt-0.5" />}
        </button>
      </nav>

      {/* More Drawer Sheet */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMoreOpen(false)}
          />
          <div className="relative bg-card border-t border-border rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
                  T
                </div>
                <h3 className="font-bold text-base text-foreground">More Sections</h3>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 py-4">
              {moreTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = currentTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onSelectTab(tab.id);
                      setIsMoreOpen(false);
                    }}
                    className={cn(
                      "flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all",
                      isActive
                        ? "bg-brand-500/10 border-brand-500/40 text-brand-500"
                        : "bg-muted/30 border-border hover:bg-muted/60 text-foreground"
                    )}
                  >
                    <div
                      className={cn(
                        "p-2 rounded-xl mb-2.5",
                        isActive ? "bg-brand-500 text-white shadow-sm" : "bg-card text-muted-foreground border border-border"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs text-foreground block">{tab.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{tab.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
