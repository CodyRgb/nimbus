"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function ConditionalNavbar() {
    const { isLoggedIn, user } = useAuth();
    const pathname = usePathname();
    const isLandingPage = pathname === '/';
    const isLoginPage = pathname === '/login';
    const isOnAuthPage = pathname === '/login' || pathname === '/register';

    const isRegisterPage = pathname === '/register';

    // Navbar is now enabled on all pages including Landing, Login and Register


    return <Navbar isLoggedIn={isLoggedIn} user={user} isOnAuthPage={isOnAuthPage} />;
}
