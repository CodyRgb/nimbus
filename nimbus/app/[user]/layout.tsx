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
        <div className="min-h-screen relative font-body text-white bg-background-dark overflow-x-hidden selection:bg-primary selection:text-white">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
            </div>

            {/* Main Content */}
            <main className="relative z-10 p-4 md:p-8 pt-28 lg:pt-36 overflow-y-auto min-h-screen max-w-8xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
