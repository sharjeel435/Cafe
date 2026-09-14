import type { Prisma } from "@prisma/client";
export class OrderError extends Error {}
export function optionIds(value: Prisma.JsonValue): string[] {
  if (
    !Array.isArray(value) ||
    value.some((v) => typeof v !== "string") ||
    new Set(value).size !== value.length
  )
    throw new OrderError("Invalid item options");
  return value as string[];
}
export function unitPrice(
  item: {
    price: { toString(): string };
    options: {
      id: string;
      groupName: string;
      extraPrice: { toString(): string };
    }[];
  },
  selected: Prisma.JsonValue,
): number {
  const ids = optionIds(selected);
  const options = ids.map((id) => {
    const option = item.options.find((o) => o.id === id);
    if (!option)
      throw new OrderError(
        "An item option is no longer available. Please add the item again.",
      );
    return option;
  });
  if (new Set(options.map((o) => o.groupName)).size !== options.length)
    throw new OrderError("Choose one option per group.");
  return (
    Math.round(Number(item.price.toString()) * 100) +
    options.reduce(
      (sum, o) => sum + Math.round(Number(o.extraPrice.toString()) * 100),
      0,
    )
  );
}
export function campusClock(now = new Date()) {
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Karachi",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  const [hours, minutes] = time.split(":").map(Number);
  return {
    date: new Date(`${date}T00:00:00.000Z`),
    dateKey: date,
    time,
    minutes: hours * 60 + minutes,
    start: new Date(`${date}T00:00:00+05:00`),
    end: new Date(new Date(`${date}T00:00:00+05:00`).getTime() + 86400000),
  };
}
export const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};
export const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
export function actionError(error: unknown): { success: false; error: string } {
  if (error instanceof OrderError)
    return { success: false, error: error.message };
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    error.code === "P2034"
  )
    return {
      success: false,
      error: "Another update happened at the same time. Please try again.",
    };
  console.error(
    "Database action failed:",
    error instanceof Error ? error.name : "Unknown error",
  );
  return {
    success: false,
    error: "Unable to save your changes. Please try again.",
  };
}
