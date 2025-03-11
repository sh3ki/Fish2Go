import { ReactNode, useState } from "react";
import { router, useForm } from "@inertiajs/react";
import { BreadcrumbItem } from "@/types";
import { Menu, Folder, ShoppingCart, CreditCard, DollarSign, LogOut } from "lucide-react";
import ConfirmLogout from "@/components/ConfirmLogout";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useInitials } from "@/hooks/use-initials";
import AppLogoIcon from "@/components/app-logo-icon";
import { Link, usePage } from "@inertiajs/react";
import { cn } from "@/lib/utils";

interface StaffLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function StaffLayout({ breadcrumbs, children }: StaffLayoutProps) {
    const { post } = useForm();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const page = usePage();
    const { auth } = page.props as unknown as { auth: { user: { avatar: string; name: string; } } };
    const getInitials = useInitials();

    const handleLogout = () => {
        post(route("logout"));
    };

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header Section */}
            <header className={cn("border-b p-4 flex items-center justify-between shadow-md", "bg-sidebar dark:bg-dark-sidebar")}> 
                {/* Logo (Matches AppHeader) */}
                <div className="flex items-center space-x-2">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                        <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                    </div>
                    <div className="ml-1 grid flex-1 text-left text-sm">
                        <span className="mb-0.5 truncate leading-none font-semibold">Fish2Go</span>
                    </div>
                </div>
                <h1 className="text-xl font-semibold flex-1 text-center text-black dark:text-white">Point of Sale</h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-10 rounded-full p-1">
                            <Avatar className="size-8 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-sidebar dark:bg-dark-sidebar text-white" align="end">
                        <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-gray-700" onClick={() => router.get(route('staff.products'))}>
                            <ShoppingCart size={18} /> Products
                        </button>
                        <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-gray-700" onClick={() => router.get(route('staff.inventory'))}>
                            <Folder size={18} /> Inventory
                        </button>
                        <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-gray-700" onClick={() => router.get(route('staff.transactions'))}>
                            <CreditCard size={18} /> Transactions
                        </button>
                        <button className="w-full text-left p-2 flex items-center gap-2 hover:bg-gray-700" onClick={() => router.get(route('staff.expenses'))}>
                            <DollarSign size={18} /> Expenses
                        </button>
                        <button className="w-full text-left p-2 flex items-center gap-2 text-red-400 hover:bg-gray-700" onClick={() => setIsLogoutModalOpen(true)}>
                            <LogOut size={18} /> Logout
                        </button>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4">
                {breadcrumbs && (
                    <nav>
                        <ul className="flex space-x-2">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <li key={index}>
                                    {index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
                                </li>
                            ))}
                        </ul>
                    </nav>
                )}
                {children}
            </main>

            {/* Confirm Logout Modal */}
            <ConfirmLogout 
                isOpen={isLogoutModalOpen} 
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
            />
        </div>
    );
}
