"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

interface User {
    _id: string;
    name: string;
    email: string;
}

interface NavbarProps {
    isLoggedIn: boolean;
    user: User | null;
    isOnAuthPage: boolean;
}

export default function Navbar({ isLoggedIn, user, isOnAuthPage }: NavbarProps) {
    const { logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 pointer-events-none">
            <motion.nav
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="pointer-events-auto flex items-center justify-between gap-6 p-4 pl-8 pr-4 bg-[#0A0A0A]/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_0_40px_-10px_rgba(120,119,198,0.3)] max-w-7xl w-full relative overflow-hidden"
            >
                {/* Subtle Aurora Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                {/* Logo */}
                <div
                    onClick={() => {
                        if (isLoggedIn) {
                            logout();
                        } else {
                            window.location.href = '/';
                        }
                    }}
                    className="flex items-center gap-3 group shrink-0 relative z-10 cursor-pointer"
                >
                    <motion.div whileHover={{ rotate: 360 }} transition={{ duration: 0.6 }}>
                        <Image
                            src="/nimbus-logo.png"
                            alt="Nimbus Logo"
                            width={36}
                            height={36}
                            className="object-contain"
                            priority
                        />
                    </motion.div>
                    <span className="text-2xl font-bold text-white font-display hidden sm:block tracking-tight">
                        Nimbus
                    </span>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-1 relative z-10">
                    {isOnAuthPage ? null : isLoggedIn ? (
                        <>
                            <Link href={`/${user?.name}/storage`} className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105">
                                Storage
                            </Link>
                            <Link href={`/${user?.name}/favorites`} className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105">
                                Favorites
                            </Link>
                            <Link href={`/${user?.name}/upload`} className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105">
                                Uploads
                            </Link>
                            <Link href={`/${user?.name}/albums`} className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105">
                                Albums
                            </Link>
                        </>
                    ) : (
                        ["About", "Help", "FAQ", "Contact"].map((item) => (
                            <Link
                                key={item}
                                href={`/#${item.toLowerCase()}`}
                                className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105"
                            >
                                {item}
                            </Link>
                        ))
                    )}
                </div>

                {/* Desktop Buttons */}
                <div className="hidden md:flex items-center gap-4 shrink-0 relative z-10">
                    {isOnAuthPage ? (
                        <Link href="/contact" className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-full hover:bg-white/10 hover:scale-105">
                            Contact
                        </Link>
                    ) : isLoggedIn ? (
                        <>
                            <span className="text-white font-medium">
                                {user?.name}
                            </span>
                            <button
                                onClick={logout}
                                className="px-7 py-3 text-base font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-105"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <button className="px-7 py-3 text-base font-medium text-white border border-white/20 rounded-full hover:bg-white/10 transition-all duration-300 hover:scale-105">
                                    Login
                                </button>
                            </Link>
                            <Link href="/register">
                                <button className="px-7 py-3 text-base font-medium text-black bg-white rounded-full hover:bg-gray-100 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] hover:scale-105">
                                    Register
                                </button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Hamburger Menu */}
                {isLoggedIn && !isOnAuthPage && (
                    <motion.button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden relative z-10 p-2 text-white"
                        whileTap={{ scale: 0.95 }}
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </motion.button>
                )}
            </motion.nav>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileMenuOpen && isLoggedIn && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden absolute top-24 left-4 right-4 pointer-events-auto"
                    >
                        <div className="glass-card border border-white/10 rounded-2xl p-4 shadow-[0_0_40px_-10px_rgba(120,119,198,0.3)]">
                            <div className="flex flex-col gap-2">
                                <Link
                                    href={`/${user?.name}/storage`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                                >
                                    📂 Storage
                                </Link>
                                <Link
                                    href={`/${user?.name}/favorites`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                                >
                                    ❤️ Favorites
                                </Link>
                                <Link
                                    href={`/${user?.name}/upload`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                                >
                                    📤 Uploads
                                </Link>
                                <Link
                                    href={`/${user?.name}/albums`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-6 py-3 text-base font-medium text-gray-300 hover:text-white transition-all duration-300 rounded-xl hover:bg-white/10"
                                >
                                    🖼️ Albums
                                </Link>
                                <div className="border-t border-white/10 my-2"></div>
                                <div className="px-6 py-2 text-sm text-gray-400">
                                    {user?.name}
                                </div>
                                <button
                                    onClick={() => {
                                        logout();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="px-6 py-3 text-base font-medium text-red-400 hover:text-red-300 transition-all duration-300 rounded-xl hover:bg-red-500/10 text-left"
                                >
                                    🚪 Logout
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
