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

  // Упрощенная проверка localStorage - всегда показываем баннер по умолчанию
  useEffect(() => {
    // Принудительно показываем баннер, игнорируя localStorage
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

    // Проверяем, если скрипт уже загружен
    if (adContainerRef.current.children.length > 0) {
      setAdLoaded(true);
      return;
    }

    console.log("[NewsAdBanner] Loading AdsTerra banner...");

    const loadAdsterra = () => {
      if (!adContainerRef.current) return;

      try {
        // Очищаем контейнер
        adContainerRef.current.innerHTML = "";

        // Создаем уникальный ID для контейнера
        const containerId = `adsterra-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        adContainerRef.current.id = containerId;

        // Создаем конфигурационный скрипт
        const configScript = document.createElement("script");
        configScript.type = "text/javascript";
        configScript.text = `
          window.atOptions_${containerId} = {
            'key': '4385a5a6b91cfc53c3cdf66ea55b3291',
            'format': 'iframe',
            'height': 50,
            'width': 320,
            'params': {}
          };
          if (typeof window.atOptions === 'undefined') {
            window.atOptions = window.atOptions_${containerId};
          }
        `;

        // Создаем загружающий скрипт
        const adScript = document.createElement("script");
        adScript.type = "text/javascript";
        adScript.src =
          "https://www.highperformanceformat.com/4385a5a6b91cfc53c3cdf66ea55b3291/invoke.js";
        adScript.async = true;

        let loadTimeout;
        let checkInterval;

        const cleanup = () => {
          if (loadTimeout) clearTimeout(loadTimeout);
          if (checkInterval) clearInterval(checkInterval);
        };

        adScript.onload = () => {
          console.log("[NewsAdBanner] ✅ AdsTerra script loaded");
          setAdLoaded(true);

          // Проверяем появление iframe
          let attempts = 0;
          const maxAttempts = 10;

          checkInterval = setInterval(() => {
            attempts++;
            const iframe = adContainerRef.current?.querySelector("iframe");

            if (iframe) {
              console.log("[NewsAdBanner] 🎯 AdsTerra iframe found!");
              cleanup();
            } else if (attempts >= maxAttempts) {
              console.log(
                "[NewsAdBanner] ⚠️ No iframe after maximum attempts, showing fallback",
              );
              showFallback();
              cleanup();
            }
          }, 500);
        };

        adScript.onerror = () => {
          console.error("[NewsAdBanner] ❌ Failed to load AdsTerra script");
          showFallback();
          cleanup();
        };

        // Таймаут для полной загрузки
        loadTimeout = setTimeout(() => {
          const iframe = adContainerRef.current?.querySelector("iframe");
          if (!iframe) {
            console.log("[NewsAdBanner] ⏰ Timeout reached, showing fallback");
            showFallback();
          }
          cleanup();
        }, 15000);

        // Добавляем скрипты
        adContainerRef.current.appendChild(configScript);
        adContainerRef.current.appendChild(adScript);

        return cleanup;
      } catch (error) {
        console.error("[NewsAdBanner] Error loading banner:", error);
        showFallback();
      }
    };

    const showFallback = () => {
      if (
        !adContainerRef.current ||
        adContainerRef.current.querySelector(".fallback-ad")
      )
        return;

      const fallbackDiv = document.createElement("div");
      fallbackDiv.className =
        "fallback-ad flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg h-[50px] w-[320px]";
      fallbackDiv.innerHTML = `
        <div class="text-center">
          <div class="text-sm font-medium">Advertisement</div>
          <div class="text-xs opacity-80">320x50 Banner Space</div>
        </div>
      `;
      adContainerRef.current.innerHTML = "";
      adContainerRef.current.appendChild(fallbackDiv);
      setAdLoaded(true);
    };

    const cleanup = loadAdsterra();

    return () => {
      if (cleanup) cleanup();
    };
  }, [isVisible, isMinimized, isMobile]);

  // Убираем сохранение состояния в localStorage для обеспечения постоянного отображения
  const handleClose = () => {
    console.log(
      "[NewsAdBanner] Temporarily hiding banner (will reappear on page reload)",
    );
    setIsVisible(false);
    // Не сохраняем состояние в localStorage
  };

  const handleMinimize = () => {
    console.log("[NewsAdBanner] Toggling minimize:", !isMinimized);
    setIsMinimized(!isMinimized);
    // Не сохраняем состояние в localStorage
  };

  // Функция для принудительного показа баннера (для отладки)
  const forceShow = () => {
    console.log("[NewsAdBanner] Force showing banner");
    localStorage.removeItem("newsAdBannerState");
    setIsVisible(true);
    setIsMinimized(false);
  };

  // Функция для перезагрузки AdsTerra скрипта
  const reloadAdScript = () => {
    console.log("[NewsAdBanner] Reloading AdsTerra script");
    if (adContainerRef.current) {
      adContainerRef.current.innerHTML = "";
      setAdLoaded(false);

      // Принудительно перезапускаем useEffect
      setTimeout(() => {
        if (adContainerRef.current && isVisible && !isMinimized) {
          const event = new Event("reload-ad");
          adContainerRef.current.dispatchEvent(event);
        }
      }, 100);
    }
  };

  // Альтернативный метод загрузки AdsTerra (для отладки)
  const loadAdAlternative = () => {
    console.log("[NewsAdBanner] 🔄 Trying alternative loading method...");
    if (!adContainerRef.current) return;

    // Очищаем контейнер
    adContainerRef.current.innerHTML = "";

    // Создаем iframe напрямую (для тестирования нового баннера)
    const testIframe = document.createElement("iframe");
    testIframe.src = `https://www.highperformanceformat.com/4385a5a6b91cfc53c3cdf66ea55b3291/invoke.js`;
    testIframe.width = "320";
    testIframe.height = "50";
    testIframe.style.border = "none";
    testIframe.style.display = "block";

    testIframe.onload = () => {
      console.log("[NewsAdBanner] 🎯 Test iframe loaded");
    };

    testIframe.onerror = () => {
      console.log("[NewsAdBanner] ❌ Test iframe failed");
    };

    adContainerRef.current.appendChild(testIframe);
  };

  // Добавляем глобальные функции для отладки
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).showNewsAdBanner = forceShow;
      (window as any).reloadAdScript = reloadAdScript;
      (window as any).loadAdAlternative = loadAdAlternative;
      console.log(
        "[NewsAdBanner] Added global functions: window.showNewsAdBanner(), window.reloadAdScript(), window.loadAdAlternative()",
      );
    }
  }, []);

  // Принудительно показываем баннер (убираем проверку видимости)
  console.log(
    "[NewsAdBanner] Force rendering banner, isVisible:",
    isVisible,
    "isMinimized:",
    isMinimized,
  );

  // Если баннер был скрыт, принудительно показываем его
  if (!isVisible) {
    console.log("[NewsAdBanner] Banner was hidden, forcing it to be visible");
    setIsVisible(true);
  }

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: isMobile ? -20 : 0,
        x: isMobile ? 0 : -30,
        scale: 0.95,
      }}
      animate={{
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: isMobile ? -20 : 0,
        x: isMobile ? 0 : -30,
        scale: 0.95,
      }}
      transition={{
        duration: 0.5,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2 },
      }}
      className={`relative bg-gradient-to-br from-[#1A1D2E]/90 to-[#16213E]/80 backdrop-blur-md rounded-xl border border-purple-500/20 overflow-hidden shadow-2xl hover:shadow-purple-500/10 ${className}`}
    >
      {/* Header с кнопками управления */}
      <div className="flex items-center justify-between p-3 border-b border-gradient-to-r from-purple-500/20 to-blue-500/20">
        <div className="flex items-center gap-2">
          <motion.div
            className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          ></motion.div>
          <span className="text-white/70 text-xs font-medium bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Sponsored
          </span>
        </div>

        <div className="flex items-center gap-1">
          {!isMobile && (
            <motion.button
              onClick={handleMinimize}
              className="p-2 hover:bg-gradient-to-r hover:from-purple-500/20 hover:to-blue-500/20 rounded-lg transition-all duration-300 group"
              whileHover={{
                scale: 1.1,
                rotate: isMinimized ? 180 : 0,
              }}
              whileTap={{ scale: 0.9 }}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              <svg
                className="w-4 h-4 text-white/60 group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isMinimized ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                )}
              </svg>
            </motion.button>
          )}

          {/* Close button - доступна на всех устройствах */}
          <motion.button
            onClick={handleClose}
            className="p-2 hover:bg-gradient-to-r hover:from-red-500/20 hover:to-pink-500/20 rounded-lg transition-all duration-300 group"
            whileHover={{
              scale: 1.1,
              rotate: 90,
            }}
            whileTap={{ scale: 0.9 }}
            title="Close Ad"
          >
            <XMarkIcon className="w-4 h-4 text-white/60 group-hover:text-red-400 transition-colors" />
          </motion.button>
        </div>
      </div>

      {/* Контент баннера */}
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{
              height: 0,
              opacity: 0,
              y: -20,
            }}
            animate={{
              height: "auto",
              opacity: 1,
              y: 0,
            }}
            exit={{
              height: 0,
              opacity: 0,
              y: -20,
            }}
            transition={{
              duration: 0.4,
              type: "spring",
              stiffness: 100,
              damping: 15,
            }}
            className="overflow-hidden"
          >
            <motion.div
              className="relative"
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Декоративный градиент */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-lg"></div>

              <div className="relative">
                {/* AdsTerra Banner Container */}
                <div
                  ref={adContainerRef}
                  className="flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg border border-gray-700 relative overflow-hidden"
                  style={{
                    width: 320, // Новый размер баннера
                    height: 50, // Новый размер баннера
                    minHeight: 50, // Новый размер баннера
                  }}
                >
                  {!adLoaded && (
                    <div className="text-center text-gray-400 z-10 flex flex-col items-center justify-center h-full">
                      <div className="animate-spin w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-2"></div>
                      <div className="text-sm">Loading Advertisement...</div>
                      <div className="text-xs mt-1 opacity-70">
                        AdsTerra Banner
                      </div>
                      <div className="text-xs mt-1 opacity-50">320x50</div>
                    </div>
                  )}

                  {/* Отладочная информация (только в development) */}
                  {process.env.NODE_ENV === "development" && (
                    <>
                      <div className="absolute top-1 left-1 text-xs text-green-400 bg-black/50 px-1 rounded z-20">
                        {adLoaded ? "✅ Script Loaded" : "⏳ Loading Script"}
                      </div>

                      <div className="absolute bottom-1 left-1 text-xs text-blue-400 bg-black/50 px-1 rounded z-20">
                        Container:{" "}
                        {adContainerRef.current?.children.length || 0} children
                      </div>
                    </>
                  )}

                  {/* Кнопки для отладки (только в development) */}
                  {process.env.NODE_ENV === "development" && (
                    <div className="absolute top-1 right-1 flex gap-1 z-30">
                      <button
                        onClick={reloadAdScript}
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded"
                        title="Reload Ad Script"
                      >
                        🔄
                      </button>
                      <button
                        onClick={loadAdAlternative}
                        className="text-xs bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded"
                        title="Try Alternative Method"
                      >
                        🧪
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Минимизированное состояние */}
      {isMinimized && !isMobile && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-b-xl"></div>
          <motion.span
            className="text-white/50 text-xs font-medium relative"
            animate={{
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Ad minimized - Click to expand
          </motion.span>
        </motion.div>
      )}
    </motion.div>
  );
};

export default NewsAdBanner;
