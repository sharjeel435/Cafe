import { PrismaClient, type UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { defaultSettings } from "../src/lib/default-settings";
import { campusClock } from "../src/lib/order-helpers";
const prisma = new PrismaClient();
const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
async function main() {
  console.log("Seeding demo accounts without deleting existing data...");
  const accounts: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    studentId?: string;
    balance?: number;
  }[] = [
    {
      name: "Admin User",
      email: "admin@campusbite.pk",
      password: "Admin@123",
      role: "ADMIN",
    },
    {
      name: "Hassan Ali",
      email: "staff@campusbite.pk",
      password: "Staff@123",
      role: "STAFF",
    },
    {
      name: "Ahmed Khan",
      email: "ahmed@student.ku.edu.pk",
      password: "Student@123",
      role: "STUDENT",
      studentId: "STU-2026-001",
      balance: 250000,
    },
    {
      name: "Fatima Zahra",
      email: "fatima@student.ku.edu.pk",
      password: "Student@123",
      role: "STUDENT",
      studentId: "STU-2026-002",
      balance: 150000,
    },
    {
      name: "Bilal Hussain",
      email: "bilal@student.ku.edu.pk",
      password: "Student@123",
      role: "STUDENT",
      studentId: "STU-2026-003",
      balance: 50000,
    },
  ];
  for (const account of accounts) {
    const password = await bcrypt.hash(account.password, 12);
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.upsert({
        where: { email: account.email },
        update: { password, role: account.role, isActive: true },
        create: {
          name: account.name,
          email: account.email,
          password,
          role: account.role,
        },
      });
      if (account.studentId) {
        await tx.studentProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, studentId: account.studentId },
        });
        await tx.cart.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id },
        });
        const balance = account.balance!;
        await tx.wallet.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            balance,
            transactions: {
              create: {
                type: "TOP_UP",
                amount: balance,
                balanceAfter: balance,
                description: "Initial demo credit",
              },
            },
          },
        });
      }
      if (account.role === "STAFF")
        await tx.staffProfile.upsert({
          where: { userId: user.id },
          update: {},
          create: { userId: user.id, subrole: "CASHIER" },
        });
    });
  }
  const desi = await prisma.menuCategory.upsert({
    where: { slug: "desi" },
    update: {},
    create: { name: "Desi Food", slug: "desi", emoji: "🍛", sortOrder: 1 },
  });
  const burgers = await prisma.menuCategory.upsert({
    where: { slug: "burgers" },
    update: {},
    create: { name: "Burgers", slug: "burgers", emoji: "🍔", sortOrder: 2 },
  });
  const sandwiches = await prisma.menuCategory.upsert({
    where: { slug: "sandwiches" },
    update: {},
    create: {
      name: "Sandwiches",
      slug: "sandwiches",
      emoji: "🥪",
      sortOrder: 3,
    },
  });
  const rolls = await prisma.menuCategory.upsert({
    where: { slug: "rolls" },
    update: {},
    create: { name: "Rolls & Wraps", slug: "rolls", emoji: "🌯", sortOrder: 4 },
  });
  const snacks = await prisma.menuCategory.upsert({
    where: { slug: "snacks" },
    update: {},
    create: { name: "Snacks", slug: "snacks", emoji: "🍟", sortOrder: 5 },
  });
  const drinks = await prisma.menuCategory.upsert({
    where: { slug: "drinks" },
    update: {},
    create: { name: "Drinks", slug: "drinks", emoji: "🥤", sortOrder: 6 },
  });
  const teaCoffee = await prisma.menuCategory.upsert({
    where: { slug: "tea-coffee" },
    update: {},
    create: {
      name: "Tea & Coffee",
      slug: "tea-coffee",
      emoji: "☕",
      sortOrder: 7,
    },
  });
  const desserts = await prisma.menuCategory.upsert({
    where: { slug: "desserts" },
    update: {},
    create: { name: "Desserts", slug: "desserts", emoji: "🍮", sortOrder: 8 },
  });

  console.log("✅ 8 categories created");

  // ── 4. MENU ITEMS (27 items) ──────────────────────────────────────────
  const items = [
    // DESI FOOD
    {
      name: "Chicken Biryani",
      description:
        "Aromatic basmati rice with tender chicken, spices & fried onions.",
      price: 250,
      preparationTime: 5,
      categoryId: desi.id,
      isAvailable: true,
      totalOrdered: 342,
      imageUrl:
        "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400",
    },
    {
      name: "Mutton Karahi",
      description:
        "Slow-cooked mutton in spiced tomato gravy. Served with 2 naan.",
      price: 450,
      preparationTime: 10,
      categoryId: desi.id,
      isAvailable: true,
      totalOrdered: 189,
      imageUrl:
        "https://images.unsplash.com/photo-1574653853027-5382a3d23a15?w=400",
    },
    {
      name: "Daal Chawal",
      description:
        "Red lentil curry over steamed white rice. Simple comfort food.",
      price: 150,
      preparationTime: 5,
      categoryId: desi.id,
      isAvailable: true,
      totalOrdered: 278,
    },
    {
      name: "Chicken Pulao",
      description: "Fragrant rice cooked with chicken in a mild broth.",
      price: 200,
      preparationTime: 5,
      categoryId: desi.id,
      isAvailable: true,
      totalOrdered: 215,
    },
    {
      name: "Nihari",
      description:
        "Slow-cooked beef shank stew with ginger & lime. Served with naan.",
      price: 350,
      preparationTime: 8,
      categoryId: desi.id,
      isAvailable: false,
      totalOrdered: 142,
    },
    // BURGERS
    {
      name: "Zinger Burger",
      description:
        "Crispy fried chicken fillet with spicy mayo, lettuce & pickles.",
      price: 380,
      preparationTime: 8,
      categoryId: burgers.id,
      isAvailable: true,
      totalOrdered: 298,
      imageUrl:
        "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    },
    {
      name: "Beef Burger",
      description:
        "Juicy beef patty with cheese, caramelized onions, mustard & ketchup.",
      price: 420,
      preparationTime: 10,
      categoryId: burgers.id,
      isAvailable: true,
      totalOrdered: 210,
      imageUrl:
        "https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=400",
    },
    {
      name: "Double Patty Burger",
      description:
        "Two beef patties, double cheese, lettuce, tomato, special sauce.",
      price: 550,
      preparationTime: 12,
      categoryId: burgers.id,
      isAvailable: true,
      totalOrdered: 134,
    },
    // SANDWICHES
    {
      name: "Club Sandwich",
      description: "Triple-decker with chicken, egg, cheese, lettuce & tomato.",
      price: 320,
      preparationTime: 7,
      categoryId: sandwiches.id,
      isAvailable: true,
      totalOrdered: 245,
      imageUrl:
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
    },
    {
      name: "Chicken Tikka Sandwich",
      description:
        "Marinated grilled chicken tikka with mint chutney & crispy onions.",
      price: 280,
      preparationTime: 8,
      categoryId: sandwiches.id,
      isAvailable: true,
      totalOrdered: 178,
    },
    {
      name: "Egg & Cheese Sandwich",
      description: "Scrambled eggs with melted cheese on buttered toast.",
      price: 180,
      preparationTime: 5,
      categoryId: sandwiches.id,
      isAvailable: true,
      totalOrdered: 156,
    },
    // ROLLS
    {
      name: "Chicken Roll",
      description:
        "Spicy chicken in a flaky paratha with green chutney & onions.",
      price: 180,
      preparationTime: 5,
      categoryId: rolls.id,
      isAvailable: true,
      totalOrdered: 389,
      imageUrl:
        "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
    },
    {
      name: "Beef Seekh Roll",
      description:
        "Minced beef seekh kebab in rumali roti with onions & raita.",
      price: 220,
      preparationTime: 6,
      categoryId: rolls.id,
      isAvailable: true,
      totalOrdered: 234,
    },
    {
      name: "Veggie Paratha Roll",
      description: "Mixed vegetable filling in a whole-wheat paratha.",
      price: 130,
      preparationTime: 5,
      categoryId: rolls.id,
      isAvailable: true,
      totalOrdered: 89,
    },
    // SNACKS
    {
      name: "French Fries",
      description: "Crispy golden fries. Choose regular or masala.",
      price: 180,
      preparationTime: 7,
      categoryId: snacks.id,
      isAvailable: true,
      totalOrdered: 421,
      imageUrl:
        "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
    },
    {
      name: "Chicken Nuggets (6 pcs)",
      description:
        "Crunchy breaded chicken nuggets. Served with ketchup & mayo.",
      price: 250,
      preparationTime: 8,
      categoryId: snacks.id,
      isAvailable: true,
      totalOrdered: 198,
    },
    {
      name: "Samosa (2 pcs)",
      description: "Crispy fried samosas filled with spiced potatoes & peas.",
      price: 80,
      preparationTime: 3,
      categoryId: snacks.id,
      isAvailable: true,
      totalOrdered: 512,
    },
    {
      name: "Spring Rolls (4 pcs)",
      description:
        "Crispy vegetable spring rolls. Served with sweet chilli sauce.",
      price: 150,
      preparationTime: 5,
      categoryId: snacks.id,
      isAvailable: true,
      totalOrdered: 267,
    },
    // DRINKS
    {
      name: "Mango Shake",
      description: "Fresh blended mango milkshake. Thick and chilled.",
      price: 180,
      preparationTime: 4,
      categoryId: drinks.id,
      isAvailable: true,
      totalOrdered: 341,
      imageUrl:
        "https://images.unsplash.com/photo-1541658016709-a2f1a1af56cf?w=400",
    },
    {
      name: "Cold Coffee",
      description: "Iced blended coffee with milk and a touch of vanilla.",
      price: 200,
      preparationTime: 4,
      categoryId: drinks.id,
      isAvailable: true,
      totalOrdered: 289,
    },
    {
      name: "Lemon Soda",
      description: "Refreshing lemon water with a hint of mint.",
      price: 80,
      preparationTime: 2,
      categoryId: drinks.id,
      isAvailable: true,
      totalOrdered: 198,
    },
    {
      name: "Mineral Water (500ml)",
      description: "Chilled bottled water.",
      price: 50,
      preparationTime: 1,
      categoryId: drinks.id,
      isAvailable: true,
      totalOrdered: 623,
    },
    // TEA & COFFEE
    {
      name: "Chai (Doodh Patti)",
      description: "Strong milk tea brewed with loose leaves. The real thing.",
      price: 80,
      preparationTime: 4,
      categoryId: teaCoffee.id,
      isAvailable: true,
      totalOrdered: 892,
      imageUrl:
        "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400",
    },
    {
      name: "Cappuccino",
      description: "Espresso with steamed milk foam. Served hot.",
      price: 220,
      preparationTime: 5,
      categoryId: teaCoffee.id,
      isAvailable: true,
      totalOrdered: 156,
    },
    {
      name: "Green Tea",
      description: "Light green tea with lemon. Good for focus.",
      price: 100,
      preparationTime: 3,
      categoryId: teaCoffee.id,
      isAvailable: true,
      totalOrdered: 112,
    },
    // DESSERTS
    {
      name: "Gulab Jamun (2 pcs)",
      description: "Soft milk-solid balls soaked in rose-flavored sugar syrup.",
      price: 80,
      preparationTime: 2,
      categoryId: desserts.id,
      isAvailable: true,
      totalOrdered: 234,
    },
    {
      name: "Kheer",
      description: "Creamy rice pudding with cardamom, saffron & pistachios.",
      price: 120,
      preparationTime: 3,
      categoryId: desserts.id,
      isAvailable: true,
      totalOrdered: 145,
    },
  ];

  for (const item of items) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name },
    });
    if (existing) continue;
    await prisma.menuItem.upsert({
      where: { slug: slugify(item.name) },
      update: {},
      create: {
        name: item.name,
        slug: slugify(item.name),
        description: item.description,
        price: item.price,
        preparationTime: item.preparationTime,
        categoryId: item.categoryId,
        isAvailable: item.isAvailable,
        totalOrdered: item.totalOrdered,
        imageUrl: item.imageUrl,
      },
    });
  }

  // Add options to specific items
  const zinger = await prisma.menuItem.findFirst({
    where: { name: "Zinger Burger" },
  });
  if (zinger) {
    await seedOptions({
      data: [
        {
          menuItemId: zinger.id,
          groupName: "Size",
          optionName: "Regular",
          extraPrice: 0,
        },
        {
          menuItemId: zinger.id,
          groupName: "Size",
          optionName: "Large",
          extraPrice: 80,
        },
        {
          menuItemId: zinger.id,
          groupName: "Spice Level",
          optionName: "Mild",
          extraPrice: 0,
        },
        {
          menuItemId: zinger.id,
          groupName: "Spice Level",
          optionName: "Spicy",
          extraPrice: 0,
        },
        {
          menuItemId: zinger.id,
          groupName: "Spice Level",
          optionName: "Extra Spicy 🔥",
          extraPrice: 0,
        },
      ],
    });
  }

  const chickenRoll = await prisma.menuItem.findFirst({
    where: { name: "Chicken Roll" },
  });
  if (chickenRoll) {
    await seedOptions({
      data: [
        {
          menuItemId: chickenRoll.id,
          groupName: "Spice Level",
          optionName: "Regular",
          extraPrice: 0,
        },
        {
          menuItemId: chickenRoll.id,
          groupName: "Spice Level",
          optionName: "Extra Spicy 🌶️",
          extraPrice: 0,
        },
        {
          menuItemId: chickenRoll.id,
          groupName: "Add Extra",
          optionName: "Extra Chutney",
          extraPrice: 20,
        },
        {
          menuItemId: chickenRoll.id,
          groupName: "Add Extra",
          optionName: "Cheese Slice",
          extraPrice: 40,
        },
      ],
    });
  }

  const fries = await prisma.menuItem.findFirst({
    where: { name: "French Fries" },
  });
  if (fries) {
    await seedOptions({
      data: [
        {
          menuItemId: fries.id,
          groupName: "Style",
          optionName: "Plain",
          extraPrice: 0,
        },
        {
          menuItemId: fries.id,
          groupName: "Style",
          optionName: "Masala",
          extraPrice: 0,
        },
        {
          menuItemId: fries.id,
          groupName: "Size",
          optionName: "Regular",
          extraPrice: 0,
        },
        {
          menuItemId: fries.id,
          groupName: "Size",
          optionName: "Large",
          extraPrice: 60,
        },
      ],
    });
  }

  console.log(`✅ ${items.length} menu items created with options`);

  // ── 5. SYSTEM SETTINGS ────────────────────────────────────────────────
  await prisma.systemSetting.createMany({
    data: Object.entries(defaultSettings).map(([key, value]) => ({
      key,
      value,
      label: key,
    })),
    skipDuplicates: true,
  });
  await prisma.systemSetting.updateMany({
    where: { key: "cafeteriaName", value: "KU Main Cafeteria" },
    data: { value: "BUKC Main Cafeteria" },
  });
  console.log("✅ System settings created");

  // ── 6. PICKUP SLOTS ───────────────────────────────────────────────────
  const today = campusClock().date;

  const slotTimes = [
    { start: "08:00", end: "08:10" },
    { start: "08:10", end: "08:20" },
    { start: "08:30", end: "08:40" },
    { start: "09:00", end: "09:10" },
    { start: "10:00", end: "10:10" },
    { start: "11:00", end: "11:10" },
    { start: "12:00", end: "12:10" },
    { start: "12:10", end: "12:20" },
    { start: "12:20", end: "12:30" },
    { start: "12:30", end: "12:40" },
    { start: "12:40", end: "12:50" },
    { start: "13:00", end: "13:10" },
    { start: "13:10", end: "13:20" },
    { start: "13:20", end: "13:30" },
    { start: "14:00", end: "14:10" },
    { start: "15:00", end: "15:10" },
    { start: "16:00", end: "16:10" },
    { start: "17:00", end: "17:10" },
  ];

  await prisma.pickupSlot.createMany({
    skipDuplicates: true,
    data: slotTimes.map((t) => ({
      date: today,
      startTime: t.start,
      endTime: t.end,
      maxOrders: 20,
      currentCount: 0,
    })),
  });
  console.log(`✅ ${slotTimes.length} pickup slots created`);

  // ── 7. NOTIFICATIONS ──────────────────────────────────────────────────

  // ── SUMMARY ───────────────────────────────────────────────────────────
  console.log("\n🎉 Database seeded successfully!");
  console.log("─────────────────────────────────────────────────────");
  console.log("👤 Admin:     admin@campusbite.pk       | Admin@123");
  console.log("👨‍🍳 Staff:     staff@campusbite.pk      | Staff@123");
  console.log(
    "🎓 Student 1: ahmed@student.ku.edu.pk   | Student@123  (Wallet: Rs.2500)",
  );
  console.log(
    "🎓 Student 2: fatima@student.ku.edu.pk  | Student@123  (Wallet: Rs.1500)",
  );
  console.log(
    "🎓 Student 3: bilal@student.ku.edu.pk   | Student@123  (Wallet: Rs.500)",
  );
  console.log("─────────────────────────────────────────────────────");
  console.log(
    `📊 ${items.length} menu items  |  8 categories  |  ${slotTimes.length} slots`,
  );
}

async function seedOptions({
  data,
}: {
  data: {
    menuItemId: string;
    groupName: string;
    optionName: string;
    extraPrice: number;
  }[];
}) {
  for (const option of data) {
    const existing = await prisma.menuItemOption.findFirst({
      where: {
        menuItemId: option.menuItemId,
        groupName: option.groupName,
        optionName: option.optionName,
      },
    });
    if (!existing) await prisma.menuItemOption.create({ data: option });
  }
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
