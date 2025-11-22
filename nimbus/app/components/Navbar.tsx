"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/api";

export default function Navbar() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        const token = localStorage.getItem("token");
        // Ideally, we should also verify the token or decode it to get the username if not stored
        // For now, we'll assume if token exists, user is logged in. 
        // We might need to store username in localStorage on login too for the link.
        if (token) {
            setIsLoggedIn(true);
            // Try to get user info if not available (optional improvement)
        }
    }, []);

    const handleLogout = async () => {
        try {
            await api.post("/auth/logout");
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            router.push("/");
        } catch (error) {
            console.error("Logout failed", error);
            // Force logout on client even if server fails
            localStorage.removeItem("token");
            setIsLoggedIn(false);
            router.push("/");
        }
    };

    return (
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            {/* Website Logo/Brand Name */}
            <Link href="/" className="text-xl font-bold text-blue-600">
                Nimbus
            </Link>

            <div className="flex items-center space-x-4">
                {isLoggedIn ? (
                    <>
                        {/* Add link to dashboard if needed, or just show logout */}
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
