import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";
export async function authenticateUser(credentials: unknown) {
  const parsed = loginSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.trim().toLowerCase() },
  });
  if (
    !user?.isActive ||
    !(await bcrypt.compare(parsed.data.password, user.password))
  )
    return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
