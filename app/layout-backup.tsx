import { Suspense } from 'react';
import Script from 'next/script';
import UserProvider from './context/user';
import AllOverlays from "@/app/components/AllOverlays";
import YandexMetrika from "@/app/components/YandexMetrika";
import ClientWelcomeModal from "@/app/components/ClientWelcomeModal";
// import disableConsoleLogs from '@/app/utils/disableConsoleLog';
// disableConsoleLogs();
import { EditProvider } from './context/editContext';

// Disable console logs throughout the application
if (typeof window !== 'undefined') {
    // disableConsoleLogs();
}

import './globals.css';
import { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import { PlayerProvider } from '@/app/context/playerContext';
import { OnboardingProvider } from './context/OnboardingContext';
import { ShareVibeProvider } from './components/vibe/useShareVibe';
import AuthErrorHandler from './components/AuthErrorHandler';
import { clsx } from 'clsx';
import { inter } from '@/app/fonts/inter';

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                {/* Favicon links */}
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                
                {/* SEO Keywords - дополнительные ключевые слова для поисковых систем */}
                <meta name="keywords" content="music marketplace, artist platform, music streaming, music genres, pop, rock, hip hop, rap, electronic, EDM, classical, jazz, blues, country, R&B, soul, folk, indie, alternative, metal, punk, reggae, funk, disco, techno, house, ambient, lo-fi, trap, dubstep, trance, drum and bass, instrumental, vocal, beats, producers, musicians, songs, albums, singles, playlists, new music, underground, independent music, royalties, music community" />
                
                {/* Дополнительные метаданные о музыкальных жанрах для структурированных данных */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: `
                    {
                        "@context": "https://schema.org",
                        "@type": "MusicDigitalPublicationSeries",
                        "name": "Sacral Track",
                        "description": "Music network and marketplace for artists and music lovers",
                        "url": "https://sacraltrack.space",
                        "genre": [
                            "Pop", "Rock", "Hip Hop", "Rap", "Electronic", "EDM", "Classical", 
                            "Jazz", "Blues", "Country", "R&B", "Soul", "Folk", "Indie", 
                            "Alternative", "Metal", "Punk", "Reggae", "Funk", "Disco", 
                            "Techno", "House", "Ambient", "Lo-Fi", "Trap", "Dubstep", 
                            "Trance", "Drum and Bass", "Instrumental"
                        ],
                        "offers": {
                            "@type": "Offer",
                            "description": "Access to music streaming and marketplace"
                        }
                    }
                `}} />
                
                {/* Preload critical resources */}
                <link 
                    rel="preload" 
                    href="/images/T-logo.svg" 
                    as="image" 
                    type="image/svg+xml"
                />
                
                {/* Preconnect to external domains */}
                <link rel="preconnect" href="https://mc.yandex.ru" />
                
                {/* Critical CSS inline - don't hide content */}
                <style dangerouslySetInnerHTML={{ __html: `
                    body { background: linear-gradient(60deg,#2E2469,#351E43); }
                    .bg-gradient { background: linear-gradient(60deg,#2E2469,#351E43); }
                    #TopNav { background: linear-gradient(60deg,#2E2469,#351E43); }
                ` }} />
            </head>
            <body className={clsx(inter.variable, 'bg-[#0F1122]')}>
                {/* SimpleLoader removed - not found */}
                <Suspense fallback={<></>}>
                    <YandexMetrika />
                </Suspense>
                {/*  <Background /> */}

                {/* Убираем сложные компоненты для стабильности */}
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

