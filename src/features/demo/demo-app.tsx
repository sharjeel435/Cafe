"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Utensils, ShoppingBag, Wallet, RotateCcw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { demoAccounts } from "@/lib/demo-accounts";
import {
  demoSessionKey,
  demoStateKey,
  createDemoState,
  cartTotal,
  placeDemoOrder,
  cancelDemoOrder,
  type DemoAccount,
  type DemoState,
} from "@/lib/demo-store";

const money = (paisa: number) => `Rs. ${(paisa / 100).toLocaleString("en-PK")}`;
const subscribe = () => () => {};
function currentAccount() {
  try {
    return sessionStorage.getItem(demoSessionKey) ?? "";
  } catch {
    return "";
  }
}
function readState(): DemoState {
  try {
    const saved = sessionStorage.getItem(demoStateKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed.menu) &&
        Array.isArray(parsed.orders) &&
        parsed.wallets &&
        parsed.carts &&
        Number.isInteger(parsed.nextOrder) &&
        typeof parsed.cafeOpen === "boolean"
      )
        return parsed;
    }
  } catch {
    /* Restore sample data when storage is unavailable or corrupt. */
  }
  return createDemoState();
}

export function DemoApp() {
  const email = useSyncExternalStore(subscribe, currentAccount, () => "");
  const account = demoAccounts.find((a) => a.email === email);
  if (!account)
    return (
      <main className="min-h-screen grid place-items-center bg-orange-50 p-6">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Try CampusBite</h1>
          <p>Choose one of five demo accounts to explore the cafeteria.</p>
          <Link
            className="inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white"
            href="/login"
          >
            Choose a demo account
          </Link>
        </div>
      </main>
    );
  return <DemoDashboard key={account.email} account={account} />;
}

