// Enhanced Google OAuth utility functions with improved iOS/iPhone support

export interface BrowserInfo {
  isMobileSafari: boolean;
  isMobileFirefox: boolean;
  isMobileChrome: boolean;
  isDesktopSafari: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  isTablet: boolean;
  userAgent: string;
  browserName: string;
  osName: string;
  version: string;
  supportsPopups: boolean;
  requiresEnhancedAuth: boolean;
}

export interface OAuthUrlParams {
  appwriteEndpoint: string;
  projectId: string;
  successUrl: string;
  failureUrl: string;
  browserInfo: BrowserInfo;
  scope?: string;
  state?: string;
}

/**
 * Comprehensive browser detection with enhanced iOS support
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === "undefined") {
    return {
      isMobileSafari: false,
      isMobileFirefox: false,
      isMobileChrome: false,
      isDesktopSafari: false,
      isIOS: false,
      isAndroid: false,
      isMobile: false,
      isTablet: false,
      userAgent: "",
      browserName: "unknown",
      osName: "unknown",
      version: "",
      supportsPopups: false,
      requiresEnhancedAuth: false,
    };
  }

  const userAgent = navigator.userAgent;
  const platform = navigator.platform;
  const maxTouchPoints = navigator.maxTouchPoints || 0;

  // iOS Detection (comprehensive)
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1) ||
    /iOS/.test(userAgent);

  // More specific iOS device detection
  const isIPhone = /iPhone/.test(userAgent);
  const isIPad =
    /iPad/.test(userAgent) || (platform === "MacIntel" && maxTouchPoints > 1);
  const isIPod = /iPod/.test(userAgent);

  // Android Detection
  const isAndroid = /Android/.test(userAgent);

  // Mobile Detection
  const isMobile =
    isIOS ||
    isAndroid ||
    /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(userAgent);
  const isTablet =
    isIPad || (/Android/.test(userAgent) && !/Mobile/.test(userAgent));

  // Browser Detection
  const isMobileSafari =
    isIOS &&
    /AppleWebKit/.test(userAgent) &&
    !userAgent.includes("CriOS") &&
    !userAgent.includes("FxiOS") &&
    !userAgent.includes("EdgiOS") &&
    /Safari/.test(userAgent);

  const isMobileChrome =
    (isIOS && userAgent.includes("CriOS")) ||
    (isAndroid && /Chrome/.test(userAgent) && /Mobile/.test(userAgent));

  const isMobileFirefox =
    (isIOS && userAgent.includes("FxiOS")) ||
    (isAndroid && /Firefox/.test(userAgent));

  const isDesktopSafari =
    !isMobile &&
    /^((?!chrome|android).)*safari/i.test(userAgent) &&
    /AppleWebKit/.test(userAgent) &&
    !userAgent.includes("Chrome") &&
    !userAgent.includes("Chromium");

  // Browser Name Detection
  let browserName = "unknown";
  if (isMobileSafari || isDesktopSafari) browserName = "safari";
  else if (isMobileChrome || userAgent.includes("Chrome"))
    browserName = "chrome";
  else if (isMobileFirefox || userAgent.includes("Firefox"))
    browserName = "firefox";
  else if (userAgent.includes("Edge")) browserName = "edge";
  else if (userAgent.includes("Opera")) browserName = "opera";

  // OS Name Detection
  let osName = "unknown";
  if (isIOS) osName = "ios";
  else if (isAndroid) osName = "android";
  else if (userAgent.includes("Windows")) osName = "windows";
  else if (userAgent.includes("Mac")) osName = "macos";
  else if (userAgent.includes("Linux")) osName = "linux";

  // Version Detection (simplified)
  let version = "";
  try {
    if (isIOS) {
      const match = userAgent.match(/OS (\d+)_(\d+)_?(\d+)?/);
      if (match) {
        version = `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ""}`;
      }
    } else if (isAndroid) {
      const match = userAgent.match(/Android (\d+(?:\.\d+)*)/);
      if (match) {
        version = match[1];
      }
    }
  } catch (error) {
    console.warn("Version detection failed:", error);
  }

  // Popup Support Detection
  const supportsPopups = !isMobile || (browserName === "chrome" && !isIOS);

  // Enhanced Auth Requirements
  const requiresEnhancedAuth =
    isIOS ||
    isMobileSafari ||
    isMobileFirefox ||
    isDesktopSafari ||
    (isAndroid && browserName === "firefox");

  return {
    isMobileSafari,
    isMobileFirefox,
    isMobileChrome,
    isDesktopSafari,
    isIOS,
    isAndroid,
    isMobile,
    isTablet,
    userAgent: userAgent.substring(0, 200), // Truncate for security
    browserName,
    osName,
    version,
    supportsPopups,
    requiresEnhancedAuth,
  };
}

/**
 * Determines if enhanced authentication flow is needed
 */
