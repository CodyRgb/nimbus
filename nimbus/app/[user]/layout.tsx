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
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
                <div className="p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                        Menu
                    </h2>
                    <nav className="space-y-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`block px-4 py-2 rounded-lg transition-colors ${isActive
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium"
                                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                        }`}
                                >
                                    {item.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </aside>

            {/* Mobile Nav (Simple top bar for small screens) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 flex justify-around p-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`text-sm font-medium ${isActive
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-500 dark:text-gray-400"
                                }`}
                        >
                            {item.name}
                        </Link>
                    );
                })}
            </div>

            {/* Main Content */}
            <main className="flex-1 p-8 pb-24 md:pb-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
