import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "CampusBite BUKC — Skip the Queue. Grab Your Food.",
    template: "%s | CampusBite",
  },
  description:
    "Pre-order your cafeteria meal and pick it up between classes. No more long queues at BUKC cafeteria.",
  authors: [{ name: "Bilal Khan" }],
  creator: "Bilal Khan",
  keywords: [
    "cafeteria",
    "food order",
    "university",
    "BUKC",
    "campus food",
    "pre-order",
  ],
  openGraph: {
    title: "CampusBite BUKC — Skip the Queue. Grab Your Food.",
    description:
      "Pre-order your cafeteria meal and pick it up between classes.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {children}
        <footer className="border-t border-gray-100 bg-white px-4 pt-5 pb-24 text-center text-xs text-gray-500 md:pb-6">
          CampusBite · BUKC{" "}
          <span className="mx-2" aria-hidden="true">
            |
          </span>{" "}
          Developed by{" "}
          <span className="font-semibold text-gray-700">Bilal Khan</span>
        </footer>
        <Toaster
          position="top-center"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
          }}
        />
      </body>
    </html>
  );
}
