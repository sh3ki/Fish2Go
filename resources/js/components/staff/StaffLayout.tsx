import AppLogoIcon from '@/components/app-logo-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ConfirmLogout from '@/components/confirm-logout';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useInitials } from '@/hooks/use-initials';
import { db } from '@/lib/firebase'; // Firestore DB
import { cn } from '@/lib/utils';
import { router, useForm, usePage } from '@inertiajs/react';
import { collection, getDocs, onSnapshot, query, setDoc, where, orderBy } from 'firebase/firestore';
import { CookingPot, HardDrive, ClipboardList, Wallet, ReceiptText, ChefHat, CreditCard, LogOut, MessageCircleMore, Truck } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import axios from 'axios';
import { BreadcrumbItem } from '@/types';

interface StaffLayoutProps {
    breadcrumbs?: BreadcrumbItem[];
    children: ReactNode;
}

export default function StaffLayout({ breadcrumbs, children }: StaffLayoutProps) {
    const { post } = useForm();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
    const page = usePage();
    const { auth } = page.props as unknown as { auth: { user: { avatar: string; name: string } } };
    const currentUrl = page.url; // new: used to highlight active page
    const getInitials = useInitials();

    const handleLogout = async () => {
        try {
            await axios.post('/logout');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout failed', error);
        }
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
            document.documentElement.requestFullscreen();
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

    // 🔥 Message notification dot for avatar (same logic as admin sidebar)
    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        // Listen to all chats where the current staff user is a participant
        // (Assume staff user id is available as auth.user.id)
        const staffUserId = auth?.user?.id;
        if (!staffUserId) return;

        const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", staffUserId));
        let unsubMessages: (() => void)[] = [];

        const unsubscribeChats = onSnapshot(chatsQuery, (chatsSnap) => {
            unsubMessages.forEach(unsub => unsub());
            unsubMessages = [];

            const chatIds = chatsSnap.docs.map(doc => doc.id);
            if (chatIds.length === 0) {
                setHasUnread(false);
                return;
            }

            let foundUnread = false;
            let processed = 0;

            chatIds.forEach(chatId => {
                // Listen only to the last message in each chat
                const lastMsgQuery = query(
                    collection(db, "chats", chatId, "messages"),
                    orderBy("timestamp", "desc")
                );
                const unsub = onSnapshot(lastMsgQuery, (msgSnap) => {
                    const lastMsgDoc = msgSnap.docs[0];
                    if (lastMsgDoc) {
                        const data = lastMsgDoc.data();
                        // Only if the last message is not sent by the current user and not seen by the current user
                        if (data.senderId !== staffUserId && !(data.seenBy || []).includes(staffUserId)) {
                            foundUnread = true;
                        }
                    }
                    processed += 1;
                    if (processed === chatIds.length) {
                        setHasUnread(foundUnread);
                        foundUnread = false;
                        processed = 0;
                    }
                });
                unsubMessages.push(unsub);
            });

            if (chatIds.length === 0) {
                setHasUnread(false);
            }
        });

        return () => {
            unsubscribeChats();
            unsubMessages.forEach(unsub => unsub());
        };
    }, [auth?.user?.id]);

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
                        <span className="mb-0.5 truncate leading-none font-semibold">Fredo's Grilling </span>
                    </div>
                </div>

                <h1 className="flex-1 text-center text-base font-semibold text-black dark:text-white">
                    {page.url === '/staff/cook'
                        ? 'Cook Products'
                        : page.url === '/staff/transactions'
                        ? 'Transaction History'
                        : page.url === '/staff/expenses'
                        ? 'Expense Management'
                        : page.url === '/staff/products'
                        ? 'Product Management'
                        : page.url === '/staff/inventory'
                        ? 'Inventory Management'
                        : page.url === '/staff/delivery'
                        ? 'Delivery Management'
                        : page.url === '/staff/messages'
                        ? 'Messages'
                        : page.url === '/staff/summary'
                        ? 'Sales Summary'
                        : 'Point of Sales'}
                </h1>

                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 rounded-full p-1 relative">
                            <span className="relative inline-block">
                                <Avatar className="size-6 overflow-hidden rounded-full">
                                    <AvatarImage src={auth.user.avatar} alt={auth.user.name} />
                                    <AvatarFallback className="rounded-lg bg-neutral-200 text-xs text-black dark:bg-neutral-700 dark:text-white">
                                        {getInitials(auth.user.name)}
                                    </AvatarFallback>
                                </Avatar>
                                {hasUnread && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none z-10">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </span>
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
                            <HardDrive size={18} /> POS
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/cook' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.cook'))}
                        >
                            <CookingPot size={18} /> Cook
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/transactions' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.transactions'))}
                        >
                            <ReceiptText size={18} /> Transactions
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/products' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.products'))}
                        >
                            <ChefHat size={18} /> Products
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/expenses' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.expenses'))}
                        >
                            <CreditCard size={18} /> Expenses
                        </button>
                        <button
                            className={`flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700 ${currentUrl === '/staff/inventory' ? 'bg-gray-800' : ''}`}
                            onClick={() => router.get(route('staff.inventory'))}
                        >
                            <ClipboardList size={18} /> Inventory
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
                            <Wallet size={18} /> Summary
                        </button>

                        {/* 🔥 Messages with Unread Count */}
                        <button
                            className="relative flex w-full items-center gap-2 p-2 text-left hover:bg-gray-700"
                            onClick={() => {
                                handleMessagesClick();
                                router.get(route('staff.messages'));
                            }}
                        >
                            <span className="relative">
                                <MessageCircleMore size={18} />
                                {hasUnread && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3 pointer-events-none z-10">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </span>
                            Messages
                            {unreadCount > 0 && (
                                <span className="absolute right-3 ml-2 rounded-full bg-red-500 px-2 py-1 text-xs font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        <button
                            className="flex w-full items-center gap-2 p-2 text-left text-red-400 hover:bg-gray-700"
                            onClick={() => {
                                setIsLogoutModalOpen(true);
                                setIsDropdownOpen(false);
                            }}
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
