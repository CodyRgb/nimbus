import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "./context/AuthContext";
import ConditionalNavbar from "./layout/ConditionalNavbar";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Nimbus Cloud Storage",
  description: "Unlimited storage power integrated directly with your Telegram account.",
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
    <html lang="en" data-scroll-behavior="smooth" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${manrope.variable} antialiased font-display bg-background-dark text-white selection:bg-primary selection:text-white overflow-x-hidden`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <ConditionalNavbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
