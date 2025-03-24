import { useEffect, useState } from "react";

export default function AppLogoIcon(props: React.ImgHTMLAttributes<HTMLImageElement>) {
    const [logo, setLogo] = useState("/images/f2g.png");

    useEffect(() => {
        const updateLogo = () => {
            const isDarkMode = document.documentElement.classList.contains("dark");
            setLogo(isDarkMode ? "/images/f2g.png" : "/images/f2g_logo_white.png");
        };

        updateLogo(); // Set on mount
        const observer = new MutationObserver(updateLogo);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    return (
        <img 
            {...props} 
            src={logo} 
            alt="App Logo" 
            className="h-7 w-auto max-h-12 max-w-full"
            style={{ filter: document.documentElement.classList.contains("dark") ? "brightness(0.8)" : "none" }}
        />
    );
}