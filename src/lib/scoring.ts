import { db, getSettings } from "./db";
import { ProductivityScoreBreakdown } from "@/types";
import { parseISO, getDay } from "date-fns";

export async function calculateProductivityScore(
  dateStr: string
): Promise<ProductivityScoreBreakdown> {
  const settings = await getSettings();
  const dateObj = parseISO(dateStr);
  const dayOfWeek = getDay(dateObj); // 0 = Sunday, 6 = Saturday
  const isRestDay = settings.restDays?.includes(dayOfWeek) ?? false;

  const weights = settings.scoringWeights || {
    taskWeight: 50,
    habitWeight: 25,
    focusWeight: 15,
    reflectionWeight: 10,
  };

  // 1. Tasks
  const tasks = await db.tasks.where("date").equals(dateStr).toArray();
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  let taskPercentage = 0;
  if (totalTasks > 0) {
    taskPercentage = completedTasks / totalTasks;
  } else {
    // If no tasks planned and it's a rest day, give full points; otherwise neutral 100% or 50%
    taskPercentage = isRestDay ? 1 : 0.8;
  }
  const taskPoints = Math.round(taskPercentage * weights.taskWeight);

  // 2. Habits
  const activeHabits = await db.habits.where("status").equals("active").toArray();
  const totalHabits = activeHabits.length;
  const habitLogs = await db.habitLogs
    .where("date")
    .equals(dateStr)
    .and((log) => log.completed)
    .toArray();
  const completedHabits = habitLogs.length;

  let habitPercentage = 0;
  if (totalHabits > 0) {
    habitPercentage = Math.min(1, completedHabits / totalHabits);
  } else {
    habitPercentage = 1;
  }
  const habitPoints = Math.round(habitPercentage * weights.habitWeight);

  // 3. Focus Sessions
  // Target: 50 minutes of deep work (approx 2 Pomodoros)
  const targetFocusMinutes = isRestDay ? 25 : 50;
  const focusSessions = await db.focusSessions
    .filter((s) => s.startedAt.startsWith(dateStr) && s.completed)
    .toArray();
  
  const totalFocusMinutes = focusSessions.reduce(
    (acc, s) => acc + (s.completedDurationSeconds ? Math.floor(s.completedDurationSeconds / 60) : s.durationMinutes),
    0
  );

  const focusRatio = Math.min(1, totalFocusMinutes / targetFocusMinutes);
  const focusPoints = Math.round(focusRatio * weights.focusWeight);

  // 4. Daily Reflection
  const journalEntry = await db.journalEntries.where("date").equals(dateStr).first();
  const realityCheck = await db.realityChecks.where("date").equals(dateStr).first();
  const reflectionCompleted = Boolean(journalEntry || realityCheck);
  const reflectionPoints = reflectionCompleted ? weights.reflectionWeight : 0;

  // Total
  const totalScore = Math.min(100, taskPoints + habitPoints + focusPoints + reflectionPoints);

  let summary = "";
  if (totalScore >= 90) {
    summary = "Outstanding day! You operated in top-tier flow and conquered your objectives.";
  } else if (totalScore >= 75) {
    summary = "Great productive output! Solid discipline and meaningful progress achieved.";
  } else if (totalScore >= 50) {
    summary = "Good effort today. Steady progress made across your key priorities.";
  } else if (isRestDay) {
    summary = "Scheduled Rest & Recovery Day. Good balance is essential for long-term stamina.";
  } else {
    summary = "Room for improvement tomorrow. Keep momentum going by nailing your morning routine.";
  }

  return {
    totalScore,
    taskScore: taskPoints,
    taskDetails: {
      completed: completedTasks,
      total: totalTasks,
      percentage: Math.round(taskPercentage * 100),
      points: taskPoints,
    },
    habitScore: habitPoints,
    habitDetails: {
      completed: completedHabits,
      total: totalHabits,
      percentage: Math.round(habitPercentage * 100),
      points: habitPoints,
    },
    focusScore: focusPoints,
    focusDetails: {
      minutesSpent: totalFocusMinutes,
      targetMinutes: targetFocusMinutes,
      points: focusPoints,
    },
    reflectionScore: reflectionPoints,
    reflectionDetails: {
      completed: reflectionCompleted,
      points: reflectionPoints,
    },
    isRestDay,
    summary,
  };
}
