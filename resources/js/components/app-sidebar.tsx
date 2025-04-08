import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, updateDoc, getDocs } from "firebase/firestore";
import { Link } from "@inertiajs/react";
import { LayoutGrid, ShoppingCart, ClipboardList, PhilippinePeso, HandCoins, Users, SquarePercent, MessageCircleMore } from "lucide-react";
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
        { title: "Inventory", url: "/admin/inventory", icon: ShoppingCart },
        { title: "Products", url: "/admin/products", icon: ClipboardList },
        { title: "Sales", url: "/admin/sales", icon: PhilippinePeso },
        { title: "Expenses", url: "/admin/expenses", icon: HandCoins },
        { title: "Staff Management", url: "/admin/staffmanagement", icon: Users },
        { title: "Promotions", url: "/admin/promotions", icon: SquarePercent },
        { title: "Summary", url: "/admin/summary", icon: SquarePercent },
        { 
            title: "Messages", 
            url: "/admin/messages", 
            icon: MessageCircleMore,
            count: newMessageCount > 0 ? newMessageCount : null,
            onClick: markMessagesAsSeen // 👈 Reset count on click
        }
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
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
