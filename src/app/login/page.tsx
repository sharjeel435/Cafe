"use client";

import Link from "next/link";
import { demoAccounts } from "@/lib/demo-accounts";
import { demoSessionKey, findDemoAccount } from "@/lib/demo-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, getSession } from "next-auth/react";
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
    setValue,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    const demo = findDemoAccount(data.email, data.password);
    if (demo) {
      try {
        sessionStorage.setItem(demoSessionKey, demo.email);
        router.push("/demo");
      } catch {
        toast.error("Allow browser storage to open the demo.");
      }
      return;
    }
    if (
      demoAccounts.some(
        (account) => account.email === data.email.trim().toLowerCase(),
      )
    ) {
      toast.error(
        "Incorrect demo password. Choose an account above to fill its credentials.",
      );
      return;
    }
    const result = await signIn("credentials", {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      toast.error(
        result.error === "CredentialsSignin"
          ? "Invalid email or password. Please try again."
          : "Sign-in is unavailable right now. Please try again later.",
      );
      return;
    }

    const session = await getSession();
    const home =
      session?.user.role === "ADMIN"
        ? "/admin"
        : session?.user.role === "STAFF"
          ? "/staff"
          : "/student";
    const safeCallback =
      callbackUrl &&
      callbackUrl.startsWith(home) &&
      !callbackUrl.includes("\\") &&
      (callbackUrl === home || callbackUrl.startsWith(`${home}/`));
    router.push(safeCallback ? callbackUrl : home);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <details className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm">
        <summary className="cursor-pointer font-semibold text-orange-800">
          Try a demo account
        </summary>
        <p className="mt-2 text-xs text-gray-600">
          Choose an account, then sign in. Demo changes last for this browser
          tab.
        </p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map((account) => (
            <button
              type="button"
              key={account.email}
              onClick={() => {
                setValue("email", account.email);
                setValue("password", account.password);
              }}
              className="rounded-lg border border-orange-100 bg-white p-2 text-left hover:border-orange-400"
            >
              <span className="block font-medium">{account.name}</span>
              <span className="block text-xs text-gray-500">
                {account.email}
              </span>
              <span className="block text-xs text-gray-600">
                Password: {account.password}
              </span>
            </button>
          ))}
        </div>
      </details>
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
          <Link
            href="/"
            className="inline-flex items-center gap-2 font-bold text-xl"
          >
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
            Sign in to your CampusBite BUKC account
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
          <Link
            href="/register"
            className="font-medium text-orange-600 hover:text-orange-700"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
