import Dexie, { type Table } from "dexie";
import {
  Task,
  CalendarEvent,
  Habit,
  HabitLog,
  Goal,
  FocusSession,
  JournalEntry,
  DailyRealityCheck,
  QuickNote,
  UserSettings,
  AppNotification,
} from "@/types";
import { format, subDays, addDays } from "date-fns";

export class TehseenOSDatabase extends Dexie {
  tasks!: Table<Task, number>;
  events!: Table<CalendarEvent, number>;
  habits!: Table<Habit, number>;
  habitLogs!: Table<HabitLog, number>;
  goals!: Table<Goal, number>;
  focusSessions!: Table<FocusSession, number>;
  journalEntries!: Table<JournalEntry, number>;
  realityChecks!: Table<DailyRealityCheck, number>;
  notes!: Table<QuickNote, number>;
  settings!: Table<UserSettings, number>;
  notifications!: Table<AppNotification, number>;

  constructor() {
    super("TehseenOSDB");
    this.version(1).stores({
      tasks: "++id, date, priority, category, completed, reminder, createdAt",
      events: "++id, date, category, reminder, createdAt",
      habits: "++id, category, status, createdAt",
      habitLogs: "++id, habitId, date, [habitId+date], completed",
      goals: "++id, type, status, priority, category",
      focusSessions: "++id, taskId, startedAt, completed",
      journalEntries: "++id, &date, createdAt",
      realityChecks: "++id, &date, savedAt",
      notes: "++id, category, pinned, updatedAt",
      settings: "++id",
      notifications: "++id, isRead, scheduledTime, dismissed, createdAt",
    });
  }
}

export const db = new TehseenOSDatabase();

export async function getSettings(): Promise<UserSettings> {
  const existing = await db.settings.toCollection().first();
  if (existing) return existing;

  const defaultSettings: UserSettings = {
    profileName: "Tehseen",
    timezone: "Asia/Kolkata",
    timeFormat: "12h",
    dateFormat: "yyyy-MM-dd",
    theme: "dark",
    notificationsEnabled: true,
    soundEnabled: true,
    soundVolume: 0.7,
    scoringWeights: {
      taskWeight: 50,
      habitWeight: 25,
      focusWeight: 15,
      reflectionWeight: 10,
    },
    restDays: [0], // Sunday
    categories: [
      "Personal",
      "Work",
      "DevOps Learning",
      "Technical Learning",
      "Health & Fitness",
      "Family",
      "Other",
    ],
  };

  const id = await db.settings.add(defaultSettings);
  return { ...defaultSettings, id };
}

