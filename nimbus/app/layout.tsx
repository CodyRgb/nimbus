import type { Metadata } from "next";
import { Outfit, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "./context/AuthContext";
import { UploadProvider } from "./context/UploadContext";
import ConditionalNavbar from "./layout/ConditionalNavbar";
import FloatingUploadWidget from "./components/FloatingUploadWidget";
import UploadManagerDrawer from "./components/UploadManagerDrawer";
import OnlineStatus from "./components/OnlineStatus";
import PWAInstaller from "./components/PWAInstaller";
import MobileBottomNav from "./components/MobileBottomNav";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
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
  title: "CipherVault | Infinite, Encrypted & Zero-Knowledge Cloud Storage",
  description: "Unlimited cloud storage power engineered on Telegram's distributed API. Ultra-fast, zero-knowledge AES-256 encrypted, and always accessible.",
  manifest: "/manifest.json",
  icons: {
    icon: '/ciphervault-logo.png',
    shortcut: '/ciphervault-logo.png',
    apple: '/ciphervault-logo.png',
  },
  openGraph: {
    title: "CipherVault | Infinite, Encrypted Cloud Storage",
    description: "Unlimited free cloud storage powered by Telegram with client-side zero-knowledge encryption.",
    images: ['/ciphervault-logo.png'],
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
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0720C6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CipherVault" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${outfit.variable} ${plusJakartaSans.variable} antialiased font-body bg-[#16181B] text-white selection:bg-[#B8FE00] selection:text-[#16181B] overflow-x-hidden pb-16 md:pb-0`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <UploadProvider>
            <OnlineStatus />
            <ConditionalNavbar />
            <PWAInstaller />
            {children}
            <FloatingUploadWidget />
            <UploadManagerDrawer />
            <MobileBottomNav />
          </UploadProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
