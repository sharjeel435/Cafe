import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number as Pakistani Rupees */
export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `Rs. ${num.toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/** Convert paisa (integer) to rupees display */
export function paisaToRupees(paisa: number): string {
  const rupees = paisa / 100;
  return formatPrice(rupees);
}

/** Convert rupees to paisa for storage */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

/** Generate order number like CB-2026-1042 */
export function generateOrderNumber(sequentialId?: number): string {
  const year = new Date().getFullYear();
  const idStr =
    typeof sequentialId === "number"
      ? sequentialId.toString().padStart(4, "0")
      : Math.floor(1000 + Math.random() * 9000).toString();
  return `CB-${year}-${idStr}`;
}

/** Generate 4-digit pickup code */
export function generatePickupCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/** Format date as "Mon, 14 Sep 2026" */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Format time as "1:30 PM" */
export function formatTime(date: Date | string): string {
  return new Date(date).toLocaleTimeString("en-PK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format pickup slot label */
export function formatSlotLabel(start: string, end: string): string {
  return `${start} – ${end}`;
}

/** Get relative time from now */
export function timeAgo(date: Date | string): string {
  const now = new Date();
  const past = new Date(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return formatDate(date);
}

/** Slug generation */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
