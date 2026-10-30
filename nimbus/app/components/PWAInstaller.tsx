"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LuDownload, LuX, LuSmartphone, LuShare } from "react-icons/lu";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isInstallable, setIsInstallable] = useState<boolean>(false);
    const [isInstalled, setIsInstalled] = useState<boolean>(false);
    const [showBanner, setShowBanner] = useState<boolean>(false);
    const [isIOS, setIsIOS] = useState<boolean>(false);
    const [showIOSGuide, setShowIOSGuide] = useState<boolean>(false);

    useEffect(() => {
        // Register Service Worker
        if (typeof window !== "undefined" && 'serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then((reg) => {
                        console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);
                    })
                    .catch((err) => {
                        console.warn('[PWA] Service Worker registration failed:', err);
                    });
            });
        }

        // Check standalone / installed mode
        if (typeof window !== "undefined") {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
            if (isStandalone) {
                setIsInstalled(true);
                return;
            }

            // Detect iOS
            const userAgent = window.navigator.userAgent.toLowerCase();
            const iosDevice = /iphone|ipad|ipod/.test(userAgent);
            setIsIOS(iosDevice);

            // Listen for beforeinstallprompt
            const handleBeforeInstallPrompt = (e: Event) => {
                e.preventDefault();
                setDeferredPrompt(e as BeforeInstallPromptEvent);
                setIsInstallable(true);

                // Show discreet banner after 3 seconds if not dismissed previously
                const dismissed = localStorage.getItem('ciphervault_pwa_dismissed');
                if (!dismissed) {
                    setTimeout(() => setShowBanner(true), 3000);
                }
            };

            const handleAppInstalled = () => {
                setIsInstalled(true);
                setIsInstallable(false);
                setShowBanner(false);
                setDeferredPrompt(null);
                console.log('[PWA] CipherVault app was installed!');
            };

            const handleTriggerInstall = () => {
                handleInstallClick();
            };

            window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.addEventListener('appinstalled', handleAppInstalled);
            window.addEventListener('ciphervault-trigger-install', handleTriggerInstall);

            return () => {
                window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
                window.removeEventListener('appinstalled', handleAppInstalled);
                window.removeEventListener('ciphervault-trigger-install', handleTriggerInstall);
            };
        }
    }, [deferredPrompt, isIOS]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSGuide(true);
            return;
        }

        if (!deferredPrompt) {
            // If prompt not yet available, show instructions
            alert("To install CipherVault on your device:\n\n• On Chrome/Edge (Desktop): Click the install icon in the address bar (⊕).\n• On Android: Tap the 3-dots menu and select 'Install app' or 'Add to Home screen'.\n• On iOS Safari: Tap the Share button and select 'Add to Home Screen'.");
            return;
        }

        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                console.log('[PWA] User accepted installation prompt');
                setIsInstalled(true);
                setShowBanner(false);
            }
            setDeferredPrompt(null);
        } catch (err) {
            console.error('[PWA] Installation failed:', err);
        }
    };

    const handleDismiss = () => {
        setShowBanner(false);
        localStorage.setItem('ciphervault_pwa_dismissed', 'true');
    };

    if (isInstalled) return null;

    return (
        <>
            {/* 1. Floating Bottom Install Toast / Banner */}
            <AnimatePresence>
                {showBanner && isInstallable && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.95 }}
                        className="fixed bottom-6 left-4 md:left-6 z-50 max-w-sm w-full bg-[#202327]/95 backdrop-blur-xl border border-[#B8FE00]/40 rounded-2xl p-4 shadow-[0_20px_45px_rgba(0,0,0,0.8)] flex items-center justify-between gap-3 text-white"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0720C6] border border-[#B8FE00]/30 flex items-center justify-center text-[#B8FE00] shrink-0">
                                <LuSmartphone size={20} />
                            </div>
                            <div>
                                <h4 className="font-display font-extrabold text-sm uppercase text-white">
                                    INSTALL CIPHERVAULT
                                </h4>
                                <p className="text-[11px] font-mono text-white/60">
                                    Fast standalone access & background persistence.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={handleInstallClick}
                                className="px-3 py-1.5 bg-[#B8FE00] text-[#16181B] text-xs font-mono font-bold uppercase rounded-lg hover:bg-white transition-all shadow-md"
                            >
                                INSTALL
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="p-1.5 text-white/40 hover:text-white transition-colors"
                            >
                                <LuX size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. iOS Add to Home Screen Instructions Modal */}
            <AnimatePresence>
                {showIOSGuide && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#202327] border border-white/20 rounded-2xl p-6 max-w-sm w-full text-white shadow-2xl space-y-4"
                        >
                            <div className="flex items-center justify-between">
                                <h3 className="font-display font-bold text-lg uppercase text-white">
                                    INSTALL ON IOS
                                </h3>
                                <button
                                    onClick={() => setShowIOSGuide(false)}
                                    className="p-1 text-white/50 hover:text-white"
                                >
                                    <LuX size={18} />
                                </button>
                            </div>
                            <p className="text-xs text-white/70 font-mono">
                                Apple Safari allows direct home screen app installation:
                            </p>
                            <ol className="text-xs font-mono space-y-2 text-white/80 list-decimal list-inside bg-[#16181B] p-3 rounded-xl border border-white/10">
                                <li className="flex items-center gap-1.5">
                                    Tap the Safari <LuShare className="text-[#B8FE00]" /> <strong>Share</strong> button.
                                </li>
                                <li>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</li>
                                <li>Tap <strong>&quot;Add&quot;</strong> in the top-right corner.</li>
                            </ol>
                            <button
                                onClick={() => setShowIOSGuide(false)}
                                className="w-full py-2.5 bg-[#B8FE00] text-black font-mono font-bold text-xs uppercase rounded-xl hover:bg-white transition-all"
                            >
                                GOT IT
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
