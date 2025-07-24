import UserProvider from './context/user';
import AllOverlays from "@/app/components/AllOverlays";
// import disableConsoleLogs from '@/app/utils/disableConsoleLog';
// disableConsoleLogs();
import { EditProvider } from './context/editContext';
import IOSOptimizer from './components/IOSOptimizer';

// Disable console logs throughout the application
if (typeof window !== 'undefined') {
    // disableConsoleLogs();
}

import './globals.css';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { Suspense } from 'react';
import Background from '@/app/components/Background'; 
import { PlayerProvider } from '@/app/context/playerContext'; 
import GlobalLoader from './components/GlobalLoader'
import ClientWelcomeModal from './components/ClientWelcomeModal';
import Script from 'next/script';
import { OnboardingProvider } from './context/OnboardingContext';
import { ShareVibeProvider } from './components/vibe/useShareVibe';
import { useUser } from './context/user';
import AuthErrorHandler from './components/AuthErrorHandler';
import { clsx } from 'clsx';
import { inter } from '@/app/fonts/inter';
import YandexMetrika from './components/YandexMetrika';

export const metadata: Metadata = {
    title: 'Sacral Track',
    description: 'Sacral Track - music network marketplace for music artists and lovers. Listen to music, release a tracks, withdraw royalties to visa/mastercard.',
    metadataBase: new URL('https://sacraltrack.space'),
    icons: {
        icon: [
            { url: '/favicon.svg', type: 'image/svg+xml' },
            { url: '/favicon.ico', sizes: 'any' }
        ],
        apple: { url: '/apple-touch-icon.png' }
    },
    keywords: 'music, artist, marketplace, royalties, listen, release, tracks, streaming, pop, rock, hip hop, rap, electronic, EDM, classical, jazz, blues, country, R&B, soul, folk, indie, alternative, metal, punk, reggae, funk, disco, techno, house, ambient, lo-fi, trap, dubstep, trance, drum and bass, instrumental, vocal, beats, producers, musicians, songs, albums, singles, playlists, new music, trending',
    openGraph: {
        title: 'Sacral Track',
        description: 'Sacral Track - social network with marketplace for artists and music lovers',
        url: 'https://sacraltrack.space',
        images: [
            {
                url: '/images/sacraltrack.png',
                width: 800,
                height: 600,
                alt: 'Sacral Track',
            },
        ],
        type: 'website',
    },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
        <head>
            {/* Enhanced viewport meta tag for iOS devices */}
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
            
            {/* iOS Safari specific meta tags */}
            <meta name="mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            <meta name="apple-mobile-web-app-title" content="Sacral Track" />
            
            {/* Prevent automatic phone number detection */}
            <meta name="format-detection" content="telephone=no" />
            
            {/* Optimize for touch devices */}
            <meta name="HandheldFriendly" content="true" />
            <meta name="MobileOptimized" content="320" />
            
            {/* Theme color for iOS */}
            <meta name="theme-color" content="#2E2469" />
            <meta name="msapplication-navbutton-color" content="#2E2469" />
            <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
            
            {/* Preconnect to external domains */}
            <link rel="preconnect" href="https://cloud.appwrite.io" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://mc.yandex.ru" />
            
            {/* Critical CSS inline for fast rendering */}
            <style dangerouslySetInnerHTML={{ __html: `
                /* iOS Safari viewport fixes */
                html {
                    height: 100%;
                    height: -webkit-fill-available;
                }
                
                body { 
                    background: linear-gradient(60deg,#2E2469,#351E43);
                    min-height: 100vh;
                    min-height: -webkit-fill-available;
                    /* Prevent bounce scrolling */
                    overscroll-behavior: none;
                    /* Smooth scrolling for iOS */
                    -webkit-overflow-scrolling: touch;
                    /* Prevent text size adjust */
                    -webkit-text-size-adjust: 100%;
                    text-size-adjust: 100%;
                }
                
                /* Safe area insets for devices with notch */
                body {
                    padding-top: env(safe-area-inset-top);
                    padding-bottom: env(safe-area-inset-bottom);
                    padding-left: env(safe-area-inset-left);
                    padding-right: env(safe-area-inset-right);
                }
                
                .bg-gradient { background: linear-gradient(60deg,#2E2469,#351E43); }
                #TopNav { 
                    background: linear-gradient(60deg,#2E2469,#351E43);
                    /* Account for safe area */
                    padding-top: env(safe-area-inset-top);
                    height: calc(60px + env(safe-area-inset-top));
                }
                
                /* Optimize for touch */
                * {
                    -webkit-tap-highlight-color: transparent;
                    -webkit-touch-callout: none;
                    -webkit-user-select: none;
                    user-select: none;
                }
                
                /* Allow text selection for inputs and content */
                input, textarea, [contenteditable] {
                    -webkit-user-select: text;
                    user-select: text;
                }
                
                /* Improve input rendering on iOS */
                input[type="text"],
                input[type="email"],
                input[type="password"],
                textarea {
                    -webkit-appearance: none;
                    border-radius: 0;
                    font-size: 16px; /* Prevent zoom on focus */
                }
            ` }} />
        </head>
            <body className={clsx(inter.variable, 'bg-[#0F1122]')}>
                <GlobalLoader />
                <IOSOptimizer />
                <Suspense fallback={<></>}>
                    <YandexMetrika />
                </Suspense>
                
                {/* SVG для градиентов иконок */}
                <svg width="0" height="0" className="absolute">
                    <defs>
                        <linearGradient id="fire-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ff8a00" />
                            <stop offset="30%" stopColor="#ff5e00" />
                            <stop offset="60%" stopColor="#ff3d00" />
                            <stop offset="100%" stopColor="#ff5e00" />
                            <animate attributeName="x1" from="0%" to="100%" dur="4s" repeatCount="indefinite" />
                            <animate attributeName="y1" from="0%" to="100%" dur="5s" repeatCount="indefinite" />
                            <animate attributeName="x2" from="100%" to="0%" dur="4s" repeatCount="indefinite" />
                            <animate attributeName="y2" from="100%" to="0%" dur="5s" repeatCount="indefinite" />
                        </linearGradient>
                    </defs>
                </svg>

       
                <PlayerProvider>
                    <UserProvider>
                        <OnboardingProvider>
                            <ShareVibeProvider appName="Sacral Track">
                                <EditProvider>
                                    <AuthErrorHandler>
                                        <Toaster
                                            position="top-center"
                                            containerStyle={{
                                                zIndex: 10000000
                                            }}
                                            toastOptions={{
                                                duration: 3000,
                                                style: {
                                                    background: '#272B43',
                                                    color: '#fff',
                                                    zIndex: 10000000
                                                },
                                                // Custom success/error styles
                                                success: {
                                                    iconTheme: {
                                                        primary: '#8B5CF6',
                                                        secondary: '#FFFAEE',
                                                    },
                                                },
                                                error: {
                                                    iconTheme: {
                                                        primary: '#EF4444',
                                                        secondary: '#FFFAEE',
                                                    },
                                                },
                                            }}
                                        />
                                        <AllOverlays />
                                        {/* CALL Оборачиваем ClientWelcomeModal в client-only обертку с error boundary */}
                                        {typeof window !== 'undefined' && (
                                          <div suppressHydrationWarning>
                                            <ClientWelcomeModal />
                                          </div>
                                        )}
                                        {children}
                                    </AuthErrorHandler>
                                </EditProvider>
                            </ShareVibeProvider>
                        </OnboardingProvider>
                    </UserProvider>
                </PlayerProvider>
              
                
                {/* Use next/script for external scripts with strategy="afterInteractive" */}
                <Script id="yandex-metrika" strategy="afterInteractive">
                    {`
                    (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                    m[i].l=1*new Date();
                    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
                    (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
                    ym(101742029, "init", {
                        defer: true,
                        clickmap: true,
                        trackLinks: true,
                        accurateTrackBounce: true
                    });
                    `}
                </Script>
                
                {/* Add noscript fallback for Yandex Metrika */}
                <noscript>
                    <div>
                        <img src="https://mc.yandex.ru/watch/101742029" style={{ position: 'absolute', left: '-9999px' }} alt="" />
                    </div>
                </noscript>
                
                {/* Добавляем скрипт для отключения Service Worker как клиентский скрипт */}
                <Script id="disable-service-worker" strategy="afterInteractive">
                    {`
                    if ('serviceWorker' in navigator) {
                      navigator.serviceWorker.getRegistrations().then(function(registrations) {
                        registrations.forEach(registration => {
                          registration.unregister();
                          console.log('ServiceWorker unregistered');
                        });
                      }).catch(error => {
                        console.error('Error unregistering service worker:', error);
                      });
                    }
                    `}
                </Script>
            </body>
        </html>
    );
}

