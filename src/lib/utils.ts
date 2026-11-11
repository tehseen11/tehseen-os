import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isToday, isYesterday, isTomorrow } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string, formatStr: string = "MMM d, yyyy"): string {
  try {
    const date = parseISO(dateString);
    return format(date, formatStr);
  } catch {
    return dateString;
  }
}

export function formatFriendlyDate(dateString: string): string {
  try {
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "EEE, MMM d");
  } catch {
    return dateString;
  }
}

export function formatTime(time24: string, format12h: boolean = true): string {
  if (!time24) return "";
  if (!format12h) return time24;
  
  const [hoursStr, minutes] = time24.split(":");
  let hours = parseInt(hoursStr, 10);
  if (isNaN(hours)) return time24;
  
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  return `${hours}:${minutes || "00"} ${ampm}`;
}

export function getGreeting(name: string = "Tehseen"): { greeting: string; period: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return { greeting: `Good morning, ${name}`, period: "morning" };
  } else if (hour >= 12 && hour < 17) {
    return { greeting: `Good afternoon, ${name}`, period: "afternoon" };
  } else if (hour >= 17 && hour < 22) {
    return { greeting: `Good evening, ${name}`, period: "evening" };
  } else {
    return { greeting: `Good night, ${name}`, period: "night" };
  }
}

export function getCategoryBadgeClass(category: string): string {
  switch (category) {
    case "Work":
      return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
    case "DevOps Learning":
      return "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20";
    case "Technical Learning":
      return "bg-cyan-500/10 text-cyan-500 dark:text-cyan-400 border-cyan-500/20";
    case "Health & Fitness":
      return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
    case "Personal":
      return "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
    case "Family":
      return "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border-zinc-500/20";
  }
}

export function getPriorityBadgeClass(priority: string): string {
  switch (priority) {
    case "urgent":
      return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
    case "high":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
    case "medium":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "low":
    default:
      return "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20";
  }
}
