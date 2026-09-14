import { Navbar } from "@/components/layout/navbar";
export default function MenuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="text-sm font-semibold text-orange-600">
            FRESH FROM THE BUKC KITCHEN
          </p>
          <h1 className="mt-2 text-3xl font-bold">
            Find your next favorite bite.
          </h1>
          <p className="mt-2 text-gray-500">
            Browse the menu. Sign in to order and choose your pickup time.
          </p>
        </div>
        {children}
      </main>
    </>
  );
}