export function needsEnhancedAuth(browserInfo: BrowserInfo): boolean {
  return (
    browserInfo.requiresEnhancedAuth ||
    browserInfo.isIOS ||
    browserInfo.isMobileSafari ||
    browserInfo.isMobileFirefox ||
    browserInfo.isDesktopSafari
  );
}

/**
 * Build enhanced Google OAuth URL with iOS/mobile optimizations
 */
export function buildGoogleOAuthUrl(params: OAuthUrlParams): string {
  const {
    appwriteEndpoint,
    projectId,
    successUrl,
    failureUrl,
    browserInfo,
    scope = "openid email profile",
    state,
  } = params;

  // Base URL
  const baseUrl = `${appwriteEndpoint}/account/sessions/oauth2/google`;

  // URL parameters
  const urlParams = new URLSearchParams();

  // Required parameters
  urlParams.set("project", projectId);
  urlParams.set("success", successUrl);
  urlParams.set("failure", failureUrl);

  // Scope
  urlParams.set("scope", scope);

  // State parameter for security
  if (state) {
    urlParams.set("state", state);
  }

  // iOS/Safari specific parameters
  if (browserInfo.isIOS || browserInfo.isMobileSafari) {
    // Force redirect mode for iOS
    urlParams.set("mode", "redirect");

    // iOS specific cookie settings
    urlParams.set("cookieSameSite", "none");
    urlParams.set("cookieSecure", "true");

    // Enhanced redirect parameters for iOS
    urlParams.set("forceRedirect", "true");
    urlParams.set("useQueryForSuccessUrl", "true");

    // iOS version specific handling
    if (browserInfo.version && parseFloat(browserInfo.version) >= 13) {
      urlParams.set("iosVersion", browserInfo.version);
    }

    // Safari specific parameters
    if (browserInfo.isMobileSafari) {
      urlParams.set("safariMode", "true");
      urlParams.set("preventThirdPartyCookies", "true");
    }
  }

  // Desktop Safari specific parameters
  if (browserInfo.isDesktopSafari) {
    urlParams.set("cookieSameSite", "none");
    urlParams.set("cookieSecure", "true");
    urlParams.set("safariDesktop", "true");
  }

  // Mobile Chrome on iOS specific parameters
  if (browserInfo.isMobileChrome && browserInfo.isIOS) {
    urlParams.set("chromeIOS", "true");
    urlParams.set("mode", "redirect");
  }

  // Android specific parameters
  if (browserInfo.isAndroid) {
    urlParams.set("androidMode", "true");

    if (browserInfo.isMobileFirefox) {
      urlParams.set("firefoxAndroid", "true");
      urlParams.set("mode", "redirect");
    }
  }

  // Mobile optimization parameters
  if (browserInfo.isMobile) {
    urlParams.set("mobile", "true");
    urlParams.set("viewport", "mobile");

    // Tablet specific handling
    if (browserInfo.isTablet) {
      urlParams.set("tablet", "true");
    }
  }

  // Popup support parameters
  if (!browserInfo.supportsPopups) {
    urlParams.set("disablePopup", "true");
    urlParams.set("mode", "redirect");
  }

  // Enhanced error handling parameters
  urlParams.set("enhancedErrors", "true");
  urlParams.set("returnErrors", "true");

  return `${baseUrl}?${urlParams.toString()}`;
}

/**
 * Enhanced authentication flow handler with iOS optimizations
 */
