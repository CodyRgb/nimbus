import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "./context/AuthContext";
import ConditionalNavbar from "./layout/ConditionalNavbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nimbus",
  description: "Cloud Storage for your files",
  icons: {
    icon: '/nimbus.ico',
    shortcut: '/nimbus.ico',
    apple: '/nimbus.ico',
  },
  openGraph: {
    title: "Nimbus - Cloud Storage",
    description: "Unlimited free cloud storage powered by Telegram",
    images: ['/nimbus.ico'],
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
        <AuthProvider>
          <ConditionalNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
