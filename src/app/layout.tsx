import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import "./globals.css";
import "../styles/colors.css";
import SessionProvider from "@/components/SessionProvider";
import AuthWrapper from "@/components/AuthWrapper";
import ConditionalLayout from "@/components/ConditionalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ZZBistro - Your Personal Cooking Companion",
  description: "Manage recipes, track ingredients, and discover what to cook next",
  icons: {
    icon: [
      { url: '/favicon-16x16-v2.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32-v2.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48-v2.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 dark:bg-gray-900`}
      >
        <SessionProvider>
          <AuthWrapper>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </AuthWrapper>
        </SessionProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
