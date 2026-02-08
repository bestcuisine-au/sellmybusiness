import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OwnerExit.ai - Sell Your Business Without a Broker",
    template: "%s | OwnerExit.ai",
  },
  description: "Australia's first AI-powered platform for selling your business yourself. Save 5-10% on broker commissions with intelligent tools.",
  keywords: ["sell business", "business for sale", "FSBO", "business valuation", "Australia", "business broker alternative"],
  openGraph: {
    title: "OwnerExit.ai - Sell Your Business Without a Broker",
    description: "AI-powered tools to sell your business yourself. Save thousands in broker commissions.",
    url: "https://ownerexit.ai",
    siteName: "OwnerExit.ai",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OwnerExit.ai - Sell Your Business Without a Broker",
    description: "AI-powered tools to sell your business yourself.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
