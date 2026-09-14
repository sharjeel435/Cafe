import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "CampusBite — Skip the Queue. Grab Your Food.",
    template: "%s | CampusBite",
  },
  description:
    "Pre-order your cafeteria meal and pick it up between classes. No more long queues at Karachi University cafeteria.",
  keywords: [
    "cafeteria",
    "food order",
    "university",
    "Karachi University",
    "campus food",
    "pre-order",
  ],
  openGraph: {
    title: "CampusBite — Skip the Queue. Grab Your Food.",
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
    <html lang="en">
      <body>
        {children}
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
