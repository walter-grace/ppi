import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "PSA - Premium Price Intelligence | Ultimate Luxury Price Assistant",
  description: "Your ultimate luxury price assistant. Discover arbitrage opportunities for luxury watches and trading cards with AI-powered market intelligence.",
  keywords: ["luxury watches", "trading cards", "arbitrage", "price intelligence", "eBay", "PSA", "luxury items"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}

