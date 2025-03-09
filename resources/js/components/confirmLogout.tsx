import React from "react";

interface ConfirmLogoutProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ConfirmLogout({ isOpen, onClose, onConfirm }: ConfirmLogoutProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Confirm Logout</h2>
                <p className="text-gray-600 mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-center gap-4">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    );
}
