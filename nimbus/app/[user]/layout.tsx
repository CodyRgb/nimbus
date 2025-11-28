"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function UserLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const params = useParams();
    const pathname = usePathname();
    const user = params.user as string;

    const navItems = [
        { name: "Upload", href: `/${user}/upload` },
        { name: "Storage", href: `/${user}/storage` },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-deep-space-start via-deep-space-end to-deep-space-start pt-28">
            {/* Main Content */}
            <main className="p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
