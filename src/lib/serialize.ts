import { Prisma } from "@prisma/client";
export type Serialized<T> = T extends Prisma.Decimal
  ? string
  : T extends Date
    ? Date
    : T extends readonly (infer U)[]
      ? Serialized<U>[]
      : T extends object
        ? { [K in keyof T]: Serialized<T[K]> }
        : T;
/** Convert database Decimal objects before crossing a React server/client boundary. */
export function serialize<T>(value: T): Serialized<T> {
  if (Prisma.Decimal.isDecimal(value)) return value.toString() as Serialized<T>;
  if (value instanceof Date || value === null || typeof value !== "object")
    return value as Serialized<T>;
  if (Array.isArray(value)) return value.map(serialize) as Serialized<T>;
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [key, serialize(child)]),
  ) as Serialized<T>;
}
