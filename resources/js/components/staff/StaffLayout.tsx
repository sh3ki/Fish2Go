import { ReactNode, useState } from "react";
import { useForm, router } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { Menu, X } from "lucide-react";
import ConfirmLogout from "@/components/ConfirmLogout"; 

interface StaffLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function StaffLayout({ breadcrumbs, children }: StaffLayoutProps) {
    const { post } = useForm(); // Inertia form handler
    const [isModalOpen, setIsModalOpen] = useState(false); // State for sidebar modal
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); // State for logout modal

    const handleLogout = () => {
        post(route("logout")); // Proceed with logout
    };

    const navigateTo = (routeName: string) => {
        router.get(route(routeName)); // Navigate using Inertia.js
        setIsModalOpen(false); // Close modal after clicking
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header Section */}
            <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
                <h1 className="text-xl font-semibold">Staff POS</h1>
                <div className="flex items-center gap-4">
                    {/* Hamburger Button */}
                    <button 
                        className="text-white p-2 rounded hover:bg-gray-700"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Menu size={24} />
                    </button>

                    {/* Logout Button */}
                    <button 
                        onClick={() => setIsLogoutModalOpen(true)}
                        className="text-sm bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                    >
                        Log Out
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex flex-1 flex-col p-4">{children}</main>

            {/* Modal for Navigation */}
            {isModalOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
                    onClick={() => setIsModalOpen(false)}
                >
                    <div 
                        className="bg-white p-6 rounded-lg shadow-lg w-80 relative"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center border-b pb-2 mb-4">
                            <h2 className="text-lg font-semibold text-black">Navigation</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-1">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Navigation Links */}
                        <ul className="space-y-3">
                            <li>
                                <button 
                                    onClick={() => navigateTo("staff.pos")} 
                                    className="block text-blue-500 hover:underline w-full text-left"
                                >
                                    POS
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => navigateTo("staff.inventory")} 
                                    className="block text-blue-500 hover:underline w-full text-left"
                                >
                                    Inventory
                                </button>
                            </li>
                            <li>
                                <button 
                                    onClick={() => navigateTo("staff.products")} 
                                    className="block text-blue-500 hover:underline w-full text-left"
                                >
                                    Products
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Confirmation Logout Modal */}
            <ConfirmLogout 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}
