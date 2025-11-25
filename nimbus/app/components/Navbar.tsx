"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import api from "../../lib/api";

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
            // Force logout on client even if server fails
            authLogout();
            router.push("/");
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Website Logo */}
            <Link href="/" className="flex items-center gap-2">
                <Image src="/nimbus-logo.png" alt="Nimbus Logo" width={40} height={40} className="object-contain" />
                <span className="text-xl font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 bg-clip-text text-transparent">Nimbus</span>
            </Link>

            <div className="flex items-center space-x-4">
                {isLoggedIn ? (
                    <>
                        {user && (
                            <span className="text-gray-600 dark:text-gray-300">
                                Welcome, {user.name}
                            </span>
                        )}
                        <button
                            onClick={handleLogout}
                            className="text-gray-600 hover:text-red-600 dark:text-gray-300 dark:hover:text-red-400 font-medium"
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <Link
                            href="/login"
                            className="text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-white font-medium"
                        >
                            Login
                        </Link>
                        <Link
                            href="/register"
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                        >
                            Register
                        </Link>
                    </>
                )}
            </div>
        </header>
    );
}
