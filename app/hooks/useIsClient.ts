'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to check if the component is running on the client side
 * Useful for preventing hydration mismatches in Next.js
 * @returns boolean - true if running on client, false if on server
 */
export const useIsClient = (): boolean => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // This effect only runs on the client side
    setIsClient(true);
  }, []);

  return isClient;
}; 