export function handleEnhancedAuth(
  browserInfo: BrowserInfo,
  oauthUrl: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Clear any existing auth flags
      clearAuthStorage();

      // Set auth in progress flags
      setAuthInProgress(browserInfo);

      // iOS specific handling with improved Safari support
      if (browserInfo.isIOS) {
        handleiOSAuth(oauthUrl, resolve, reject);
      }
      // Desktop Safari handling
      else if (browserInfo.isDesktopSafari) {
        handleSafariAuth(oauthUrl, resolve, reject);
      }
      // Mobile Firefox handling
      else if (browserInfo.isMobileFirefox) {
        handleMobileFirefoxAuth(oauthUrl, resolve, reject);
      }
      // Default redirect handling
      else {
        handleDefaultRedirect(oauthUrl, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * iOS specific authentication handling with enhanced Safari support
 */
function handleiOSAuth(
  oauthUrl: string,
  resolve: Function,
  reject: Function,
): void {
  try {
    // Set iOS specific flags with enhanced tracking
    if (typeof window !== "undefined") {
      sessionStorage.setItem("iOSAuthAttempt", "true");
      sessionStorage.setItem("iOSAuthTimestamp", Date.now().toString());

      // Store current URL for return
      sessionStorage.setItem("preAuthUrl", window.location.href);

      // Enhanced iOS Safari detection and handling
      const userAgent = navigator.userAgent;
      const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
      const isInAppBrowser = /FBAN|FBAV|Instagram|Twitter|Line|WhatsApp/.test(userAgent);

      sessionStorage.setItem("iOSSafari", isSafari.toString());
      sessionStorage.setItem("iOSInAppBrowser", isInAppBrowser.toString());

      // Store viewport info for debugging
      sessionStorage.setItem("iOSViewport", JSON.stringify({
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio || 1
      }));

      // For Safari, add special handling to prevent hanging
      if (isSafari) {
        // Clear any existing Safari auth flags that might cause conflicts
        localStorage.removeItem("safariAuthProcessing");
        localStorage.removeItem("safariAuthSuccessful");

        // Set a flag to track Safari auth attempt
        localStorage.setItem("safariAuthInProgress", Date.now().toString());

        // Add visibility change listener for Safari
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            // User likely navigated to Google OAuth
            sessionStorage.setItem("safariAuthRedirectDetected", Date.now().toString());
          }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange, { once: true });

        // Clean up listener after timeout
        setTimeout(() => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 45000);
      }
    }

    // Extended timeout for iOS Safari (it can be slower)
    const timeout = setTimeout(() => {
      console.error("[iOS Auth] Authentication timeout after 45 seconds");
      reject(new Error("iOS authentication timeout - please try again"));
    }, 45000); // 45 seconds timeout for iOS Safari

    // Enhanced beforeunload handling
    const handleBeforeUnload = () => {
      clearTimeout(timeout);
      sessionStorage.setItem("iOSAuthRedirectSuccess", Date.now().toString());
      resolve();
    };

    window.addEventListener("beforeunload", handleBeforeUnload, { once: true });

    // Additional pagehide event for iOS Safari
    window.addEventListener("pagehide", handleBeforeUnload, { once: true });

    // Add a small delay before redirect to ensure all flags are set
    setTimeout(() => {
      console.log("[iOS Auth] Redirecting to Google OAuth:", oauthUrl);
      window.location.href = oauthUrl;
    }, 100);

  } catch (error) {
    console.error("[iOS Auth] Error in handleiOSAuth:", error);
    reject(error);
  }
}

/**
 * Safari specific authentication handling with enhanced reliability
 */
function handleSafariAuth(
  oauthUrl: string,
  resolve: Function,
  reject: Function,
): void {
  try {
    // Enhanced Safari specific storage and tracking
    if (typeof window !== "undefined") {
      localStorage.setItem("safariAuthAttempt", Date.now().toString());
      localStorage.setItem("safariAuthUrl", oauthUrl);

      // Clear any conflicting flags
      localStorage.removeItem("safariAuthProcessing");
      localStorage.removeItem("safariAuthSuccessful");

      // Set tracking flags
      sessionStorage.setItem("safariDesktopAuth", "true");
      sessionStorage.setItem("safariAuthTimestamp", Date.now().toString());

      // Store browser capabilities for debugging
      const capabilities = {
        cookiesEnabled: navigator.cookieEnabled,
        localStorage: typeof(Storage) !== "undefined",
        sessionStorage: typeof(Storage) !== "undefined",
        thirdPartyCookies: document.cookie.indexOf('test=') !== -1
      };

      sessionStorage.setItem("safariBrowserCapabilities", JSON.stringify(capabilities));
    }

    // Add timeout for Safari
    const timeout = setTimeout(() => {
      console.error("[Safari Auth] Authentication timeout after 30 seconds");
      reject(new Error("Safari authentication timeout"));
    }, 30000);

    // Enhanced beforeunload handling for Safari
    const handleBeforeUnload = () => {
      clearTimeout(timeout);
      localStorage.setItem("safariAuthRedirectSuccess", Date.now().toString());
      resolve();
    };

    window.addEventListener("beforeunload", handleBeforeUnload, { once: true });

    // Add small delay for Safari to ensure proper state setting
    setTimeout(() => {
      console.log("[Safari Auth] Redirecting to Google OAuth:", oauthUrl);
      window.location.href = oauthUrl;
    }, 50);

  } catch (error) {
    console.error("[Safari Auth] Error in handleSafariAuth:", error);
    reject(error);
  }
}

/**
 * Mobile Firefox specific authentication handling
 */
function handleMobileFirefoxAuth(
  oauthUrl: string,
  resolve: Function,
  reject: Function,
): void {
  try {
    // Firefox mobile specific handling
    if (typeof window !== "undefined") {
      sessionStorage.setItem("firefoxMobileAuth", "true");
    }

    window.location.href = oauthUrl;
    resolve();
  } catch (error) {
    reject(error);
  }
}

/**
 * Default redirect handling
 */
function handleDefaultRedirect(
  oauthUrl: string,
  resolve: Function,
  reject: Function,
): void {
  try {
    window.location.href = oauthUrl;
    resolve();
  } catch (error) {
    reject(error);
  }
}

/**
 * Set authentication in progress flags
 */
function setAuthInProgress(browserInfo: BrowserInfo): void {
  if (typeof window === "undefined") return;

  const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

  sessionStorage.setItem("googleAuthInProgress", "true");
  sessionStorage.setItem("googleAuthExpiryTime", expiryTime.toString());
  sessionStorage.setItem("authBrowserInfo", JSON.stringify(browserInfo));

  // Browser specific flags
  if (browserInfo.isIOS) {
    sessionStorage.setItem("iOSAuthInProgress", "true");
  }
  if (browserInfo.isDesktopSafari) {
    localStorage.setItem("safariAuthInProgress", "true");
  }
}

/**
 * Clear authentication storage
 */
function clearAuthStorage(): void {
  if (typeof window === "undefined") return;

  // Session storage cleanup
  const sessionKeys = [
    "googleAuthInProgress",
    "googleAuthExpiryTime",
    "authBrowserInfo",
    "iOSAuthAttempt",
    "iOSAuthTimestamp",
    "iOSAuthInProgress",
    "firefoxMobileAuth",
  ];

  sessionKeys.forEach((key) => {
    sessionStorage.removeItem(key);
  });

  // Local storage cleanup
  const localKeys = [
    "authRedirectAttempt",
    "safariAuthUrl",
    "safariAuthAttempt",
    "safariAuthInProgress",
  ];

  localKeys.forEach((key) => {
    localStorage.removeItem(key);
  });
}

/**
 * Check if authentication is currently in progress
 */
export function isAuthInProgress(): boolean {
  if (typeof window === "undefined") return false;

  const inProgress = sessionStorage.getItem("googleAuthInProgress");
  const expiryTime = sessionStorage.getItem("googleAuthExpiryTime");

  if (!inProgress || !expiryTime) return false;

  // Check if expired
  if (Date.now() > parseInt(expiryTime)) {
    clearAuthStorage();
    return false;
  }

  return true;
}

/**
 * Get stored browser info from auth session
 */
export function getStoredBrowserInfo(): BrowserInfo | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = sessionStorage.getItem("authBrowserInfo");
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.warn("Failed to parse stored browser info:", error);
    return null;
  }
}

