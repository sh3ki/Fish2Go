import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout'; 
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface Notification {
    id: number;
    notification_status: 'read' | 'unread';
    product_name: string;
    product_quantity: number;
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
        setLoading(true);  // ✅ Start loading
        fetch('/notifications')
            .then((res) => res.json())
            .then((data: Notification[]) => {
                setNotifications(data);
                setUnreadCount(data.filter(notification => notification.notification_status === 'unread').length);
                setLoading(false);  // ✅ Stop loading
            })
            .catch((error) => {
                console.error('Error fetching notifications:', error);
                setLoading(false);  // ✅ Stop loading even if failed
            });
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleBellClick = () => {
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
                    setNotifications(prevNotifications =>
                        prevNotifications.map(notification => ({
                            ...notification,
                            notification_status: 'read'
                        }))
                    );
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

                    <div className="max-h-60 overflow-y-auto">  {/* ✅ Add scroll */}
                        {loading ? (  // ✅ Show loading state
                            <div className="p-2 text-sm text-gray-500">Loading notifications...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div key={notification.id} className="p-2 border-b last:border-none text-sm flex flex-col gap-1 text-black">
                                    <div className="flex items-center gap-2">
                                        <span className="text-yellow-500 text-lg">⚠️</span>
                                        {notification.product_name} has only <strong>{notification.product_quantity}</strong> left!
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
