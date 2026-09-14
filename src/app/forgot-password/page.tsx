"use client";

import Link from "next/link";
import { useState } from "react";
import { Utensils, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // In production: call password reset API
    // For demo: simulate delay
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <CheckCircle className="text-orange-600" size={32} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-gray-500 mb-6">
            If an account exists for{" "}
            <span className="font-medium text-gray-700">{email}</span>, you will
            receive password reset instructions shortly.
          </p>
          <Link href="/login">
            <Button variant="outline">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
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
            Reset your password
          </h1>
          <p className="text-sm text-gray-500">
            Enter your email and we&apos;ll send you reset instructions.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@student.edu.pk"
              required
              autoComplete="email"
            />
            <Button type="submit" fullWidth loading={loading} size="lg">
              Send Reset Link
            </Button>
          </form>
        </div>

        <Link
          href="/login"
          className="flex items-center justify-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 mt-6"
        >
          <ArrowLeft size={14} />
          Back to Sign In
        </Link>
      </div>
    </div>
  );
}
