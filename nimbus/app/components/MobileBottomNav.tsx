"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { useUpload } from "../context/UploadContext";
import {
    LuHardDrive,
    LuCloudUpload,
    LuImage,
    LuHeart,
    LuShield
} from "react-icons/lu";

export default function MobileBottomNav() {
    const pathname = usePathname();
    const params = useParams();
    const { isLoggedIn, user } = useAuth();
    const { activeUploadsCount, queuedCount, overallProgress } = useUpload();

    // Only show for authenticated users inside the dashboard
    if (!isLoggedIn || !user) return null;

    const username = (params.user as string) || user.name || "user";
    const hasActiveUploads = activeUploadsCount > 0 || queuedCount > 0;

    const navItems = [
        {
            name: "Storage",
            href: `/${username}/storage`,
            icon: <LuHardDrive size={18} />,
            active: pathname?.includes("/storage"),
        },
        {
            name: "Upload",
            href: `/${username}/upload`,
            icon: <LuCloudUpload size={18} />,
            active: pathname?.includes("/upload"),
            badge: hasActiveUploads ? `${overallProgress}%` : null,
        },
        {
            name: "Albums",
            href: `/${username}/albums`,
            icon: <LuImage size={18} />,
            active: pathname?.includes("/albums"),
        },
        {
            name: "Favorites",
            href: `/${username}/favorites`,
            icon: <LuHeart size={18} />,
            active: pathname?.includes("/favorites"),
        },
        {
            name: "Security",
            href: `/${username}/settings`,
            icon: <LuShield size={18} />,
            active: pathname?.includes("/settings"),
        },
    ];

    return (
        <nav
            aria-label="Mobile Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#16181B]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1.5 shadow-[0_-8px_25px_rgba(0,0,0,0.6)] safe-area-pb"
        >
            <div className="flex items-center justify-around max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = item.active;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
                                isActive
                                    ? "text-[#B8FE00] font-bold"
                                    : "text-white/60 hover:text-white"
                            }`}
                        >
                            <div className="relative flex items-center justify-center">
                                {item.icon}
                                {item.badge && (
                                    <span className="absolute -top-1.5 -right-3 px-1 py-0.2 text-[8px] font-mono font-bold bg-[#B8FE00] text-[#16181B] rounded-full shadow-sm animate-pulse">
                                        {item.badge}
                                    </span>
                                )}
                            </div>
                            <span className="text-[10px] font-mono uppercase tracking-wider mt-1">
                                {item.name}
                            </span>
                            {isActive && (
                                <span className="w-1 h-1 rounded-full bg-[#B8FE00] mt-0.5" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
