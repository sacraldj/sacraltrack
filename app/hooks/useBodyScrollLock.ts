import { useEffect } from 'react';
import { useIsClient } from './useIsClient';

/**
 * Hook to prevent body scrolling when modal is open
 * @param isOpen - Whether the modal is open
 */
export const useBodyScrollLock = (isOpen: boolean) => {
  const isClient = useIsClient();

  useEffect(() => {
    if (!isClient) return;

    if (isOpen) {
      // Store current scroll position
      const scrollY = window.scrollY;
      
      // Add class to body
      document.body.classList.add('auth-modal-open');
      
      // Set body styles to prevent scrolling
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        // Remove class from body
        document.body.classList.remove('auth-modal-open');
        
        // Restore body styles
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen, isClient]);
}; 