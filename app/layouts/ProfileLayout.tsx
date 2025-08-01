"use client";

import React, { useEffect, useState } from "react";
import TopNav from "./includes/TopNav"
import { usePathname } from "next/navigation"
import { ProfilePageTypes, ProfileStore } from "../types"
import { useUser } from "@/app/context/user";
import { useProfileStore } from "@/app/stores/profile"
import { useGeneralStore } from "@/app/stores/general";
import { useUIStore } from '@/app/stores/uiStore';
import useCreateBucketUrl from "@/app/hooks/useCreateBucketUrl"
import { IoSettingsOutline } from 'react-icons/io5';
import { BsPeople, BsHeart, BsVinylFill, BsPeopleFill } from 'react-icons/bs';
import { RiDownloadLine } from 'react-icons/ri';
import { motion, AnimatePresence } from 'framer-motion';
import EnhancedEditProfileOverlay from "@/app/components/profile/EnhancedEditProfileOverlay";
import '@/app/globals.css';
import '@/app/styles/profile-mobile.css';
import ProfileComponents from "./includes/ProfileComponents"
import PurchasedTracks from "@/app/components/profile/PurchasedTracks"
import useDownloadsStore from '@/app/stores/downloadsStore';
import { useLikedStore } from '@/app/stores/likedStore';
import PostLikes from "@/app/components/profile/PostLikes";
import UserProfileSidebar from "@/app/components/profile/UserProfileSidebar";
import WelcomeReleasesSkeleton from "@/app/components/profile/WelcomeReleasesSkeleton";
import { usePostStore } from "@/app/stores/post";
import FriendsTab from "@/app/components/profile/FriendsTab";
import UserActivitySidebar from "@/app/components/profile/UserActivitySidebar";
import { useVibeStore } from '@/app/stores/vibeStore';
import { MdOutlineMusicNote } from 'react-icons/md';
import UserVibes from "@/app/components/profile/UserVibes";
import { useEditContext } from "@/app/context/editContext";
import { FaUserPlus, FaUserCheck, FaUserMinus, FaClock, FaCheck, FaTimes } from 'react-icons/fa';
import DebugPanel from "@/app/components/DebugPanel";

