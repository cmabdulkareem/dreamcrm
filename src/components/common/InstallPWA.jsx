import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const InstallPWA = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        // Better iOS detection
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
            (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            window.navigator.standalone === true;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isSecure = window.isSecureContext;
        const isInAppBrowser = /FBAN|FBAV|Instagram|LinkedIn|Twitter|WhatsApp/i.test(navigator.userAgent);



        if (isInAppBrowser && !isStandalone && !sessionStorage.getItem('pwa_prompt_shown')) {
            sessionStorage.setItem('pwa_prompt_shown', 'true');
            toast.warning("You are using an in-app browser. For the best experience and to install this app, please open this link in your phone's main browser (Chrome or Safari).", {
                position: "top-center",
                autoClose: 10000
            });
        }

        if (!isSecure && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            console.warn('[PWA] PWA features require HTTPS when not on localhost.');
        }

        let iosTimer;
        let installPromptTimer;

        // Show iOS prompt after a short delay
        if (isIOS && !isStandalone && !sessionStorage.getItem('pwa_prompt_shown')) {
            iosTimer = setTimeout(() => {
                console.log('[PWA] iOS detected, showing instructions');
                showIOSInstallPrompt();
            }, 3000);
        }

        const handler = (e) => {
            console.log('%c[PWA] beforeinstallprompt event fired!', 'color: #12b76a; font-weight: bold;');
            // Prevent Chrome from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            if (!isStandalone && !sessionStorage.getItem('pwa_prompt_shown')) {
                installPromptTimer = setTimeout(() => {
                    console.log('[PWA] Showing custom install prompt');
                    showInstallPrompt(e);
                }, 2000);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Some browsers might have already fired the event
        // though usually unlikely for a React component mount
        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
            if (iosTimer) clearTimeout(iosTimer);
            if (installPromptTimer) clearTimeout(installPromptTimer);
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
