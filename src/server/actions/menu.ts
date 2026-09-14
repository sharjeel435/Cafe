"use server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { serialize } from "@/lib/serialize";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { ActionResult } from "./auth";
import { actionError, OrderError } from "@/lib/order-helpers";

export async function getMenuItems(params?: {
  categorySlug?: string;
  search?: string;
  availableOnly?: boolean;
}) {
  const where: Prisma.MenuItemWhereInput = {
    isActive: true,
    category: {
      isActive: true,
      ...(params?.categorySlug ? { slug: params.categorySlug } : {}),
    },
  };
  if (params?.availableOnly) where.isAvailable = true;
  if (params?.search?.trim())
    where.OR = [
      { name: { contains: params.search.trim(), mode: "insensitive" } },
      { description: { contains: params.search.trim(), mode: "insensitive" } },
    ];
  return serialize(
    await prisma.menuItem.findMany({
      where,
      include: { category: true, options: true },
      orderBy: [{ sortOrder: "asc" }, { totalOrdered: "desc" }],
    }),
  );
}
export async function getMenuItem(id: string) {
  return serialize(
    await prisma.menuItem.findFirst({
      where: { id, isActive: true, category: { isActive: true } },
      include: { category: true, options: true },
    }),
  );
}
export async function getCategories() {
  return prisma.menuCategory.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      _count: {
        select: { items: { where: { isActive: true, isAvailable: true } } },
      },
    },
  });
}
export async function toggleItemAvailability(
  itemId: string,
  isAvailable: boolean,
): Promise<ActionResult> {
  const session = await auth();
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role))
    return { success: false, error: "Unauthorized" };
  if (typeof isAvailable !== "boolean")
    return { success: false, error: "Invalid availability" };
  try {
    await prisma.menuItem.update({
      where: { id: itemId },
      data: { isAvailable },
    });
    refreshMenu();
    return { success: true, data: undefined };
  } catch (error) {
    return actionError(error);
  }
}
function refreshMenu() {
  for (const path of [
    "/menu",
    "/student",
    "/student/menu",
    "/staff/menu",
    "/admin/menu",
  ])
    revalidatePath(path);
}
const itemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2).max(100),
  description: z.string().max(1000).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/)
    .refine((p) => Number(p) > 0 && Number(p) <= 50000, "Invalid price"),
  categoryId: z.string().min(1),
  imageUrl: z
    .union([z.literal(""), z.url().refine((url) => /^https?:\/\//.test(url))])
    .optional(),
  isAvailable: z.boolean(),
  preparationTime: z.number().int().min(1).max(120),
});
export async function upsertMenuItem(
  data: z.infer<typeof itemSchema>,
): Promise<ActionResult<{ id: string }>> {
  const session = await auth();
  if (!session || !["STAFF", "ADMIN"].includes(session.user.role))
    return { success: false, error: "Unauthorized" };
  const parsed = itemSchema.safeParse(data);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };
  try {
    const { id, ...values } = parsed.data;
    if (
      !(await prisma.menuCategory.findFirst({
        where: { id: values.categoryId, isActive: true },
      }))
    )
      throw new OrderError("Select an active category");
    const payload = { ...values, imageUrl: values.imageUrl || null };
    const item = id
      ? await prisma.menuItem.update({ where: { id }, data: payload })
      : await prisma.menuItem.create({
          data: {
            ...payload,
            slug: `${values.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${crypto.randomUUID()}`,
          },
        });
    refreshMenu();
    return { success: true, data: { id: item.id } };
  } catch (error) {
    return actionError(error);
  }
}
