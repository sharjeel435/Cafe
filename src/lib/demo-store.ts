import { demoAccounts } from "./demo-accounts";

export const demoSessionKey = "campusbite-demo-account";
export const demoStateKey = "campusbite-demo-state-v1";
export type DemoAccount = (typeof demoAccounts)[number];
export type DemoItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  available: boolean;
};
export type DemoOrder = {
  id: string;
  email: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: "Pending" | "Preparing" | "Ready" | "Completed" | "Cancelled";
  payment: "Wallet" | "Cash";
  pickup: string;
};
export type DemoState = {
  menu: DemoItem[];
  wallets: Record<string, number>;
  carts: Record<string, Record<string, number>>;
  orders: DemoOrder[];
  nextOrder: number;
  cafeOpen: boolean;
};

export function findDemoAccount(email: string, password: string) {
  return demoAccounts.find(
    (account) =>
      account.email === email.trim().toLowerCase() &&
      account.password === password,
  );
}

export function createDemoState(): DemoState {
  return {
    menu: [
      {
        id: "biryani",
        name: "Chicken Biryani",
        category: "Desi",
        price: 25000,
        image: "/food/biryani.jpg",
        available: true,
      },
      {
        id: "burger",
        name: "Zinger Burger",
        category: "Burgers",
        price: 35000,
        image: "/food/burger.jpg",
        available: true,
      },
      {
        id: "chai",
        name: "Doodh Patti Chai",
        category: "Drinks",
        price: 8000,
        image: "/food/chai.jpg",
        available: true,
      },
      {
        id: "pulao",
        name: "Chicken Pulao",
        category: "Desi",
        price: 22000,
        image: "/food/biryani.jpg",
        available: true,
      },
      {
        id: "cheeseburger",
        name: "Cheese Burger",
        category: "Burgers",
        price: 40000,
        image: "/food/burger.jpg",
        available: true,
      },
      {
        id: "tea",
        name: "Karak Chai",
        category: "Drinks",
        price: 10000,
        image: "/food/chai.jpg",
        available: true,
      },
    ],
    wallets: Object.fromEntries(
      demoAccounts
        .filter((a) => a.role === "STUDENT")
        .map((a) => [a.email, a.balance ?? 0]),
    ),
    carts: {},
    orders: [
      {
        id: "DEMO-1001",
        email: demoAccounts[2].email,
        items: [{ name: "Chicken Biryani", quantity: 1, price: 25000 }],
        total: 25000,
        status: "Preparing",
        payment: "Cash",
        pickup: "1001",
      },
    ],
    nextOrder: 1002,
    cafeOpen: true,
  };
}

export function cartTotal(state: DemoState, email: string) {
  return Object.entries(state.carts[email] ?? {}).reduce(
    (total, [id, quantity]) =>
      total +
      (state.menu.find((item) => item.id === id)?.price ?? 0) * quantity,
    0,
  );
}

export function placeDemoOrder(
  state: DemoState,
  email: string,
  payment: "Wallet" | "Cash",
): DemoState {
  if (!demoAccounts.some((a) => a.email === email && a.role === "STUDENT"))
    throw new Error("Choose a student account to order.");
  if (!state.cafeOpen)
    throw new Error(
      "The demo cafeteria is closed. Admin can reopen it in Settings.",
    );
  const entries = Object.entries(state.carts[email] ?? {});
  if (!entries.length) throw new Error("Your cart is empty.");
  const items = entries.map(([id, quantity]) => {
    const item = state.menu.find((i) => i.id === id);
    if (!item?.available || !Number.isInteger(quantity) || quantity < 1)
      throw new Error("A cart item is unavailable. Please update your cart.");
    return { name: item.name, price: item.price, quantity };
  });
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  if (payment === "Wallet" && (state.wallets[email] ?? 0) < total)
    throw new Error(
      "Not enough demo credit. Choose cash or ask the demo Admin to add credit.",
    );
  return {
    ...state,
    nextOrder: state.nextOrder + 1,
    carts: { ...state.carts, [email]: {} },
    wallets: {
      ...state.wallets,
      [email]: (state.wallets[email] ?? 0) - (payment === "Wallet" ? total : 0),
    },
    orders: [
      {
        id: `DEMO-${state.nextOrder}`,
        email,
        items,
        total,
        payment,
        status: "Pending",
        pickup: String(state.nextOrder).slice(-4),
      },
      ...state.orders,
    ],
  };
}

export function cancelDemoOrder(
  state: DemoState,
  email: string,
  id: string,
): DemoState {
  const order = state.orders.find((o) => o.id === id && o.email === email);
  if (!order || !["Pending", "Preparing"].includes(order.status))
    throw new Error("This order cannot be cancelled.");
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.id === id ? { ...o, status: "Cancelled" } : o,
    ),
    wallets: {
      ...state.wallets,
      [email]:
        (state.wallets[email] ?? 0) +
        (order.payment === "Wallet" ? order.total : 0),
    },
  };
}