export async function seedInitialData(force: boolean = false) {
  const taskCount = await db.tasks.count();
  if (taskCount > 0 && !force) {
    return;
  }

  if (force) {
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
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const yesterdayStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Seed Habits
  const habitIds = await db.habits.bulkAdd([
    {
      name: "Wake up at 6:00 AM",
      description: "Consistent morning start for meditation and planning",
      category: "Personal",
      frequency: "daily",
      targetDaysPerWeek: 7,
      targetValue: 1,
      unit: "times",
      preferredTime: "morning",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      name: "DevOps & Cloud Practice",
      description: "Hands-on lab with Kubernetes, Terraform or CI/CD pipelines",
      category: "DevOps Learning",
      frequency: "daily",
      targetDaysPerWeek: 6,
      targetValue: 45,
      unit: "mins",
      preferredTime: "morning",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Read Technical / Leadership Books",
      description: "30 minutes of deep non-fiction reading",
      category: "Technical Learning",
      frequency: "daily",
      targetDaysPerWeek: 7,
      targetValue: 30,
      unit: "mins",
      preferredTime: "evening",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Exercise & Workout",
      description: "Strength training, running or mobility drills",
      category: "Health & Fitness",
      frequency: "weekdays",
      targetDaysPerWeek: 5,
      targetValue: 45,
      unit: "mins",
      preferredTime: "morning",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Drink 3L Water",
      description: "Maintain hydration throughout the workday",
      category: "Health & Fitness",
      frequency: "daily",
      targetDaysPerWeek: 7,
      targetValue: 3000,
      unit: "ml",
      preferredTime: "anytime",
      status: "active",
      createdAt: new Date().toISOString(),
    },
    {
      name: "Night Reflection & Reality Check",
      description: "Review today's wins, missed items, and tomorrow's targets",
      category: "Personal",
      frequency: "daily",
      targetDaysPerWeek: 7,
      targetValue: 1,
      unit: "times",
      preferredTime: "evening",
      status: "active",
      createdAt: new Date().toISOString(),
    },
  ], { allKeys: true });

  // Seed Habit logs for past 14 days for rich heatmap/analytics
  const habitLogsToInsert: HabitLog[] = [];
  const habitsList = await db.habits.toArray();
  for (let i = 14; i >= 0; i--) {
    const dStr = format(subDays(new Date(), i), "yyyy-MM-dd");
    for (const h of habitsList) {
      if (!h.id) continue;
      // Mark ~80% as completed to showcase realistic habit tracking
      const isCompleted = Math.random() > 0.2 || i === 0;
      habitLogsToInsert.push({
        habitId: h.id,
        date: dStr,
        completed: isCompleted,
        value: isCompleted ? h.targetValue : 0,
        completedAt: new Date().toISOString(),
      });
    }
  }
  await db.habitLogs.bulkAdd(habitLogsToInsert);

  // Seed Tasks
  await db.tasks.bulkAdd([
    {
      title: "Plan Daily Priorities & Review Schedule",
      description: "Check critical deliverables, meetings, and learning blocks",
      date: todayStr,
      startTime: "07:30",
      dueTime: "08:00",
      priority: "high",
      category: "Personal",
      completed: true,
      completedAt: new Date().toISOString(),
      reminder: false,
      recurrence: "daily",
      estimatedDuration: 30,
      actualDuration: 25,
      notes: "Daily ritual to set focus",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Kubernetes Cluster Architecture & Helm Deployment",
      description: "Set up multi-node microservices architecture with ArgoCD GitOps",
      date: todayStr,
      startTime: "09:00",
      dueTime: "11:30",
      priority: "urgent",
      category: "DevOps Learning",
      completed: true,
      completedAt: new Date().toISOString(),
      reminder: true,
      recurrence: "none",
      estimatedDuration: 120,
      actualDuration: 110,
      notes: "Configured ingress-nginx and cert-manager",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Complete Core Feature Sprint Review",
      description: "Refactor backend API endpoints and optimize database queries",
      date: todayStr,
      startTime: "13:30",
      dueTime: "15:30",
      priority: "high",
      category: "Work",
      completed: false,
      reminder: true,
      recurrence: "none",
      estimatedDuration: 90,
      actualDuration: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "45-Minute High-Intensity Workout",
      description: "Upper body strength training and core stability",
      date: todayStr,
      startTime: "17:30",
      dueTime: "18:30",
      priority: "medium",
      category: "Health & Fitness",
      completed: false,
      reminder: true,
      recurrence: "daily",
      estimatedDuration: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Daily Journal & Reality Check Review",
      description: "Evaluate daily productivity score and log key lessons learned",
      date: todayStr,
      startTime: "21:30",
      dueTime: "22:00",
      priority: "medium",
      category: "Personal",
      completed: false,
      reminder: true,
      recurrence: "daily",
      estimatedDuration: 20,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Automate Terraform Cloud State Backups",
      description: "Write automated CI workflow to snapshot state to secure S3 bucket",
      date: tomorrowStr,
      startTime: "10:00",
      dueTime: "12:00",
      priority: "high",
      category: "DevOps Learning",
      completed: false,
      reminder: true,
      recurrence: "none",
      estimatedDuration: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Family Dinner & Weekend Activity Planning",
      description: "Spend quality time with family without screen distractions",
      date: tomorrowStr,
      startTime: "19:30",
      dueTime: "21:00",
      priority: "medium",
      category: "Family",
      completed: false,
      reminder: false,
      recurrence: "none",
      estimatedDuration: 90,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Seed Events
  await db.events.bulkAdd([
    {
      title: "DevOps Architecture & Infrastructure Sync",
      description: "Review production clusters, automated CI/CD and monitoring alerts",
      date: todayStr,
      startTime: "11:30",
      endTime: "12:30",
      location: "Google Meet / Virtual Room",
      category: "Work",
      reminder: true,
      recurrence: "weekly",
      color: "#6366f1",
      createdAt: new Date().toISOString(),
    },
    {
      title: "Cloud Native Study Group & Hands-on Lab",
      description: "Deep dive into eBPF, Cilium networking, and Prometheus metrics",
      date: tomorrowStr,
      startTime: "16:00",
      endTime: "17:30",
      location: "Discord Tech Lab",
      category: "Technical Learning",
      reminder: true,
      recurrence: "none",
      color: "#06b6d4",
      createdAt: new Date().toISOString(),
    },
  ]);

  // Seed Goals
  await db.goals.bulkAdd([
    {
      title: "Master Kubernetes & GitOps Production Systems",
      description: "Deploy and manage resilient, self-healing cloud native systems with ArgoCD, Prometheus, and Terraform.",
      type: "monthly",
      targetDate: format(addDays(new Date(), 30), "yyyy-MM-dd"),
      priority: "high",
      progress: 68,
      status: "in-progress",
      category: "DevOps Learning",
      milestones: [
        { id: "m1", title: "Setup 3-node multi-master cluster", completed: true },
        { id: "m2", title: "Automate Helm charts with GitOps", completed: true },
        { id: "m3", title: "Configure Prometheus & Grafana dashboards", completed: true },
        { id: "m4", title: "Conduct Chaos Engineering drills", completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      title: "Read 12 High-Impact Technical & Leadership Books",
      description: "Build deep knowledge in distributed systems, software craft, and personal leadership.",
      type: "long-term",
      targetDate: format(addDays(new Date(), 180), "yyyy-MM-dd"),
      priority: "medium",
      progress: 50,
      status: "in-progress",
      category: "Technical Learning",
      milestones: [
        { id: "b1", title: "Designing Data-Intensive Applications", completed: true },
        { id: "b2", title: "Accelerate (State of DevOps)", completed: true },
        { id: "b3", title: "The Phoenix Project & DevOps Handbook", completed: true },
        { id: "b4", title: "System Design Interview Vol 2", completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      title: "Build Peak Physical Stamina & Consistency",
      description: "Consistent 5-day weekly workouts and optimal sleep routine.",
      type: "monthly",
      targetDate: format(addDays(new Date(), 45), "yyyy-MM-dd"),
      priority: "high",
      progress: 75,
      status: "in-progress",
      category: "Health & Fitness",
      milestones: [
        { id: "f1", title: "Log 20 consecutive workout days", completed: true },
        { id: "f2", title: "Consistent 10k steps daily for 2 weeks", completed: true },
        { id: "f3", title: "Sub-25 min 5K run", completed: false },
      ],
      createdAt: new Date().toISOString(),
    },
  ]);

  // Seed Focus Sessions
  await db.focusSessions.bulkAdd([
    {
      taskTitle: "Kubernetes Cluster Architecture & Helm Deployment",
      type: "pomodoro",
      durationMinutes: 25,
      completedDurationSeconds: 1500,
      completed: true,
      notes: "Intense deep focus on Helm chart templates",
      startedAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    },
    {
      taskTitle: "Kubernetes Cluster Architecture & Helm Deployment",
      type: "pomodoro",
      durationMinutes: 25,
      completedDurationSeconds: 1500,
      completed: true,
      notes: "Deployed ingress controller and verified TLS certs",
      startedAt: new Date(Date.now() - 2.3 * 3600 * 1000).toISOString(),
      endedAt: new Date(Date.now() - 1.8 * 3600 * 1000).toISOString(),
    },
  ]);

  // Seed Journal Entry for yesterday
  await db.journalEntries.add({
    date: yesterdayStr,
    accomplished: "Completed Terraform AWS infrastructure modules and practiced Kubernetes network security policies.",
    learned: "Understood CNI plugin differences between Flannel and Calico, especially BGP peering and NetworkPolicy enforcement.",
    challenges: "Spent extra time debugging a lingering DNS timeout issue inside a pod namespace.",
    improvement: "Start with DNS diagnosis commands (nslookup, dig) immediately instead of guessing overlay routing.",
    thoughts: "Consistency is compounding every single day. Feeling sharp and productive.",
    tomorrowPriorities: "Helm deployment, team sprint sync, and 45-min workout.",
    mood: "great",
    tags: ["DevOps", "Wins", "Productivity"],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
  });

  // Seed Quick Notes
  await db.notes.bulkAdd([
    {
      title: "DevOps Cheatsheet & Key Commands",
      content: "- `kubectl get pods -A -o wide`\n- `kubectl rollout restart deployment <name>`\n- `terraform plan -out=tfplan`\n- `helm upgrade --install <release> <chart> -f values.yaml`",
      category: "DevOps Learning",
      pinned: true,
      color: "#6366f1",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Daily Discipline Principles",
      content: "1. The morning sets the tone: plan before reacting.\n2. Deep work blocks: close slack and notifications for 90 minutes.\n3. Measure reality honestly every evening.",
      category: "Personal",
      pinned: true,
      color: "#10b981",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      title: "Tehseen OS Architecture Notes",
      content: "Local-first IndexedDB storage via Dexie. Offline PWA capability. Clean separation between domain models and UI states. Instant responsiveness.",
      category: "Technical Learning",
      pinned: false,
      color: "#06b6d4",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Seed initial notification
  await db.notifications.add({
    title: "Welcome to Tehseen OS!",
    message: "Your private daily management system is fully active and ready to keep you organized and disciplined.",
    type: "system",
    scheduledTime: new Date().toISOString(),
    isRead: false,
    dismissed: false,
    createdAt: new Date().toISOString(),
  });

  await getSettings();
}

export async function exportAllDataToJson(): Promise<string> {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "1.0.0",
    tasks: await db.tasks.toArray(),
    events: await db.events.toArray(),
    habits: await db.habits.toArray(),
    habitLogs: await db.habitLogs.toArray(),
    goals: await db.goals.toArray(),
    focusSessions: await db.focusSessions.toArray(),
    journalEntries: await db.journalEntries.toArray(),
    realityChecks: await db.realityChecks.toArray(),
    notes: await db.notes.toArray(),
    settings: await db.settings.toArray(),
  };
  return JSON.stringify(data, null, 2);
}

export async function importDataFromJson(jsonStr: string): Promise<{ success: boolean; message: string }> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.tasks && !data.habits && !data.settings) {
      return { success: false, message: "Invalid backup file format: missing core collections." };
    }

    await db.transaction("rw", [
      db.tasks,
      db.events,
      db.habits,
      db.habitLogs,
      db.goals,
      db.focusSessions,
      db.journalEntries,
      db.realityChecks,
      db.notes,
      db.settings,
    ], async () => {
      if (Array.isArray(data.tasks)) {
        await db.tasks.clear();
        await db.tasks.bulkAdd(data.tasks);
      }
      if (Array.isArray(data.events)) {
        await db.events.clear();
        await db.events.bulkAdd(data.events);
      }
      if (Array.isArray(data.habits)) {
        await db.habits.clear();
        await db.habits.bulkAdd(data.habits);
      }
      if (Array.isArray(data.habitLogs)) {
        await db.habitLogs.clear();
        await db.habitLogs.bulkAdd(data.habitLogs);
      }
      if (Array.isArray(data.goals)) {
        await db.goals.clear();
        await db.goals.bulkAdd(data.goals);
      }
      if (Array.isArray(data.focusSessions)) {
        await db.focusSessions.clear();
        await db.focusSessions.bulkAdd(data.focusSessions);
      }
      if (Array.isArray(data.journalEntries)) {
        await db.journalEntries.clear();
        await db.journalEntries.bulkAdd(data.journalEntries);
      }
      if (Array.isArray(data.realityChecks)) {
        await db.realityChecks.clear();
        await db.realityChecks.bulkAdd(data.realityChecks);
      }
      if (Array.isArray(data.notes)) {
        await db.notes.clear();
        await db.notes.bulkAdd(data.notes);
      }
      if (Array.isArray(data.settings) && data.settings.length > 0) {
        await db.settings.clear();
        await db.settings.bulkAdd(data.settings);
      }
    });

    return { success: true, message: "All data successfully restored from backup." };
  } catch (err: any) {
    return { success: false, message: `Error importing data: ${err?.message || err}` };
  }
}
