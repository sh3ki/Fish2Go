import { ReactNode } from "react";
import { Head, useForm } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";

interface StaffLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function StaffLayout({ breadcrumbs, children }: StaffLayoutProps) {
    const { post } = useForm(); // Inertia form handler

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        post(route("logout")); // Send a POST request to logout
    };

    return (
        <div className="flex min-h-screen flex-col">
            <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Staff POS</h1>
                <form onSubmit={handleLogout}>
                    <button 
                        type="submit" 
                        className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Log Out
                    </button>
                </form>
            </header>
            <main className="flex flex-1 flex-col p-4">{children}</main>
        </div>
    );
}
