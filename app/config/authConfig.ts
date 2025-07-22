/**
 * Authentication configuration for different browsers and devices
 * Optimized for mobile browsers, especially iOS Safari
 */

export interface AuthTimeoutConfig {
  redirectTimeout: number;
  sessionCheckTimeout: number;
  retryDelay: number;
  maxRetries: number;
  exponentialBackoffBase: number;
  jitterRange: number;
}

export interface AuthConfig {
  desktop: AuthTimeoutConfig;
  mobile: AuthTimeoutConfig;
  ios: AuthTimeoutConfig;
  safari: AuthTimeoutConfig;
  firefox: AuthTimeoutConfig;
}

// Base configuration for different platforms
export const AUTH_CONFIG: AuthConfig = {
  // Desktop browsers (Chrome, Firefox, Edge)
  desktop: {
    redirectTimeout: 15000,      // 15 seconds
    sessionCheckTimeout: 5000,   // 5 seconds
    retryDelay: 1000,           // 1 second
    maxRetries: 3,              // 3 attempts
    exponentialBackoffBase: 1.5,
    jitterRange: 500,           // ±500ms
  },

  // Mobile browsers (general)
  mobile: {
    redirectTimeout: 25000,      // 25 seconds (mobile networks can be slower)
    sessionCheckTimeout: 8000,   // 8 seconds
    retryDelay: 1500,           // 1.5 seconds
    maxRetries: 4,              // 4 attempts
    exponentialBackoffBase: 1.5,
    jitterRange: 750,           // ±750ms
  },

  // iOS devices (iPhone, iPad)
  ios: {
    redirectTimeout: 45000,      // 45 seconds (iOS Safari can be very slow)
    sessionCheckTimeout: 10000,  // 10 seconds
    retryDelay: 2000,           // 2 seconds
    maxRetries: 5,              // 5 attempts
    exponentialBackoffBase: 1.3, // Slower backoff
    jitterRange: 1000,          // ±1 second
  },

  // Safari (desktop and mobile)
  safari: {
    redirectTimeout: 35000,      // 35 seconds
    sessionCheckTimeout: 8000,   // 8 seconds
    retryDelay: 1800,           // 1.8 seconds
    maxRetries: 5,              // 5 attempts
    exponentialBackoffBase: 1.4,
    jitterRange: 800,           // ±800ms
  },

  // Firefox (desktop and mobile)
  firefox: {
    redirectTimeout: 20000,      // 20 seconds
    sessionCheckTimeout: 6000,   // 6 seconds
    retryDelay: 1200,           // 1.2 seconds
    maxRetries: 4,              // 4 attempts
    exponentialBackoffBase: 1.5,
    jitterRange: 600,           // ±600ms
  },
};

// Define delay configuration interface
interface DelayConfig {
  desktop: number;
  mobile: number;
  ios: number;
  safari?: number;
}

// Additional delays for specific scenarios
export const ADDITIONAL_DELAYS: Record<string, DelayConfig> = {
  // Initial delay before starting auth process
  initialDelay: {
    desktop: 0,
    mobile: 100,
    ios: 200,
    safari: 150,
  },

  // Delay before checking user session
  userCheckDelay: {
    desktop: 500,
    mobile: 1000,
    ios: 1500,
    safari: 1200,
  },

  // Extended delay for Safari user retrieval
  safariExtendedDelay: {
    desktop: 1500,
    mobile: 2000,
    ios: 2500,
    safari: 2200,
  },

  // Delay before redirect
  redirectDelay: {
    desktop: 0,
    mobile: 50,
    ios: 100,
    safari: 75,
  },
};

// Global authentication limits
export const GLOBAL_AUTH_LIMITS = {
  maxGlobalAttempts: 8,         // Maximum attempts across all sessions
  attemptWindowMs: 15 * 60 * 1000, // 15 minutes window
  blockDurationMs: 10 * 60 * 1000,  // 10 minutes block
};

