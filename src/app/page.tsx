"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickAddModal } from "@/components/layout/QuickAddModal";
import { NotificationDrawer } from "@/components/layout/NotificationDrawer";

import { DashboardView } from "@/components/dashboard/DashboardView";
import { TasksView } from "@/components/tasks/TasksView";
import { CalendarView } from "@/components/calendar/CalendarView";
import { HabitsView } from "@/components/habits/HabitsView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { GoalsView } from "@/components/goals/GoalsView";
import { FocusView } from "@/components/focus/FocusView";
import { JournalView } from "@/components/journal/JournalView";
import { NotesView } from "@/components/notes/NotesView";
import { SettingsView } from "@/components/settings/SettingsView";

import { seedInitialData } from "@/lib/db";
import { initPWA } from "@/lib/pwa";
import { checkDueReminders } from "@/lib/notifications";

export default function Home() {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultTab, setQuickAddDefaultTab] = useState<"task" | "event" | "habit" | "goal" | "note">("task");
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Initialize DB, PWA, and scheduled reminder check
  useEffect(() => {
    seedInitialData(false);
    initPWA((installable) => setCanInstallPwa(installable));

    // Check reminders immediately and periodically every 60s
    checkDueReminders();
    const reminderInterval = setInterval(() => {
      checkDueReminders();
    }, 60000);

    return () => clearInterval(reminderInterval);
  }, []);

  const handleOpenQuickAdd = (tab: "task" | "event" | "habit" | "goal" | "note" = "task") => {
    setQuickAddDefaultTab(tab);
    setIsQuickAddOpen(true);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop / Tablet Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Universal Top Header */}
        <Header
          onOpenQuickAdd={() => handleOpenQuickAdd("task")}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onNavigateToSettings={() => setCurrentTab("settings")}
          canInstallPwa={canInstallPwa}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {currentTab === "dashboard" && (
            <DashboardView
              onNavigate={(tab) => setCurrentTab(tab)}
              onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "task")}
            />
          )}

          {currentTab === "tasks" && (
            <TasksView onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "task")} />
          )}

          {currentTab === "calendar" && (
            <CalendarView onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "event")} />
          )}

          {currentTab === "habits" && (
            <HabitsView onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "habit")} />
          )}

          {currentTab === "reports" && <AnalyticsView />}

          {currentTab === "goals" && (
            <GoalsView onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "goal")} />
          )}

          {currentTab === "focus" && <FocusView />}

          {currentTab === "journal" && <JournalView />}

          {currentTab === "notes" && (
            <NotesView onOpenQuickAdd={(tab) => handleOpenQuickAdd(tab || "note")} />
          )}

          {currentTab === "settings" && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Global Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        defaultTab={quickAddDefaultTab}
      />

      {/* Global Notifications & Reminder Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
}
