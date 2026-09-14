import { z } from "zod";

// ─────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(100),
    studentId: z
      .string()
      .min(3, "Student ID is required")
      .regex(/^[A-Z0-9-]+$/i, "Invalid student ID format"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^(\+92|0)?[0-9]{10}$/.test(v.replace(/\s/g, "")),
        "Invalid Pakistani phone number"
      ),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// ─────────────────────────────────────────────
// MENU SCHEMAS
// ─────────────────────────────────────────────

export const menuItemSchema = z.object({
  name: z.string().min(2, "Name is required").max(100),
  description: z.string().max(500).optional(),
  price: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid price")
    .refine((v) => parseFloat(v) > 0, "Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  isAvailable: z.boolean().default(true),
  preparationTime: z
    .number()
    .int()
    .min(1, "Min 1 minute")
    .max(120, "Max 120 minutes"),
});

// ─────────────────────────────────────────────
// ORDER SCHEMAS
// ─────────────────────────────────────────────

export const cartItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(10),
  selectedOptions: z.array(z.string()).default([]),
  specialNote: z.string().max(200).optional(),
});

export const checkoutSchema = z.object({
  pickupSlotId: z.string().min(1, "Please select a pickup slot"),
  paymentMethod: z.enum(["CASH", "WALLET"], {
    error: "Please select a payment method",
  }),
  specialNote: z.string().max(500).optional(),
});

// ─────────────────────────────────────────────
// WALLET SCHEMAS
// ─────────────────────────────────────────────

export const topUpSchema = z.object({
  amount: z
    .number()
    .min(100, "Minimum top-up is Rs. 100")
    .max(10000, "Maximum top-up is Rs. 10,000"),
});

// ─────────────────────────────────────────────
// SETTINGS SCHEMA
// ─────────────────────────────────────────────

export const cafeteriaSettingsSchema = z.object({
  cafeteriaName: z.string().min(2),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)"),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time (HH:MM)"),
  slotDuration: z.number().int().min(5).max(60),
  maxOrdersPerSlot: z.number().int().min(1).max(100),
  minPreparationTime: z.number().int().min(1).max(60),
  cancellationCutoff: z.enum(["PENDING", "CONFIRMED", "PREPARING"]),
  serviceFee: z.number().min(0).max(100),
  walletEnabled: z.boolean(),
  cashEnabled: z.boolean(),
});

// ─────────────────────────────────────────────
// PICKUP VERIFICATION
// ─────────────────────────────────────────────

export const pickupVerifySchema = z.object({
  code: z
    .string()
    .length(4, "Pickup code must be 4 digits")
    .regex(/^\d{4}$/, "Pickup code must be 4 digits"),
});

// ─────────────────────────────────────────────
// USER MANAGEMENT
// ─────────────────────────────────────────────

export const createStaffSchema = z
  .object({
    name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    subrole: z.enum(["KITCHEN_STAFF", "CASHIER", "MANAGER"]),
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type MenuItemInput = z.infer<typeof menuItemSchema>;
export type CartItemInput = z.infer<typeof cartItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type CafeteriaSettingsInput = z.infer<typeof cafeteriaSettingsSchema>;
export type PickupVerifyInput = z.infer<typeof pickupVerifySchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
