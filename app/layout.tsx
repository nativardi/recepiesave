// Description: Root layout component for SaveIt Recipe Edition - sets up global providers and metadata

import type { Metadata } from "next";
import { Urbanist } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/providers/QueryProvider";

// Configure Urbanist font with required weights
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urbanist",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SaveIt - Recipe Edition",
  description: "Turn social media recipes into your personal cookbook",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={urbanist.variable}>
      <body className={urbanist.className}>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
