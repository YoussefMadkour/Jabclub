import type { Metadata } from "next";
import { Oxanium, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
// import ErrorBoundary from "@/components/shared/ErrorBoundary";

// Display face — angular, technical; echoes the squared APEX letterforms
const oxanium = Oxanium({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

// Body face — neutral, legible
const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Apex Martial Arts — Boxing, Kickboxing & MMA in Cairo",
  description: "Train boxing, kickboxing, and MMA at Apex Martial Arts — Nexus, Zed Park, Cairo. Certified coaches, all ages and levels. See the live class schedule and start training.",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  other: {
    'google-site-verification': process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
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
        className={`${oxanium.variable} ${inter.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
