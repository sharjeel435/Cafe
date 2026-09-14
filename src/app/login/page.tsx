"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { Utensils, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { loginSchema, type LoginInput } from "@/lib/validations";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password. Please try again.");
      return;
    }

    // Redirect based on role (handled by server after re-fetch)
    // For now redirect to callbackUrl or let server determine
    const redirectTo = callbackUrl ?? "/student";
    router.push(redirectTo);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        placeholder="you@student.edu.pk"
        required
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          {...register("password")}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-sm text-orange-600 hover:text-orange-700"
        >
          Forgot password?
        </Link>
      </div>

      <Button type="submit" fullWidth loading={isSubmitting} size="lg">
        Sign In
      </Button>
    </form>
  );
}

export default function LoginPage() {
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
            Welcome back
          </h1>
          <p className="text-sm text-gray-500">
            Sign in to your CampusBite account
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          New student?{" "}
          <Link href="/register" className="font-medium text-orange-600 hover:text-orange-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