/**
 * Enhanced cleanup function
 */
export function clearAllAuthFlags(): void {
  clearAuthStorage();

  // Additional cleanup for edge cases
  if (typeof window !== "undefined") {
    // Clear any remaining auth-related items
    Object.keys(sessionStorage).forEach((key) => {
      if (
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("oauth")
      ) {
        sessionStorage.removeItem(key);
      }
    });

    Object.keys(localStorage).forEach((key) => {
      if (
        key.toLowerCase().includes("auth") ||
        key.toLowerCase().includes("oauth")
      ) {
        localStorage.removeItem(key);
      }
    });
  }
}

/**
 * Detect if current session is from OAuth return
 */
export function isOAuthReturn(): boolean {
  if (typeof window === "undefined") return false;

  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams =
    urlParams.has("code") || urlParams.has("state") || urlParams.has("error");
  const wasAuthInProgress =
    sessionStorage.getItem("googleAuthInProgress") === "true";

  return hasOAuthParams || wasAuthInProgress;
}

/**
 * Handle OAuth return and cleanup
 */
export function handleOAuthReturn(): { success: boolean; error?: string } {
  if (typeof window === "undefined")
    return { success: false, error: "No window object" };

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");
    const code = urlParams.get("code");

    // Clear auth flags
    clearAllAuthFlags();

    if (error) {
      return { success: false, error: error };
    }

    if (code) {
      return { success: true };
    }

    // Check if this was an auth attempt
    const wasAuthInProgress =
      sessionStorage.getItem("googleAuthInProgress") === "true";
    if (wasAuthInProgress) {
      return { success: true };
    }

    return { success: false, error: "No auth parameters found" };
  } catch (error) {
    console.error("Error handling OAuth return:", error);
    return { success: false, error: "Failed to process OAuth return" };
  }
}
