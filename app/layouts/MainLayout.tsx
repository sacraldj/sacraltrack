"use client";

import React, { useState, useEffect, useRef } from "react";
import TopNav from "./includes/TopNav";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { useUser } from "@/app/context/user";
import { PlayerProvider } from "@/app/context/playerContext";
import Link from "next/link";
import { useGeneralStore } from "../stores/general";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { BsSearch } from "react-icons/bs";
import NotificationBell from "../components/notifications/NotificationBell";
import UserProfileSidebar from "../components/profile/UserProfileSidebar";
import { useProfileStore } from "@/app/stores/profile";
import AuthObserver from "@/app/components/AuthObserver";
import createBucketUrl from "@/app/hooks/useCreateBucketUrl";
import ContentFilter from "@/app/components/ContentFilter";
import { FaInfoCircle } from "react-icons/fa";
import ClientWelcomeModal from "../components/ClientWelcomeModal";

// Local interface for profile card
interface ProfileCardProps {
  user_id: string;
  name: string;
  image: string;
  created_at?: string;
  genre?: string;
  bio?: string;
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const userContext = useUser();
  const router = useRouter();
  const { currentProfile, setCurrentProfile } = useProfileStore();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isLayoutReady, setIsLayoutReady] = useState(false);

  const { setIsLoginOpen, setIsEditProfileOpen } = useGeneralStore();

  // Load profile if user is authenticated
  useEffect(() => {
    if (
      userContext &&
      userContext.user &&
      userContext.user.id &&
      !currentProfile
    ) {
      // Add debounce to prevent multiple rapid calls
      const loadProfileWithDebounce = async () => {
        try {
          const userId = (
            userContext.user as NonNullable<typeof userContext.user>
          ).id;
          await setCurrentProfile(userId);
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      };

      // Use a short timeout to debounce multiple calls
      const timeoutId = setTimeout(() => {
        loadProfileWithDebounce();
      }, 200); // 200ms debounce

      // Clean up timeout on unmount or when dependencies change
      return () => clearTimeout(timeoutId);
    }
  }, [userContext?.user?.id, currentProfile, setCurrentProfile]);

  // Set layout ready after a short delay to ensure everything is initialized
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLayoutReady(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle welcome modal close
  const handleWelcomeModalClose = () => {
    setShowWelcomeModal(false);
  };

  // Show loading state while layout is initializing
  if (!isLayoutReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1E1A36] to-[#2A2151] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#20DDBB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <TopNav params={{ id: userContext?.user?.id as string }} />
      <AuthObserver />

      <div className="flex mx-auto w-full px-0 smooth-scroll-container min-h-screen safe-area-all"
           style={{
             paddingTop: 'calc(60px + env(safe-area-inset-top))',
             minHeight: '100vh'
           }}>
        <div className="hidden md:flex w-[350px] relative">
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full sticky h-[calc(100vh-70px)]"
            style={{
              top: 'calc(70px + env(safe-area-inset-top))',
              height: 'calc(100vh - 70px - env(safe-area-inset-top) - env(safe-area-inset-bottom))'
            }}
          >
            {/* Profile card for desktop and iPad */}
            {userContext?.user && currentProfile && (
              <div className="px-3">
                <UserProfileSidebar profile={currentProfile} />
              </div>
            )}
          </motion.div>
        </div>

        <PlayerProvider>
          <div className="flex justify-center w-full px-0">
            <motion.div
              initial={{ opacity: 0, y: -100 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full min-h-screen content-with-bottom-nav"
              style={{
                paddingBottom: 'max(80px, calc(80px + env(safe-area-inset-bottom)))',
                minHeight: '100vh'
              }}
            >
              {children}
            </motion.div>
          </div>
        </PlayerProvider>

        <div className="hidden md:flex w-[300px] pr-[20px]">
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <div className="sticky pt-0"
                 style={{
                   top: 'calc(80px + env(safe-area-inset-top))'
                 }}>
              <ContentFilter />
            </div>
          </motion.div>
        </div>

        {/* Mobile filter for smaller screens */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 0.5,
          }}
          className="md:hidden fixed bottom-0 left-0 right-0 z-[99998] bg-[#0F1225]/50 backdrop-blur-xl border-t border-white/5 shadow-lg mobile-nav-safe"
          style={{
            paddingLeft: 'max(16px, env(safe-area-inset-left))',
            paddingRight: 'max(16px, env(safe-area-inset-right))',
            paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
            height: 'calc(60px + env(safe-area-inset-bottom))'
          }}
        >
          <div className="px-4 py-2 pb-2">
            <ContentFilter />
          </div>
        </motion.div>

        {/* Welcome Modal */}
        <ClientWelcomeModal
          isVisible={showWelcomeModal}
          onClose={handleWelcomeModalClose}
          hideFirstVisitCheck={true}
        />
      </div>
    </>
  );
}
