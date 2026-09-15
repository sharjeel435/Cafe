import type { UserRole } from "@prisma/client";

// Public credentials for the five seeded demo accounts.
export const demoAccounts: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  studentId?: string;
  balance?: number;
}[] = [
  {
    name: "Admin",
    email: "admin@campusbite.pk",
    password: "Admin@123",
    role: "ADMIN",
  },
  {
    name: "Staff",
    email: "staff@campusbite.pk",
    password: "Staff@123",
    role: "STAFF",
  },
  {
    name: "Bilal 1",
    email: "ahmed@student.ku.edu.pk",
    password: "Student@123",
    role: "STUDENT",
    studentId: "STU-2026-001",
    balance: 250000,
  },
  {
    name: "Bilal 2",
    email: "fatima@student.ku.edu.pk",
    password: "Student@123",
    role: "STUDENT",
    studentId: "STU-2026-002",
    balance: 150000,
  },
  {
    name: "Bilal 3",
    email: "bilal@student.ku.edu.pk",
    password: "Student@123",
    role: "STUDENT",
    studentId: "STU-2026-003",
    balance: 50000,
  },
];
