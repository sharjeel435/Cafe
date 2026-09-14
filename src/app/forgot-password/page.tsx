import Link from "next/link";
import { ArrowLeft, LifeBuoy } from "lucide-react";
export const metadata = { title: "Account help" };
export default function AccountHelp() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8">
        <LifeBuoy className="mb-5 text-orange-500" size={32} />
        <h1 className="text-2xl font-bold">Need help signing in?</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          For a demo account, return to sign in and choose one of the seeded
          accounts. For other accounts, contact your cafeteria administrator for
          help. Email password resets are not configured.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 font-semibold text-orange-600"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
