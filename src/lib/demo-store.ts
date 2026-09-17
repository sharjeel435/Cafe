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
        id: "cheeseburger",
        name: "Cheese Burger",
        category: "Burgers",
        price: 40000,
        image: "/food/burger.jpg",
        available: true,
      },
      ...additionalDishes.map(([id, name, category, rupees, image]) => ({
        id, name, category, price: rupees * 100,
        image: image ? `/food/${image}.jpg` : "", available: true,
      })),
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

// Illustrative demo prices in rupees. Image provenance: public/food/SOURCES.json.
const additionalDishes: [string, string, string, number, string][] = [
  ["chicken-tikka","Chicken Tikka","BBQ",350,"chicken-tikka"],
  ["seekh-kabab","Beef Seekh Kabab","BBQ",320,"seekh-kabab"],
  ["malai-boti","Chicken Malai Boti","BBQ",380,"malai-boti"],
  ["behari-boti","Beef Behari Boti","BBQ",400,"behari-boti"],
  ["chicken-karahi","Chicken Karahi","Karahi & Handi",550,"chicken-karahi"],
  ["white-handi","Paneer Reshmi Handi","Karahi & Handi",550,"white-handi"],
  ["daal-makhni","Daal Makhni Handi","Vegetarian",250,"daal-makhni"],
  ["palak-paneer","Palak Paneer","Vegetarian",280,"palak-paneer"],
  ["mixed-vegetables","Mixed Vegetable Handi","Vegetarian",220,"mixed-vegetables"],
  ["chicken-fried-rice","Chicken Fried Rice","Rice",280,"chicken-fried-rice"],
  ["kabuli-pulao","Beef Kabuli Pulao","Rice",350,"kabuli-pulao"],
  ["chicken-mandi","Chicken Mandi","Rice",550,"chicken-mandi"],
  ["chowmein","Chicken Chowmein","Chinese",320,"chowmein"],
  ["manchurian","Chicken Manchurian with Rice","Chinese",450,"manchurian"],
  ["corn-soup","Chicken Corn Soup","Soups & Sides",180,"corn-soup"],
  ["salad","Fresh Green Salad","Soups & Sides",120,"salad"],
  ["raita","Raita","Soups & Sides",80,"raita"],
  ["club-sandwich","Club Sandwich","Sandwiches",320,"club-sandwich"],
  ["alfredo","Chicken Alfredo Pasta","Pasta",450,"alfredo"],
  ["fish-chips","Fish and Chips","Seafood",450,"fish-chips"],
  ["dynamite-prawns","Dynamite Prawns","Seafood",550,"dynamite-prawns"],
  ["masala-fries","Masala Fries","Snacks",180,"masala-fries"],
  ["wings","Spicy Chicken Wings","Snacks",320,"wings"],
  ["naan","Plain Naan","Breads",50,"naan"],
  ["paratha","Puri Paratha","Breads",80,"paratha"],
  ["kunafa","Kunafa","Desserts",350,"kunafa"],
  ["brownie","Chocolate Brownie","Desserts",220,"brownie"],
  ["mango-shake","Mango Milkshake","Drinks",250,"mango-shake"],
  ["limca","Fresh Lime Soda","Drinks",120,"limca"],
];

export function cartTotal(state: DemoState, email: string) {
  return Object.entries(state.carts[email] ?? {}).reduce(
    (total, [id, quantity]) =>
      total +
      (state.menu.find((item) => item.id === id)?.price ?? 0) * quantity,
    0,
  );
}

/** Refresh catalog content while retaining stock edits and unrelated session data. */
export function refreshDemoCatalog(state: DemoState): DemoState {
  const menu = createDemoState().menu.map((item) => {
    const saved = state.menu.find((previous) => previous.id === item.id);
    return { ...item, available: saved?.available ?? item.available };
  });
  const ids = new Set(menu.map((item) => item.id));
  return {
    ...state,
    menu,
    carts: Object.fromEntries(Object.entries(state.carts).map(([email, cart]) => [
      email, Object.fromEntries(Object.entries(cart).filter(([id]) => ids.has(id))),
    ])),
  };
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
