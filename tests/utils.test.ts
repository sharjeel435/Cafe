import { describe, it, expect } from "vitest";
import {
  formatPrice,
  paisaToRupees,
  rupeesToPaisa,
  generateOrderNumber,
  generatePickupCode,
  slugify,
} from "@/lib/utils";

describe("Pricing and Currency Utilities", () => {
  it("converts rupees to paisa correctly", () => {
    expect(rupeesToPaisa(250)).toBe(25000);
    expect(rupeesToPaisa(15.5)).toBe(1550);
    expect(rupeesToPaisa(0)).toBe(0);
  });

  it("converts paisa to formatted rupees string", () => {
    expect(paisaToRupees(25000)).toBe("Rs. 250");
    expect(paisaToRupees(250000)).toBe("Rs. 2,500");
    expect(paisaToRupees(0)).toBe("Rs. 0");
  });

  it("formats decimal string price into PKR format", () => {
    expect(formatPrice("380.00")).toBe("Rs. 380");
    expect(formatPrice(1250)).toBe("Rs. 1,250");
  });
});

describe("Identifier Generators", () => {
  it("generates an order number starting with CB- and year format", () => {
    const orderNum = generateOrderNumber();
    expect(orderNum).toMatch(/^CB-\d{4}-\d{4}$/);
  });

  it("generates a 4-digit pickup code", () => {
    const code = generatePickupCode();
    expect(code).toHaveLength(4);
    expect(/^\d{4}$/.test(code)).toBe(true);
    const num = parseInt(code, 10);
    expect(num).toBeGreaterThanOrEqual(1000);
    expect(num).toBeLessThanOrEqual(9999);
  });

  it("slugifies item names cleanly", () => {
    expect(slugify("Chicken Biryani Special")).toBe("chicken-biryani-special");
    expect(slugify("Zinger Burger 🔥 (Large)")).toBe("zinger-burger-large");
  });
});
