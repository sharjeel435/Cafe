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

// Prices are authored in rupees and converted to the demo ledger's paisa above.
const additionalDishes: [string, string, string, number, string][] = [
  ["beef-biryani", "Beef Biryani", "Desi", 320, "biryani"],
  ["mutton-biryani", "Mutton Biryani", "Desi", 450, "biryani"],
  ["vegetable-biryani", "Vegetable Biryani", "Desi", 180, "biryani"],
  ["egg-biryani", "Egg Biryani", "Desi", 200, "biryani"],
  ["sindhi-biryani", "Sindhi Chicken Biryani", "Desi", 280, "biryani"],
  ["beef-pulao", "Beef Pulao", "Desi", 300, "biryani"],
  ["mutton-pulao", "Mutton Pulao", "Desi", 420, "biryani"],
  ["vegetable-pulao", "Vegetable Pulao", "Desi", 170, "biryani"],
  ["chana-pulao", "Chana Pulao", "Desi", 160, "biryani"],
  ["chicken-fried-rice", "Chicken Fried Rice", "Rice", 280, "biryani"],
  ["egg-fried-rice", "Egg Fried Rice", "Rice", 200, "biryani"],
  ["vegetable-fried-rice", "Vegetable Fried Rice", "Rice", 180, "biryani"],
  ["beef-burger", "Classic Beef Burger", "Burgers", 380, "burger"],
  ["grilled-chicken-burger", "Grilled Chicken Burger", "Burgers", 360, "burger"],
  ["double-zinger", "Double Zinger Burger", "Burgers", 520, "burger"],
  ["spicy-chicken-burger", "Spicy Chicken Burger", "Burgers", 370, "burger"],
  ["bbq-beef-burger", "BBQ Beef Burger", "Burgers", 430, "burger"],
  ["mushroom-burger", "Mushroom Beef Burger", "Burgers", 450, "burger"],
  ["veggie-burger", "Veggie Burger", "Burgers", 250, "burger"],
  ["crispy-fish-burger", "Crispy Fish Burger", "Burgers", 390, "burger"],
  // Pakistani menu variety inspired by Kababjees and Foodpanda listings.
  // These are our demo prices, not restaurant quotes; blank images use a placeholder.
  ["chicken-tikka", "Chicken Tikka", "BBQ", 350, ""],
  ["seekh-kabab", "Beef Seekh Kabab", "BBQ", 320, ""],
  ["reshmi-kabab", "Chicken Reshmi Kabab", "BBQ", 350, ""],
  ["malai-boti", "Chicken Malai Boti", "BBQ", 380, ""],
  ["behari-boti", "Beef Behari Boti", "BBQ", 400, ""],
  ["chapli-kabab", "Peshawari Chapli Kabab", "BBQ", 300, ""],
  ["chicken-karahi", "Chicken Karahi", "Karahi & Handi", 550, ""],
  ["peshawari-karahi", "Mutton Peshawari Karahi", "Karahi & Handi", 750, ""],
  ["white-handi", "Chicken White Handi", "Karahi & Handi", 550, ""],
  ["daal-makhni", "Daal Makhni Handi", "Vegetarian", 250, ""],
  ["nihari", "Beef Nihari", "Desi", 380, ""],
  ["haleem", "Chicken Haleem", "Desi", 280, ""],
  ["sajji", "Balochi Chicken Sajji", "BBQ", 600, ""],
  ["saag", "Sarson Ka Saag", "Vegetarian", 230, ""],
  ["aloo-palak", "Aloo Palak", "Vegetarian", 200, ""],
  ["daal-chawal", "Daal Chawal", "Vegetarian", 180, ""],
  ["halwa-puri", "Halwa Puri Breakfast", "Breakfast", 250, ""],
  ["anda-paratha", "Anda Paratha", "Breakfast", 180, ""],
  ["lahori-channay", "Lahori Channay", "Breakfast", 200, ""],
  ["bun-kabab", "Karachi Bun Kabab", "Street Food", 150, ""],
  ["samosa", "Aloo Samosa (2 pcs)", "Street Food", 100, ""],
  ["pakora", "Mixed Pakora", "Street Food", 150, ""],
  ["chana-chaat", "Chana Chaat", "Street Food", 160, ""],
  ["gol-gappay", "Gol Gappay (6 pcs)", "Street Food", 180, ""],
  ["naan", "Plain Naan", "Breads", 50, ""],
  ["garlic-naan", "Garlic Naan", "Breads", 100, ""],
  ["roti", "Tandoori Roti", "Breads", 30, ""],
  ["gulab-jamun", "Gulab Jamun (2 pcs)", "Desserts", 140, ""],
  ["kheer", "Kheer", "Desserts", 160, ""],
  ["rabri", "Rabri", "Desserts", 220, ""],
  ["lassi", "Sweet Lassi", "Drinks", 180, ""],
  ["limca", "Fresh Lime Soda", "Drinks", 120, ""],
];

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
