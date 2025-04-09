import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; 
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: number;
    product_notification: 'read' | 'unread';
    product_name: string;
    product_qty: number;
    created_at: string;
    notification_count?: number; // added optional field
    notification_time?: string; // added optional field
}

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = () => {
        setLoading(true);
        fetch('/notifications')
            .then((res) => res.json())
            .then((data: Notification[]) => {
                const now = new Date();
                const updatedData = data.map(notification => {
                    const notificationTime = Math.floor((now.getTime() - new Date(notification.created_at).getTime()) / 60000);
                    return {
                        ...notification,
                        notification_time: notificationTime < 60 
                            ? `${notificationTime} Minutes Ago` 
                            : `${Math.floor(notificationTime / 60)} Hours Ago`
                    };
                });
                setNotifications(updatedData);
                const unreadCount = updatedData.filter(notification => notification.product_notification === 'unread').length;
                setUnreadCount(unreadCount);
                setLoading(false);
            });
    };

    useEffect(() => {
        // Always fetch fresh notifications from the API.
        fetchNotifications();
    }, []);

    const handleBellClick = (event: React.MouseEvent) => {
        event.preventDefault();
        if (!showNotifications) {
            fetch('/notifications/mark-as-read', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
            })
            .then((res) => res.json())
            .then((data) => {
                if (data.status === 'success') {
                    // Update local notifications and clear unread count
                    const updatedNotifications = notifications.map(notification => ({
                        ...notification,
                        product_notification: 'read'
                    }));
                    setNotifications(updatedNotifications);
                    setUnreadCount(0);
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

                    <div className="max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-2 text-sm text-gray-500">Loading notifications...</div>
                        ) : notifications.length > 0 ? (
                            // Sort notifications so the most recent appear first.
                            [...notifications].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((notification) => (
                                    <div key={notification.id} className="p-2 border-b last:border-none text-sm flex flex-col gap-1 text-black">
                                        <div className="flex items-center gap-2">
                                            <span className="text-yellow-500 text-lg">⚠️</span>
                                            {notification.product_name} has only <strong>{notification.product_qty}</strong> left!
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {notification.notification_time}
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
