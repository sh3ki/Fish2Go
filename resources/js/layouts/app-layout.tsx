import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode, useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => {
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        fetch('/notifications') // Ensure this matches your web.php route
            .then((res) => res.json())
            .then((data) => {
                setLowStockProducts(data);
            })
            .catch((error) => console.error('Error fetching notifications:', error));
    }, []);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            <div className="absolute top-4 right-4 flex items-center space-x-4">
                <button 
                    className="relative flex items-center justify-center" 
                    onClick={() => setShowNotifications(!showNotifications)}
                >
                    <Bell className="w-6 h-6 text-gray-600 cursor-pointer" />
                    {lowStockProducts.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                            {lowStockProducts.length}
                        </span>
                    )}
                </button>
            </div>
            
            {/* Notification dropdown */}
            {showNotifications && (
                <div className="absolute top-12 right-0 w-64 bg-white shadow-lg rounded-lg p-2 z-50 border border-gray-300">
                    {lowStockProducts.length > 0 ? (
                        lowStockProducts.map((product) => (
                            <div key={product.id} className="p-2 border-b last:border-none text-sm flex items-center gap-2 text-black">
                                <span className="text-yellow-500 text-lg">⚠️</span> {product.product_name} has only <strong>{product.product_quantity}</strong> left!
                            </div>
                        ))
                    ) : (
                        <div className="p-2 text-sm text-gray-500">No low-stock products</div>
                    )}
                </div>
            )}
            {children}
        </AppLayoutTemplate>
    );
};
