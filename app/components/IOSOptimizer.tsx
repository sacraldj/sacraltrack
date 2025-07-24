'use client';

import { useEffect } from 'react';

/**
 * iOS Optimizer Component
 * Handles iOS Safari specific fixes and optimizations
 * Особенно важно для iPhone 13 Pro и Safari на iOS
 */
const IOSOptimizer = () => {
  useEffect(() => {
    // Проверяем, что мы в браузере и это iOS
    if (typeof window === 'undefined') return;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (!isIOS) return;

    console.log('[iOS Optimizer] Applying iOS optimizations');

    // 1. Fix viewport height issues
    const setViewportHeight = () => {
      // First we get the viewport height and multiply it by 1% to get a value for a vh unit
      let vh = window.innerHeight * 0.01;
      // Then we set the value in the --vh custom property to the root of the document
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    // Set initial viewport height
    setViewportHeight();

    // Listen for orientation changes and resize events
    window.addEventListener('resize', setViewportHeight);
    window.addEventListener('orientationchange', () => {
      // Timeout to account for iOS Safari's UI changes
      setTimeout(setViewportHeight, 100);
    });

    // 2. Prevent zoom on input focus
    const preventZoomOnInputs = () => {
      const inputs = document.querySelectorAll('input, textarea, select');
      inputs.forEach((input) => {
        const element = input as HTMLElement;
        if (element.style.fontSize !== '16px') {
          element.style.fontSize = '16px';
        }
      });
    };

    // Apply immediately and on DOM changes
    preventZoomOnInputs();
    
    // Create observer for dynamically added inputs
    const observer = new MutationObserver(preventZoomOnInputs);
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // 3. Handle safe area insets for dynamic content
    const applySafeAreaInsets = () => {
      const root = document.documentElement;
      
      // Get computed safe area values
      const safeAreaTop = getComputedStyle(root).getPropertyValue('env(safe-area-inset-top)') || '0px';
      const safeAreaBottom = getComputedStyle(root).getPropertyValue('env(safe-area-inset-bottom)') || '0px';
      const safeAreaLeft = getComputedStyle(root).getPropertyValue('env(safe-area-inset-left)') || '0px';
      const safeAreaRight = getComputedStyle(root).getPropertyValue('env(safe-area-inset-right)') || '0px';
      
      // Set CSS custom properties for easier use
      root.style.setProperty('--safe-area-inset-top', safeAreaTop);
      root.style.setProperty('--safe-area-inset-bottom', safeAreaBottom);
      root.style.setProperty('--safe-area-inset-left', safeAreaLeft);
      root.style.setProperty('--safe-area-inset-right', safeAreaRight);
    };

    applySafeAreaInsets();

    // 4. Fix iOS Safari bounce scrolling
    const preventBounceScrolling = () => {
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
    };

    preventBounceScrolling();

    // 5. Optimize touch events
    const optimizeTouchEvents = () => {
      // Disable double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (event) => {
        const now = (new Date()).getTime();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });

      // Improve touch responsiveness
      document.addEventListener('touchstart', () => {}, { passive: true });
    };

    optimizeTouchEvents();

    // 6. Handle virtual keyboard on iOS
    const handleVirtualKeyboard = () => {
      const handleFocusIn = (event: FocusEvent) => {
        const target = event.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
          // Небольшая задержка для iOS Safari
          setTimeout(() => {
            target.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
          }, 300);
        }
      };

      const handleFocusOut = () => {
        // Восстанавливаем viewport при закрытии клавиатуры
        setTimeout(() => {
          setViewportHeight();
          window.scrollTo(0, 0);
        }, 300);
      };

      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);
    };

    handleVirtualKeyboard();

    // 7. Safari-specific localStorage fixes
    if (isSafari) {
      console.log('[iOS Optimizer] Applying Safari-specific fixes');
      
      // Fix for Safari's sessionStorage issues during OAuth
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = function(key: string, value: string) {
        try {
          originalSetItem.call(this, key, value);
          // Также сохраняем в localStorage как backup для Safari
          if (key.includes('Auth') || key.includes('oauth')) {
            localStorage.setItem(`${key}_safari_backup`, value);
          }
        } catch (error) {
          console.error('SessionStorage error in Safari:', error);
          // Fallback to localStorage
          localStorage.setItem(key, value);
        }
      };
    }

    // 8. Performance optimizations for iOS
    const optimizePerformance = () => {
      // Enable hardware acceleration for key elements
      const elementsToAccelerate = [
        '.auth-modal-container',
        '.modal-content',
        '#TopNav',
        '.smooth-scroll-container'
      ];

      elementsToAccelerate.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
          const el = element as HTMLElement;
          el.style.transform = 'translateZ(0)';
          el.style.willChange = 'transform';
        });
      });

      // Optimize images for Retina displays
      const images = document.querySelectorAll('img');
      images.forEach(img => {
        img.style.imageRendering = '-webkit-optimize-contrast';
      });
    };

    // Apply performance optimizations after a delay
    setTimeout(optimizePerformance, 1000);

    // 9. Handle iOS Safari's changing viewport during scroll
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          // Prevent iOS Safari's viewport from jumping
          const currentHeight = window.innerHeight;
          document.documentElement.style.setProperty('--current-vh', `${currentHeight * 0.01}px`);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup function
    return () => {
      window.removeEventListener('resize', setViewportHeight);
      window.removeEventListener('orientationchange', setViewportHeight);
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  // This component doesn't render anything
  return null;
};

export default IOSOptimizer; 