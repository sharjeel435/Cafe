import Link from "next/link";

export function SampleMenuNotice() {
  return (
    <div role="status" className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">You’re browsing our sample menu</p>
      <p className="mt-1">The live menu is temporarily unavailable. Sample prices and availability are for demonstration only.</p>
      <Link href="/login" className="mt-2 inline-block font-semibold underline">Choose a demo account to try ordering</Link>
    </div>
  );
}
