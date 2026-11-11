"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  User,
  Clock,
  Bell,
  Shield,
  Download,
  Upload,
  RotateCcw,
  Volume2,
  Sliders,
  Check,
  AlertTriangle,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, getSettings, exportAllDataToJson, importDataFromJson, seedInitialData } from "@/lib/db";
import { UserSettings } from "@/types";
import { promptPWAInstall } from "@/lib/pwa";
import { playNotificationSound, requestNotificationPermission } from "@/lib/notifications";

export function SettingsView() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    async function load() {
      const s = await getSettings();
      setSettings(s);
    }
    load();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings || !settings.id) return;

    await db.settings.put(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export JSON Backup
  const handleExportBackup = async () => {
    const jsonStr = await exportAllDataToJson();
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `tehseen-os-backup-${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Import JSON Backup
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        if (window.confirm("Warning: Importing a backup will overwrite your current database. Proceed?")) {
          const res = await importDataFromJson(content);
          setImportStatus(res.message);
          setTimeout(() => setImportStatus(null), 4000);
          window.location.reload();
        }
      }
    };
    reader.readAsText(file);
  };

  // Reload demo sample data
  const handleReloadDemo = async () => {
    if (window.confirm("Reload comprehensive demo tasks, habits, and timeline activities?")) {
      await seedInitialData(true);
      window.location.reload();
    }
  };

  // Wipe database clean
  const handleWipeData = async () => {
    if (window.confirm("CAUTION: This will delete ALL tasks, habits, goals, notes, and journal entries. Are you completely sure?")) {
      await db.tasks.clear();
      await db.events.clear();
      await db.habits.clear();
      await db.habitLogs.clear();
      await db.goals.clear();
      await db.focusSessions.clear();
      await db.journalEntries.clear();
      await db.realityChecks.clear();
      await db.notes.clear();
      await db.notifications.clear();
      window.location.reload();
    }
  };

  if (!settings) return null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-6 h-6 text-brand-500" />
          <span>System Settings & Preferences</span>
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Customize your experience, scoring weights, notification alerts, and data backups
        </p>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {importStatus && (
        <div className="p-3.5 rounded-2xl bg-brand-500/15 border border-brand-500/30 text-brand-600 dark:text-brand-400 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Sparkles className="w-4 h-4" />
          <span>{importStatus}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* 1. Profile & Timezone */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <User className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-sm text-foreground">Personal Profile</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={settings.profileName}
                onChange={(e) => setSettings({ ...settings, profileName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-foreground text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Timezone
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground text-xs"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="UTC">UTC (Universal)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                Time Display Format
              </label>
              <select
                value={settings.timeFormat}
                onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value as "12h" | "24h" })}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-xs"
              >
                <option value="12h">12-Hour (e.g. 09:30 AM)</option>
                <option value="24h">24-Hour (e.g. 09:30, 17:00)</option>
              </select>
            </div>
          </div>
        </div>

        {/* 2. Productivity Scoring Formula Customization */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Sliders className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Productivity Scoring Formula</h3>
              <p className="text-xs text-muted-foreground">Adjust weights for your transparent 100-point score</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Task Weight (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.scoringWeights.taskWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    scoringWeights: { ...settings.scoringWeights, taskWeight: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Habit Weight (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.scoringWeights.habitWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    scoringWeights: { ...settings.scoringWeights, habitWeight: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Focus Weight (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.scoringWeights.focusWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    scoringWeights: { ...settings.scoringWeights, focusWeight: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-bold text-center"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1">
                Reflection (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={settings.scoringWeights.reflectionWeight}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    scoringWeights: { ...settings.scoringWeights, reflectionWeight: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-foreground text-sm font-bold text-center"
              />
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground">
            Current Total:{" "}
            <strong className="text-foreground">
              {settings.scoringWeights.taskWeight +
                settings.scoringWeights.habitWeight +
                settings.scoringWeights.focusWeight +
                settings.scoringWeights.reflectionWeight}
              %
            </strong>{" "}
            (Recommended: 100%)
          </div>
        </div>

        {/* 3. Notifications & Audio */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Bell className="w-5 h-5 text-cyan-500" />
            <h3 className="font-bold text-sm text-foreground">Notifications & Sound Effects</h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-muted/30 border border-border">
              <div>
                <span className="font-semibold text-xs text-foreground block">Enable Notifications</span>
                <span className="text-[11px] text-muted-foreground">Receive browser reminders for timed tasks and events</span>
              </div>
              <input
                type="checkbox"
                checked={settings.notificationsEnabled}
                onChange={(e) => setSettings({ ...settings, notificationsEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-border text-brand-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer p-3 rounded-2xl bg-muted/30 border border-border">
              <div>
                <span className="font-semibold text-xs text-foreground block">Sound Chimes</span>
                <span className="text-[11px] text-muted-foreground">Synthesized audio cues when completing tasks or timers</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => playNotificationSound()}
                  className="px-2.5 py-1 rounded-lg bg-card border border-border text-xs text-muted-foreground hover:text-foreground"
                >
                  Test Sound
                </button>
                <input
                  type="checkbox"
                  checked={settings.soundEnabled}
                  onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-brand-500"
                />
              </div>
            </label>
          </div>
        </div>

        {/* 4. PWA Installation Instructions & Status */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-3">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Smartphone className="w-5 h-5 text-indigo-500" />
            <h3 className="font-bold text-sm text-foreground">Mobile & PWA Installation</h3>
          </div>

          <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
            <p className="text-foreground font-semibold">How to install on Android phone / tablet:</p>
            <ol className="list-decimal list-inside text-muted-foreground space-y-1">
              <li>Open Chrome or your browser on your phone.</li>
              <li>Tap the three dots (⋮) menu in the top right.</li>
              <li>Select <strong>&quot;Add to Home screen&quot;</strong> or <strong>&quot;Install app&quot;</strong>.</li>
              <li>Tehseen OS will appear on your app drawer with standalone offline capabilities!</li>
            </ol>
            <button
              type="button"
              onClick={() => promptPWAInstall()}
              className="mt-2 px-3 py-1.5 rounded-xl bg-brand-500/10 text-brand-500 font-semibold"
            >
              Trigger Install Prompt
            </button>
          </div>
        </div>

        {/* 5. Data Privacy, Backup & Reset */}
        <div className="p-6 rounded-3xl bg-card border border-border shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Shield className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="font-bold text-sm text-foreground">Data Privacy & Local Storage</h3>
              <p className="text-xs text-muted-foreground">100% offline, zero server telemetry, full export freedom</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted/50 hover:bg-muted border border-border text-xs font-semibold text-foreground transition-all"
            >
              <Download className="w-4 h-4 text-brand-500" />
              <span>Export Full JSON Backup</span>
            </button>

            <label className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-muted/50 hover:bg-muted border border-border text-xs font-semibold text-foreground cursor-pointer transition-all">
              <Upload className="w-4 h-4 text-cyan-500" />
              <span>Restore from JSON Backup</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleReloadDemo}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-xs font-semibold text-amber-600 dark:text-amber-400 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Load Comprehensive Demo Workspace</span>
            </button>

            <button
              type="button"
              onClick={handleWipeData}
              className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-all"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Wipe All Local Data (Start Clean)</span>
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 active:scale-95 transition-all"
          >
            Save All Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
