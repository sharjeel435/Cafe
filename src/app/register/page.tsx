"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Utensils, Eye, EyeOff, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerStudent } from "@/server/actions/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    const result = await registerStudent(data);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    // Auto sign-in after registration
    const signInResult = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (signInResult?.error) {
      // Registration succeeded but sign-in failed — redirect to login
      toast.success("Account created! Please sign in.");
      router.push("/login");
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.push("/student");
      router.refresh();
    }, 1500);
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Account created!
          </h2>
          <p className="text-gray-500">Taking you to your dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl">
            <span className="flex items-center justify-center w-9 h-9 bg-orange-500 rounded-xl text-white">
              <Utensils size={18} />
            </span>
            <span>
              Campus<span className="text-orange-500">Bite</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-1">
            Create your account
          </h1>
          <p className="text-sm text-gray-500">
            Join CampusBite and skip the cafeteria queue
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              autoComplete="name"
              placeholder="Ahmed Khan"
              required
              error={errors.name?.message}
              {...register("name")}
            />

            <Input
              label="Student ID"
              type="text"
              placeholder="STU-2026-001"
              required
              error={errors.studentId?.message}
              hint="Your university-issued student ID"
              {...register("studentId")}
            />

            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              placeholder="you@student.edu.pk"
              required
              error={errors.email?.message}
              {...register("email")}
            />

            <Input
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="03XX XXXXXXX"
              error={errors.phone?.message}
              {...register("phone")}
            />

            <div className="relative">
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                required
                error={errors.password?.message}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <div className="relative">
              <Input
                label="Confirm Password"
                type={showConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Re-enter your password"
                required
                error={errors.confirmPassword?.message}
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                aria-label={showConfirm ? "Hide" : "Show"}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isSubmitting}
              size="lg"
              className="mt-2"
            >
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-orange-600 hover:text-orange-700">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
