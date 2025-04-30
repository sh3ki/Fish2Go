import React from "react";

interface ConfirmLogoutProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ConfirmLogout({ isOpen, onClose, onConfirm }: ConfirmLogoutProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg shadow-lg w-[400px] md:w-[500px] lg:w-[600px] text-center">
                <h2 className="text-2xl font-semibold text-gray-800">Confirm Logout</h2>
                <p className="text-gray-600 mt-2">Are you sure you want to log out?</p>
                <div className="flex justify-center gap-6 mt-6">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg"
                    >
                        No
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
}
