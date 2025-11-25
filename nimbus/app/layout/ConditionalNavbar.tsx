"use client";

import { usePathname } from "next/navigation";
import Navbar from "../components/Navbar";

export default function ConditionalNavbar() {
    const pathname = usePathname();

    // Hide navbar on the landing page
    if (pathname === "/") {
        return null;
    }

    return <Navbar />;
}
