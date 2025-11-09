
import React, { useState, useEffect } from 'react';
import { FullscreenEnterIcon, FullscreenExitIcon } from './Icons.js';

const Header = () => {
    const [isFullscreen, setIsFullscreen] = useState(false);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    return (
        <>
            <div className="absolute top-2 right-2 z-20">
                <button onClick={toggleFullScreen} title="Plein écran" className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                    {isFullscreen ? <FullscreenExitIcon /> : <FullscreenEnterIcon />}
                </button>
            </div>
            <header className="text-center mb-2">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-1">🎸 GIA Navigator</h1>
                <p className="text-md text-gray-400">Votre plan d'action visuel pour l'improvisation.</p>
            </header>
        </>
    );
};

export default Header;