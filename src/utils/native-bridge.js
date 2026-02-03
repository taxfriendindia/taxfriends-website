import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Share } from '@capacitor/share';

/**
 * Check if the app is running on a native platform (Android/iOS)
 */
export const isNative = () => Capacitor.isNativePlatform();

/**
 * Check if the app is running on Android specifically
 */
export const isAndroid = () => Capacitor.getPlatform() === 'android';

/**
 * Initialize Native Platform Features
 */
export const initNativeFeatures = async () => {
    if (!isNative()) return;

    // 1. Configure Status Bar
    try {
        if (isAndroid()) {
            await StatusBar.setStyle({ style: Style.Dark });
            await StatusBar.setBackgroundColor({ color: '#1a1a2e' }); // Match your brand color
        }
    } catch (e) {
        console.warn('StatusBar not available', e);
    }

    // 2. Handle Android Hardware Back Button
    App.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
            App.exitApp();
        } else {
            window.history.back();
        }
    });
};

/**
 * Native Share Utility
 */
export const nativeShare = async (title, text, url) => {
    if (isNative()) {
        await Share.share({ title, text, url, dialogTitle: 'Share with' });
    } else if (navigator.share) {
        await navigator.share({ title, text, url });
    } else {
        // Fallback or alert
        console.log('Sharing not supported on this browser');
    }
};
