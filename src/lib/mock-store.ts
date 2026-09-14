// In-Memory Dummy Data Store for Zero-DB / Vercel Serverless deployments
// Provides realistic initial state with full interactivity

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockOption {
  id: string;
  menuItemId: string;
  groupName: string;
  optionName: string;
  extraPrice: any;
  isDefault: boolean;
}

export interface MockMenuItem {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  price: any;
  imageUrl: string | null;
  isAvailable: boolean;
  isActive: boolean;
  preparationTime: number;
  sortOrder: number;
  totalOrdered: number;
  createdAt: Date;
  updatedAt: Date;
  category: MockCategory;
  options: MockOption[];
}

export interface MockPickupSlot {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  maxOrders: number;
  currentCount: number;
  rushLevel: "LOW" | "MODERATE" | "BUSY" | "VERY_BUSY";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  passwordHash: string; // Plain/bcrypt comparison
  role: "STUDENT" | "STAFF" | "ADMIN";
  studentProfile?: {
    id: string;
    studentId: string;
    phone: string | null;
  };
  staffProfile?: {
    id: string;
    subrole: "KITCHEN_STAFF" | "CASHIER" | "MANAGER";
  };
}

export interface MockCartItem {
  id: string;
  cartId: string;
  menuItemId: string;
  quantity: number;
  selectedOptions: string[];
  specialNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  menuItem: MockMenuItem;
}

export interface MockCart {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  items: MockCartItem[];
}

export interface MockOrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  itemName: string;
  itemPrice: any;
  quantity: number;
  subtotal: any;
  selectedOptions: string[];
  specialNote: string | null;
  menuItem?: MockMenuItem;
}

export interface MockPayment {
  id: string;
  orderId: string;
  method: "CASH" | "WALLET";
  status: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
  amount: any;
  serviceFee: any;
  total: any;
  paidAt: Date | null;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MockOrder {
  id: string;
  orderNumber: string;
  userId: string;
  pickupSlotId: string | null;
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED";
  pickupCode: string;
  specialNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt: Date | null;
  preparingAt: Date | null;
  readyAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  items: MockOrderItem[];
  payment: MockPayment | null;
  pickupSlot: MockPickupSlot | null;
  user: {
    name: string;
    email: string;
    studentProfile: { id: string; studentId: string; phone: string | null; userId: string; createdAt: Date; updatedAt: Date } | null;
  };
}

export interface MockWalletTransaction {
  id: string;
  walletId: string;
  type: "TOP_UP" | "PAYMENT" | "REFUND";
  amount: number; // in paisa
  balanceAfter: number;
  description: string;
  createdAt: Date;
  orderId: string | null;
}

export interface MockWallet {
  id: string;
  userId: string;
  balance: number; // in paisa (100 paisa = 1 PKR)
  createdAt: Date;
  updatedAt: Date;
  transactions: MockWalletTransaction[];
}

export interface MockNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  orderId: string | null;
  isRead: boolean;
  createdAt: Date;
}

class MockDataStore {
  categories: MockCategory[] = [];
  menuItems: MockMenuItem[] = [];
  pickupSlots: MockPickupSlot[] = [];
  users: MockUser[] = [];
  wallets: Map<string, MockWallet> = new Map();
  carts: Map<string, MockCart> = new Map();
  orders: MockOrder[] = [];
  notifications: MockNotification[] = [];
  settings: Record<string, string> = {};

  constructor() {
    this.seed();
  }

