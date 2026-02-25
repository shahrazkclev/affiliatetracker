import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Cleverpoly Affiliates",
  description: "Affiliate Platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen`}>
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
        {children}
      </body>
    </html>
  );
}
