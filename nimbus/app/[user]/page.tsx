"use client";

import { useParams } from "next/navigation";

export default function UserDashboard() {
    const params = useParams();
    const user = params.user as string;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Welcome, {decodeURIComponent(user)}</h1>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold mb-4">Your Files</h2>
                    <p className="text-gray-500 dark:text-gray-400">
                        File management features will appear here.
                    </p>
                    {/* Future: Add FileList and Upload components here */}
                </div>
            </div>
        </div>
    );
}
