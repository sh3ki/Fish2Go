import React, { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const offset = useRef({ x: 0, y: 0 });
    const isDragging = useRef(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isDragging.current && modalRef.current) {
                modalRef.current.style.left = `${e.clientX - offset.current.x}px`;
                modalRef.current.style.top = `${e.clientY - offset.current.y}px`;
            }
        };

        const handleMouseUp = () => {
            isDragging.current = false;
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        if (modalRef.current) {
            offset.current = {
                x: e.clientX - modalRef.current.getBoundingClientRect().left,
                y: e.clientY - modalRef.current.getBoundingClientRect().top,
            };
            isDragging.current = true;
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex justify-center items-center">
            <div
                ref={modalRef}
                className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-104 border-2 border-blue-500 relative cursor-move"
                onMouseDown={handleMouseDown}
                style={{ position: 'absolute' }}
            >
                <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-500"
                    onClick={onClose}
                >
                    &times;
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default Modal;