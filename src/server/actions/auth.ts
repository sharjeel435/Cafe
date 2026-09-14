"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { actionError } from "@/lib/order-helpers";
import bcrypt from "bcryptjs";
import { registerSchema } from "@/lib/validations";
import type { RegisterInput } from "@/lib/validations";

export type ActionResult<T = void> =
  { success: true; data: T } | { success: false; error: string };

/** Register a new student */
export async function registerStudent(
  input: RegisterInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input",
    };
  }

  const { name, studentId, email, phone, password } = parsed.data;

  // University email domain check (configurable via env)
  const domain = process.env.UNIVERSITY_EMAIL_DOMAIN;
  if (domain && !email.toLowerCase().endsWith(`@${domain}`)) {
    return {
      success: false,
      error: `Please use your university email (@${domain})`,
    };
  }

  try {
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    const existingStudentId = await prisma.studentProfile.findUnique({
      where: { studentId: studentId.toUpperCase() },
    });
    if (existingStudentId) {
      return { success: false, error: "This Student ID is already registered" };
    }

    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          name,
          password: hashed,
          role: "STUDENT",
        },
      });

      await tx.studentProfile.create({
        data: {
          userId: newUser.id,
          studentId: studentId.toUpperCase(),
          phone: phone ?? null,
        },
      });

      // Create wallet for student
      await tx.wallet.create({
        data: { userId: newUser.id, balance: 0 },
      });

      // Create empty cart
      await tx.cart.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    return { success: true, data: { id: user.id } };
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    )
      return {
        success: false,
        error: "Email or student ID is already registered",
      };
    return actionError(error);
  }
}

/** Get current session user's profile */
export async function getUserProfile(userId: string) {
  const session = await auth();
  if (!session || (session.user.id !== userId && session.user.role !== "ADMIN"))
    return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      staffProfile: true,
    },
  });

  if (!user) return null;
  const {
    id,
    email,
    name,
    role,
    isActive,
    createdAt,
    updatedAt,
    studentProfile,
    staffProfile,
  } = user;
  return {
    id,
    email,
    name,
    role,
    isActive,
    createdAt,
    updatedAt,
    studentProfile,
    staffProfile,
  };
}
