"use client";

import { useState, useEffect } from 'react';

export default function DebugPanel() {
  const [showDebug, setShowDebug] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <>
      {/* Тестовая панель внизу */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-red-500 text-white p-4 text-center font-bold z-[999999999]"
        style={{ 
          zIndex: 999999999,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
        }}
      >
        ТЕСТОВАЯ ПАНЕЛЬ (Z-INDEX: 999999999) - {isMobile ? 'МОБИЛЬНЫЙ' : 'ДЕСКТОП'}
        <button 
          onClick={() => setShowDebug(true)}
          className="ml-4 bg-white text-red-500 px-2 py-1 rounded"
        >
          Тест модалки
        </button>
      </div>

      {/* Тестовое модальное окно */}
      {showDebug && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center"
          style={{ 
            zIndex: 999999999,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onClick={() => setShowDebug(false)}
        >
          <div 
            className="bg-white p-8 rounded-lg text-black max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Тестовое модальное окно</h2>
            <p>Устройство: {isMobile ? 'Мобильное' : 'Десктоп'}</p>
            <p>Z-index: 999999999</p>
            <p>Если видите это - модалки работают!</p>
            <button 
              onClick={() => setShowDebug(false)}
              className="mt-4 bg-red-500 text-white px-4 py-2 rounded"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </>
  );
} 