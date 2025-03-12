import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: number;
    notification_status: 'read' | 'unread';
    product_name: string;
    product_quantity: number;
}

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetch('/notifications')
            .then((res) => res.json())
            .then((data: Notification[]) => {
                setNotifications(data);
                setUnreadCount(data.filter(notification => notification.notification_status === 'unread').length);
            })
            .catch((error) => console.error('Error fetching notifications:', error));
    }, []);

    const handleBellClick = () => {
        setShowNotifications(!showNotifications);
    };

    const handleMarkAsRead = () => {
        fetch('/notifications/mark-as-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
        .then((res) => res.json())
        .then((data) => {
            if (data.status === 'success') {
                setUnreadCount(0); // Reset UI count
                setNotifications(prevNotifications =>
                    prevNotifications.map(notification => ({
                        ...notification,
                        notification_status: 'read'
                    }))
                );
            }
        })
        .catch((error) => console.error('Error updating notification status:', error));
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
                <div className="absolute top-12 right-0 w-64 bg-white shadow-lg rounded-lg p-2 z-50 border border-gray-300">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold">Notifications</span>
                        <button 
                            className="text-sm text-blue-500 hover:underline"
                            onClick={handleMarkAsRead}
                        >
                            Mark as Read
                        </button>
                    </div>
                    {notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div key={notification.id} className="p-2 border-b last:border-none text-sm flex items-center gap-2 text-black">
                                <span className="text-yellow-500 text-lg">⚠️</span> {notification.product_name} has only <strong>{notification.product_quantity}</strong> left!
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-gray-500">No notifications</div>
                    )}
                </div>
            )}
            {children}
        </AppLayoutTemplate>
    );
};