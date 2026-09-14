"use server";

import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth";

/** Get all active menu items with category */
export async function getMenuItems(params?: {
  categorySlug?: string;
  search?: string;
  availableOnly?: boolean;
}) {
  try {
    let items = mockStore.menuItems.filter((i) => i.isActive);

    if (params?.availableOnly) {
      items = items.filter((i) => i.isAvailable);
    }
    if (params?.categorySlug) {
      items = items.filter((i) => i.category?.slug === params.categorySlug);
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q))
      );
    }

    if (items.length > 0) {
      return items.sort((a, b) => a.sortOrder - b.sortOrder);
    }
  } catch {
    // fallback
  }

  try {
    const where: Record<string, unknown> = { isActive: true };
    if (params?.availableOnly) where.isAvailable = true;
    if (params?.categorySlug) where.category = { slug: params.categorySlug };
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ];
    }
    return await prisma.menuItem.findMany({
      where,
      include: { category: true, options: true },
      orderBy: [{ sortOrder: "asc" }, { totalOrdered: "desc" }],
    });
  } catch {
    return [];
  }
}

/** Get single menu item by id */
export async function getMenuItem(id: string) {
  const item = mockStore.menuItems.find((i) => i.id === id);
  if (item) return item;

  try {
    return await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true, options: true },
    });
  } catch {
    return null;
  }
}

/** Get all categories */
export async function getCategories() {
  if (mockStore.categories.length > 0) {
    return mockStore.categories.map((cat) => ({
      ...cat,
      _count: {
        items: mockStore.menuItems.filter(
          (m) => m.categoryId === cat.id && m.isActive && m.isAvailable
        ).length,
      },
    }));
  }

  try {
    return await prisma.menuCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { items: { where: { isActive: true, isAvailable: true } } } },
      },
    });
  } catch {
    return [];
  }
}

/** Toggle item availability (staff/admin) */
export async function toggleItemAvailability(
  itemId: string,
  isAvailable: boolean
): Promise<ActionResult> {
  const session = await auth();
  if (!session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.menuItem.update({
    where: { id: itemId },
    data: { isAvailable },
  });

  revalidatePath("/staff/menu");
  revalidatePath("/student/menu");
  return { success: true, data: undefined };
}

/** Create or update menu item (staff/admin) */
export async function upsertMenuItem(
  data: {
    id?: string;
    name: string;
    description?: string;
    price: string;
    categoryId: string;
    imageUrl?: string;
    isAvailable: boolean;
    preparationTime: number;
  }
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || (session.user.role !== "STAFF" && session.user.role !== "ADMIN")) {
    return { success: false, error: "Unauthorized" };
  }

  const slug = data.name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-") + `-${Date.now()}`;

  const item = await prisma.menuItem.upsert({
    where: { id: data.id ?? "new" },
    update: {
      name: data.name,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable,
      preparationTime: data.preparationTime,
    },
    create: {
      name: data.name,
      slug,
      description: data.description,
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl || null,
      isAvailable: data.isAvailable,
      preparationTime: data.preparationTime,
    },
  });

  revalidatePath("/staff/menu");
  revalidatePath("/student/menu");
  return { success: true, data: { id: item.id } };
}
