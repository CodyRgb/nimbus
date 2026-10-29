import type { Metadata } from "next";
import { Anton, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "./context/AuthContext";
import ConditionalNavbar from "./layout/ConditionalNavbar";

const anton = Anton({
  variable: "--font-anton",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: "Nimbus Cloud Storage | Infinite, Encrypted & Zero-Knowledge Vault",
  description: "Unlimited cloud storage power engineered on Telegram's distributed API. Ultra-fast, zero-knowledge AES-256 encrypted, and always accessible.",
  icons: {
    icon: '/nimbus-logo.png',
    shortcut: '/nimbus-logo.png',
    apple: '/nimbus-logo.png',
  },
  openGraph: {
    title: "Nimbus Cloud Storage | Infinite, Encrypted Vault",
    description: "Unlimited free cloud storage powered by Telegram with client-side zero-knowledge encryption.",
    images: ['/nimbus-logo.png'],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${anton.variable} ${plusJakartaSans.variable} antialiased font-body bg-[#16181B] text-white selection:bg-[#B8FE00] selection:text-[#16181B] overflow-x-hidden`}
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
