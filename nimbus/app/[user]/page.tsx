"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserDashboard() {
    const params = useParams();
    const router = useRouter();
    const user = params.user as string;

    useEffect(() => {
        // Redirect to upload page
        router.replace(`/${user}/upload`);
    }, [user, router]);

    return null;
}