  seed() {
    // 1. Settings
    this.settings = {
      cafeteriaName: "KU Main Cafeteria",
      openingTime: "08:00",
      closingTime: "18:00",
      openTime: "08:00",
      closeTime: "18:00",
      serviceFee: "0",
      slotDuration: "10",
      maxOrdersPerSlot: "20",
      avgPrepTime: "12",
      minPreparationTime: "12",
      cashEnabled: "true",
      walletEnabled: "true",
      rushHourStart: "12:00",
      rushHourEnd: "13:30",
    };

    // 2. Users
    this.users = [
      {
        id: "usr_admin",
        email: "admin@campusbite.pk",
        name: "Admin User",
        passwordHash: "Admin@123",
        role: "ADMIN",
      },
      {
        id: "usr_staff",
        email: "staff@campusbite.pk",
        name: "Hassan Ali",
        passwordHash: "Staff@123",
        role: "STAFF",
        staffProfile: { id: "stf_1", subrole: "CASHIER" },
      },
      {
        id: "usr_student1",
        email: "ahmed@student.ku.edu.pk",
        name: "Ahmed Khan",
        passwordHash: "Student@123",
        role: "STUDENT",
        studentProfile: { id: "sp_1", studentId: "STU-2026-001", phone: "03001234567" },
      },
      {
        id: "usr_student2",
        email: "fatima@student.ku.edu.pk",
        name: "Fatima Zahra",
        passwordHash: "Student@123",
        role: "STUDENT",
        studentProfile: { id: "sp_2", studentId: "STU-2026-002", phone: "03111234567" },
      },
      {
        id: "usr_student3",
        email: "bilal@student.ku.edu.pk",
        name: "Bilal Hussain",
        passwordHash: "Student@123",
        role: "STUDENT",
        studentProfile: { id: "sp_3", studentId: "STU-2026-003", phone: "03211234567" },
      },
    ];

    // 3. Wallets
    this.wallets.set("usr_student1", {
      id: "w_1",
      userId: "usr_student1",
      balance: 250000, // Rs. 2,500
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [
        {
          id: "tx_1",
          walletId: "w_1",
          type: "TOP_UP",
          amount: 250000,
          balanceAfter: 250000,
          description: "Initial wallet top-up by admin",
          orderId: null,
          createdAt: new Date(),
        },
      ],
    });

    this.wallets.set("usr_student2", {
      id: "w_2",
      userId: "usr_student2",
      balance: 150000, // Rs. 1,500
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [
        {
          id: "tx_2",
          walletId: "w_2",
          type: "TOP_UP",
          amount: 150000,
          balanceAfter: 150000,
          description: "Initial wallet top-up by admin",
          orderId: null,
          createdAt: new Date(),
        },
      ],
    });

    this.wallets.set("usr_student3", {
      id: "w_3",
      userId: "usr_student3",
      balance: 50000, // Rs. 500
      createdAt: new Date(),
      updatedAt: new Date(),
      transactions: [
        {
          id: "tx_3",
          walletId: "w_3",
          type: "TOP_UP",
          amount: 50000,
          balanceAfter: 50000,
          description: "Initial wallet top-up by admin",
          orderId: null,
          createdAt: new Date(),
        },
      ],
    });

    // 4. Categories
    this.categories = [
      { id: "cat_1", name: "Desi Food", slug: "desi", emoji: "🍛", sortOrder: 1, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_2", name: "Burgers", slug: "burgers", emoji: "🍔", sortOrder: 2, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_3", name: "Sandwiches", slug: "sandwiches", emoji: "🥪", sortOrder: 3, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_4", name: "Rolls & Wraps", slug: "rolls", emoji: "🌯", sortOrder: 4, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_5", name: "Snacks", slug: "snacks", emoji: "🍟", sortOrder: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_6", name: "Drinks", slug: "drinks", emoji: "🥤", sortOrder: 6, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_7", name: "Tea & Coffee", slug: "tea-coffee", emoji: "☕", sortOrder: 7, isActive: true, createdAt: new Date(), updatedAt: new Date() },
      { id: "cat_8", name: "Desserts", slug: "desserts", emoji: "🍮", sortOrder: 8, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    ];

    // 5. 27 Pakistani Menu Items
    const rawItems = [
      // Desi
      { id: "item_1", catId: "cat_1", name: "Chicken Biryani", desc: "Aromatic basmati rice with tender chicken, spices & fried onions. Karachi style.", price: 250, prep: 5, orders: 342, img: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400", avail: true },
      { id: "item_2", catId: "cat_1", name: "Mutton Karahi", desc: "Slow-cooked mutton in rich spiced tomato gravy. Served with 2 naan.", price: 450, prep: 10, orders: 189, img: "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400", avail: true },
      { id: "item_3", catId: "cat_1", name: "Daal Chawal", desc: "Red lentil curry with cumin tarka over steamed white basmati rice.", price: 150, prep: 5, orders: 278, img: null, avail: true },
      { id: "item_4", catId: "cat_1", name: "Chicken Pulao", desc: "Fragrant rice cooked with spiced chicken pieces in rich mild broth.", price: 200, prep: 5, orders: 215, img: null, avail: true },
      { id: "item_5", catId: "cat_1", name: "Nihari", desc: "Slow-cooked tender beef shank stew with ginger & lime. Served with naan.", price: 350, prep: 8, orders: 142, img: null, avail: false },
      // Burgers
      { id: "item_6", catId: "cat_2", name: "Zinger Burger", desc: "Crispy fried spicy chicken breast fillet with lettuce & mayo in seeded bun.", price: 380, prep: 8, orders: 298, img: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400", avail: true },
      { id: "item_7", catId: "cat_2", name: "Beef Burger", desc: "Juicy grilled beef patty with cheese, caramelized onions & secret sauce.", price: 420, prep: 10, orders: 210, img: "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400", avail: true },
      { id: "item_8", catId: "cat_2", name: "Double Patty Burger", desc: "Two beef patties, double melted cheese, lettuce, tomato & barbecue relish.", price: 550, prep: 12, orders: 134, img: null, avail: true },
      // Sandwiches
      { id: "item_9", catId: "cat_3", name: "Club Sandwich", desc: "Triple-layer toasted sandwich with chicken, egg, cheese, lettuce & tomato.", price: 320, prep: 7, orders: 245, img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400", avail: true },
      { id: "item_10", catId: "cat_3", name: "Chicken Tikka Sandwich", desc: "Spiced grilled chicken tikka chunks with cool mint chutney & crisp onions.", price: 280, prep: 8, orders: 178, img: null, avail: true },
      { id: "item_11", catId: "cat_3", name: "Egg & Cheese Sandwich", desc: "Fresh scrambled eggs with melted cheddar on toasted whole-wheat bread.", price: 180, prep: 5, orders: 156, img: null, avail: true },
      // Rolls
      { id: "item_12", catId: "cat_4", name: "Chicken Roll", desc: "Spicy barbecued chicken rolled in a crisp golden paratha with green chutney.", price: 180, prep: 5, orders: 389, img: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400", avail: true },
      { id: "item_13", catId: "cat_4", name: "Beef Seekh Roll", desc: "Minced beef seekh kebab wrapped in a soft roti with sliced onions & raita.", price: 220, prep: 6, orders: 234, img: null, avail: true },
      { id: "item_14", catId: "cat_4", name: "Veggie Paratha Roll", desc: "Mixed sautéed spiced vegetables in crisp whole-wheat paratha.", price: 130, prep: 5, orders: 89, img: null, avail: true },
      // Snacks
      { id: "item_15", catId: "cat_5", name: "French Fries", desc: "Golden salted fries. Choose classic salt or tangy chaat masala.", price: 180, prep: 7, orders: 421, img: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400", avail: true },
      { id: "item_16", catId: "cat_5", name: "Chicken Nuggets (6 pcs)", desc: "Crispy battered chicken nuggets with garlic dip & tomato ketchup.", price: 250, prep: 8, orders: 198, img: null, avail: true },
      { id: "item_17", catId: "cat_5", name: "Samosa (2 pcs)", desc: "Crispy fried pastry triangles loaded with spiced potato and pea filling.", price: 80, prep: 3, orders: 512, img: null, avail: true },
      { id: "item_18", catId: "cat_5", name: "Spring Rolls (4 pcs)", desc: "Crisp vegetable spring rolls served with sweet Thai chilli dipping sauce.", price: 150, prep: 5, orders: 267, img: null, avail: true },
      // Drinks
      { id: "item_19", catId: "cat_6", name: "Mango Shake", desc: "Thick, chilled milkshake blended with fresh ripe Sindhri mangoes.", price: 180, prep: 4, orders: 341, img: "https://images.unsplash.com/photo-1541658016709-a2f1a1af56cf?w=400", avail: true },
      { id: "item_20", catId: "cat_6", name: "Cold Coffee", desc: "Rich iced coffee whipped with milk, sugar and chocolate drizzle.", price: 200, prep: 4, orders: 289, img: null, avail: true },
      { id: "item_21", catId: "cat_6", name: "Lemon Soda", desc: "Chilled fresh lemon fizz with mint leaves and a touch of black salt.", price: 80, prep: 2, orders: 198, img: null, avail: true },
      { id: "item_22", catId: "cat_6", name: "Mineral Water (500ml)", desc: "Pure chilled spring water bottle.", price: 50, prep: 1, orders: 623, img: null, avail: true },
      // Tea & Coffee
      { id: "item_23", catId: "cat_7", name: "Chai (Doodh Patti)", desc: "Traditional slow-brewed strong cardamom milk tea. The KU student fuel.", price: 80, prep: 4, orders: 892, img: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400", avail: true },
      { id: "item_24", catId: "cat_7", name: "Cappuccino", desc: "Rich double espresso with steamed creamy milk foam and cocoa dusting.", price: 220, prep: 5, orders: 156, img: null, avail: true },
      { id: "item_25", catId: "cat_7", name: "Green Tea", desc: "Refreshing jasmine green tea steeped with fresh lemon slice & honey.", price: 100, prep: 3, orders: 112, img: null, avail: true },
      // Desserts
      { id: "item_26", catId: "cat_8", name: "Gulab Jamun (2 pcs)", desc: "Warm soft milk dumplings soaked in aromatic rose cardamom sugar syrup.", price: 80, prep: 2, orders: 234, img: null, avail: true },
      { id: "item_27", catId: "cat_8", name: "Kheer", desc: "Traditional rice pudding infused with saffron, cardamom and chopped pistachios.", price: 120, prep: 3, orders: 145, img: null, avail: true },
    ];

    this.menuItems = rawItems.map((r, idx) => {
      const cat = this.categories.find((c) => c.id === r.catId)!;
      return {
        id: r.id,
        categoryId: r.catId,
        name: r.name,
        slug: r.name.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-"),
        description: r.desc,
        price: r.price,
        imageUrl: r.img,
        isAvailable: r.avail,
        isActive: true,
        preparationTime: r.prep,
        sortOrder: idx + 1,
        totalOrdered: r.orders,
        createdAt: new Date(),
        updatedAt: new Date(),
        category: cat,
        options:
          r.name === "Zinger Burger"
            ? [
                { id: "opt_1", menuItemId: r.id, groupName: "Size", optionName: "Regular", extraPrice: 0, isDefault: true },
                { id: "opt_2", menuItemId: r.id, groupName: "Size", optionName: "Large", extraPrice: 80, isDefault: false },
                { id: "opt_3", menuItemId: r.id, groupName: "Spice Level", optionName: "Mild", extraPrice: 0, isDefault: true },
                { id: "opt_4", menuItemId: r.id, groupName: "Spice Level", optionName: "Spicy", extraPrice: 0, isDefault: false },
              ]
            : r.name === "Chicken Roll"
            ? [
                { id: "opt_5", menuItemId: r.id, groupName: "Add Extra", optionName: "Extra Chutney", extraPrice: 20, isDefault: false },
                { id: "opt_6", menuItemId: r.id, groupName: "Add Extra", optionName: "Cheese Slice", extraPrice: 40, isDefault: false },
              ]
            : [],
      };
    });

    // 6. Pickup Slots
    const slotTimes = [
      { start: "08:00", end: "08:10" },
      { start: "08:30", end: "08:40" },
      { start: "09:00", end: "09:10" },
      { start: "10:00", end: "10:10" },
      { start: "11:00", end: "11:10" },
      { start: "11:30", end: "11:40" },
      { start: "12:00", end: "12:10" },
      { start: "12:10", end: "12:20" },
      { start: "12:20", end: "12:30" },
      { start: "12:30", end: "12:40" },
      { start: "13:00", end: "13:10" },
      { start: "13:30", end: "13:40" },
      { start: "14:00", end: "14:10" },
      { start: "15:00", end: "15:10" },
      { start: "16:00", end: "16:10" },
      { start: "17:00", end: "17:10" },
    ];

    this.pickupSlots = slotTimes.map((st, i) => ({
      id: `slot_${i + 1}`,
      date: new Date(),
      startTime: st.start,
      endTime: st.end,
      maxOrders: 20,
      currentCount: i === 6 ? 12 : i === 7 ? 18 : 2,
      rushLevel: st.start >= "12:00" && st.start <= "13:30" ? "BUSY" : "LOW",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // 7. Initial Seed Orders (for Ahmed Khan and Live Staff Board)
    const biryani = this.menuItems[0];
    const chai = this.menuItems[22];
    const zinger = this.menuItems[5];

    this.orders = [
      {
        id: "ord_demo_1",
        orderNumber: "CB-2026-1041",
        userId: "usr_student1",
        pickupSlotId: "slot_7",
        status: "PREPARING",
        pickupCode: "4819",
        specialNote: "Please pack with extra tissue napkins",
        createdAt: new Date(Date.now() - 12 * 60000),
        updatedAt: new Date(),
        cancelledAt: null,
        confirmedAt: new Date(Date.now() - 11 * 60000),
        preparingAt: new Date(Date.now() - 10 * 60000),
        readyAt: null,
        completedAt: null,
        items: [
          {
            id: "oi_1",
            orderId: "ord_demo_1",
            menuItemId: biryani.id,
            itemName: biryani.name,
            itemPrice: biryani.price,
            quantity: 1,
            subtotal: biryani.price,
            selectedOptions: [],
            specialNote: null,
            menuItem: biryani,
          },
          {
            id: "oi_2",
            orderId: "ord_demo_1",
            menuItemId: chai.id,
            itemName: chai.name,
            itemPrice: chai.price,
            quantity: 2,
            subtotal: chai.price * 2,
            selectedOptions: [],
            specialNote: null,
            menuItem: chai,
          },
        ],
        payment: {
          id: "pay_1",
          orderId: "ord_demo_1",
          method: "WALLET",
          status: "PAID",
          amount: 410,
          serviceFee: 0,
          total: 410,
          paidAt: new Date(Date.now() - 12 * 60000),
          refundedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        pickupSlot: this.pickupSlots[6],
        user: {
          name: "Ahmed Khan",
          email: "ahmed@student.ku.edu.pk",
          studentProfile: { id: "sp_1", studentId: "STU-2026-001", phone: "03001234567", userId: "usr_student1", createdAt: new Date(), updatedAt: new Date() },
        },
      },
      {
        id: "ord_demo_2",
        orderNumber: "CB-2026-1042",
        userId: "usr_student2",
        pickupSlotId: "slot_8",
        status: "READY",
        pickupCode: "7320",
        specialNote: null,
        createdAt: new Date(Date.now() - 22 * 60000),
        updatedAt: new Date(),
        confirmedAt: new Date(Date.now() - 20 * 60000),
        preparingAt: new Date(Date.now() - 15 * 60000),
        readyAt: new Date(Date.now() - 5 * 60000),
        completedAt: null,
        cancelledAt: null,
        items: [
          {
            id: "oi_3",
            orderId: "ord_demo_2",
            menuItemId: zinger.id,
            itemName: zinger.name,
            itemPrice: zinger.price,
            quantity: 1,
            subtotal: zinger.price,
            selectedOptions: ["Spicy"],
            specialNote: null,
            menuItem: zinger,
          },
        ],
        payment: {
          id: "pay_2",
          orderId: "ord_demo_2",
          method: "WALLET",
          status: "PAID",
          amount: 380,
          serviceFee: 0,
          total: 380,
          paidAt: new Date(Date.now() - 22 * 60000),
          refundedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        pickupSlot: this.pickupSlots[7],
        user: {
          name: "Fatima Zahra",
          email: "fatima@student.ku.edu.pk",
          studentProfile: { id: "sp_2", studentId: "STU-2026-002", phone: "03111234567", userId: "usr_student2", createdAt: new Date(), updatedAt: new Date() },
        },
      },
      {
        id: "ord_demo_3",
        orderNumber: "CB-2026-1039",
        userId: "usr_student1",
        pickupSlotId: "slot_4",
        status: "COMPLETED",
        pickupCode: "1192",
        specialNote: null,
        createdAt: new Date(Date.now() - 120 * 60000),
        updatedAt: new Date(Date.now() - 90 * 60000),
        confirmedAt: new Date(Date.now() - 118 * 60000),
        preparingAt: new Date(Date.now() - 110 * 60000),
        readyAt: new Date(Date.now() - 95 * 60000),
        completedAt: new Date(Date.now() - 90 * 60000),
        cancelledAt: null,
        items: [
          {
            id: "oi_4",
            orderId: "ord_demo_3",
            menuItemId: biryani.id,
            itemName: biryani.name,
            itemPrice: biryani.price,
            quantity: 2,
            subtotal: biryani.price * 2,
            selectedOptions: [],
            specialNote: null,
            menuItem: biryani,
          },
        ],
        payment: {
          id: "pay_3",
          orderId: "ord_demo_3",
          method: "CASH",
          status: "PAID",
          amount: 500,
          serviceFee: 0,
          total: 500,
          paidAt: new Date(Date.now() - 90 * 60000),
          refundedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        pickupSlot: this.pickupSlots[3],
        user: {
          name: "Ahmed Khan",
          email: "ahmed@student.ku.edu.pk",
          studentProfile: { id: "sp_1", studentId: "STU-2026-001", phone: "03001234567", userId: "usr_student1", createdAt: new Date(), updatedAt: new Date() },
        },
      },
    ];

    // 8. Notifications
    this.notifications = [
      {
        id: "notif_1",
        userId: "usr_student1",
        title: "Order Preparing! 🍳",
        message: "Your Biryani and Chai order is currently being prepared.",
        type: "info",
        orderId: "ord_demo_1",
        isRead: false,
        createdAt: new Date(Date.now() - 10 * 60000),
      },
      {
        id: "notif_2",
        userId: "usr_student1",
        title: "Welcome to CampusBite! 🎉",
        message: "Your campus pre-order wallet has been credited with Rs. 2,500.",
        type: "success",
        orderId: null,
        isRead: true,
        createdAt: new Date(Date.now() - 360 * 60000),
      },
    ];
  }
}

// Global singleton for Next.js dev server & Vercel serverless function persistence
const globalForMock = globalThis as unknown as { mockStore: MockDataStore | undefined };
export const mockStore = globalForMock.mockStore ?? new MockDataStore();
if (process.env.NODE_ENV !== "production") {
  globalForMock.mockStore = mockStore;
}
