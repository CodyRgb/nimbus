"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../../lib/api";
import { motion } from "framer-motion";
import MagneticButton from "./ui/MagneticButton";

export default function Navbar() {
    const router = useRouter();
    const { isLoggedIn, user, logout: authLogout } = useAuth();

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            authLogout();
            router.push("/");
        } catch (error) {
            console.error("Logout failed", error);
            authLogout();
            router.push("/");
        }
    };

    return (
        <motion.header 
            className="glass-card sticky top-0 z-50 px-6 py-4 border-b border-white/10 backdrop-blur-xl"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex items-center justify-between max-w-7xl mx-auto">
                {/* Website Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <motion.div 
                        whileHover={{ rotate: 360, scale: 1.1 }} 
                        transition={{ duration: 0.6 }}
                    >
                        <Image 
                            src="/nimbus-logo.png" 
                            alt="Nimbus Logo" 
                            width={40} 
                            height={40} 
                            className="object-contain" 
                        />
                    </motion.div>
                    <span className="text-2xl font-bold text-gradient font-display">
                        Nimbus
                    </span>
                </Link>

                <div className="flex items-center space-x-4">
                    {isLoggedIn ? (
                        <>
                            {user && (
                                <motion.div
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="glass-card px-4 py-2 rounded-full"
                                >
                                    <span className="text-gray-300 font-body">
                                        Welcome, <span className="text-aurora-blue font-semibold">{user.name}</span>
                                    </span>
                                </motion.div>
                            )}
                            <motion.button
                                onClick={handleLogout}
                                className="px-4 py-2 text-gray-300 hover:text-red-400 font-medium transition-colors font-body"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                Logout
                            </motion.button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <motion.button
                                    className="px-4 py-2 text-gray-300 hover:text-white font-medium transition-colors font-body"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    Login
                                </motion.button>
                            </Link>
                            <Link href="/register">
                                <MagneticButton variant="primary" className="px-6 py-2 text-base">
                                    Register
                                </MagneticButton>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </motion.header>
    );
}