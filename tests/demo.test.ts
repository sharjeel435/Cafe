import { describe, it, expect } from "vitest";
import {
  createDemoState,
  placeDemoOrder,
  cancelDemoOrder,
  findDemoAccount,
} from "@/lib/demo-store";
import { demoAccounts } from "@/lib/demo-accounts";

describe("database-free demo", () => {
  it("accepts exactly the five fixed credentials", () => {
    for (const a of demoAccounts) {
      expect(findDemoAccount(a.email.toUpperCase(), a.password)?.name).toBe(
        a.name,
      );
      expect(findDemoAccount(a.email, "wrong")).toBeUndefined();
    }
    expect(
      findDemoAccount("unknown@example.com", "Student@123"),
    ).toBeUndefined();
  });
  it("charges a wallet, clears the cart, and refunds cancellation only once", () => {
    const email = demoAccounts[2].email;
    const state = createDemoState();
    state.carts[email] = { biryani: 2 };
    const placed = placeDemoOrder(state, email, "Wallet");
    expect(placed.wallets[email]).toBe(200000);
    expect(placed.carts[email]).toEqual({});
    expect(placed.orders[0].total).toBe(50000);
    expect(state.wallets[email]).toBe(250000);
    const cancelled = cancelDemoOrder(placed, email, placed.orders[0].id);
    expect(cancelled.wallets[email]).toBe(250000);
    expect(() =>
      cancelDemoOrder(cancelled, email, placed.orders[0].id),
    ).toThrow();
  });
  it("rejects insufficient credit and unavailable items, allows cash", () => {
    const email = demoAccounts[4].email;
    const state = createDemoState();
    state.carts[email] = { burger: 2 };
    expect(() => placeDemoOrder(state, email, "Wallet")).toThrow("Not enough");
    expect(placeDemoOrder(state, email, "Cash").wallets[email]).toBe(50000);
    state.menu[1].available = false;
    expect(() => placeDemoOrder(state, email, "Cash")).toThrow("unavailable");
  });
  it("rejects empty carts, closed cafeteria and another student's cancellation", () => {
    const state = createDemoState();
    expect(() => placeDemoOrder(state, demoAccounts[2].email, "Cash")).toThrow(
      "empty",
    );
    state.cafeOpen = false;
    expect(() => placeDemoOrder(state, demoAccounts[2].email, "Cash")).toThrow(
      "closed",
    );
    expect(() =>
      cancelDemoOrder(state, demoAccounts[3].email, "DEMO-1001"),
    ).toThrow();
  });
});
