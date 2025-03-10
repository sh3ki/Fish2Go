import { DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { UserInfo } from '@/components/user-info';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { type User } from '@/types';
import { Link, router } from '@inertiajs/react';
import { LogOut, Settings } from 'lucide-react';
import { useState } from 'react';
import ConfirmLogout from '@/components/ConfirmLogout'; // Ensure correct case-sensitive path

interface UserMenuContentProps {
    user: User;
}

export function UserMenuContent({ user }: UserMenuContentProps) {
    const cleanup = useMobileNavigation();
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const handleLogout = () => {
        router.post(route('logout')); // Inertia.js recommended way to logout
    };

    return (
        <>
            <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UserInfo user={user} showEmail={true} />
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
                <DropdownMenuItem asChild>
                    <Link className="block w-full" href={route('profile.edit')} as="button" prefetch onClick={cleanup}>
                        <Settings className="mr-2" />
                        Settings
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            
            {/* Fix: Proper Logout Button without `asChild` */}
            <DropdownMenuItem 
                onSelect={(e) => {
                    e.preventDefault(); // Prevent dropdown from closing automatically
                    cleanup(); // Close menu manually
                    setIsLogoutModalOpen(true); // Open modal
                }}
                className="cursor-pointer"
            >
                <LogOut className="mr-2" />
                Log out
            </DropdownMenuItem>

            {/* Logout Confirmation Modal */}
            <ConfirmLogout
                isOpen={isLogoutModalOpen}
                onClose={() => setIsLogoutModalOpen(false)}
                onConfirm={handleLogout}
            />
        </>
    );
}
