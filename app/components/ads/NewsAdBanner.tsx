"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface NewsAdBannerProps {
  className?: string;
  isMobile?: boolean;
}

const NewsAdBanner: React.FC<NewsAdBannerProps> = ({
  className = "",
  isMobile = false,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Move showFallbackBanner function to component level
  const showFallbackBanner = () => {
    if (!adContainerRef.current) return;
    
    const atOptions = {
      height: isMobile ? 50 : 50,
      width: isMobile ? 300 : 320,
    };
    
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'fallback-ad flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg cursor-pointer hover:from-blue-700 hover:to-purple-700 transition-all duration-300';
    fallbackDiv.style.height = `${atOptions.height}px`;
    fallbackDiv.style.width = `${atOptions.width}px`;
    fallbackDiv.onclick = () => {
      window.open('https://publishers.adsterra.com/referral/4Lx5vMNjC3', '_blank');
    };
    fallbackDiv.innerHTML = `
      <div class="text-center p-2">
        <div class="text-sm font-medium">🎵 Music Advertisement</div>
        <div class="text-xs opacity-80">Click to learn more</div>
      </div>
    `;
    
    adContainerRef.current.innerHTML = '';
    adContainerRef.current.appendChild(fallbackDiv);
    setAdLoaded(true);
    setShowFallback(true);
    console.log('[NewsAdBanner] Fallback banner displayed');
  };

  // Принудительно показываем баннер
  useEffect(() => {
    console.log("[NewsAdBanner] Forcing banner to be visible");
    setIsVisible(true);
    setIsMinimized(false);

    // Очищаем старое состояние из localStorage если оно есть
    const bannerState = localStorage.getItem("newsAdBannerState");
    if (bannerState) {
      console.log("[NewsAdBanner] Clearing old localStorage state");
      localStorage.removeItem("newsAdBannerState");
    }
  }, []);

  // Загружаем AdsTerra Static Banner согласно официальной документации
  useEffect(() => {
    if (!isVisible || isMinimized || !adContainerRef.current) {
      return;
    }

    // Проверяем, если баннер уже загружен
    if (adContainerRef.current.children.length > 0) {
      setAdLoaded(true);
      return;
    }

    console.log("[NewsAdBanner] Loading AdsTerra banner...");

    const loadAdsterra = () => {
      if (!adContainerRef.current) return;

        // Очищаем контейнер
      adContainerRef.current.innerHTML = '';

      // Уникальный ID для предотвращения конфликтов
        const containerId = `adsterra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Конфигурация AdsTerra с правильными параметрами
      const atOptions = {
        key: '4385a5a6b91cfc53c3cdf66ea55b3291',
        format: 'iframe',
        height: isMobile ? 50 : 50,
        width: isMobile ? 300 : 320,
        params: {}
      };

      // Создаем скрипт конфигурации (точно как в документации AdsTerra)
      const configScript = document.createElement('script');
      configScript.type = 'text/javascript';
        configScript.text = `
        console.log('[AdsTerra] Loading banner with options:', ${JSON.stringify(atOptions)});
          window.atOptions_${containerId} = {
          'key': '${atOptions.key}',
            'format': 'iframe',
          'height': ${atOptions.height},
          'width': ${atOptions.width},
            'params': {}
          };
          if (typeof window.atOptions === 'undefined') {
            window.atOptions = window.atOptions_${containerId};
          }
        `;

      // Создаем скрипт загрузки (HTTPS для безопасности)
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = `https://www.highperformanceformat.com/${atOptions.key}/invoke.js`;
      invokeScript.async = true;

      try {
        // Добавляем скрипты в правильном порядке
        adContainerRef.current.appendChild(configScript);
        adContainerRef.current.appendChild(invokeScript);
        
        console.log('[NewsAdBanner] AdsTerra scripts added successfully');

        // Проверяем появление iframe с интервалами
        let attempts = 0;
        const maxAttempts = 10;
        let checkInterval: NodeJS.Timeout;
        let loadTimeout: NodeJS.Timeout;

        const cleanup = () => {
          if (checkInterval) clearInterval(checkInterval);
          if (loadTimeout) clearTimeout(loadTimeout);
        };

        // Проверяем каждые 500ms появление iframe
          checkInterval = setInterval(() => {
            attempts++;
          const iframe = adContainerRef.current?.querySelector('iframe');
          const anyAdElement = adContainerRef.current?.querySelector('[id*="adsterra"], [class*="adsterra"], iframe, ins');

          if (iframe || anyAdElement) {
            console.log('[NewsAdBanner] ✅ AdsTerra element found!');
            setAdLoaded(true);
              cleanup();
            } else if (attempts >= maxAttempts) {
            console.log('[NewsAdBanner] ⚠️ Max attempts reached, showing fallback');
            showFallbackBanner();
              cleanup();
            }
          }, 500);

        // Общий таймаут безопасности (15 секунд)
        loadTimeout = setTimeout(() => {
          const iframe = adContainerRef.current?.querySelector('iframe');
          const anyAdElement = adContainerRef.current?.querySelector('[id*="adsterra"], [class*="adsterra"], iframe, ins');
          
          if (!iframe && !anyAdElement) {
            console.log('[NewsAdBanner] ⏰ Timeout reached, showing fallback');
            showFallbackBanner();
          }
          cleanup();
        }, 15000);

        // Обработчик ошибок скрипта
        invokeScript.onerror = () => {
          console.log('[NewsAdBanner] ❌ Script load error, showing fallback');
          showFallbackBanner();
          cleanup();
        };

      } catch (error) {
        console.error('[NewsAdBanner] Error loading AdsTerra:', error);
        showFallbackBanner();
      }
    };

    // Запускаем загрузку после небольшой задержки
    const timer = setTimeout(loadAdsterra, 100);

    return () => {
      clearTimeout(timer);
    };
  }, [isVisible, isMinimized, isMobile]);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("newsAdBannerState", JSON.stringify({ 
      hidden: true, 
      timestamp: Date.now() 
    }));
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`relative ${className}`}
      >
        <div
          className={`
            relative overflow-hidden rounded-xl 
            bg-gradient-to-br from-[#1A1D2E]/80 to-[#2A2151]/80 
            backdrop-blur-sm border border-white/10
            ${isMinimized ? 'h-12' : 'h-auto'}
            transition-all duration-300 ease-out
          `}
        >
          {/* Header bar */}
          <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white/70 text-xs font-medium">
                {showFallback ? 'Music Advertisement' : 'Loading Advertisement'}
          </span>
        </div>

        <div className="flex items-center gap-1">
              <button
              onClick={handleMinimize}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
              title={isMinimized ? "Expand" : "Minimize"}
              >
                <span className="text-white/70 text-xs">
                  {isMinimized ? "+" : "−"}
                </span>
              </button>
              
              <button
            onClick={handleClose}
                className="w-6 h-6 rounded-full bg-white/10 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                title="Close"
              >
                <XMarkIcon className="w-3 h-3 text-white/70" />
              </button>
        </div>
      </div>

          {/* Ad content */}
        {!isMinimized && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="p-4"
            >
              <div className="flex items-center justify-center">
                <div
                  ref={adContainerRef}
                  className="flex items-center justify-center min-h-[50px]"
                  style={{
                    minWidth: isMobile ? '300px' : '320px',
                    minHeight: '50px'
                  }}
                >
                  {!adLoaded && (
                    <div className="flex flex-col items-center justify-center text-white/50 space-y-2">
                      <div className="w-8 h-8 border-2 border-[#20DDBB] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-xs">Loading ad...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ad label */}
              <div className="mt-2 text-center">
                <span className="text-white/40 text-xs">Advertisement</span>
              </div>
            </motion.div>
          )}
        </div>
          </motion.div>
      </AnimatePresence>
  );
};

export default NewsAdBanner;
