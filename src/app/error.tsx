"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto my-16 max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center">
      <h1 className="text-2xl font-bold">We couldn’t load this page</h1>
      <p className="mt-3 text-gray-600">
        Please try again in a moment. If this continues, contact the cafeteria
        administrator.
      </p>
      <div className="mt-6 flex justify-center gap-4">
        <button
          onClick={reset}
          className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
        >
          Try again
        </button>
        <Link href="/" className="rounded-xl border px-5 py-3">
          Go home
        </Link>
      </div>
    </main>
  );
}
