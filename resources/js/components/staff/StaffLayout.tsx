import AppLogoIcon from '@/components/app-logo-icon';
import ConfirmLogout from '@/components/ConfirmLogout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { db } from '@/lib/firebase'; // Firestore DB
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { collection, getDocs, onSnapshot, query, setDoc, where } from 'firebase/firestore';
import { CookingPot, CreditCard, Folder, HandCoins, LogOut, MessageCircleMore, NotebookPen, PhilippinePeso, ShoppingCart, Truck } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

interface StaffLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function StaffLayout({ breadcrumbs, children }: StaffLayoutProps) {
    const { post } = useForm();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const page = usePage();
    const { auth } = page.props as unknown as { auth: { user: { avatar: string; name: string } } };
    const currentUrl = page.url; // new: used to highlight active page
    const getInitials = useInitials();

    const handleLogout = () => {
        post(route('logout'));
    };

    // 🔥 Message Count for Unseen Messages by Staff
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const messagesRef = collection(db, 'messages');
        const unreadMessagesQuery = query(messagesRef, where('seenbystaff', '==', false));

        const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    const handleMessagesClick = async () => {
        const messagesRef = collection(db, 'messages');
        const unreadMessagesQuery = query(messagesRef, where('seenbystaff', '==', false));

        const snapshot = await getDocs(unreadMessagesQuery);
        snapshot.forEach((doc) => {
            const messageDoc = doc.ref;
            setDoc(messageDoc, { seenbystaff: true }, { merge: true }); // ✅ Mark as seen by staff
        });

        setUnreadCount(0); // ✅ Reset the count
    };

    // Check for full-screen mode on component mount
    useEffect(() => {
        const shouldBeFullScreen = localStorage.getItem('staffFullScreenMode') === 'true';
        
        if (shouldBeFullScreen && !document.fullscreenElement) {
            // Try to enter full-screen mode automatically
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
        
        // Monitor full-screen changes
        const handleFullscreenChange = () => {
            // If user manually exits full-screen mode, update localStorage
            if (!document.fullscreenElement) {
                localStorage.removeItem('staffFullScreenMode');
            } else {
                localStorage.setItem('staffFullScreenMode', 'true');
            }
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    return (
        <div className="flex min-h-screen flex-col">
            {/* Header Section */}
            <header className={cn('flex items-center justify-between border-b p-1 shadow-sm', 'bg-sidebar dark:bg-dark-sidebar')}>
                {/* Logo */}
                <div className="flex items-center space-x-2">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-md">
                        <AppLogoIcon className="size-5 fill-current text-white dark:text-black" />
                    </div>
                    <div className="ml-1 grid flex-1 text-left text-sm">
                        <span className="mb-0.5 truncate leading-none font-semibold">Fish2Go</span>
                    </div>
                </div>

                <h1 className="flex-1 text-center text-base font-semibold text-black dark:text-white">
                    {page.url === '/staff/cook'
                        ? 'Cooks'
                        : page.url === '/staff/transactions'
                        ? 'Transactions'
                        : page.url === '/staff/expenses'
                        ? 'Expenses'
                        : page.url === '/staff/products'
                        ? 'Products'
                        : page.url === '/staff/inventory'
                        ? 'Inventories'
                        : page.url === '/staff/delivery'
                        ? 'Deliveries'
                        : page.url === '/staff/messages'
                        ? 'Messages'
                        : page.url === '/staff/summary'
                        ? 'Summary'
                        : 'Point of Sales'}
                </h1>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 rounded-full p-1">
                            <Avatar className="size-6 overflow-hidden rounded-full">
                                <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                    {getInitials(auth.user.name)}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className={cn(
                            'bg-sidebar dark:bg-dark-sidebar w-40 text-sm',
                            'text-black dark:text-white' // ✅ Adjust text color based on theme
                        )}
                        align="end"
                    >
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/pos' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.pos'))}
                        >
                            <HandCoins size={18} /> POS
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/cook' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.cook'))}
                        >
                            <CookingPot size={18} /> Cook
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/expenses' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.expenses'))}
                        >
                            <PhilippinePeso size={18} /> Expenses
                        </button>
                        {/* <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/products' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.products'))}
                        >
                            <ShoppingCart size={18} /> Products
                        </button> */}
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/inventory' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.inventory'))}
                        >
                            <Folder size={18} /> Inventory
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/transactions' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.transactions'))}
                        >
                            <CreditCard size={18} /> Transactions
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/delivery' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.delivery'))}
                        >
                            <Truck size={18} /> Delivery
                        </button>

                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/summary' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.summary'))}
                        >
                            <CreditCard size={18} /> Summary
                        </button>

                        {/* 🔥 Messages with Unread Count */}
                        <button
                            className="relative flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700"
                            onClick={() => {
                                handleMessagesClick(); // ✅ Update seenbystaff on click
                                router.get(route('staff.messages')); // ✅ Navigate to messages page
                            }}
                        >
                            <MessageCircleMore size={18} /> Messages
                            {unreadCount > 0 && (
                                <span className="absolute right-3 ml-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            className="flex w-full items-center gap-2 p-2 text-left text-red-400 hover:bg-gray-700"
                            onClick={() => setIsLogoutModalOpen(true)}
                        >
                            <LogOut size={18} /> Logout
                        </button>
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {breadcrumbs && (
                    <nav>
                        <ul className="flex space-x-2">
                            {breadcrumbs.map((breadcrumb, index) => (
                                <li key={index}>{index < breadcrumbs.length - 1 && <span className="mx-2">/</span>}</li>
                            ))}
                        </ul>
                    </nav>
                )}
                {children}
            </main>

            {/* Confirm Logout Modal */}
            <ConfirmLogout isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} onConfirm={handleLogout} />
        </div>
    );
}
