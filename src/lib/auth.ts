import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { mockStore } from "@/lib/mock-store";
import bcrypt from "bcryptjs";
import { loginSchema } from "@/lib/validations";
import type { UserRole } from "@prisma/client";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // 1. Check in-memory mock store
        const mockUser = mockStore.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
        if (mockUser) {
          if (mockUser.passwordHash === password) {
            return {
              id: mockUser.id,
              email: mockUser.email,
              name: mockUser.name,
              role: mockUser.role,
            };
          }
          // Also try bcrypt if hashed
          try {
            const match = await bcrypt.compare(password, mockUser.passwordHash);
            if (match) {
              return {
                id: mockUser.id,
                email: mockUser.email,
                name: mockUser.name,
                role: mockUser.role,
              };
            }
          } catch {
            // continue
          }
        }

        // 2. Database fallback if available
        try {
          const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
            include: { studentProfile: true, staffProfile: true },
          });

          if (!user || !user.isActive) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
