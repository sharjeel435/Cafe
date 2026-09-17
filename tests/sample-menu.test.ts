import { describe, expect, it } from "vitest";
import { filterSampleMenu, sampleMenu } from "../src/lib/sample-menu";
import { existsSync } from "node:fs";
import { join } from "node:path";

describe("public sample menu", () => {
  it("has unique dishes with local images and a varied catalog", () => {
    expect(new Set(sampleMenu.map((item) => item.name)).size).toBe(sampleMenu.length);
    expect(new Set(sampleMenu.map((item) => item.category.name)).size).toBeGreaterThanOrEqual(10);
    for (const item of sampleMenu) {
      expect(item.imageUrl).toMatch(/^\/food\/.+\.jpg$/);
      expect(existsSync(join(process.cwd(), "public", item.imageUrl!))).toBe(true);
    }
  });
  it("uses rupees and distinct sample IDs rather than live cart IDs", () => {
    expect(sampleMenu.find((item) => item.name === "Chicken Biryani")?.price).toBe("250.00");
    expect(sampleMenu.every((item) => item.id.startsWith("sample-"))).toBe(true);
  });
  it("combines category and trimmed case-insensitive search", () => {
    expect(filterSampleMenu({ category: "burgers", search: " CHEESE ", available: "1" }).map((item) => item.name)).toEqual(["Cheese Burger"]);
    expect(filterSampleMenu({ category: "drinks", search: "biryani" })).toEqual([]);
  });
  it("restores every item when filters are cleared", () => {
    expect(filterSampleMenu({ category: "", search: "", available: "" })).toEqual(sampleMenu);
  });
});
