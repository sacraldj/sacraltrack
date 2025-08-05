import TextInput from "../TextInput";
import { useState, useEffect } from "react";
import { ShowErrorObject } from "@/app/types";
import { useUser } from "@/app/context/user";
import { useGeneralStore } from "@/app/stores/general";
import { BiLoaderCircle } from "react-icons/bi";
import { FcGoogle } from "react-icons/fc";
import {
  FiMail,
  FiLock,
  FiX,
  FiEye,
  FiEyeOff,
  FiCheck,
  FiAlertCircle,
} from "react-icons/fi";
import { BsMusicNoteBeamed } from "react-icons/bs";
import { motion, AnimatePresence } from "framer-motion";
import { account } from "@/libs/AppWriteClient";
import { toast } from "react-hot-toast";
import {
  detectBrowser,
  needsEnhancedAuth,
  buildGoogleOAuthUrl,
  handleEnhancedAuth,
} from "./googleOAuthUtils";
import { clearAllAuthFlags } from "@/app/utils/authCleanup";
import SafariAuthHelper from './SafariAuthHelper';
import { getRedirectTimeout, getAdditionalDelay } from '@/app/config/authConfig';
import { useIsClient } from '@/app/hooks/useIsClient';
import { useBodyScrollLock } from '@/app/hooks/useBodyScrollLock';

// Custom toast styling function
const showToast = (
  type: "success" | "error" | "loading",
  message: string,
  options = {},
) => {
  const baseStyle = {
    background: "linear-gradient(135deg, #1E1F2E 0%, #272B43 100%)",
    color: "#fff",
    borderRadius: "16px",
    border: "1px solid rgba(32, 221, 187, 0.2)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
    padding: "16px 20px",
    fontSize: "14px",
    fontWeight: "500",
    ...options,
  };

  const iconStyles = {
    success: { borderLeft: "4px solid #20DDBB", icon: "✅" },
    error: { borderLeft: "4px solid #EF4444", icon: "❌" },
    loading: { borderLeft: "4px solid #8A2BE2", icon: "⏳" },
  };

  return toast[type](message, {
    duration: type === "loading" ? Infinity : 5000,
    style: { ...baseStyle, ...iconStyles[type] },
    icon: iconStyles[type].icon,
    ...options,
  });
};

