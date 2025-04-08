import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FullScreenPromptProps {
    onFullScreenChange?: (isFullScreen: boolean) => void;
}

export default function FullScreenPrompt({ onFullScreenChange }: FullScreenPromptProps) {
    const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
    const [showPrompt, setShowPrompt] = useState<boolean>(true);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullScreen(true);
                setShowPrompt(false);
                localStorage.setItem('staffFullScreenMode', 'true');
                if (onFullScreenChange) onFullScreenChange(true);
            }).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        }
    };

    useEffect(() => {
        const wasInFullScreen = localStorage.getItem('staffFullScreenMode') === 'true';
        if (wasInFullScreen) {
            setShowPrompt(false);
        }

        const handleKeyDown = () => {
            if (!document.fullscreenElement) {
                toggleFullScreen();
            }
        };

        if (!document.fullscreenElement) {
            window.addEventListener('keydown', handleKeyDown, { once: true });
        }

        const handleFullscreenChange = () => {
            const newFullScreenState = !!document.fullscreenElement;
            setIsFullScreen(newFullScreenState);
            if (!newFullScreenState) {
                setShowPrompt(true);
            }
            if (onFullScreenChange) {
                onFullScreenChange(newFullScreenState);
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [onFullScreenChange]);

    if (!showPrompt) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
            onClick={toggleFullScreen}
            onTouchStart={toggleFullScreen}
        >
            <div 
                className="bg-gray-800 p-6 rounded-xl max-w-md text-center"
                onClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4 text-white">Tap anywhere or press any key to enter full-screen mode</h2>
                <p className="text-gray-300 mb-6">For the best experience, this application works in full-screen mode.</p>
                <Button
                    className="bg-blue-500 hover:bg-blue-600"
                    onClick={toggleFullScreen}
                >
                    Enter Full-Screen Mode
                </Button>
            </div>
        </div>
    );
}
