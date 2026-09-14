import { describe, it, expect } from "vitest";
import { Prisma } from "@prisma/client";
import { campusClock, unitPrice } from "../src/lib/order-helpers";
import { serialize } from "../src/lib/serialize";
describe("pricing and transport boundaries", () => {
  const dish = {
    price: new Prisma.Decimal("380.25"),
    options: [
      {
        id: "large",
        groupName: "Size",
        extraPrice: new Prisma.Decimal("80.50"),
      },
      { id: "regular", groupName: "Size", extraPrice: new Prisma.Decimal(0) },
    ],
  };
  it("prices extras exactly in integer paisa", () => {
    expect(unitPrice(dish, ["large"])).toBe(46075);
  });
  it("rejects unknown, duplicate and conflicting options", () => {
    for (const options of [["other"], ["large", "large"], ["large", "regular"]])
      expect(() => unitPrice(dish, options)).toThrow();
  });
  it("transports Decimal values as strings and preserves Dates", () => {
    const date = new Date("2026-09-15T00:00:00Z");
    expect(
      serialize({
        value: new Prisma.Decimal("19.95"),
        nested: [new Prisma.Decimal("0.01")],
        date,
        empty: null,
      }),
    ).toEqual({ value: "19.95", nested: ["0.01"], date, empty: null });
  });
  it("uses Karachi dates and hours regardless of the server timezone", () => {
    const clock = campusClock(new Date("2026-09-14T20:10:00Z"));
    expect(clock.dateKey).toBe("2026-09-15");
    expect(clock.time).toBe("01:10");
    expect(clock.minutes).toBe(70);
    expect(clock.start.toISOString()).toBe("2026-09-14T19:00:00.000Z");
  });
});
