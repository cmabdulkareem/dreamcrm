import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 1024;
        const isSecure = window.isSecureContext;

        console.log('[PWA Debug]', { isIOS, isStandalone, isMobile, isSecure, location: window.location.href });

        if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.warn('[PWA] PWA features require HTTPS when not on localhost.');
        }

        if (isIOS && isMobile && !isStandalone && !sessionStorage.getItem('pwa_prompt_shown')) {
            console.log('[PWA] Triggering iOS specific prompt');
            showIOSInstallPrompt();
        }

        const handler = (e) => {
            console.log('[PWA] beforeinstallprompt event fired');
            // Prevent Chrome from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            if (isMobile && !isStandalone && !sessionStorage.getItem('pwa_prompt_shown')) {
                showInstallPrompt(e);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const showIOSInstallPrompt = () => {
        if (sessionStorage.getItem('pwa_prompt_shown')) return;
        sessionStorage.setItem('pwa_prompt_shown', 'true');

        toast.info(
            <div className="flex flex-col gap-2 p-1 text-left">
                <p className="font-bold text-gray-800 dark:text-white">Install DreamCRM on iOS</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                    Tap the <span className="font-bold">Share</span> button (the square with an arrow) and then select <span className="font-bold">Add to Home Screen</span>.
                </p>
                <div className="flex justify-end mt-1">
                    <button
                        onClick={() => toast.dismiss()}
                        className="bg-brand-500 text-white px-3 py-1.5 rounded text-xs font-semibold"
                    >
                        Got it
                    </button>
                </div>
            </div>,
            {
                position: "bottom-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                className: 'dark:bg-gray-805 bg-white border border-gray-100 dark:border-gray-700 shadow-xl'
            }
        );
    };

    const showInstallPrompt = (e) => {
        // Only show if we haven't shown it yet this session
        if (sessionStorage.getItem('pwa_prompt_shown')) return;

        sessionStorage.setItem('pwa_prompt_shown', 'true');

        toast.info(
            <div className="flex flex-col gap-2 p-1 text-left">
                <p className="font-bold text-gray-800 dark:text-white">Install DreamCRM App</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">Get a better mobile experience and faster access by installing our app.</p>
                <div className="flex gap-2 justify-end mt-1">
                    <button
                        onClick={() => toast.dismiss()}
                        className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
                    >
                        Later
                    </button>
                    <button
                        onClick={() => handleInstall(e)}
                        className="bg-brand-500 text-white px-3 py-1.5 rounded text-xs font-semibold hover:bg-brand-600 transition-colors shadow-sm"
                    >
                        Install
                    </button>
                </div>
            </div>,
            {
                position: "bottom-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                className: 'dark:bg-gray-805 bg-white border border-gray-100 dark:border-gray-700 shadow-xl'
            }
        );
    };

    const handleInstall = async (e) => {
        if (!e) return;
        // Show the prompt
        e.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await e.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        toast.dismiss();
    };

    return null;
};

export default InstallPWA;
