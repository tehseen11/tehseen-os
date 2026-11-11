export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskCategory =
  | 'Personal'
  | 'Work'
  | 'DevOps Learning'
  | 'Technical Learning'
  | 'Health & Fitness'
  | 'Family'
  | 'Other';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id?: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime?: string; // HH:mm
  dueTime?: string; // HH:mm
  priority: Priority;
  category: TaskCategory;
  completed: boolean;
  completedAt?: string;
  reminder: boolean;
  recurrence: RecurrenceType;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id?: number;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location?: string;
  category: TaskCategory;
  reminder: boolean;
  recurrence: RecurrenceType;
  color?: string;
  createdAt: string;
}

export type HabitFrequency = 'daily' | 'weekdays' | 'weekends' | 'custom';
export type PreferredTime = 'morning' | 'afternoon' | 'evening' | 'anytime';

export interface Habit {
  id?: number;
  name: string;
  description?: string;
  category: TaskCategory;
  frequency: HabitFrequency;
  targetDaysPerWeek: number;
  targetValue: number;
  unit: string;
  preferredTime: PreferredTime;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface HabitLog {
  id?: number;
  habitId: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: number;
  notes?: string;
  completedAt: string;
}

export type GoalType = 'daily' | 'weekly' | 'monthly' | 'long-term';
export type GoalStatus = 'not-started' | 'in-progress' | 'completed' | 'on-hold';

export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id?: number;
  title: string;
  description?: string;
  type: GoalType;
  targetDate: string; // YYYY-MM-DD
  priority: Priority;
  progress: number; // 0-100
  status: GoalStatus;
  milestones: Milestone[];
  category: TaskCategory;
  createdAt: string;
}

export type FocusSessionType = 'pomodoro' | 'short-break' | 'long-break' | 'custom';

export interface FocusSession {
  id?: number;
  taskId?: number;
  taskTitle?: string;
  type: FocusSessionType;
  durationMinutes: number;
  completedDurationSeconds: number;
  completed: boolean;
  notes?: string;
  startedAt: string;
  endedAt?: string;
}

export type Mood = 'great' | 'good' | 'neutral' | 'tired' | 'tough';

export interface JournalEntry {
  id?: number;
  date: string; // YYYY-MM-DD
  accomplished: string;
  learned: string;
  challenges: string;
  improvement: string;
  thoughts: string;
  tomorrowPriorities: string;
  mood: Mood;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyRealityCheck {
  id?: number;
  date: string; // YYYY-MM-DD
  plannedTasksCount: number;
  completedTasksCount: number;
  missedTasksCount: number;
  missedTasksSummary: string;
  reasonForMissed: string;
  biggestAchievement: string;
  keyLearning: string;
  improvementTomorrow: string;
  productivityScore: number;
  savedAt: string;
}

export interface QuickNote {
  id?: number;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ScoringWeights {
  taskWeight: number; // default 50
  habitWeight: number; // default 25
  focusWeight: number; // default 15
  reflectionWeight: number; // default 10
}

export interface UserSettings {
  id?: number;
  profileName: string;
  avatarUrl?: string;
  timezone: string;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  theme: 'dark' | 'light' | 'system';
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: number;
  scoringWeights: ScoringWeights;
  restDays: number[]; // 0 = Sunday, 6 = Saturday
  categories: TaskCategory[];
}

export type NotificationType = 'task' | 'event' | 'habit' | 'reminder' | 'system';

export interface AppNotification {
  id?: number;
  title: string;
  message: string;
  type: NotificationType;
  relatedId?: number;
  scheduledTime: string; // ISO string
  isRead: boolean;
  isSnoozed?: boolean;
  snoozedUntil?: string; // ISO string
  dismissed: boolean;
  createdAt: string;
}

export interface ProductivityScoreBreakdown {
  totalScore: number;
  taskScore: number;
  taskDetails: { completed: number; total: number; percentage: number; points: number };
  habitScore: number;
  habitDetails: { completed: number; total: number; percentage: number; points: number };
  focusScore: number;
  focusDetails: { minutesSpent: number; targetMinutes: number; points: number };
  reflectionScore: number;
  reflectionDetails: { completed: boolean; points: number };
  isRestDay: boolean;
  summary: string;
}
