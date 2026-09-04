import type { Metadata } from "next";
import "./globals.css";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { CartProvider } from "@/components/providers/cart-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Sovereign Watches | Luxury Timepieces",
  description:
    "Restraint is the rarest form of luxury. Discover our curated collection of automatic, quartz, and smart timepieces with official warranty and free delivery.",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SupabaseProvider>
          <CartProvider>
            {children}
            <Toaster theme="light" />
          </CartProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
