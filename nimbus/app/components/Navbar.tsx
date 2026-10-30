"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

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
    const pathname = usePathname();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
            <div className={`mx-auto max-w-[1320px] px-4 sm:px-6 transition-all duration-300 ${scrolled ? 'pt-3' : 'pt-5'}`}>
                <motion.nav
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-center justify-between px-5 py-3 sm:px-7 sm:py-4 bg-[#202327]/90 backdrop-blur-xl border border-white/15 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
                >
                    {/* Brand Logo Left */}
                    <Link
                        href={isLoggedIn ? `/${user?.name}/storage` : "/"}
                        className="flex items-center gap-3 group shrink-0 focus:outline-none"
                    >
                        {/* 8-point geometric star icon in #B8FE00 */}
                        <div className="w-9 h-9 rounded-full bg-[#16181B] border border-[#B8FE00]/30 flex items-center justify-center transition-transform duration-500 group-hover:rotate-90 shadow-[0_0_15px_rgba(184,254,0,0.25)]">
                            <svg className="w-5 h-5 text-[#B8FE00]" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
                            </svg>
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="font-display font-extrabold text-2xl tracking-wider text-white uppercase leading-none">
                                    CIPHERVAULT
                                </span>
                                <span className="text-[10px] font-mono text-[#B8FE00] font-bold">®</span>
                            </div>
                            <span className="text-[9px] font-mono tracking-widest text-[#A0A6B2] uppercase hidden sm:block">
                                ENCRYPTED CLOUD
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links Center */}
                    <div className="hidden md:flex items-center gap-1 lg:gap-2">
                        {isOnAuthPage ? (
                            <span className="text-xs font-mono uppercase tracking-widest text-[#A0A6B2] px-4 py-1.5 border border-white/10 rounded-full">
                                SECURE GATEWAY
                            </span>
                        ) : isLoggedIn ? (
                            <>
                                <Link
                                    href={`/${user?.name}/storage`}
                                    className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all rounded-full ${pathname?.includes('/storage')
                                        ? 'bg-[#B8FE00] text-[#16181B] font-bold shadow-[0_0_15px_rgba(184,254,0,0.3)]'
                                        : 'text-[#A0A6B2] hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    STORAGE
                                </Link>
                                <Link
                                    href={`/${user?.name}/upload`}
                                    className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all rounded-full ${pathname?.includes('/upload')
                                        ? 'bg-[#B8FE00] text-[#16181B] font-bold shadow-[0_0_15px_rgba(184,254,0,0.3)]'
                                        : 'text-[#A0A6B2] hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    UPLOAD
                                </Link>
                                <Link
                                    href={`/${user?.name}/albums`}
                                    className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all rounded-full ${pathname?.includes('/albums')
                                        ? 'bg-[#B8FE00] text-[#16181B] font-bold shadow-[0_0_15px_rgba(184,254,0,0.3)]'
                                        : 'text-[#A0A6B2] hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    ALBUMS
                                </Link>
                                <Link
                                    href={`/${user?.name}/favorites`}
                                    className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all rounded-full ${pathname?.includes('/favorites')
                                        ? 'bg-[#B8FE00] text-[#16181B] font-bold shadow-[0_0_15px_rgba(184,254,0,0.3)]'
                                        : 'text-[#A0A6B2] hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    FAVORITES
                                </Link>
                                <Link
                                    href={`/${user?.name}/settings`}
                                    className={`px-4 py-2 text-xs font-display tracking-widest uppercase transition-all rounded-full ${pathname?.includes('/settings')
                                        ? 'bg-[#B8FE00] text-[#16181B] font-bold shadow-[0_0_15px_rgba(184,254,0,0.3)]'
                                        : 'text-[#A0A6B2] hover:text-white hover:bg-white/10'
                                        }`}
                                >
                                    SECURITY
                                </Link>
                            </>
                        ) : (
                            [
                                { label: "CAPABILITIES", href: "/#capabilities" },
                                { label: "ARCHITECTURE", href: "/#architecture" },
                                { label: "HOW IT WORKS", href: "/#workflow" },
                                { label: "SECURITY", href: "/#security" },
                                { label: "REVIEWS", href: "/#reviews" },
                                { label: "FAQ", href: "/#faq" },
                            ].map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="px-3.5 py-2 text-xs font-display tracking-widest text-[#A0A6B2] hover:text-white transition-colors uppercase rounded-full hover:bg-white/5"
                                >
                                    {item.label}
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Right Actions */}
                    <div className="hidden md:flex items-center gap-3 shrink-0">
                        {isOnAuthPage ? (
                            <Link
                                href="/"
                                className="px-5 py-2 text-xs font-display tracking-wider text-white border border-white/20 rounded-full hover:bg-white/10 transition-all flex items-center gap-1.5"
                            >
                                <span>BACK TO HOME</span>
                                <span>←</span>
                            </Link>
                        ) : isLoggedIn ? (
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-[#16181B] border border-white/10 rounded-full">
                                    <span className="w-2 h-2 rounded-full bg-[#B8FE00] animate-pulse"></span>
                                    <span className="text-xs font-mono text-white font-bold max-w-[120px] truncate">
                                        {user?.name || "User"}
                                    </span>
                                </div>
                                <button
                                    onClick={logout}
                                    className="px-4 py-2 text-xs font-display tracking-wider text-white border border-white/20 rounded-full hover:border-[#B8FE00] hover:text-[#B8FE00] hover:bg-white/5 transition-all cursor-pointer uppercase"
                                >
                                    LOGOUT
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5">
                                <Link
                                    href="/login"
                                    className="px-5 py-2 text-xs font-display tracking-widest text-white border border-white/25 rounded-full hover:bg-white/10 transition-all uppercase"
                                >
                                    SIGN IN
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-5 py-2 text-xs font-display tracking-widest text-[#16181B] bg-[#B8FE00] font-bold rounded-full hover:bg-white transition-all shadow-[0_0_20px_rgba(184,254,0,0.35)] flex items-center gap-1.5 group cursor-pointer uppercase"
                                >
                                    <span>GET STARTED</span>
                                    <span className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">↗</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile Hamburger Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle Navigation Menu"
                        className="md:hidden p-2 text-white hover:text-[#B8FE00] transition-colors focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </motion.nav>

                {/* Mobile Drawer */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="md:hidden mt-2 bg-[#202327] border border-white/15 rounded-2xl p-5 shadow-2xl space-y-4"
                        >
                            {isLoggedIn ? (
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2 pb-3 mb-2 border-b border-white/10">
                                        <div className="w-8 h-8 rounded-full bg-[#0720C6] text-[#B8FE00] flex items-center justify-center font-bold text-xs">
                                            {user?.name?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{user?.name}</p>
                                            <p className="text-[11px] font-mono text-[#A0A6B2]">{user?.email}</p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/${user?.name}/storage`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-white hover:bg-white/10 flex items-center gap-2.5"
                                    >
                                        <span>✦</span> STORAGE VAULT
                                    </Link>
                                    <Link
                                        href={`/${user?.name}/upload`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-white hover:bg-white/10 flex items-center gap-2.5"
                                    >
                                        <span>✦</span> UPLOAD FILES
                                    </Link>
                                    <Link
                                        href={`/${user?.name}/albums`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-white hover:bg-white/10 flex items-center gap-2.5"
                                    >
                                        <span>✦</span> ALBUMS
                                    </Link>
                                    <Link
                                        href={`/${user?.name}/favorites`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-white hover:bg-white/10 flex items-center gap-2.5"
                                    >
                                        <span>✦</span> FAVORITES
                                    </Link>
                                    <Link
                                        href={`/${user?.name}/settings`}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-white hover:bg-white/10 flex items-center gap-2.5"
                                    >
                                        <span>✦</span> SECURITY & SHARING
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setMobileMenuOpen(false);
                                        }}
                                        className="mt-2 w-full px-4 py-2.5 text-xs font-display tracking-widest uppercase rounded-lg text-red-400 border border-red-500/20 hover:bg-red-500/10 text-center"
                                    >
                                        LOGOUT VAULT
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-2">
                                    {[
                                        { label: "CAPABILITIES", href: "/#capabilities" },
                                        { label: "ARCHITECTURE", href: "/#architecture" },
                                        { label: "HOW IT WORKS", href: "/#workflow" },
                                        { label: "SECURITY", href: "/#security" },
                                        { label: "REVIEWS", href: "/#reviews" },
                                        { label: "FAQ", href: "/#faq" },
                                    ].map((item) => (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="px-4 py-2.5 text-xs font-display tracking-widest uppercase text-[#A0A6B2] hover:text-white rounded-lg hover:bg-white/5"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                    <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
                                        <Link
                                            href="/login"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full text-center py-2.5 text-xs font-display tracking-widest uppercase border border-white/20 rounded-full text-white"
                                        >
                                            SIGN IN
                                        </Link>
                                        <Link
                                            href="/register"
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="w-full text-center py-2.5 text-xs font-display tracking-widest uppercase bg-[#B8FE00] text-[#16181B] font-bold rounded-full"
                                        >
                                            GET STARTED FREE ↗
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </header>
    );
}
