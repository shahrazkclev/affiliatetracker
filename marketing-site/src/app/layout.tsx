import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';


export const metadata: Metadata = {
  title: 'AffiliateMango | High-Performance Affiliate Software for SaaS',
  description: 'Launch your affiliate program in 5 minutes. Get all the enterprise features of Rewardful and PartnerStack for 50% less. 0% transaction fees natively built for Stripe.',
  keywords: ['affiliate software', 'saas affiliate program', 'rewardful alternative', 'stripe affiliate tracking', 'b2b affiliate'],
  openGraph: {
    title: 'AffiliateMango | Scale your SaaS revenue',
    description: 'Launch a world-class affiliate program with zero transaction fees. Specifically built for SaaS companies.',
    url: 'https://affiliatemango.com',
    siteName: 'AffiliateMango',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AffiliateMango - Stop paying 30% to legacy ad networks',
    description: 'The minimalist, powerful affiliate dashboard built directly on top of your Stripe billing.',
  },
  alternates: {
    canonical: 'https://affiliatemango.com',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-white flex flex-col">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
