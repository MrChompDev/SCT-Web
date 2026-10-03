import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import "./globals.css";

const display = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Southern Cross Towing — Virtual Heavy Recovery & Incident Management",
    template: "%s · Southern Cross Towing",
  },
  description:
    "Southern Cross Towing is New South Wales' virtual heavy recovery and incident management crew — roadside recovery, heavy division uprighting, flatbed transport and multi-agency scene support, 24/7.",
  openGraph: {
    title: "Southern Cross Towing — Virtual Heavy Recovery & Incident Management",
    description:
      "Roadside recovery, heavy division uprighting, flatbed transport and scene support alongside FRNSW & NSWPF — 24/7.",
    images: ["/images/header.webp"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
