import Link from "next/link";
export default function NotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="font-bold text-orange-500">404</p>
      <h1 className="my-4 text-3xl font-bold">This page isn’t on the menu.</h1>
      <p className="mb-6 text-gray-500">
        The link may have changed, or this item is no longer available.
      </p>
      <Link
        href="/menu"
        className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
      >
        Explore the menu
      </Link>
    </main>
  );
}
