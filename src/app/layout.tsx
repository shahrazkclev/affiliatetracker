import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from "@/components/ui/sonner";
import { AuthHashHandler } from "@/components/AuthHashHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://affiliatemango.com'),
  title: "AffiliateMango | Automated Affiliate Network Engine",
  description: "Create powerful affiliate programs in minutes. We handle Stripe webhooks, partner payouts, and seamless tracking so you don't have to.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`} suppressHydrationWarning>
        <NextTopLoader
          color="#f97316"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #f97316,0 0 5px #f97316"
        />
        <Toaster />
        <AuthHashHandler />
        {children}
      </body>
    </html>
  );
}
