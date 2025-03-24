import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const page = usePage();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const messagesRef = collection(db, "messages");

        // ✅ Count messages where seenbyadmin is false
        const unreadMessagesQuery = query(messagesRef, where("seenbyadmin", "==", false));

        const unsubscribe = onSnapshot(unreadMessagesQuery, (snapshot) => {
            setUnreadCount(snapshot.size);
        });

        return () => unsubscribe();
    }, []);

    const handleMessagesClick = async () => {
        const messagesRef = collection(db, "messages");

        // ✅ Get messages where seenbyadmin is false
        const unreadMessagesQuery = query(messagesRef, where("seenbyadmin", "==", false));

        const snapshot = await getDocs(unreadMessagesQuery);
        snapshot.forEach(async (messageDoc) => {
            await updateDoc(doc(db, "messages", messageDoc.id), { seenbyadmin: true }); // ✅ Mark as seen by admin
        });

        // ✅ Immediately set count to zero to prevent flickering
        setUnreadCount(0);
    };

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.url === page.url}>
                            <Link href={item.url} prefetch onClick={item.title === "Messages" ? handleMessagesClick : undefined}>
                                {item.icon && <item.icon />}
                                <span>{item.title}</span>

                                {/* 🔴 Show unread count for "Messages" */}
                                {item.title === "Messages" && unreadCount > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                        {unreadCount}
                                    </span>
                                )}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