export default function Login() {
  const { setIsLoginOpen, setIsRegisterOpen } = useGeneralStore();
  const contextUser = useUser();
  const isClient = useIsClient();

  const [loading, setLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<ShowErrorObject | null>(null);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showSafariHelper, setShowSafariHelper] = useState(false);
  const [safariErrorType, setSafariErrorType] = useState<'cookies' | 'tracking' | 'timeout' | 'general'>('general');
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState<number>(0);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [blockTimeLeft, setBlockTimeLeft] = useState<number>(0);

  // Prevent body scroll when modal is open
  useBodyScrollLock(true);

  // Check if user is temporarily blocked
  useEffect(() => {
    const checkBlockStatus = () => {
      const blockTime = localStorage.getItem("loginBlockTime");
      const attempts = localStorage.getItem("loginAttempts");

      if (attempts) {
        setLoginAttempts(parseInt(attempts));
      }

      if (blockTime) {
        const blockEnd = parseInt(blockTime);
        if (Date.now() < blockEnd) {
          setIsBlocked(true);
          const timeLeft = Math.ceil((blockEnd - Date.now()) / 1000);
          setBlockTimeLeft(timeLeft);

          const countdown = setInterval(() => {
            const newTimeLeft = Math.ceil((blockEnd - Date.now()) / 1000);
            if (newTimeLeft <= 0) {
              setIsBlocked(false);
              setBlockTimeLeft(0);
              localStorage.removeItem("loginBlockTime");
              localStorage.removeItem("loginAttempts");
              setLoginAttempts(0);
              clearInterval(countdown);
            } else {
              setBlockTimeLeft(newTimeLeft);
            }
          }, 1000);

          return () => clearInterval(countdown);
        } else {
          localStorage.removeItem("loginBlockTime");
          localStorage.removeItem("loginAttempts");
          setIsBlocked(false);
          setLoginAttempts(0);
        }
      }
    };
    checkBlockStatus();
  }, []);

  // Слушатель событий аутентификации для автоматического закрытия модального окна
  useEffect(() => {
    const handleAuthStateChange = (event: CustomEvent) => {
      const { user } = event.detail;
      if (user) {
        console.log("Auth state change detected, user logged in, closing login modal");
        setIsLoginOpen(false);
      }
    };

    // Добавляем слушатель события
    window.addEventListener('auth_state_change', handleAuthStateChange as EventListener);

    // Также проверяем текущее состояние пользователя при монтировании
    if (contextUser?.user) {
      console.log("User already logged in, closing login modal");
      setIsLoginOpen(false);
    }

    // Очистка слушателя при размонтировании
    return () => {
      window.removeEventListener('auth_state_change', handleAuthStateChange as EventListener);
    };
  }, [contextUser?.user, setIsLoginOpen]);

  // Format time remaining for block
  const formatTimeLeft = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const showError = (type: string) => {
    if (error && Object.entries(error).length > 0 && error?.type == type) {
      return error.message;
    }
    return "";
  };

  const validate = () => {
    setError(null);
    let isError = false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      setError({ type: "email", message: "Email is required" });
      isError = true;
    } else if (!emailRegex.test(email)) {
      setError({
        type: "email",
        message: "Please enter a valid email address",
      });
      isError = true;
    } else if (!password) {
      setError({ type: "password", message: "Password is required" });
      isError = true;
    } else if (password.length < 6) {
      setError({
        type: "password",
        message: "Password must be at least 6 characters",
      });
      isError = true;
    }
    return isError;
  };

  const handleGoogleLogin = async () => {
    if (googleLoading || loading) return;

    try {
      setGoogleLoading(true);

      // Show loading toast
      const loadingToastId = showToast(
        "loading",
        "Redirecting to Google login...",
        {
          id: "google-redirect",
          duration: 10000,
        },
      );

      const browserInfo = detectBrowser();
      const enhanced = needsEnhancedAuth(browserInfo);

      if (typeof window !== "undefined") {
        clearAllAuthFlags();
        sessionStorage.setItem("googleAuthInProgress", "true");
        const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes
        sessionStorage.setItem("googleAuthExpiryTime", expiryTime.toString());
        sessionStorage.setItem("authBrowserInfo", JSON.stringify(browserInfo));

        // Special handling for iPhone/iOS
        if (browserInfo.isIOS || browserInfo.isMobileSafari) {
          sessionStorage.setItem("iOSAuthAttempt", "true");
          sessionStorage.setItem("iOSAuthTimestamp", Date.now().toString());
          // Add iOS specific parameters
          sessionStorage.setItem("iOSRetry", "false");
        }

        console.log("[GoogleLogin] Browser info:", browserInfo);
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
      const successUrl = `${appUrl}/auth/google/success`;
      const failureUrl = `${appUrl}/auth/google/fail`;

      if (!process.env.NEXT_PUBLIC_APPWRITE_URL) {
        toast.dismiss("google-redirect");
        showToast(
          "error",
          "Authentication service is not configured. Please contact support.",
        );
        throw new Error("Appwrite configuration is missing");
      }

      setIsLoginOpen(false);

      // Check for existing session
      try {
        const session = await account.getSession("current");
        if (session) {
          toast.dismiss("google-redirect");
          showToast("success", "Already logged in! Redirecting...");
          setTimeout(() => {
            window.location.href = "/";
          }, 1000);
          return;
        }
      } catch (sessionError) {
        console.log(
          "[GoogleLogin] No existing session found, proceeding with OAuth",
        );
      }

      // Enhanced OAuth for mobile browsers and iPhone
      if (enhanced) {
        try {
          const appwriteEndpoint =
            process.env.NEXT_PUBLIC_APPWRITE_URL ||
            "https://cloud.appwrite.io/v1";
          const projectId = process.env.NEXT_PUBLIC_ENDPOINT || "";

          const oauthUrl = buildGoogleOAuthUrl({
            appwriteEndpoint,
            projectId,
            successUrl,
            failureUrl,
            browserInfo,
          });

          // Enhanced handling for Safari and iOS with improved reliability
          if (browserInfo.isIOS || browserInfo.isMobileSafari) {
            console.log("[GoogleLogin] iOS/Mobile Safari detected, using enhanced auth handler");

            // Clear any existing auth state that might interfere
            if (typeof window !== "undefined") {
              sessionStorage.removeItem("googleAuthInProgress");
              localStorage.removeItem("safariAuthProcessing");

              // Set fresh auth state
              sessionStorage.setItem("googleAuthInProgress", "true");
              sessionStorage.setItem("authType", "login");
              const expiryTime = Date.now() + 15 * 60 * 1000; // 15 minutes
              sessionStorage.setItem("googleAuthExpiryTime", expiryTime.toString());
            }

            // Use the enhanced auth handler for iOS/Mobile Safari
            try {
              await handleEnhancedAuth(browserInfo, oauthUrl);
              return; // Exit early since handleEnhancedAuth manages the redirect
            } catch (enhancedError) {
              console.error("[GoogleLogin] Enhanced auth failed:", enhancedError);
              // Fall back to standard redirect
            }
          } else if (browserInfo.isDesktopSafari) {
            // Desktop Safari handling
            localStorage.setItem("authRedirectAttempt", Date.now().toString());
            localStorage.setItem("safariAuthUrl", oauthUrl);

            // Clear any conflicting flags
            localStorage.removeItem("safariAuthProcessing");
            localStorage.removeItem("safariAuthSuccessful");

            console.log("[GoogleLogin] Desktop Safari detected, using enhanced redirect");
          }

          console.log("[GoogleLogin] Using enhanced OAuth URL:", oauthUrl);

          // Dynamic timeout based on browser configuration
          const timeoutDuration = getRedirectTimeout(browserInfo);
          console.log(`[GoogleLogin] Setting redirect timeout: ${timeoutDuration}ms for ${browserInfo.browserName}`);

          const redirectTimeout = setTimeout(() => {
            toast.dismiss("google-redirect");
            showToast(
              "error",
              "Redirect is taking longer than expected. Please try again.",
            );
            setGoogleLoading(false);
            clearAllAuthFlags();
          }, timeoutDuration);

          // Enhanced beforeunload handling
          const handleBeforeUnload = () => {
            clearTimeout(redirectTimeout);
            if (browserInfo.isIOS || browserInfo.isMobileSafari) {
              sessionStorage.setItem("authRedirectSuccess", Date.now().toString());
            }
          };

          window.addEventListener("beforeunload", handleBeforeUnload, { once: true });

          // Also listen for pagehide on iOS
          if (browserInfo.isIOS) {
            window.addEventListener("pagehide", handleBeforeUnload, { once: true });
          }

          // Add small delay before redirect for mobile browsers
          const redirectDelay = getAdditionalDelay('redirectDelay', browserInfo);
          if (redirectDelay > 0) {
            console.log(`[GoogleLogin] Adding redirect delay: ${redirectDelay}ms`);
          }
          setTimeout(() => {
            window.location.href = oauthUrl;
          }, redirectDelay);
        } catch (error) {
          console.error("[GoogleLogin] Error starting OAuth session:", error);
          toast.dismiss("google-redirect");
          showToast(
            "error",
            "Failed to start Google authentication. Please try email login instead.",
          );
          setGoogleLoading(false);
          clearAllAuthFlags();
        }
      } else {
        // Standard OAuth for desktop browsers
        try {
          await account.createOAuth2Session("google", successUrl, failureUrl);
        } catch (error) {
          console.error("[GoogleLogin] Standard OAuth error:", error);
          toast.dismiss("google-redirect");

          let errorMessage = "Failed to start Google authentication.";
          if (error.code === 429) {
            errorMessage =
              "Too many attempts. Please wait a few minutes before trying again.";
          } else if (error.code === 503) {
            errorMessage =
              "Google authentication service is temporarily unavailable.";
          }

          showToast("error", errorMessage);
          setGoogleLoading(false);
          clearAllAuthFlags();
        }
      }
    } catch (error: any) {
      console.error("[GoogleLogin] General error:", error);
      toast.dismiss("google-redirect");

      // Enhanced Safari error handling
      const browserInfo = detectBrowser();
      if (browserInfo.isDesktopSafari || browserInfo.isMobileSafari) {
        // Determine error type for Safari
        let errorType: 'cookies' | 'tracking' | 'timeout' | 'general' = 'general';

        if (error.code === 429) {
          errorType = 'timeout';
        } else if (error.message?.includes('cookie') || error.message?.includes('session')) {
          errorType = 'cookies';
        } else if (error.message?.includes('tracking') || error.message?.includes('cross-site')) {
          errorType = 'tracking';
        }

        setSafariErrorType(errorType);
        setShowSafariHelper(true);

        showToast("error", "Safari authentication issue detected");
      } else {
        showToast(
          "error",
          "Failed to login with Google. Please try email login instead.",
        );
      }

      setGoogleLoading(false);
      clearAllAuthFlags();
    }
  };

  // Function to check if user exists by attempting to create a session
  const checkUserExists = async (email: string, password: string): Promise<boolean> => {
    try {
      // Try to create a session - this will fail if user doesn't exist
      const session = await account.createEmailSession(email, password);
      
      // If we reach here, user exists and credentials are correct
      if (session) {
        // Delete the session immediately since this is just a check
        await account.deleteSession('current');
        return true;
      }
      return false;
    } catch (error: any) {
      console.log('[Login] User check error:', error);
      // Check error codes to determine if user exists
      if (error.code === 401) {
        if (error.message?.includes("user_not_found") || 
            error.message?.includes("User not found") ||
            error.message?.includes("Invalid credentials")) {
          return false; // User doesn't exist
        }
      }
      // For other errors, assume user might exist but there's another issue
      return true;
    }
  };

  const login = async () => {
    console.log('[Login] Клик по кнопке логина, email:', email);
    if (isBlocked) {
      console.log('[Login] Аккаунт заблокирован, осталось секунд:', blockTimeLeft);
      showToast(
        "error",
        `Account locked. Try again in ${formatTimeLeft(blockTimeLeft)}`,
      );
      return;
    }

    let isError = validate();
    if (isError) {
      console.log('[Login] Валидация не пройдена:', error);
      return;
    }
    if (!contextUser) {
      console.log('[Login] Нет contextUser');
      return;
    }

    try {
      setLoading(true);
      console.log('[Login] Начинаем процесс логина через contextUser.login');
      
      // Show loading toast
      const loadingToastId = showToast("loading", "Checking credentials...", {
        id: "login-loading",
      });

      // Check if user exists first
      console.log('[Login] Проверяем существование пользователя...');
      const userExists = await checkUserExists(email, password);
      
      if (!userExists) {
        toast.dismiss("login-loading");
        setLoading(false);
        console.log('[Login] Пользователь не найден');
        showToast("error", "❌ User not found. Please check your email or register a new account.", {
          duration: 6000
        });
        
        // Ask if user wants to register instead
        setTimeout(() => {
          const shouldRegister = confirm("This email is not registered. Would you like to create an account?");
          if (shouldRegister) {
            setIsRegisterOpen(true);
            setIsLoginOpen(false);
          }
        }, 2000);
        return;
      }

      // Update loading message
      toast.dismiss("login-loading");
      showToast("loading", "Signing you in...", {
        id: "login-loading",
      });

      // Закрываем модальное окно МГНОВЕННО при нажатии кнопки логина
      setIsLoginOpen(false);
      await contextUser.login(email, password);
      toast.dismiss("login-loading");
      setLoading(false);
      setLoginAttempts(0);
      localStorage.removeItem("loginAttempts");
      localStorage.removeItem("loginBlockTime");
      // If we reach here, login was successful
      console.log("[Login] Login completed successfully");
      showToast("success", `Welcome back! 🎉`);
      // Clear form data
      setEmail("");
      setPassword("");
      setError({ type: "", message: "" });
      // No need for additional redirect here as it's handled in UserContext
      console.log("[Login] Login process completed, user should be redirected");
    } catch (error: any) {
      setLoading(false);
      console.error("[Login] Login error:", error);
      let errorMessage = "An error occurred during login.";
      const newAttempts = Math.min(loginAttempts + 1, 5);
      setLoginAttempts(newAttempts);
      localStorage.setItem("loginAttempts", newAttempts.toString());
      if (newAttempts >= 5) {
        const blockTime = Date.now() + 15 * 60 * 1000; // 15 minutes
        localStorage.setItem("loginBlockTime", blockTime.toString());
        errorMessage = `Too many failed attempts. Account locked for ${15} minutes.`;
        console.log('[Login] Слишком много попыток, аккаунт заблокирован');
      } else if (error.code === 401) {
        if (error.message?.includes("Invalid credentials")) {
          errorMessage =
            "Invalid email or password. Please check your credentials.";
          console.log('[Login] Неверные данные для входа');
        } else if (
          error.message?.includes("user_not_found") ||
          error.message?.includes("User not found")
        ) {
          errorMessage = `This email is not registered. Would you like to sign up instead?`;
          console.log('[Login] Пользователь не найден');
          // Show option to switch to register
          setTimeout(() => {
            const switchToRegister = confirm(
              "This email is not registered. Would you like to create an account?",
            );
            if (switchToRegister) {
              setIsRegisterOpen(true);
            }
          }, 2000);
        } else {
          errorMessage = "Invalid email or password.";
          console.log('[Login] Неизвестная ошибка авторизации');
        }
      }
      showToast("error", errorMessage);
    }
  };

  const sendVerificationEmail = async () => {
    if (!email) {
      setError({
        type: "email",
        message: "Please enter your email address first",
      });
      return;
    }

    try {
      setLoading(true);

      const verifyUrl = process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL}/verify`
        : `${window.location.origin}/verify`;

      await account.createVerification(verifyUrl);
      setIsEmailSent(true);

      showToast(
        "success",
        "Verification email sent! Please check your inbox and spam folder.",
      );

      setTimeout(() => {
        setIsLoginOpen(false);
      }, 3000);
    } catch (error: any) {
      console.error("Email verification error:", error);

      let errorMessage = "Failed to send verification email";
      if (error.code === 429) {
        errorMessage =
          "Too many requests. Please wait before requesting another verification email.";
      } else if (error.code === 401) {
        errorMessage = "Please log in first to request email verification.";
      }

      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordRecovery = async () => {
    if (!email) {
      setError({ type: "email", message: "Please enter your email address" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError({
        type: "email",
        message: "Please enter a valid email address",
      });
      return;
    }

    try {
      setLoading(true);

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : window.location.origin;
      const resetUrl = `${baseUrl}/reset-password`;

      await account.createRecovery(email, resetUrl);

      showToast(
        "success",
        "Password reset instructions sent to your email! 📧",
      );
      setResetEmailSent(true);
      setShowForgotPassword(false);

      setTimeout(() => {
        setIsLoginOpen(false);
      }, 2000);
    } catch (error: any) {
      console.error("Password recovery error:", error);

      let errorMessage = "Failed to send recovery email";

      if (error.code === 429) {
        errorMessage = "Too many attempts. Please try again in a few minutes.";
      } else if (error.code === 400) {
        errorMessage = "Please enter a valid email address.";
      } else if (
        error.code === 404 ||
        error.message?.includes("user_not_found")
      ) {
        errorMessage = "No account found with this email address.";
      } else if (error.message?.includes("network")) {
        errorMessage = "Network error. Please check your connection.";
      }

      showToast("error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setError(null);
  };

  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !loading && !googleLoading) {
      setIsLoginOpen(false);
    }
  };

  const handleSafariHelperClose = () => {
    setShowSafariHelper(false);
  };

  const handleSafariHelperRetry = () => {
    setShowSafariHelper(false);

    // Clear any existing error states
    setError(null);

    // Retry Google login
    setTimeout(() => {
      handleGoogleLogin();
    }, 500);
  };

  const switchToRegister = () => {
    setIsRegisterOpen(true);
  };

  return (
    <div 
      className="fixed inset-0 z-[9999999999] flex items-center justify-center p-4 auth-modal-overlay"
      onClick={handleClickOutside}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-full mx-auto bg-[#1E1F2E] shadow-2xl overflow-hidden relative auth-modal-container"
        onClick={(e) => e.stopPropagation()}
        >
          {/* Enhanced Close Button for Mobile */}
          <button
            onClick={() => setIsLoginOpen(false)}
            disabled={loading || googleLoading}
            className="absolute top-4 right-4 z-10 text-[#818BAC] hover:text-white transition-colors duration-300 disabled:opacity-50 auth-modal-close mobile-close-button"
            aria-label="Close login form"
          >
            <FiX className="text-2xl" />
          </button>

          <div className="p-4 sm:p-6 md:p-8 auth-modal-content">
            {/* Header */}
            <div className="text-center mb-4 sm:mb-6 md:mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 15, stiffness: 300 }}
                className="flex justify-center mb-4 sm:mb-6"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20">
                  <motion.div
                    className="absolute inset-0 bg-[#20DDBB]/20 rounded-full blur-xl"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-[#20DDBB]/30 bg-gradient-to-br from-[#20DDBB]/10 to-[#8A2BE2]/10">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BsMusicNoteBeamed className="text-3xl text-[#20DDBB]" />
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#20DDBB] to-[#8A2BE2] mb-2 sm:mb-3 auth-modal-title"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Welcome Back!
              </motion.h1>
              <motion.p
                className="text-sm sm:text-base text-[#818BAC] auth-modal-subtitle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Sign in to continue your musical journey
              </motion.p>
            </div>

                        {/* Form */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
                  {/* Email Input */}
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <TextInput
                      string={email}
                      placeholder="Email Address"
                      onUpdate={setEmail}
                      inputType="email"
                      error={showError("email")}
                    />
                  </motion.div>

                  {/* Password Input */}
                  <motion.div
                    className="relative"
                    whileHover={{ scale: 1.01 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <div className="relative">
                      <TextInput
                        string={password}
                        placeholder="Password"
                        onUpdate={setPassword}
                        inputType={showPassword ? "text" : "password"}
                        error={showError("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-6 top-1/2 -translate-y-1/2 text-[#818BAC] hover:text-[#20DDBB] transition-colors duration-300 z-20"
                      >
                        {showPassword ? (
                          <FiEyeOff className="text-xl" />
                        ) : (
                          <FiEye className="text-xl" />
                        )}
                      </button>
                    </div>
                  </motion.div>

              {/* Error Display */}
              <AnimatePresence>
                {(showError("general") || showError("email") || showError("password")) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <FiAlertCircle className="text-red-400 flex-shrink-0" />
                      <p className="text-red-400 text-sm">
                        {showError("general") || showError("email") || showError("password")}
                      </p>
                  </div>
            </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              className="space-y-4 mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
                  {/* Login Button */}
                  <motion.button
                    disabled={loading || isBlocked}
                    onClick={login}
                    whileHover={{ scale: loading || isBlocked ? 1 : 1.02 }}
                    whileTap={{ scale: loading || isBlocked ? 1 : 0.98 }}
                    className="
                                            relative w-full bg-gradient-to-r from-[#20DDBB] to-[#8A2BE2]
                                            text-white py-3 sm:py-4 rounded-2xl font-semibold text-sm sm:text-base
                                            overflow-hidden group
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            auth-modal-button
                                        "
                  >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center justify-center gap-2">
                      {loading ? (
                        <BiLoaderCircle className="animate-spin text-2xl" />
                      ) : (
                        <>
                        <span>Sign In</span>
                          <motion.div
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                          >
                            →
                          </motion.div>
                        </>
                      )}
                    </div>
                  </motion.button>

                  {/* Divider */}
                <div className="flex items-center gap-4 my-4 sm:my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#818BAC]/30 to-transparent"></div>
                  <span className="text-[#818BAC] text-xs sm:text-sm font-medium">OR</span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#818BAC]/30 to-transparent"></div>
                  </div>

                  {/* Google Login Button */}
                  <motion.button
                  disabled={googleLoading || loading}
                    onClick={handleGoogleLogin}
                  whileHover={{ scale: googleLoading || loading ? 1 : 1.02 }}
                  whileTap={{ scale: googleLoading || loading ? 1 : 0.98 }}
                    className="
                    relative w-full bg-[#14151F]/60 border-2 border-[#2A2B3F]
                    hover:border-[#20DDBB]/50 text-white py-3 sm:py-4 rounded-2xl font-medium text-sm sm:text-base
                    overflow-hidden group transition-all duration-300
                                            disabled:opacity-50 disabled:cursor-not-allowed
                                            auth-google-button
                                        "
                  >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#20DDBB]/5 to-[#8A2BE2]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center justify-center gap-3">
                      {googleLoading ? (
                        <BiLoaderCircle className="animate-spin text-xl" />
                      ) : (
                        <FcGoogle className="text-xl" />
                      )}
                      <span>
                      {googleLoading ? "Connecting..." : "Continue with Google"}
                      </span>
                    </div>
                  </motion.button>
            </motion.div>

              {/* Footer */}
              <motion.div
                className="text-center pt-6 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <p className="text-[#818BAC] text-xs sm:text-sm">
                  Don't have an account?{" "}
                  <button
                    onClick={switchToRegister}
                    className="text-[#20DDBB] hover:text-[#8A2BE2] font-medium transition-colors duration-300"
                  >
                    Sign up here
                  </button>
                </p>
        </motion.div>
            </div>
          </motion.div>

      {/* Safari Authentication Helper */}
      <SafariAuthHelper
        isVisible={showSafariHelper}
        onClose={handleSafariHelperClose}
        onRetry={handleSafariHelperRetry}
        errorType={safariErrorType}
      />
    </div>
  );
}
