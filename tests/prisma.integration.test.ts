import {
  beforeAll,
  afterAll,
  beforeEach,
  describe,
  it,
  expect,
  vi,
} from "vitest";
import type { UserRole } from "@prisma/client";
const context = vi.hoisted(() => {
  if (process.env.TEST_DATABASE_URL)
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  return { session: null as { user: { id: string; role: UserRole } } | null };
});
vi.mock("@/lib/auth", () => ({ auth: async () => context.session }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
import { prisma } from "@/lib/prisma";
import { authenticateUser } from "@/lib/credentials";
import { campusClock } from "@/lib/order-helpers";
import { addToCart, getCart, updateCartItem } from "@/server/actions/cart";
import {
  createOrder,
  cancelOrder,
  updateOrderStatus,
  verifyPickupCode,
  getOrder,
  getAvailablePickupSlots,
} from "@/server/actions/orders";
import { getMenuItems, toggleItemAvailability } from "@/server/actions/menu";
import { getWallet, adminAddWalletCredit } from "@/server/actions/wallet";
import {
  getNotifications,
  markAllRead,
  getUnreadCount,
} from "@/server/actions/notifications";
import {
  getAnalytics,
  updateSettings,
  getSettings,
} from "@/server/actions/settings";
import { getUserProfile } from "@/server/actions/auth";
const enabled = !!process.env.TEST_DATABASE_URL;
describe.skipIf(!enabled)("Prisma PostgreSQL integration", () => {
  let studentId: string,
    otherId: string,
    adminId: string,
    staffId: string,
    dishId: string,
    optionId: string,
    slotId: string;
  const asStudent = () => {
    context.session = { user: { id: studentId, role: "STUDENT" } };
  };
  const asAdmin = () => {
    context.session = { user: { id: adminId, role: "ADMIN" } };
  };
  const asStaff = () => {
    context.session = { user: { id: staffId, role: "STAFF" } };
  };
  beforeAll(async () => {
    const url = new URL(process.env.TEST_DATABASE_URL!);
    if (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      url.pathname !== "/campusbite_test"
    )
      throw new Error(
        "Integration tests require an isolated local campusbite_test database.",
      );
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-15T07:00:00Z"));
    const accounts = await prisma.user.findMany();
    adminId = accounts.find((user) => user.role === "ADMIN")!.id;
    staffId = accounts.find((user) => user.role === "STAFF")!.id;
    for (const [index, balance] of [1000000, 1000000].entries()) {
      const user = await prisma.user.create({
        data: {
          email: `integration-${crypto.randomUUID()}@student.ku.edu.pk`,
          name: `Integration ${index}`,
          password: "not-a-login",
          wallet: { create: { balance } },
          cart: { create: {} },
        },
      });
      if (index === 0) studentId = user.id;
      else otherId = user.id;
    }
    const dish = await prisma.menuItem.findFirstOrThrow({
      where: { name: "Zinger Burger" },
      include: { options: true },
    });
    dishId = dish.id;
    optionId = dish.options.find((o) => o.optionName === "Large")!.id;
  }, 30000);
  beforeEach(async () => {
    asStudent();
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: { in: [studentId, otherId] } } },
    });
    await prisma.wallet.updateMany({
      where: { userId: { in: [studentId, otherId] } },
      data: { balance: 1000000 },
    });
    await prisma.menuItem.update({
      where: { id: dishId },
      data: { isAvailable: true },
    });
    const slot = await prisma.pickupSlot.upsert({
      where: {
        date_startTime: { date: campusClock().date, startTime: "13:00" },
      },
      update: { currentCount: 0, maxOrders: 20 },
      create: {
        date: campusClock().date,
        startTime: "13:00",
        endTime: "13:10",
        maxOrders: 20,
      },
    });
    slotId = slot.id;
  });
  afterAll(async () => {
    vi.useRealTimers();
    await prisma.$disconnect();
  });
  async function order(method: "CASH" | "WALLET" = "WALLET") {
    expect((await addToCart(dishId, 1, [optionId])).success).toBe(true);
    const result = await createOrder({
      pickupSlotId: slotId,
      paymentMethod: method,
    });
    expect(result.success, JSON.stringify(result)).toBe(true);
    if (!result.success) throw new Error(result.error);
    return result.data.orderId;
  }
  it("authenticates all five seeded accounts with the exact starting balances", async () => {
    for (const account of [
      ["admin@campusbite.pk", "Admin@123", "ADMIN", null],
      ["staff@campusbite.pk", "Staff@123", "STAFF", null],
      ["ahmed@student.ku.edu.pk", "Student@123", "STUDENT", 250000],
      ["fatima@student.ku.edu.pk", "Student@123", "STUDENT", 150000],
      ["bilal@student.ku.edu.pk", "Student@123", "STUDENT", 50000],
    ] as const) {
      const user = await authenticateUser({
        email: account[0],
        password: account[1],
      });
      expect(user?.role).toBe(account[2]);
      if (account[3] !== null)
        expect(
          (
            await prisma.wallet.findUniqueOrThrow({
              where: { userId: user!.id },
            })
          ).balance,
        ).toBe(account[3]);
      expect(
        await authenticateUser({
          email: account[0],
          password: "WrongPassword123",
        }),
      ).toBeNull();
    }
  }, 20000);
  it("returns a real empty menu search without fabricated fallback data", async () => {
    expect(await getMenuItems({ search: "nonexistent-food-xyz" })).toEqual([]);
  });
  it("preserves item variants and charges extras through checkout", async () => {
    await addToCart(dishId, 2, [optionId], "Extra napkins");
    await addToCart(dishId, 1, [], "No napkins");
    const cart = await getCart();
    expect(cart!.items).toHaveLength(2);
    expect(cart!.items[0].unitPricePaisa).toBe(46000);
    const result = await createOrder({
      pickupSlotId: slotId,
      paymentMethod: "WALLET",
    });
    expect(result.success).toBe(true);
    expect((await getWallet())!.balance).toBe(870000);
    expect((await getCart())!.items).toHaveLength(0);
    if (result.success)
      expect((await getOrder(result.data.orderId))!.payment!.total).toBe(
        "1300",
      );
  });
  it("rolls back an unaffordable order, slot reservation and cart clearing", async () => {
    await addToCart(dishId);
    await prisma.wallet.update({
      where: { userId: studentId },
      data: { balance: 0 },
    });
    const result = await createOrder({
      pickupSlotId: slotId,
      paymentMethod: "WALLET",
    });
    expect(result.success).toBe(false);
    expect((await getCart())!.items).toHaveLength(1);
    expect(
      (await prisma.pickupSlot.findUniqueOrThrow({ where: { id: slotId } }))
        .currentCount,
    ).toBe(0);
  });
  it("refunds a cancellation only once, even for concurrent requests", async () => {
    const id = await order();
    const results = await Promise.all([cancelOrder(id), cancelOrder(id)]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect((await getWallet())!.balance).toBe(1000000);
    expect(
      await prisma.walletTransaction.count({
        where: { orderId: id, type: "REFUND" },
      }),
    ).toBe(1);
  });
  it("permits only one checkout of the same cart under concurrency", async () => {
    await addToCart(dishId);
    const results = await Promise.all([
      createOrder({ pickupSlotId: slotId, paymentMethod: "WALLET" }),
      createOrder({ pickupSlotId: slotId, paymentMethod: "WALLET" }),
    ]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect((await getWallet())!.balance).toBe(962000);
  });
  it("rejects full, expired, unavailable, malformed and unauthorized requests", async () => {
    expect((await addToCart(dishId, -2)).success).toBe(false);
    expect((await addToCart(dishId, 1, ["fake-option"])).success).toBe(false);
    await addToCart(dishId);
    await prisma.pickupSlot.update({
      where: { id: slotId },
      data: { currentCount: 20 },
    });
    expect(
      (await createOrder({ pickupSlotId: slotId, paymentMethod: "CASH" }))
        .success,
    ).toBe(false);
    const expired = await prisma.pickupSlot.upsert({
      where: {
        date_startTime: { date: new Date("2025-01-01"), startTime: "13:00" },
      },
      update: {},
      create: {
        date: new Date("2025-01-01"),
        startTime: "13:00",
        endTime: "13:10",
      },
    });
    expect(
      (await createOrder({ pickupSlotId: expired.id, paymentMethod: "CASH" }))
        .success,
    ).toBe(false);
    await prisma.menuItem.update({
      where: { id: dishId },
      data: { isAvailable: false },
    });
    expect((await addToCart(dishId)).success).toBe(false);
    expect((await adminAddWalletCredit(studentId, 100)).success).toBe(false);
    expect((await updateSettings({ serviceFee: "10" })).success).toBe(false);
    context.session = null;
    expect(await getCart()).toBeNull();
    expect((await addToCart(dishId)).success).toBe(false);
  });
  it("blocks cross-student order, cart and profile access", async () => {
    const id = await order("CASH");
    await addToCart(dishId);
    const cart = await getCart();
    context.session = { user: { id: otherId, role: "STUDENT" } };
    expect(await getOrder(id)).toBeNull();
    expect((await cancelOrder(id)).success).toBe(false);
    expect((await updateCartItem(cart!.items[0].id, 3)).success).toBe(false);
    expect(await getUserProfile(studentId)).toBeNull();
  });
  it("fulfills a cash order, verifies pickup, records payment and updates analytics", async () => {
    const id = await order("CASH");
    asStaff();
    expect((await updateOrderStatus(id, "READY")).success).toBe(false);
    for (const status of ["CONFIRMED", "PREPARING", "READY"] as const)
      expect((await updateOrderStatus(id, status)).success).toBe(true);
    const current = await getOrder(id);
    expect((await verifyPickupCode(current!.pickupCode!)).success).toBe(true);
    expect((await updateOrderStatus(id, "COMPLETED")).success).toBe(true);
    expect((await getOrder(id))!.payment!.status).toBe("PAID");
    expect((await verifyPickupCode(current!.pickupCode!)).success).toBe(false);
    expect((await cancelOrder(id)).success).toBe(false);
    asAdmin();
    const analytics = await getAnalytics();
    expect(analytics!.todayCompleted).toBeGreaterThan(0);
    expect(analytics!.todayRevenue).toBeGreaterThanOrEqual(460);
  });
  it("persists top-ups, availability, notifications and settings", async () => {
    asAdmin();
    expect((await adminAddWalletCredit(studentId, Number.NaN)).success).toBe(
      false,
    );
    expect((await adminAddWalletCredit(studentId, 125.5)).success).toBe(true);
    expect((await updateSettings({ serviceFee: "-1" })).success).toBe(false);
    expect(
      (await updateSettings({ cafeteriaName: "BUKC Main Cafeteria" })).success,
    ).toBe(true);
    expect((await getSettings()).cafeteriaName).toBe("BUKC Main Cafeteria");
    expect((await toggleItemAvailability(dishId, false)).success).toBe(true);
    expect(
      (await getMenuItems({ availableOnly: true })).some(
        (item) => item.id === dishId,
      ),
    ).toBe(false);
    asStudent();
    expect((await getWallet())!.balance).toBe(1012550);
    expect((await getNotifications()).length).toBeGreaterThan(0);
    await markAllRead();
    expect(await getUnreadCount()).toBe(0);
    expect(
      (await getAvailablePickupSlots()).every(
        (slot) => slot.startTime >= "12:12",
      ),
    ).toBe(true);
  });
});
