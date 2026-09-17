import { describe, expect, it } from "vitest";
import { filterSampleMenu, sampleMenu } from "../src/lib/sample-menu";

describe("public sample menu", () => {
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
