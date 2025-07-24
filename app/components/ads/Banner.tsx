"use client";

import { useRef, useEffect, useState } from "react";

interface BannerProps {
  className?: string;
  isMobile?: boolean;
}

export default function Banner({
  className = "",
  isMobile = false,
}: BannerProps) {
  const banner = useRef<HTMLDivElement>(null);
  const [adLoaded, setAdLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  const atOptions = {
    key: "4385a5a6b91cfc53c3cdf66ea55b3291",
    format: "iframe",
    height: 50,
    width: 320,
    params: {},
  };

  useEffect(() => {
    if (!banner.current || banner.current.children.length > 0) {
      return;
    }

    console.log("[Banner] Loading AdsTerra Static Banner...");

    const loadAdsterra = () => {
      if (!banner.current) return;

      try {
        // Очищаем контейнер
        banner.current.innerHTML = "";

        // Создаем уникальный ID для контейнера
        const containerId = `adsterra-banner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        banner.current.id = containerId;

        // Создаем конфигурационный скрипт
        const configScript = document.createElement("script");
        configScript.type = "text/javascript";
        configScript.text = `
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

        // Создаем загружающий скрипт
        const adScript = document.createElement("script");
        adScript.type = "text/javascript";
        adScript.src = `https://www.highperformanceformat.com/${atOptions.key}/invoke.js`;
        adScript.async = true;

        let loadTimeout;
        let checkInterval;

        const cleanup = () => {
          if (loadTimeout) clearTimeout(loadTimeout);
          if (checkInterval) clearInterval(checkInterval);
        };

        adScript.onload = () => {
          console.log("[Banner] ✅ AdsTerra script loaded");
          setAdLoaded(true);

          // Проверяем появление iframe
          let attempts = 0;
          const maxAttempts = 8;

          checkInterval = setInterval(() => {
            attempts++;
            const iframe = banner.current?.querySelector("iframe");

            if (iframe) {
              console.log("[Banner] 🎯 AdsTerra iframe found!");
              cleanup();
            } else if (attempts >= maxAttempts) {
              console.log(
                "[Banner] ⚠️ No iframe after maximum attempts, showing fallback",
              );
              setShowFallback(true);
              cleanup();
            }
          }, 500);
        };

        adScript.onerror = () => {
          console.error("[Banner] ❌ Failed to load AdsTerra script");
          setShowFallback(true);
          cleanup();
        };

        // Таймаут для полной загрузки
        loadTimeout = setTimeout(() => {
          const iframe = banner.current?.querySelector("iframe");
          if (!iframe) {
            console.log("[Banner] ⏰ Timeout reached, showing fallback");
            setShowFallback(true);
          }
          cleanup();
        }, 10000);

        // Добавляем скрипты
        banner.current.appendChild(configScript);
        banner.current.appendChild(adScript);

        return cleanup;
      } catch (error) {
        console.error("[Banner] Error loading banner:", error);
        setShowFallback(true);
      }
    };

    const cleanup = loadAdsterra();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  // Отображаем fallback если нужно
  useEffect(() => {
    if (
      showFallback &&
      banner.current &&
      !banner.current.querySelector(".fallback-ad")
    ) {
      const fallbackDiv = document.createElement("div");
      fallbackDiv.className =
        "fallback-ad flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg h-[50px] w-[320px]";
      fallbackDiv.innerHTML = `
        <div class="text-center">
          <div class="text-sm font-medium">Advertisement</div>
          <div class="text-xs opacity-80">320x50 Banner Space</div>
        </div>
      `;
      banner.current.innerHTML = "";
      banner.current.appendChild(fallbackDiv);
    }
  }, [showFallback]);

  return (
    <div
      className={`mx-2 my-5 border border-gray-200 justify-center items-center text-white text-center relative ${className}`}
      ref={banner}
      style={{
        minHeight: atOptions.height,
        minWidth: atOptions.width,
      }}
    >
      {!adLoaded && !showFallback && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded">
          <div className="text-center">
            <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-blue-500 rounded-full mx-auto mb-1"></div>
            <div className="text-xs text-gray-400">Loading Ad...</div>
          </div>
        </div>
      )}
    </div>
  );
}