export default function ProfileLayout({ children, params, isFriend, pendingRequest, isLoading, onFriendAction }: { children: React.ReactNode, params: { params: { id: string } }, isFriend?: boolean, pendingRequest?: any, isLoading?: boolean, onFriendAction?: (action?: 'accept' | 'reject' | 'reset') => void }) {
    const profileId = params.params.id;
    
    const pathname = usePathname()
	const contextUser = useUser();   
    const { currentProfile, hasUserReleases, setHasUserReleases } = useProfileStore();
    const { isEditProfileOpen, setIsEditProfileOpen } = useGeneralStore();
    const { showPurchases, toggleShowPurchases, setShowPurchases } = useDownloadsStore();
    const { likedPosts, isLoading: likedLoading, showLikedTracks, setShowLikedTracks, fetchLikedPosts } = useLikedStore();
    const { postsByUser } = usePostStore();
    const [showFriends, setShowFriends] = useState(false);
    const [showVibes, setShowVibes] = useState(false);
    const { fetchVibesByUser } = useVibeStore();
    const { isEditMode } = useEditContext();
    const [isMobile, setIsMobile] = useState(false);
    // Удаляем состояния для скролла, так как панель должна быть всегда видна
    // const [hasReachedEnd, setHasReachedEnd] = useState(false);
    // const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
    // const [lastScrollTop, setLastScrollTop] = useState(0);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Отслеживание изменений DOM для переприменения стилей панели
    useEffect(() => {
        const forceBottomPanelStyles = () => {
            const panel = document.querySelector('.profile-bottom-panel-override');
            if (panel && isMobile) {
                const element = panel as HTMLElement;
                element.style.setProperty('z-index', '2147483647', 'important');
                element.style.setProperty('position', 'fixed', 'important');
                element.style.setProperty('bottom', '0', 'important');
                element.style.setProperty('left', '0', 'important');
                element.style.setProperty('right', '0', 'important');
                element.style.setProperty('transform', 'translateZ(0)', 'important');
            }
        };

        if (isMobile) {
            // Применяем стили сразу
            forceBottomPanelStyles();
            
            // Создаем MutationObserver для отслеживания изменений DOM
            const observer = new MutationObserver((mutations) => {
                let shouldUpdate = false;
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        // Проверяем, добавились ли новые карточки
                        mutation.addedNodes.forEach((node) => {
                            if (node instanceof Element && 
                                (node.classList.contains('post-user-card') || 
                                 node.querySelector('.post-user-card'))) {
                                shouldUpdate = true;
                            }
                        });
                    }
                });
                
                if (shouldUpdate) {
                    // Переприменяем стили панели после добавления карточек
                    setTimeout(forceBottomPanelStyles, 10);
                }
            });

            // Наблюдаем за изменениями в контейнере с карточками
            const container = document.querySelector('.profile-layout-container');
            if (container) {
                observer.observe(container, { 
                    childList: true, 
                    subtree: true 
                });
            }

            return () => {
                observer.disconnect();
            };
        }
    }, [isMobile]);

    // Убираем логику скролла - панель должна быть всегда видна

    // Загружаем liked posts только один раз при изменении showLikedTracks
    useEffect(() => {
        const loadLikedPosts = async () => {
            if (showLikedTracks && currentProfile?.user_id) {
                await fetchLikedPosts(currentProfile.user_id);
            }
        };

        loadLikedPosts();
    }, [currentProfile?.user_id, showLikedTracks, fetchLikedPosts]);

    // Проверяем, является ли текущий пользователь владельцем профиля
    // Сравниваем ID залогиненного пользователя с ID пользователя из URL
    const isProfileOwner = contextUser?.user?.id === profileId;

    // Проверяем URL на наличие query параметра tab
    useEffect(() => {
        // Анализируем URL на наличие параметра tab
        const url = new URL(window.location.href);
        const tab = url.searchParams.get('tab');
        
        if (tab === 'friends') {
            setShowFriends(true);
            setShowPurchases(false);
            setShowLikedTracks(false);
            setShowVibes(false);
        } else if (tab === 'purchases' && isProfileOwner) {
            setShowFriends(false);
            setShowPurchases(true);
            setShowLikedTracks(false);
            setShowVibes(false);
        } else if (tab === 'likes') {
            setShowFriends(false);
            setShowPurchases(false);
            setShowLikedTracks(true);
            setShowVibes(false);
        } else if (tab === 'vibes') {
            setShowFriends(false);
            setShowPurchases(false);
            setShowLikedTracks(false);
            setShowVibes(true);
        }
    }, [pathname, isProfileOwner]);

    useEffect(() => {
        const loadLikedPosts = async () => {
            if (showLikedTracks && currentProfile?.user_id) {
                // Загружаем лайки пользователя, чей профиль просматривается
                await fetchLikedPosts(currentProfile.user_id);
            }
        };

        loadLikedPosts();
    }, [currentProfile?.user_id, showLikedTracks, fetchLikedPosts]);

    // Обновляем проверку наличия релизов, используя реальные данные
    useEffect(() => {
        // Проверяем наличие релизов у пользователя на основе данных из postsByUser
        const hasReleases = postsByUser && postsByUser.length > 0;
        setHasUserReleases(hasReleases);
    }, [postsByUser, setHasUserReleases]);

    const switchToTab = (tab: 'friends' | 'purchases' | 'likes' | 'vibes' | 'main') => {
        setShowFriends(tab === 'friends');
        setShowPurchases(tab === 'purchases' && isProfileOwner);
        setShowLikedTracks(tab === 'likes');
        setShowVibes(tab === 'vibes');
        
        // Убираем сброс состояния панели - панель всегда видна
        // setIsScrolledToBottom(false);
        
        // Обновляем URL с параметром tab
        const url = new URL(window.location.href);
        if (tab !== 'main') {
            // Не добавляем параметр tab=purchases если пользователь не владелец профиля
            if (tab === 'purchases' && !isProfileOwner) {
                // В этом случае просто возвращаемся на основную вкладку
                url.searchParams.delete('tab');
            } else {
                url.searchParams.set('tab', tab);
            }
        } else {
            url.searchParams.delete('tab');
        }
        window.history.pushState({}, '', url);
    };

    // Принудительное применение стилей панели
    useEffect(() => {
        const forceBottomPanelStyles = () => {
            const panel = document.querySelector('.profile-bottom-panel-override');
            if (panel && isMobile) {
                const element = panel as HTMLElement;
                element.style.zIndex = '2147483647';
                element.style.position = 'fixed';
                element.style.bottom = '0';
                element.style.left = '0';
                element.style.right = '0';
                element.style.transform = 'translateZ(0)';
                element.style.isolation = 'isolate';
            }
        };

        // Применяем стили сразу и через небольшой таймаут
        forceBottomPanelStyles();
        const timer = setTimeout(forceBottomPanelStyles, 100);
        
        return () => clearTimeout(timer);
    }, [isMobile, postsByUser.length]); // Перезапускаем при изменении количества постов

    return (
		<>
		<TopNav params={{ id: profileId }} />
		
		{isEditProfileOpen && <EnhancedEditProfileOverlay />}

		<div className="w-full mx-auto px-[10px] md:px-8 box-border max-w-full overflow-x-hidden smooth-scroll-container content-with-top-nav profile-layout-container">
            <div className="max-w-[1500px] mx-auto pb-[90px] md:pb-0">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Left sidebar with user profile */}
                    {currentProfile && (
                        <div className="hidden md:block w-[260px] flex-shrink-0 sticky top-[89px] h-[calc(100vh-89px)]">
                            <UserProfileSidebar profile={currentProfile} />
                        </div>
                    )}
                    
                    {/* Main content area */}
                    <div className="flex-1 pb-[80px] md:pb-0 content-with-bottom-nav">
                        <AnimatePresence mode="wait">
                            {showPurchases && isProfileOwner ? (
                                <motion.div
                                    key="purchased"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <PurchasedTracks />
                                </motion.div>
                            ) : showLikedTracks ? (
                                <motion.div
                                    key="liked"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="max-w-[1500px] mx-auto py-6 px-[10px] md:px-0 profile-cards-container">
                                        {likedLoading ? (
                                            <div className="flex justify-center items-center min-h-[400px]">
                                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#20DDBB]"></div>
                                            </div>
                                        ) : !likedPosts || likedPosts.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                                                <BsHeart className="w-16 h-16 text-[#20DDBB]/30 mb-4" />
                                                <p className="text-white text-lg mb-2">
                                                    {isProfileOwner ? 'You haven\'t liked any tracks yet' : 'No liked tracks yet'}
                                                </p>
                                                <p className="text-gray-400">
                                                    {isProfileOwner ? 'Start exploring and liking tracks' : 'This user hasn\'t liked any tracks'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="mx-auto w-full max-w-[650px] flex flex-col gap-4 px-[10px] md:px-0 md:relative md:left-[20px] likes-container-mobile">
                                                {likedPosts.map((post) => (
                                                    <PostLikes
                                                        key={post.$id} 
                                                        post={post}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ) : showFriends ? (
                                <motion.div
                                    key="friends"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="max-w-[1500px] mx-auto py-6 px-[10px] md:px-0 profile-cards-container">
                                        {currentProfile && (
                                            <FriendsTab profileId={currentProfile.user_id} />
                                        )}
                                    </div>
                                </motion.div>
                            ) : showVibes ? (
                                <motion.div
                                    key="vibes"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    <div className="max-w-[1500px] mx-auto py-6 px-[10px] md:px-0 profile-cards-container">
                                        {currentProfile && (
                                            <UserVibes userId={currentProfile.user_id} isProfileOwner={isProfileOwner} />
                                        )}
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="main"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="w-full"
                                >
                                    {hasUserReleases || (postsByUser && postsByUser.length > 0) ? (
                                        <div className="flex justify-center">
                                            <div className="max-w-full flex flex-wrap justify-center gap-8 py-4 px-[10px] md:px-0 releases-container-mobile">
                                                {children}
                                            </div>
                                        </div>
                                    ) : (
                                        <WelcomeReleasesSkeleton isOwner={isProfileOwner} />
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    
                    {/* Right sidebar with user activity */}
                    {currentProfile && (
                        <div className="hidden lg:block w-[260px] flex-shrink-0 sticky top-[89px] h-[calc(100vh-89px)] mr-[60px] sm:mr-0">
                            <UserActivitySidebar
                                userId={currentProfile.user_id}
                                isOwner={isProfileOwner}
                                onShowFriends={() => switchToTab('friends')}
                                onShowLikes={() => switchToTab('likes')}
                                onShowPurchases={() => switchToTab('purchases')}
                                onShowVibes={() => switchToTab('vibes')}
                                activeTab={
                                    showFriends
                                        ? 'friends'
                                        : showLikedTracks
                                            ? 'likes'
                                            : showPurchases
                                                ? 'purchases'
                                                : showVibes
                                                    ? 'vibes'
                                                    : 'main'
                                }
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>

        <motion.div 
            animate={{
                y: (isEditMode && isMobile) ? 120 : 0,
                opacity: (isEditMode && isMobile) ? 0 : 1,
                transition: {
                    type: "spring",
                    stiffness: 260,
                    damping: 20,
                    duration: 0.5
                }
            }}
            className="fixed bottom-0 left-0 right-0 bg-[#24183D]/95 backdrop-blur-xl border-t border-white/5 shadow-lg profile-bottom-panel-override"
            style={{
                transform: 'translateZ(0)', // Принудительная фиксация
                position: 'fixed',
                bottom: '0',
                left: '0',
                right: '0',
                zIndex: 999999999, // Максимальный z-index
                willChange: 'transform', // Оптимизация для анимаций
                boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                isolation: 'isolate', // Создает новый stacking context
            }}
        >
            <div className="max-w-screen-xl mx-auto">
                <div className="flex flex-col p-4">
                    {/* User profile section - visible on both mobile and desktop */}
                    <div className="flex items-center w-full mb-3 md:hidden"> {/* Removed justify-between as Edit button is moved */}
                        {/* Avatar + Username */}
                        <div className="flex items-center">
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`relative w-10 h-10 rounded-xl overflow-hidden ring-2 ring-[#20DDBB]/30
                                        group transition-all duration-300 hover:ring-[#20DDBB]/50
                                        shadow-[0_0_15px_rgba(32,221,187,0.15)] ${isProfileOwner ? 'cursor-pointer' : ''}`}
                                onClick={isProfileOwner ? () => setIsEditProfileOpen(true) : undefined} // Keep this for avatar/name click
                            >
                                <img
                                    src={currentProfile?.image && currentProfile.image.trim() ? useCreateBucketUrl(currentProfile.image, 'user') : '/images/placeholders/user-placeholder.svg'}
                                    alt={currentProfile?.name || 'Profile'}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                />
                            </motion.div>
                            
                            <div className="flex items-center ml-3">
                                <motion.h1
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-base font-bold text-white truncate max-w-[120px] ${isProfileOwner ? 'cursor-pointer hover:text-[#20DDBB] transition-colors' : ''}`}
                                    onClick={isProfileOwner ? () => setIsEditProfileOpen(true) : undefined} // Keep this for avatar/name click
                                >
                                    {currentProfile?.name || 'User Name'}
                                </motion.h1>
                            </div>
                        </div>
                        
                        {/* Edit Profile button has been moved */}
                    </div>

                    {/* Navigation Icons - for both desktop and mobile */}
                    <div className="relative flex items-center justify-between gap-2 w-full">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setShowFriends(false);
                                setShowLikedTracks(false);
                                setShowPurchases(false);
                                setShowVibes(false);
                            }}
                            className={`group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 ${
                                !showFriends && !showLikedTracks && !showPurchases && !showVibes
                                ? 'text-[#20DDBB] bg-gradient-to-r from-[#20DDBB]/10 to-[#5D59FF]/10 shadow-[0_0_15px_rgba(32,221,187,0.1)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-[#20DDBB]/5 hover:to-[#5D59FF]/5 hover:shadow-[0_0_10px_rgba(32,221,187,0.05)]'
                            }`}
                        >
                            <div className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden ${!showFriends && !showLikedTracks && !showPurchases && !showVibes ? 'bg-gradient-to-r from-[#20DDBB] to-[#5D59FF] shadow-[0_0_10px_rgba(32,221,187,0.5)]' : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-[#20DDBB]/50 group-hover:to-[#5D59FF]/50 group-hover:shadow-[0_0_8px_rgba(32,221,187,0.3)]'} transition-all duration-300`}>
                                <BsVinylFill 
                                    className={`w-3.5 h-3.5 transition-all duration-300 ${!showFriends && !showLikedTracks && !showPurchases && !showVibes ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} 
                                />
                            </div>
                            <span className={`text-[9px] font-medium ${!showFriends && !showLikedTracks && !showPurchases && !showVibes ? 'text-[#20DDBB]' : 'text-gray-400'}`}>Releases</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setShowFriends(false);
                                setShowLikedTracks(false);
                                setShowPurchases(false);
                                setShowVibes(true);
                            }}
                            className={`group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 ${
                                showVibes
                                ? 'text-purple-400 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-purple-500/5 hover:to-indigo-500/5 hover:shadow-[0_0_10px_rgba(168,85,247,0.05)]'
                            }`}
                        >
                            <div className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden ${showVibes ? 'bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-purple-500/50 group-hover:to-indigo-500/50 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.3)]'} transition-all duration-300`}>
                                <MdOutlineMusicNote 
                                    className={`w-4 h-4 transition-all duration-300 ${showVibes ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} 
                                />
                            </div>
                            <span className={`text-[9px] font-medium ${showVibes ? 'text-purple-400' : 'text-gray-400'}`}>Vibes</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setShowFriends(false);
                                setShowLikedTracks(true);
                                setShowPurchases(false);
                                setShowVibes(false);
                            }}
                            className={`group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 ${
                                showLikedTracks
                                ? 'text-pink-400 bg-gradient-to-r from-pink-500/10 to-purple-500/10 shadow-[0_0_15px_rgba(236,72,153,0.1)]' 
                                : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-pink-500/5 hover:to-purple-500/5 hover:shadow-[0_0_10px_rgba(236,72,153,0.05)]'
                            }`}
                        >
                            <div className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden ${showLikedTracks ? 'bg-gradient-to-r from-pink-500 to-purple-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-pink-500/50 group-hover:to-purple-500/50 group-hover:shadow-[0_0_8px_rgba(236,72,153,0.3)]'} transition-all duration-300`}>
                                <BsHeart 
                                    className={`w-3.5 h-3.5 transition-all duration-300 ${showLikedTracks ? 'text-white' : 'text-gray-300 group-hover:text-white'}`} 
                                />
                            </div>
                            <span className={`text-[9px] font-medium ${showLikedTracks ? 'text-pink-400' : 'text-gray-400'}`}>Likes</span>
                        </motion.button>
                        
                        {/* Friends button with relative positioning for action buttons */}
                        <div className="relative flex flex-1">
                            {/* Super Stylish Friend Button above Friends */}
                            {!isProfileOwner && isMobile && onFriendAction && (
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                                    {/* Friend (Remove) */}
                                    {isFriend && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onFriendAction('reject')}
                                            disabled={isLoading}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-400/30 backdrop-blur-lg border border-pink-400/40 shadow-xl text-pink-100 hover:bg-pink-500/40 hover:text-white transition-all duration-300"
                                            aria-label="Remove Friend"
                                        >
                                            <FaUserMinus className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                    {/* Pending (you sent) */}
                                    {!isFriend && pendingRequest && pendingRequest.user_id === contextUser?.user?.id && pendingRequest.id && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onFriendAction('reset')}
                                            disabled={isLoading}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-cyan-400/30 backdrop-blur-lg border border-cyan-400/40 shadow-xl text-cyan-100 hover:bg-cyan-500/40 hover:text-white transition-all duration-300"
                                            aria-label="Cancel Request"
                                        >
                                            <FaClock className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                    {/* Incoming Request (they sent) */}
                                    {!isFriend && pendingRequest && pendingRequest.user_id !== contextUser?.user?.id && pendingRequest.id && (
                                        <>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onFriendAction('accept')}
                                                disabled={isLoading}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-green-400/30 backdrop-blur-lg border border-green-400/40 shadow-xl text-green-100 hover:bg-green-500/40 hover:text-white transition-all duration-300"
                                                aria-label="Accept Request"
                                            >
                                                <FaCheck className="w-5 h-5" />
                                            </motion.button>
                                            <motion.button
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onFriendAction('reject')}
                                                disabled={isLoading}
                                                className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-400/30 backdrop-blur-lg border border-pink-400/40 shadow-xl text-pink-100 hover:bg-pink-500/40 hover:text-white transition-all duration-300"
                                                aria-label="Decline Request"
                                            >
                                                <FaTimes className="w-5 h-5" />
                                            </motion.button>
                                        </>
                                    )}
                                    {/* Add Friend */}
                                    {!isFriend && !pendingRequest && (
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onFriendAction('accept')}
                                            disabled={isLoading}
                                            className="w-10 h-10 rounded-full flex items-center justify-center bg-green-400/30 backdrop-blur-lg border border-green-400/40 shadow-xl text-green-100 hover:bg-green-500/40 hover:text-white transition-all duration-300"
                                            aria-label="Add Friend"
                                        >
                                            <FaUserPlus className="w-5 h-5" />
                                        </motion.button>
                                    )}
                                </div>
                            )}

                            {/* Friends button */}
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setShowFriends(true);
                                    setShowLikedTracks(false);
                                    setShowPurchases(false);
                                    setShowVibes(false);
                                }}
                                className={`group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 ${
                                    showFriends
                                    ? 'text-blue-400 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 shadow-[0_0_15px_rgba(96,165,250,0.1)]'
                                    : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-blue-500/5 hover:to-cyan-500/5 hover:shadow-[0_0_10px_rgba(96,165,250,0.05)]'
                                }`}
                            >
                                <div className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden ${showFriends ? 'bg-gradient-to-r from-blue-500 to-cyan-500 shadow-[0_0_10px_rgba(96,165,250,0.5)]' : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-blue-500/50 group-hover:to-cyan-500/50 group-hover:shadow-[0_0_8px_rgba(96,165,250,0.3)]'} transition-all duration-300`}>
                                    <BsPeopleFill
                                        className={`w-3.5 h-3.5 transition-all duration-300 ${showFriends ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}
                                    />
                                </div>
                                <span className={`text-[9px] font-medium ${showFriends ? 'text-blue-400' : 'text-gray-400'}`}>Friends</span>
                            </motion.button>
                        </div>

                        {isProfileOwner && (
                            <div className="relative flex flex-1 flex-col items-center justify-center">
                                {/* New Edit Profile Button - visible only on mobile and when profile owner */}
                                {isMobile && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            console.log('Mobile edit profile button clicked, isMobile:', isMobile);
                                            setIsEditProfileOpen(true);
                                        }}
                                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-[9999] w-12 h-12 rounded-full flex items-center justify-center bg-[#20DDBB]/20 text-[#20DDBB] hover:bg-[#20DDBB]/30 transition-all duration-300 border-2 border-[#20DDBB]/50 shadow-lg md:hidden"
                                        aria-label="Edit Profile"
                                    >
                                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </motion.button>
                                )}
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setShowFriends(false);
                                        setShowLikedTracks(false);
                                        setShowPurchases(true);
                                        setShowVibes(false);
                                    }}
                                    className={`group flex flex-1 flex-col items-center justify-center gap-1 px-1 py-2 rounded-xl transition-all duration-300 w-full ${ // Added w-full for flex-1 to take effect
                                        showPurchases
                                        ? 'text-green-400 bg-gradient-to-r from-green-500/10 to-emerald-500/10 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                                        : 'text-white/70 hover:text-white hover:bg-gradient-to-r hover:from-green-500/5 hover:to-emerald-500/5 hover:shadow-[0_0_10px_rgba(34,197,94,0.05)]'
                                    }`}
                                >
                                    <div className={`relative flex items-center justify-center w-7 h-7 rounded-full overflow-hidden ${showPurchases ? 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-white/10 group-hover:bg-gradient-to-r group-hover:from-green-500/50 group-hover:to-emerald-500/50 group-hover:shadow-[0_0_8px_rgba(34,197,94,0.3)]'} transition-all duration-300`}>
                                        <RiDownloadLine
                                            className={`w-3.5 h-3.5 transition-all duration-300 ${showPurchases ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}
                                        />
                                    </div>
                                    <span className={`text-[9px] font-medium ${showPurchases ? 'text-green-400' : 'text-gray-400'}`}>Purchases</span>
                                </motion.button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
        
        {/* Временный компонент для диагностики - убрать в продакшене */}
        {process.env.NODE_ENV === 'development' && <DebugPanel />}
        
        {/* CSS правило для принудительного z-index панели */}
        <style jsx global>{`
          .profile-bottom-panel-override {
            z-index: 999999999 !important;
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            transform: translateZ(0) !important;
            isolation: isolate !important;
          }
          
          /* Убеждаемся что карточки не перекрывают панель */
          .post-user-card {
            z-index: 1 !important;
            position: relative !important;
          }
          
          /* Мобильные устройства - дополнительные правила */
          @media (max-width: 768px) {
            .profile-bottom-panel-override {
              z-index: 2147483647 !important; /* Максимальный z-index */
              will-change: transform !important;
              backface-visibility: hidden !important;
            }
            
            /* Все карточки на мобильных должны быть ниже панели */
            .post-user-card,
            [class*="card"],
            [class*="Card"] {
              z-index: 1 !important;
            }
            
            /* Убеждаемся что контент не создает новый stacking context выше панели */
            .profile-layout-container,
            .content-with-top-nav,
            .smooth-scroll-container {
              z-index: auto !important;
            }
          }
        `}</style>
	</>
    )
}


