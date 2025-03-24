import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; 
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: number;
    product_notification: 'read' | 'unread';  // ✅ Updated column name
    product_name: string;
    product_qty: number;  // ✅ Updated column name
    created_at: string;  // ✅ Added date & time
}

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);  // ✅ Loading state

    const fetchNotifications = () => {
        setLoading(true);
        fetch('/notifications')
            .then((res) => res.json())
            .then((data: Notification[]) => {
                setNotifications(data);
                setUnreadCount(data.length); // ✅ Use the length of the returned notifications

                // ✅ Save only the content messages to localStorage
                const notificationMessages = data.map(notification => 
                    `${notification.product_name} has only ${notification.product_qty} left!`
                );
                localStorage.setItem('notificationMessages', JSON.stringify(notificationMessages));
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error fetching notifications:', error);
                setLoading(false);
            });
    };

    useEffect(() => {
        // ✅ Load notification messages from localStorage on page load
        const savedMessages = localStorage.getItem('notificationMessages');
        if (savedMessages) {
            const parsedMessages: string[] = JSON.parse(savedMessages);
            setNotifications(parsedMessages.map((message, index) => ({
                id: index, // Temporary ID for rendering
                product_name: message.split(' has only ')[0],
                product_qty: parseInt(message.split(' has only ')[1].split(' ')[0], 10),
                product_notification: 'unread',
                created_at: new Date().toISOString() // Placeholder date
            })));
            setUnreadCount(parsedMessages.length);
        } else {
            fetchNotifications();
        }
    }, []);

    const handleBellClick = (event: React.MouseEvent) => {
        event.preventDefault();
        if (!showNotifications) {
            fetch('/notifications/mark-as-read', {  // ✅ Ensure this matches the route in web.php
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'success') {
                    const updatedNotifications = notifications.map(notification => ({
                        ...notification,
                        product_notification: 'read'
                    }));
                    setNotifications(updatedNotifications);
                    setUnreadCount(0);

                    // ✅ Clear localStorage since all notifications are marked as read
                    localStorage.removeItem('notificationMessages');
                }
            })
            .catch((error) => console.error('Error updating notification status:', error));
        }

        setShowNotifications(!showNotifications);
    };

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <div className="absolute top-4 right-4 flex items-center space-x-4">
                <button 
                    className="relative flex items-center justify-center" 
                    onClick={handleBellClick}
                >
                    <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Notification dropdown */}
            {showNotifications && (
                <div className="absolute top-12 right-0 w-72 bg-white shadow-lg rounded-lg p-3 z-50 border border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-black">Notifications</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto">  {/* ✅ Add scroll */}
                        {loading ? (  // ✅ Show loading state
                            <div className="p-2 text-sm text-gray-500">Loading notifications...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div key={notification.id} className="p-2 border-b last:border-none text-sm flex flex-col gap-1 text-black">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500 text-lg">⚠️</span>
                                        {notification.product_name} has only <strong>{notification.product_qty}</strong> left!  {/* ✅ Display low stock message */}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {new Date(notification.created_at).toLocaleString([], { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit', 
                                            hour: '2-digit', 
                                            minute: '2-digit', 
                                            hour12: true  // ✅ Show AM/PM format
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-2 text-sm text-gray-500">No notifications</div>
                        )}
                    </div>
                </div>
            )}

            {children}
        </AppLayoutTemplate>
    );
};