// Browser-specific feature detection
export const BROWSER_FEATURES = {
  // Browsers that need enhanced OAuth flow
  needsEnhancedAuth: ['safari', 'ios', 'mobile-firefox'],
  
  // Browsers that support popups reliably
  supportsPopups: ['chrome', 'firefox', 'edge'],
  
  // Browsers with strict cookie policies
  strictCookies: ['safari', 'ios'],
  
  // Browsers that need special session handling
  specialSessionHandling: ['safari', 'ios', 'mobile-firefox'],
};

/**
 * Get authentication configuration for a specific browser
 */
export function getAuthConfig(browserInfo: any): AuthTimeoutConfig {
  if (browserInfo.isIOS) {
    return AUTH_CONFIG.ios;
  }
  
  if (browserInfo.isDesktopSafari || browserInfo.isMobileSafari) {
    return AUTH_CONFIG.safari;
  }
  
  if (browserInfo.isMobileFirefox) {
    return AUTH_CONFIG.firefox;
  }
  
  if (browserInfo.isMobile) {
    return AUTH_CONFIG.mobile;
  }
  
  return AUTH_CONFIG.desktop;
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
export function calculateRetryDelay(
  retryCount: number, 
  config: AuthTimeoutConfig
): number {
  const baseDelay = config.retryDelay * Math.pow(config.exponentialBackoffBase, retryCount);
  const maxDelay = Math.min(baseDelay, 10000); // Cap at 10 seconds
  const jitter = (Math.random() - 0.5) * 2 * config.jitterRange;
  
  return Math.max(500, maxDelay + jitter); // Minimum 500ms
}

/**
 * Get additional delay for specific scenarios
 */
export function getAdditionalDelay(
  scenario: keyof typeof ADDITIONAL_DELAYS,
  browserInfo: any
): number {
  const delays: DelayConfig = ADDITIONAL_DELAYS[scenario];

  if (browserInfo.isIOS) {
    return delays.ios || delays.mobile || 0;
  }

  if (browserInfo.isDesktopSafari || browserInfo.isMobileSafari) {
    return delays.safari || delays.mobile || 0;
  }

  if (browserInfo.isMobile) {
    return delays.mobile || 0;
  }

  return delays.desktop || 0;
}

/**
 * Check if browser needs enhanced authentication flow
 */
export function needsEnhancedAuth(browserInfo: any): boolean {
  return (
    browserInfo.isIOS ||
    browserInfo.isMobileSafari ||
    browserInfo.isDesktopSafari ||
    browserInfo.isMobileFirefox ||
    browserInfo.requiresEnhancedAuth
  );
}

/**
 * Check if browser supports reliable popups
 */
export function supportsPopups(browserInfo: any): boolean {
  return (
    !browserInfo.isMobile || 
    (browserInfo.isMobileChrome && !browserInfo.isIOS)
  );
}

/**
 * Check if browser has strict cookie policies
 */
export function hasStrictCookies(browserInfo: any): boolean {
  return (
    browserInfo.isIOS ||
    browserInfo.isMobileSafari ||
    browserInfo.isDesktopSafari
  );
}

/**
 * Get timeout for redirect operation
 */
export function getRedirectTimeout(browserInfo: any): number {
  const config = getAuthConfig(browserInfo);
  return config.redirectTimeout;
}

/**
 * Get timeout for session check operation
 */
export function getSessionCheckTimeout(browserInfo: any): number {
  const config = getAuthConfig(browserInfo);
  return config.sessionCheckTimeout;
}

/**
 * Get maximum number of retries for browser
 */
export function getMaxRetries(browserInfo: any): number {
  const config = getAuthConfig(browserInfo);
  return config.maxRetries;
}

/**
 * Create a timeout promise that rejects after specified time
 */
export function createTimeoutPromise(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Race a promise against a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  timeoutMessage: string
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs, timeoutMessage)
  ]);
}
