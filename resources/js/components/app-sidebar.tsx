import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, updateDoc, getDocs } from "firebase/firestore";
import { Link } from "@inertiajs/react";
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
    const [newMessageCount, setNewMessageCount] = useState(0);

    useEffect(() => {
        const q = query(collection(db, "messages"), where("seen", "==", false));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNewMessageCount(snapshot.size); // Count only unseen messages
        });

        return () => unsubscribe();
    }, []);

    // ✅ Function to mark all messages as seen when clicked
    const markMessagesAsSeen = async () => {
        const q = query(collection(db, "messages"), where("seen", "==", false));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach(async (doc) => {
            await updateDoc(doc.ref, { seen: true });
        });

        setNewMessageCount(0); // Reset the counter after marking as seen
    };

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
            icon: MessageCircleMore,
            count: newMessageCount > 0 ? newMessageCount : null,
            onClick: markMessagesAsSeen
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
