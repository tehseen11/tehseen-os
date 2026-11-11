"use client";

import React, { useState } from "react";
import {
  Bell,
  X,
  Check,
  Clock,
  ClockAlert,
  AlertCircle,
  Volume2,
  Trash2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { AppNotification } from "@/types";
import { requestNotificationPermission, playNotificationSound } from "@/lib/notifications";
import { formatDistanceToNow, parseISO, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );

  const notifications = useLiveQuery(
    async () => {
      return await db.notifications
        .where("dismissed")
        .equals(0)
        .reverse()
        .sortBy("createdAt");
    },
    [],
    []
  );

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionStatus(res);
  };

  const handleMarkAsRead = async (id?: number) => {
    if (!id) return;
    await db.notifications.update(id, { isRead: true });
  };

  const handleDismiss = async (id?: number) => {
    if (!id) return;
    await db.notifications.update(id, { dismissed: true });
  };

  const handleSnooze = async (id?: number, minutes: number = 15) => {
    if (!id) return;
    const snoozedUntil = addMinutes(new Date(), minutes).toISOString();
    await db.notifications.update(id, {
      isSnoozed: true,
      snoozedUntil,
      isRead: true,
    });
  };

  const handleClearAll = async () => {
    const all = await db.notifications.toArray();
    await Promise.all(all.map((n) => n.id && db.notifications.update(n.id, { dismissed: true })));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-md bg-card border-l border-border h-full shadow-2xl flex flex-col z-10 animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-500">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground">Notification Center</h2>
              <p className="text-xs text-muted-foreground">Reminders, alerts & scheduled activities</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-muted text-xs flex items-center gap-1 transition-colors"
                title="Dismiss All"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Permission Banner & Device Limitations Note */}
        <div className="p-4 bg-muted/40 border-b border-border space-y-2">
          {permissionStatus !== "granted" ? (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs">
              <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400 font-semibold mb-1">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Browser Notifications Not Enabled</span>
              </div>
              <p className="text-muted-foreground mb-2">
                Enable native browser alerts so you never miss your scheduled tasks and focus breaks.
              </p>
              <button
                onClick={handleRequestPermission}
                className="w-full py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-sm transition-all"
              >
                Allow System Notifications
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" /> Native notifications active
              </span>
              <button
                onClick={() => playNotificationSound()}
                className="flex items-center gap-1 text-[11px] underline text-muted-foreground hover:text-foreground"
              >
                <Volume2 className="w-3.5 h-3.5" /> Test Sound
              </button>
            </div>
          )}

          {/* Honest OS Limitations Notice */}
          <div className="p-2.5 rounded-xl bg-background/80 border border-border/80 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-brand-500" />
              <span>Mobile Background Execution Note</span>
            </div>
            <span>
              On Android/iOS, mobile OS battery savers may throttle background timer tasks when the browser is suspended. Tehseen OS stores all scheduled reminders in IndexedDB and syncs instantly whenever you open the app.
            </span>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                No pending notifications or overdue reminders at this moment.
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              const isUnread = !n.isRead;
              return (
                <div
                  key={n.id}
                  className={cn(
                    "p-3 rounded-2xl border transition-all relative group",
                    isUnread
                      ? "bg-card border-brand-500/30 shadow-sm"
                      : "bg-muted/30 border-border opacity-85"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" />
                        )}
                        <h4 className="font-semibold text-xs text-foreground">
                          {n.title}
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-muted-foreground/70 mt-2 block font-mono">
                        {n.createdAt
                          ? formatDistanceToNow(parseISO(n.createdAt), { addSuffix: true })
                          : "Recently"}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDismiss(n.id)}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground opacity-60 group-hover:opacity-100 transition-opacity"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions: Mark read & Snooze */}
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-border/50 text-xs">
                    <button
                      onClick={() => handleSnooze(n.id, 15)}
                      className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted hover:bg-muted/80 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      title="Snooze for 15 minutes"
                    >
                      <Clock className="w-3 h-3" /> Snooze 15m
                    </button>
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(n.id)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md bg-brand-500/10 hover:bg-brand-500/20 text-[11px] font-medium text-brand-500 transition-colors"
                      >
                        <Check className="w-3 h-3" /> Mark Read
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