function DemoDashboard({ account }: { account: DemoAccount }) {
  const router = useRouter();
  const [state, setState] = useState<DemoState>(readState);
  const [view, setView] = useState("Dashboard");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [payment, setPayment] = useState<"Wallet" | "Cash">("Wallet");
  const [pickupCode, setPickupCode] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const student = account.role === "STUDENT";
  const admin = account.role === "ADMIN";
  const email = account.email;
  const cart = state.carts[email] ?? {};
  const total = cartTotal(state, email);
  const orders = student
    ? state.orders.filter((o) => o.email === email)
    : state.orders;
  const nav = student
    ? ["Dashboard", "Menu", "Cart", "Orders", "Wallet", "Profile"]
    : admin
      ? ["Dashboard", "Menu", "Orders", "Users", "Reports", "Settings"]
      : ["Dashboard", "Orders", "Menu", "Pickup"];

  useEffect(() => {
    try {
      sessionStorage.setItem(demoStateKey, JSON.stringify(state));
    } catch {
      toast.error(
        "Changes will last until you leave this page; browser storage is full or unavailable.",
      );
    }
  }, [state]);

  function changeQuantity(id: string, delta: number) {
    setState((s) => {
      const items = { ...(s.carts[email] ?? {}) };
      const quantity = Math.max(0, Math.min(20, (items[id] ?? 0) + delta));
      if (quantity) items[id] = quantity;
      else delete items[id];
      return { ...s, carts: { ...s.carts, [email]: items } };
    });
  }
  function checkout() {
    try {
      setState(placeDemoOrder(state, email, payment));
      setView("Orders");
      toast.success("Demo order placed. Your pickup code is on the order.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not place order.");
    }
  }
  function switchAccount() {
    sessionStorage.removeItem(demoSessionKey);
    router.push("/login");
  }
  const card = "rounded-2xl border border-gray-100 bg-white p-5 shadow-sm";
  const menu = state.menu.filter(
    (item) =>
      (category === "All" || item.category === category) &&
      item.name.toLowerCase().includes(search.toLowerCase()),
  );
  const earned = state.orders
    .filter((o) => o.status === "Completed")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="bg-orange-100 px-4 py-2 text-center text-sm text-orange-950">
        Interactive demo | Sample data and pretend payments | Changes stay in
        this browser tab.
      </div>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <Link
            href="/demo"
            className="flex items-center gap-2 text-xl font-bold"
          >
            <Utensils className="text-orange-500" />
            Campus<span className="text-orange-500">Bite</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-medium">
              {account.name} | {account.role.toLowerCase()}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResetPending(true)}
            >
              <RotateCcw size={14} />
              Reset demo
            </Button>
            <Button variant="outline" size="sm" onClick={switchAccount}>
              <LogOut size={14} />
              Switch account
            </Button>
          </div>
        </div>
      </header>
      {resetPending && (
        <div
          role="alert"
          className="mx-auto my-4 flex max-w-6xl flex-wrap items-center gap-3 rounded-xl border border-orange-200 bg-white p-4"
        >
          <p>
            Reset all demo carts, wallets, orders, and settings in this tab?
          </p>
          <Button
            size="sm"
            onClick={() => {
              setState(createDemoState());
              setResetPending(false);
              toast.success("Sample data restored.");
            }}
          >
            Reset all sample data
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setResetPending(false)}
          >
            Keep changes
          </Button>
        </div>
      )}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <nav
          aria-label="Demo navigation"
          className="mb-6 flex gap-2 overflow-x-auto pb-2"
        >
          {nav.map((tab) => (
            <button
              key={tab}
              onClick={() => setView(tab)}
              aria-current={view === tab ? "page" : undefined}
              className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold ${view === tab ? "bg-orange-500 text-white" : "bg-white text-gray-600 hover:bg-orange-50"}`}
            >
              {tab}
              {tab === "Cart" && Object.values(cart).length > 0
                ? ` (${Object.values(cart).reduce((a, b) => a + b, 0)})`
                : ""}
            </button>
          ))}
        </nav>
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {view === "Dashboard" ? `Welcome, ${account.name}` : view}
          </h1>
          <p className="mt-2 text-gray-500">
            {student
              ? "Your next campus meal, without the queue."
              : admin
                ? "Explore your cafeteria at a glance."
                : "Keep the kitchen moving and orders ready."}
          </p>
        </div>

        {view === "Dashboard" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className={card}>
                <Wallet className="mb-3 text-orange-500" />
                <p className="text-sm text-gray-500">
                  {student ? "Demo wallet" : "Completed sales"}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {money(student ? (state.wallets[email] ?? 0) : earned)}
                </p>
              </div>
              <div className={card}>
                <ShoppingBag className="mb-3 text-orange-500" />
                <p className="text-sm text-gray-500">Active orders</p>
                <p className="mt-2 text-3xl font-bold">
                  {
                    orders.filter(
                      (o) => !["Completed", "Cancelled"].includes(o.status),
                    ).length
                  }
                </p>
              </div>
              <div className={card}>
                <Utensils className="mb-3 text-orange-500" />
                <p className="text-sm text-gray-500">Cafeteria</p>
                <p className="mt-2 text-3xl font-bold">
                  {state.cafeOpen ? "Open" : "Closed"}
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-orange-500 p-7 text-white">
              <h2 className="text-2xl font-bold">
                {student
                  ? "Good food. More time for you."
                  : "Your demo cafeteria is ready."}
              </h2>
              <p className="my-3 max-w-xl">
                {student
                  ? "Browse campus favourites, add a meal to your cart, and try a wallet or cash checkout."
                  : "Update availability and move sample orders from the kitchen to collection. Switch accounts to see the same changes."}
              </p>
              <Button
                variant="secondary"
                onClick={() => setView(student ? "Menu" : "Orders")}
              >
                {student ? "Browse menu" : "Manage orders"}
              </Button>
            </div>
          </div>
        )}

        {view === "Menu" && (
          <>
            <div className="mb-5 flex flex-wrap gap-3">
              <input
                aria-label="Search menu"
                placeholder="Search your favourite food..."
                className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                aria-label="Food category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border bg-white px-4 py-3"
              >
                {["All", "Desi", "Burgers", "Drinks"].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {menu.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border bg-white"
                >
                  <div className="relative h-40">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <p className="text-xs font-semibold uppercase text-orange-600">
                      {item.category}
                    </p>
                    <h2 className="text-lg font-bold">{item.name}</h2>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold">{money(item.price)}</span>
                      {student ? (
                        <Button
                          size="sm"
                          disabled={!item.available || !state.cafeOpen}
                          onClick={() => {
                            changeQuantity(item.id, 1);
                            toast.success(`${item.name} added to cart`);
                          }}
                        >
                          {item.available ? "Add to cart" : "Sold out"}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant={item.available ? "outline" : "secondary"}
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              menu: s.menu.map((i) =>
                                i.id === item.id
                                  ? { ...i, available: !i.available }
                                  : i,
                              ),
                            }))
                          }
                        >
                          {item.available ? "Mark sold out" : "Make available"}
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {!menu.length && (
              <p className={card}>No food matched your search.</p>
            )}
          </>
        )}

        {view === "Cart" && (
          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-3 md:col-span-2">
              {Object.entries(cart).map(([id, quantity]) => {
                const item = state.menu.find((i) => i.id === id);
                return (
                  item && (
                    <div
                      key={id}
                      className={`${card} flex flex-wrap items-center justify-between gap-3`}
                    >
                      <div>
                        <h2 className="font-bold">{item.name}</h2>
                        <p>{money(item.price * quantity)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Remove one ${item.name}`}
                          onClick={() => changeQuantity(id, -1)}
                        >
                          -
                        </Button>
                        <span>{quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          aria-label={`Add one ${item.name}`}
                          onClick={() => changeQuantity(id, 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )
                );
              })}
              {!Object.keys(cart).length && (
                <p className={card}>
                  Your cart is empty. Browse the Menu to add a meal.
                </p>
              )}
            </div>
            <div className={`${card} space-y-4 self-start`}>
              <h2 className="text-xl font-bold">Checkout</h2>
              <p className="flex justify-between">
                Total <strong>{money(total)}</strong>
              </p>
              <label className="block text-sm">
                Payment method
                <select
                  className="mt-2 w-full rounded-xl border p-3"
                  value={payment}
                  onChange={(e) =>
                    setPayment(e.target.value as "Wallet" | "Cash")
                  }
                >
                  <option>Wallet</option>
                  <option>Cash</option>
                </select>
              </label>
              <p className="text-sm text-gray-500">
                Wallet: {money(state.wallets[email] ?? 0)}. No real money is
                charged.
              </p>
              <Button
                fullWidth
                disabled={!Object.keys(cart).length}
                onClick={checkout}
              >
                Place demo order
              </Button>
            </div>
          </div>
        )}

        {(view === "Orders" || view === "Pickup") && (
          <div className="space-y-4">
            {view === "Pickup" && (
              <input
                aria-label="Pickup code"
                placeholder="Enter a pickup code"
                value={pickupCode}
                onChange={(e) => setPickupCode(e.target.value)}
                className="w-full rounded-xl border bg-white p-3"
              />
            )}
            {orders
              .filter(
                (o) =>
                  view !== "Pickup" ||
                  (o.status === "Ready" && o.pickup.includes(pickupCode)),
              )
              .map((order) => (
                <article className={card} key={order.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-bold">{order.id}</h2>
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-sm font-semibold text-orange-700">
                      {order.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    {demoAccounts.find((a) => a.email === order.email)?.name} |{" "}
                    {order.payment} | Pickup code {order.pickup}
                  </p>
                  <ul className="my-3 text-sm">
                    {order.items.map((item, i) => (
                      <li key={i}>
                        {item.quantity} x {item.name}
                      </li>
                    ))}
                  </ul>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong>{money(order.total)}</strong>
                    {student &&
                      ["Pending", "Preparing"].includes(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            try {
                              setState(cancelDemoOrder(state, email, order.id));
                              toast.success(
                                "Order cancelled. Wallet payment refunded if applicable.",
                              );
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          }}
                        >
                          Cancel order
                        </Button>
                      )}
                    {!student &&
                      !["Completed", "Cancelled"].includes(order.status) && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setState((s) => ({
                              ...s,
                              orders: s.orders.map((o) =>
                                o.id === order.id
                                  ? {
                                      ...o,
                                      status:
                                        o.status === "Pending"
                                          ? "Preparing"
                                          : o.status === "Preparing"
                                            ? "Ready"
                                            : "Completed",
                                    }
                                  : o,
                              ),
                            }))
                          }
                        >
                          {order.status === "Pending"
                            ? "Start preparing"
                            : order.status === "Preparing"
                              ? "Mark ready"
                              : "Complete pickup"}
                        </Button>
                      )}
                  </div>
                </article>
              ))}
            {!orders.filter(
              (o) =>
                view !== "Pickup" ||
                (o.status === "Ready" && o.pickup.includes(pickupCode)),
            ).length && <p className={card}>No orders to show.</p>}
          </div>
        )}

        {view === "Wallet" && (
          <div className={`${card} max-w-xl space-y-4`}>
            <h2 className="text-lg font-bold">Available demo credit</h2>
            <p className="text-4xl font-bold text-orange-600">
              {money(state.wallets[email] ?? 0)}
            </p>
            <p className="text-gray-500">
              Wallet orders deduct this balance. Cancel a pending or preparing
              order to refund it. The Admin demo can add pretend credit from
              Users.
            </p>
            <Button onClick={() => setView("Orders")} variant="outline">
              View orders
            </Button>
          </div>
        )}
        {view === "Profile" && (
          <div className={`${card} max-w-xl space-y-3`}>
            <h2 className="text-xl font-bold">{account.name}</h2>
            <p>{account.email}</p>
            <p>Student ID: {account.studentId}</p>
            <p className="text-sm text-gray-500">
              This is a sample student profile for CampusBite BUKC.
            </p>
          </div>
        )}
        {view === "Users" && (
          <div className="grid gap-4 sm:grid-cols-3">
            {demoAccounts
              .filter((a) => a.role === "STUDENT")
              .map((a) => (
                <article className={`${card} space-y-3`} key={a.email}>
                  <h2 className="font-bold">{a.name}</h2>
                  <p className="break-all text-sm text-gray-500">{a.email}</p>
                  <p className="text-2xl font-bold">
                    {money(state.wallets[a.email] ?? 0)}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setState((s) => ({
                        ...s,
                        wallets: {
                          ...s.wallets,
                          [a.email]: (s.wallets[a.email] ?? 0) + 50000,
                        },
                      }));
                      toast.success("Rs. 500 demo credit added.");
                    }}
                  >
                    Add Rs. 500 demo credit
                  </Button>
                </article>
              ))}
          </div>
        )}
        {view === "Reports" && (
          <div className={`${card} space-y-4`}>
            <h2 className="text-xl font-bold">Sample sales report</h2>
            <p>
              Completed sales: <strong>{money(earned)}</strong>
            </p>
            <p>
              Completed orders:{" "}
              <strong>
                {state.orders.filter((o) => o.status === "Completed").length}
              </strong>
            </p>
            <p>
              Cancelled orders:{" "}
              <strong>
                {state.orders.filter((o) => o.status === "Cancelled").length}
              </strong>
            </p>
            <p className="text-gray-500">
              These totals reflect only the sample orders in this browser tab.
            </p>
          </div>
        )}
        {view === "Settings" && (
          <div className={`${card} max-w-xl space-y-4`}>
            <h2 className="text-xl font-bold">Cafeteria availability</h2>
            <p>Ordering is currently {state.cafeOpen ? "open" : "closed"}.</p>
            <Button
              onClick={() => setState((s) => ({ ...s, cafeOpen: !s.cafeOpen }))}
            >
              {state.cafeOpen ? "Close demo cafeteria" : "Open demo cafeteria"}
            </Button>
            <p className="text-sm text-gray-500">
              This setting applies to sample orders in this tab.
            </p>
          </div>
        )}
  
      </div>
    </div>
  );
}
