'use client'
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useUser } from "@/app/context/user"
import { Suspense } from 'react'
import useCreatePurchase from "@/app/hooks/useCreatePurchase";
import { motion, AnimatePresence } from "framer-motion";

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
      </div>
    </div>}>
      <SuccessPageContent />
    </Suspense>
  )
}

function SuccessPageContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams?.get("session_id") || null
  const router = useRouter()
  const userContext = useUser()

  const { createPurchase, isLoading: createPurchaseLoading, error: createPurchaseError } = useCreatePurchase()

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessed, setIsProcessed] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [activeButton, setActiveButton] = useState<'profile' | 'explore' | null>(null)
  const [showError, setShowError] = useState(false)

  // Проверяем, что мы на клиенте
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Эффект для задержки отображения ошибки
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        if (!isProcessed) {
          setShowError(true);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      setShowError(false);
    }
  }, [error, isProcessed]);

  useEffect(() => {
    if (!isClient) return;
    if (isProcessed || !sessionId) return;
    if (userContext === undefined) return;

    if (userContext?.user?.id) {
      setUserId(userContext.user.id);
    } else {
      try {
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
        }
      } catch (e) {
        console.error("Error accessing localStorage:", e);
      }
    }

    const handlePaymentSuccess = async () => {
      try {
        console.log("Starting handlePaymentSuccess with sessionId:", sessionId);

        if (!sessionId) {
          setError("Session ID is missing");
          setIsLoading(false);
          console.error("Session ID is missing");
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 2000));

        let currentUserId = userContext?.user?.id;
        
        if (!currentUserId) {
          const urlUserId = searchParams?.get("user_id");
          if (urlUserId) {
            currentUserId = urlUserId;
            console.log("Using user ID from URL:", urlUserId);
          }
        }

        if (!currentUserId) {
          console.log("User ID is missing, but proceeding without creating purchase");
        }

        try {
          if (currentUserId) {
            console.log("User authenticated, payment processed for userId:", currentUserId, "sessionId:", sessionId);
            // Mark as processed since we have valid session and user
          }

          setIsProcessed(true);
          console.log("Payment processing completed successfully");
        } catch (purchaseError: any) {
          console.error("Purchase creation error:", purchaseError);
          
          if (purchaseError?.message?.includes('Purchase already exists') || 
              purchaseError?.message?.includes('already processed') ||
              purchaseError?.message?.includes('DuplicatePurchaseError')) {
            console.log("Purchase already exists, marking as processed");
            setIsProcessed(true);
          } else {
            setError(purchaseError?.message || "Failed to process purchase");
          }
        }

        setIsLoading(false);
      } catch (error: any) {
        console.error("Error processing payment:", error);
        setError(error?.message || "An error occurred while processing your payment");
        setIsLoading(false);
      }
    };

    handlePaymentSuccess();
  }, [sessionId, userContext, createPurchase, searchParams, isProcessed, isClient]);

  const handleNavigateProfile = () => {
    setActiveButton('profile');
    router.push('/profile');
  };

  const handleNavigateExplore = () => {
    setActiveButton('explore');
    router.push('/');
  };

  const handleNavigateHome = () => {
    router.push('/');
  };

  // Простые состояния без анимаций загрузки
  if (userContext === undefined) {
    return (
      <div className="flex justify-center items-center h-screen p-[20px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Initializing...</h2>
        </div>
      </div>
    )
  }

  if (isLoading || createPurchaseLoading) {
    return (
      <div className="flex justify-center items-center h-screen p-[20px]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-white mb-2">Processing...</h2>
        </div>
      </div>
    )
  }
  
  const errorMessage = error || (createPurchaseError?.message || '');
  const isDuplicatePurchaseError = errorMessage.includes('Purchase already exists') || 
                                   errorMessage.includes('already processed') ||
                                   errorMessage.includes('DuplicatePurchaseError');
  
  if (showError && !isDuplicatePurchaseError && !isProcessed) {
    return (
      <div className="flex justify-center items-center h-screen p-[20px] bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        <div className="bg-[#1E2136] rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
              className="bg-[#1E2136] rounded-full p-3 z-10 mx-auto mb-4 w-16 h-16 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.div>
            <h1 className="text-2xl font-bold mb-4 text-white text-center">Oops, Something Went Wrong!</h1>
            <p className="text-[#a0a0c0] mb-6 text-center">{error || createPurchaseError?.message}</p>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold py-3 px-4 rounded-xl w-full transition-all duration-300 shadow-lg"
              onClick={handleNavigateHome}
            >
              Back to Home
            </motion.button>
          </div>
        </div>
      </div>
    )
  }

  // Успешная страница без загрузок
  return (
    <div className="flex justify-center items-center h-screen p-[20px] bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <div className="bg-[#1E2136] rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
          </div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-3xl font-bold mb-4 text-white"
          >
            Payment Successful! 🎉
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="text-[#a0a0c0] mb-8"
          >
            Your purchase has been completed successfully. You can now access your new track!
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="space-y-4"
          >
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-[#20DDBB] to-[#5D59FF] hover:from-[#20DDBB]/80 hover:to-[#5D59FF]/80 text-white font-bold py-3 px-4 rounded-xl w-full transition-all duration-300 shadow-lg"
              onClick={handleNavigateProfile}
            >
              My Profile
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="bg-gradient-to-r from-[#8A2BE2] to-[#FF6B6B] hover:from-[#8A2BE2]/80 hover:to-[#FF6B6B]/80 text-white font-bold py-3 px-4 rounded-xl w-full transition-all duration-300 shadow-lg"
              onClick={handleNavigateExplore}
            >
              Explore Music
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}  