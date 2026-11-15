import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function pluralize(count: number, singular: string, plural = singular + "s") {
  return count + " " + (count === 1 ? singular : plural);
}

export function formatRelativeTime(date: Date | string) {
  const then = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - then.getTime();
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) return minutes + "m ago";
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + "h ago";
  const days = Math.round(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return days + "d ago";
  return then.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function truncate(value: string, length: number) {
  return value.length > length ? value.slice(0, length - 1).trimEnd() + "…" : value;
}


/** Compact duration for review/decision timing, never a performance metric. */
export function formatDuration(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return "—";
  if (hours < 1) return "<1h";
  if (hours < 24) return Math.round(hours) + "h";
  const days = hours / 24;
  return days < 10 ? (Math.round(days * 10) / 10).toString().replace(/\.0$/, "") + "d" : Math.round(days) + "d";
}
