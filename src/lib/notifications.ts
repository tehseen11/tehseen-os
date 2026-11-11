import { db, getSettings } from "./db";
import { AppNotification } from "@/types";

// Web Audio API sound synthesizer
export function playNotificationSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Pleasant two-tone chime (Linear/Apple style)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.frequency.setValueAtTime(440, now); // A4
    osc2.frequency.exponentialRampToValueAtTime(659.25, now + 0.2); // E5

    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);

    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.warn("Audio playback not permitted or supported yet:", e);
  }
}

export function playTimerFinishSound() {
  try {
    if (typeof window === "undefined") return;
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Rich 3-tone victory chime
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + i * 0.12);

      gain.gain.setValueAtTime(0.2, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.5);
    });
  } catch (e) {
    console.warn("Audio playback error:", e);
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error("Error requesting notification permission:", err);
    return "denied";
  }
}

export async function triggerNotification(title: string, options?: NotificationOptions) {
  const settings = await getSettings();

  if (settings.soundEnabled) {
    playNotificationSound();
  }

  if (
    typeof window !== "undefined" &&
    "Notification" in window &&
    Notification.permission === "granted" &&
    settings.notificationsEnabled
  ) {
    try {
      new Notification(title, {
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-192x192.png",
        ...options,
      });
    } catch (e) {
      console.warn("Native notification display failed:", e);
    }
  }

  // Also add to in-app notification center as reliable fallback
  await db.notifications.add({
    title,
    message: options?.body || "",
    type: "reminder",
    scheduledTime: new Date().toISOString(),
    isRead: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
  });
}

// Check scheduled reminders in IndexedDB and notify
export async function checkDueReminders() {
  if (typeof window === "undefined") return;

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}`;

  // 1. Check tasks due today with reminders
  const dueTasks = await db.tasks
    .where("date")
    .equals(todayStr)
    .and((t) => !t.completed && t.reminder && Boolean(t.dueTime || t.startTime))
    .toArray();

  for (const task of dueTasks) {
    const targetTime = task.dueTime || task.startTime;
    if (targetTime && targetTime <= currentTimeStr) {
      // Check if we already notified for this task today
      const alreadyNotified = await db.notifications
        .where("type")
        .equals("task")
        .and((n) => n.relatedId === task.id && n.scheduledTime.startsWith(todayStr))
        .first();

      if (!alreadyNotified) {
        await triggerNotification(`Task Reminder: ${task.title}`, {
          body: `Due at ${targetTime}. Priority: ${task.priority.toUpperCase()}`,
          tag: `task-${task.id}`,
        });

        await db.notifications.add({
          title: `Task Reminder: ${task.title}`,
          message: `Due at ${targetTime} (${task.category})`,
          type: "task",
          relatedId: task.id,
          scheduledTime: new Date().toISOString(),
          isRead: false,
          dismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }

  // 2. Check events starting now/soon
  const dueEvents = await db.events
    .where("date")
    .equals(todayStr)
    .and((e) => e.reminder && Boolean(e.startTime))
    .toArray();

  for (const event of dueEvents) {
    if (event.startTime <= currentTimeStr) {
      const alreadyNotified = await db.notifications
        .where("type")
        .equals("event")
        .and((n) => n.relatedId === event.id && n.scheduledTime.startsWith(todayStr))
        .first();

      if (!alreadyNotified) {
        await triggerNotification(`Event Starting: ${event.title}`, {
          body: `Scheduled for ${event.startTime} - ${event.endTime}${event.location ? ` at ${event.location}` : ""}`,
          tag: `event-${event.id}`,
        });

        await db.notifications.add({
          title: `Event: ${event.title}`,
          message: `${event.startTime} - ${event.endTime}${event.location ? ` (${event.location})` : ""}`,
          type: "event",
          relatedId: event.id,
          scheduledTime: new Date().toISOString(),
          isRead: false,
          dismissed: false,
          createdAt: new Date().toISOString(),
        });
      }
    }
  }
}
