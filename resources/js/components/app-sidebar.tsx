import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { Link, usePage } from "@inertiajs/react";
import {
    LayoutGrid, Users, SquarePercent,
    ClipboardList, ChefHat, ReceiptText, CreditCard, Wallet, MessageCircleMore,
    ShoppingCart, PhilippinePeso, HandCoins
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { NavFooter } from "@/components/nav-footer";
import { NavUser } from "@/components/nav-user";
import AppLogo from "./app-logo";

export function AppSidebar() {
    // Get current user from Inertia page props
    const { auth } = usePage().props as any;
    const currentUserId = auth?.user?.id;

    const [hasUnread, setHasUnread] = useState(false);

    useEffect(() => {
        if (!currentUserId) return;

        const chatsQuery = query(collection(db, "chats"), where("participants", "array-contains", currentUserId));
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
                    orderBy("timestamp", "desc"),
                );
                const unsub = onSnapshot(lastMsgQuery, (msgSnap) => {
                    // Only check the latest message
                    const lastMsgDoc = msgSnap.docs[0];
                    if (lastMsgDoc) {
                        const data = lastMsgDoc.data();
                        // Only if the last message is not sent by the current user and not seen by the current user
                        if (data.senderId !== currentUserId && !(data.seenBy || []).includes(currentUserId)) {
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
    }, [currentUserId]);

    const mainNavItems = [
        { title: "Dashboard", url: "/admin/dashboard", icon: LayoutGrid },
        { title: "Transactions", url: "/admin/sales", icon: ReceiptText }, 
        { title: "Inventory", url: "/admin/inventory", icon: ClipboardList }, 
        { title: "Products", url: "/admin/products", icon: ChefHat }, 
        { title: "Expenses", url: "/admin/expenses", icon: CreditCard }, 
        { title: "Summary", url: "/admin/summary", icon: Wallet }, 
        {
            title: "Messages",
            url: "/admin/messages",
            icon: (props: any) => (
                <span className="relative flex items-center justify-center">
                    <MessageCircleMore
                        {...props}
                        size={props.size ?? 20}
                        className={props.className ?? "w-5 h-5"}
                    />
                    {hasUnread && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </span>
            ),
        }
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={[]} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
