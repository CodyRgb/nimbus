"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function ConditionalNavbar() {
    const { isLoggedIn, user } = useAuth();
    const pathname = usePathname();
    const isOnAuthPage = pathname === '/login' || pathname === '/register';

    return <Navbar isLoggedIn={isLoggedIn} user={user} isOnAuthPage={isOnAuthPage} />;
}
