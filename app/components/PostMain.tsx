"use client";

import Link from "next/link";
import Head from "next/head";
import PostMainLikes from "./PostMainLikes";
import React, {
  useEffect,
  useState,
  memo,
  useCallback,
  useRef,
  useMemo,
  Suspense,
  lazy,
  useImperativeHandle,
  forwardRef,
} from "react";
import useCreateBucketUrl from "../hooks/useCreateBucketUrl";
import { PostMainCompTypes, PostWithProfile } from "../types";
import { usePathname } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import getStripe from "@/libs/getStripe";
import { usePlayerContext } from "@/app/context/playerContext";
import { AudioPlayer } from "@/app/components/AudioPlayer";
import { useStableAudioPlayer } from "@/app/hooks/useStableAudioPlayer";
import Image from "next/image";
import { HiMusicNote } from "react-icons/hi";
import {
  FaPlay,
  FaPause,
  FaFire,
  FaStar,
  FaTrophy,
  FaHeadphones,
  FaHeart,
} from "react-icons/fa";
import ShareModal from "./ShareModal";
import { useUser } from "@/app/context/user";
import { useGeneralStore } from "@/app/stores/general";
import useCheckPurchasedTrack from "@/app/hooks/useCheckPurchasedTrack";
import { useCommentStore } from "@/app/stores/comment";
import FloatingComments from "@/app/components/FloatingComments";
import { CommentWithProfile } from "@/app/types";
import { motion, AnimatePresence } from "framer-motion";
import { PiFireFill } from "react-icons/pi";
import { ShareIcon } from "@heroicons/react/24/outline";
import useTrackStatistics from "../hooks/useTrackStatistics";
import useTrackInteraction from "../hooks/useTrackInteraction";
import { database, ID } from "@/libs/AppWriteClient";
import { APPWRITE_CONFIG } from "@/libs/AppWriteClient";

// Toast styles
const successToast = (message: string) =>
  toast.success(message, {
    position: 'top-center',
    style: {
      background: "#1E2136",
      color: "#fff",
      border: "1px solid #20DDBB",
      borderRadius: "12px",
      padding: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    icon: "🎵",
    duration: 3000,
  });

const errorToast = (message: string) =>
  toast.error(message, {
    position: 'top-center',
    style: {
      background: "#1E2136",
      color: "#fff",
      border: "1px solid #ff5555",
      borderRadius: "12px",
      padding: "16px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
    },
    icon: "❌",
    duration: 4000,
  });

interface Comment {
  id: string;
  user: {
    name: string;
    image: string;
  };
  text: string;
  created_at: string;
}

interface PostHeaderProps {
  profile: {
    user_id: string;
    name: string;
    image: string;
  };
  avatarUrl: string;
  avatarError: boolean;
  setAvatarError: (error: boolean) => void;
  text: string;
  genre: string;
}

interface PostImageProps {
  imageUrl: string;
  imageError: boolean;
  comments: CommentWithProfile[];
  isPlaying: boolean;
  onTogglePlay: () => void;
  post: any;
  onReact?: (reactionType: string) => void;
  reactions?: Record<string, number>;
  currentReaction?: string | null;
  statsCounterRef?: React.RefObject<StatsCounterRef | null>;
}

// Sound wave animation component
const SoundWave = memo(() => {
  // Store random values in refs to ensure consistent renders
  const randomValues = useRef(
    [...Array(5)].map(() => ({
      height: 8 + Math.floor(Math.random() * 8),
      duration: (0.8 + Math.random() * 0.5).toFixed(2),
    })),
  );

  return (
    <div className="flex items-center justify-center space-x-1 h-12 absolute bottom-4 left-0 right-0 pointer-events-none">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-white/70 rounded-full"
          initial={{ height: 4 }}
          animate={{
            height: [4, randomValues.current[i].height, 4],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: Number(randomValues.current[i].duration),
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  );
});

SoundWave.displayName = "SoundWave";

// Optimized image loading with intersection observer
const LazyImage = memo(
  ({
    src,
    alt,
    className,
    onError,
    fallback,
  }: {
    src: string;
    alt: string;
    className?: string;
    onError?: () => void;
    fallback?: React.ReactNode;
  }) => {
    // Use refs for client-side state to prevent hydration mismatch
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const imgRef = useRef(null);

    // Track client-side mounting
    useEffect(() => {
      setIsMounted(true);
    }, []);

    useEffect(() => {
      if (!isMounted) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 },
      );

      if (imgRef.current) {
        observer.observe(imgRef.current);
      }

      return () => {
        if (imgRef.current) {
          observer.disconnect();
        }
      };
    }, [isMounted]);

    const handleError = () => {
      setHasError(true);
      if (onError) onError();
    };

    const handleLoad = () => {
      setIsLoaded(true);
    };

    // Always render the image for SSR, but control visibility with CSS
    return (
      <div
        ref={imgRef}
        className={`${className || ""} relative overflow-hidden`}
      >
        {isMounted && (!isInView || !isLoaded) && !hasError && (
          <div className="absolute inset-0 bg-gradient-to-r from-[#2E2469]/50 to-[#351E43]/50 animate-pulse" />
        )}

        {/* Добавляем проверку на пустую строку в src */}
        {src && src.trim() !== "" ? (
          <img
            src={src}
            alt={alt}
            onError={handleError}
            onLoad={handleLoad}
            loading="lazy"
            className={`${className || ""} ${isLoaded || !isMounted ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#2E2469] to-[#351E43] flex items-center justify-center">
            <HiMusicNote className="text-white/40 text-2xl" />
          </div>
        )}

        {hasError && fallback}
      </div>
    );
  },
);

LazyImage.displayName = "LazyImage";

const PostHeader = memo(
  ({
    profile,
    avatarUrl,
    avatarError,
    setAvatarError,
    text,
    genre,
  }: PostHeaderProps) => (
    <div className="p-[5px] flex items-center justify-between">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Link
          href={`/profile/${profile.user_id}`}
          aria-label={`Visit ${profile.name}'s profile`}
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
            <LazyImage
              src={avatarError ? "/images/placeholder-user.jpg" : avatarUrl}
              alt={`${profile.name} - ${genre} music artist profile picture`}
              onError={() => setAvatarError(true)}
              className="w-full h-full object-cover"
            />
          </div>
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/profile/${profile.user_id}`}
            className="text-white font-medium hover:underline hover:text-[#20DDBB] transition-colors line-clamp-1"
          >
            {profile.name}
          </Link>
          <div className="flex items-center gap-1.5 w-full">
            <p
              className="text-[#818BAC] text-sm truncate max-w-[180px]"
              title={text}
            >
              {text}
            </p>
            <HiMusicNote
              className="text-[#20DDBB] text-xs flex-shrink-0"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 ml-2">
        <span
          className="text-[#20DDBB] text-[10px] px-2.5 py-1 bg-[#20DDBB]/10 rounded-full uppercase font-medium tracking-wider whitespace-nowrap max-w-[110px] truncate block"
          title={genre}
        >
          {genre}
        </span>
      </div>
    </div>
  ),
);

PostHeader.displayName = "PostHeader";

// Extracted PlayButton component to improve performance
const PlayButton = memo(
  ({
    isPlaying,
    onTogglePlay,
  }: {
    isPlaying: boolean;
    onTogglePlay: () => void;
  }) => (
    <button
      onClick={onTogglePlay}
      className="absolute inset-0 md:hidden flex items-center justify-center"
      aria-label={isPlaying ? "Pause track" : "Play track"}
      type="button"
    >
      <div
        className={`
          w-20 h-20 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center
          transform transition-all duration-300 ${isPlaying ? "scale-90 bg-[#20DDBB]/30" : "scale-100"}
      `}
      >
        {isPlaying ? (
          <FaPause className="text-white text-2xl" aria-hidden="true" />
        ) : (
          <FaPlay className="text-white text-2xl ml-1" aria-hidden="true" />
        )}
      </div>
    </button>
  ),
);

PlayButton.displayName = "PlayButton";

// Fallback for when image fails to load
const PostImageFallback = memo(() => (
  <div
    className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#2E2469] to-[#351E43]"
    aria-label="Music cover image placeholder"
  >
    <div className="text-white/60 text-5xl">
      <HiMusicNote aria-hidden="true" />
    </div>
  </div>
));

PostImageFallback.displayName = "PostImageFallback";

const PostImage = memo(
  ({
    imageUrl,
    imageError,
    comments,
    isPlaying,
    onTogglePlay,
    post,
    onReact,
    reactions,
    currentReaction,
    statsCounterRef,
  }: PostImageProps) => {
    // Состояние для показа комментариев
    const [showComments, setShowComments] = useState(false);
    // Состояние для отслеживания, были ли уже показаны комментарии
    const [commentsShown, setCommentsShown] = useState(false);
    // Состояние для отслеживания, была ли карточка скрыта с экрана
    const [wasOutOfView, setWasOutOfView] = useState(false);

    const [isMobile, setIsMobile] = useState(false);
    const imageRef = useRef<HTMLDivElement>(null);
    const commentsTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Функция для показа и последующего скрытия комментариев
    const showAndHideComments = useCallback(() => {
      // Проверяем, есть ли комментарии и не были ли они уже показаны
      if (comments && comments.length > 0 && (!commentsShown || wasOutOfView)) {
        // Показываем комментарии
        setShowComments(true);

        // Устанавливаем флаг, что комментарии уже были показаны
        setCommentsShown(true);

        // Сбрасываем флаг выхода за экран
        setWasOutOfView(false);

        // Очищаем предыдущий таймер, если он был
        if (commentsTimerRef.current) {
          clearTimeout(commentsTimerRef.current);
        }

        // Устанавливаем таймер, чтобы скрыть комментарии через 10 секунд
        commentsTimerRef.current = setTimeout(() => {
          setShowComments(false);
        }, 10000); // 10 секунд
      }
    }, [comments, commentsShown, wasOutOfView]);

    // Эффект для проверки видимости при изменении комментариев
    useEffect(() => {
      // Отображаем комментарии только если они есть и еще не были показаны или были скрыты
      if (comments && comments.length > 0 && (!commentsShown || wasOutOfView)) {
        showAndHideComments();
      }

      // Очистка таймера при размонтировании
      return () => {
        if (commentsTimerRef.current) {
          clearTimeout(commentsTimerRef.current);
          commentsTimerRef.current = null;
        }
      };
    }, [comments, commentsShown, showAndHideComments, wasOutOfView]);

    // Используем IntersectionObserver для отслеживания видимости карточки
    useEffect(() => {
      // Создаем IntersectionObserver для отслеживания видимости карточки
      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Карточка вернулась в область видимости
            if (wasOutOfView) {
              // Если она была вне экрана, показываем комментарии снова
              showAndHideComments();
            }
          } else {
            // Карточка ушла из области видимости
            setWasOutOfView(true);
            // Скрываем комментарии
            setShowComments(false);

            // Очищаем таймер при выходе за экран
            if (commentsTimerRef.current) {
              clearTimeout(commentsTimerRef.current);
              commentsTimerRef.current = null;
            }
          }
        },
        { threshold: 0.2 }, // Порог видимости 20%
      );

      if (imageRef.current) {
        observer.observe(imageRef.current);
      }

      return () => {
        if (imageRef.current) {
          observer.disconnect();
        }
        // Очищаем таймер при размонтировании
        if (commentsTimerRef.current) {
          clearTimeout(commentsTimerRef.current);
          commentsTimerRef.current = null;
        }
      };
    }, [wasOutOfView, showAndHideComments]);

    useEffect(() => {
      const checkMobile = () => {
        setIsMobile(window.innerWidth < 768);
      };

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => {
        window.removeEventListener("resize", checkMobile);
      };
    }, []);

    return (
      <div className="relative group" ref={imageRef}>
        {/* Clickable image container for desktop */}
        <div
          className={`relative ${!isMobile ? "cursor-pointer" : ""}`}
          onClick={(e) => {
            // Only handle click on desktop
            if (!isMobile) {
              e.preventDefault();
              onTogglePlay();
            }
          }}
        >
          <LazyImage
            src={imageError ? "/images/placeholder-music.jpg" : imageUrl}
            alt={
              post && post.trackname
                ? `Music track cover for "${post.trackname}" by ${post.profile?.name || "artist"} - ${post.genre || "music"} genre`
                : "Music track cover"
            }
            onError={() => {}}
            className="w-full aspect-square object-cover"
          />

          {/* Stats Counter in top right corner */}
          {post && <StatsCounter post={post} ref={statsCounterRef} />}

          {/* Desktop play/pause overlay - показываем при наведении */}
          {!isMobile && (
            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div
                className={`
              w-14 h-14 rounded-full border border-white/40 backdrop-blur-[2px] flex items-center justify-center
              transform transition-all duration-300
              ${isPlaying ? "scale-90 bg-[#20DDBB]/10 border-[#20DDBB]/40" : "scale-100 bg-black/10"}
              group-hover:bg-black/20
            `}
              >
                {isPlaying ? (
                  <FaPause
                    className="text-white/90 text-lg"
                    aria-hidden="true"
                  />
                ) : (
                  <FaPlay
                    className="text-white/90 text-lg ml-1"
                    aria-hidden="true"
                  />
                )}
              </div>
            </div>
          )}

          {/* Mobile play button - более прозрачный дизайн */}
          {isMobile && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onTogglePlay();
              }}
              className="absolute inset-0 flex items-center justify-center"
              aria-label={isPlaying ? "Pause track" : "Play track"}
              type="button"
            >
              <div
                className={`
              w-14 h-14 rounded-full border border-white/40 backdrop-blur-[2px] flex items-center justify-center
              transform transition-all duration-300
              ${isPlaying ? "scale-90 bg-[#20DDBB]/10 border-[#20DDBB]/40" : "scale-100 bg-black/10"}
            `}
              >
                {isPlaying ? (
                  <FaPause
                    className="text-white/90 text-lg"
                    aria-hidden="true"
                  />
                ) : (
                  <FaPlay
                    className="text-white/90 text-lg ml-1"
                    aria-hidden="true"
                  />
                )}
              </div>
            </button>
          )}

          {/* Sound wave animation when playing */}
          {isPlaying && <SoundWave />}
        </div>

        {/* Флоатинг комментарии */}
        <AnimatePresence>
          {showComments && comments && comments.length > 0 && (
            <FloatingComments
              comments={comments}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
          )}
        </AnimatePresence>

        {/* Debug visualizer - в продакшн убрать */}
        {/* <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {commentsShown ? '✅' : '❌'} | {wasOutOfView ? '🔄' : '📌'} | {showComments ? '👁️' : '🙈'}
      </div> */}
      </div>
    );
  },
);

PostImage.displayName = "PostImage";

const PostMainSkeleton = memo(() => (
  <div className="rounded-lg overflow-hidden bg-[#1A2338]/80 backdrop-blur-md mb-4">
    {/* Заголовок скелетона с анимацией */}
    <div className="p-4 flex items-center gap-3">
      <div className="w-12 h-12 rounded-full bg-[#374151] animate-pulse"></div>
      <div className="flex-1">
        <div className="h-4 w-24 bg-[#374151] rounded mb-2 animate-pulse"></div>
        <div className="h-3 w-32 bg-[#374151] rounded animate-pulse"></div>
      </div>
    </div>

    {/* Изображение с красивой анимацией пульсации */}
    <div className="aspect-square bg-[#202A45] relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-[#202A45] to-[#2D314D] animate-pulse">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[#414867] text-5xl">♫</div>
        </div>
      </div>
    </div>

    {/* Нижняя часть с текстом */}
    <div className="p-4">
      <div className="h-4 w-full bg-[#374151] rounded mb-2 animate-pulse"></div>
      <div className="h-4 w-2/3 bg-[#374151] rounded animate-pulse"></div>
    </div>
  </div>
));

PostMainSkeleton.displayName = "PostMainSkeleton";

// Экспортируем PostMainSkeleton для использования в других компонентах
export { PostMainSkeleton };

// Добавляем интерфейс для типа реакции
interface ReactionType {
  id: string;
  icon: React.ReactNode;
  color: string;
  label: string;
  animation: {
    initial: any;
    animate: any;
  };
}

// Добавляем интерфейс для реакций на изображении
interface PostImageReactionsProps {
  post: any;
  onReact: (reactionType: string) => void;
  reactions: Record<string, number>;
}

// Создаем компонент для отображения реакций на изображении
const PostImageReactions = memo(
  ({ post, onReact, reactions = {} }: PostImageReactionsProps) => {
    const reactionTypes: ReactionType[] = [
      // Temporarily removed fire reaction
      /*{
            id: 'fire',
            icon: <div className="fire-icon-3d">
                    <PiFireFill size={38} className="text-transparent fire-gradient" />
                  </div>,
            color: 'text-orange-500',
            label: 'Огонь',
            animation: {
                initial: { scale: 0.8, opacity: 0, rotateY: -30 },
                animate: { scale: 1, opacity: 1, rotateY: 0 }
            }
        }*/
    ];

    return (
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col space-y-3 z-10">
        {reactionTypes.map((reaction) => (
          <motion.button
            key={reaction.id}
            className={`w-16 h-16 rounded-full flex items-center justify-center
                              transition-all group shadow-lg`}
            onClick={() => onReact(reaction.id)}
            whileHover={{
              scale: 1.15,
              rotateY: 20,
            }}
            whileTap={{ scale: 0.9, rotateY: -20 }}
            initial={reaction.animation.initial}
            animate={reaction.animation.animate}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 17,
              mass: 1.5,
            }}
            style={{
              perspective: "800px",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
            }}
          >
            {reaction.icon}
          </motion.button>
        ))}
      </div>
    );
  },
);

PostImageReactions.displayName = "PostImageReactions";

// Компонент для отображения эффектов реакций
const ReactionEffect = memo(({ type }: { type: string }) => {
  const renderEffect = () => {
    switch (type) {
      case "fire":
        return (
          <motion.div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {[...Array(25)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute"
                initial={{
                  x: `${Math.random() * 100}%`,
                  y: "100%",
                  opacity: 0.8,
                  scale: 0.5 + Math.random() * 0.5,
                  rotate: Math.random() * 30 - 15,
                  rotateY: Math.random() * 180,
                  rotateX: Math.random() * 45,
                }}
                animate={{
                  y: `${Math.random() * -120}%`,
                  x: `${Math.random() * 100}%`,
                  opacity: 0,
                  scale: [0.5 + Math.random() * 0.5, 1.2, 0],
                  rotate: [Math.random() * 30 - 15, Math.random() * 60 - 30],
                  rotateY: [Math.random() * 180, Math.random() * 360],
                  rotateX: [Math.random() * 45, Math.random() * 90],
                  transition: {
                    duration: 1.2 + Math.random() * 0.8,
                    repeat: 0,
                    ease: "easeOut",
                  },
                }}
                style={{
                  filter: "drop-shadow(0 0 10px rgba(255, 87, 34, 0.8))",
                  zIndex: Math.floor(Math.random() * 10),
                  perspective: "800px",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="fire-icon-3d">
                  <PiFireFill
                    size={15 + Math.random() * 35}
                    className="text-transparent fire-gradient"
                  />
                </div>
              </motion.div>
            ))}
          </motion.div>
        );
      default:
        return null;
    }
  };

  return renderEffect();
});

ReactionEffect.displayName = "ReactionEffect";

// Интерфейс для props компонента
interface StatsCounterProps {
  post: any;
}

// Интерфейс для ref компонента
interface StatsCounterRef {
  updateStatistics: () => void;
}

// Компонент для отображения счетчиков статистики на изображении
const StatsCounter = memo(
  forwardRef<StatsCounterRef, StatsCounterProps>(({ post }, ref) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const hasLoadedRef = useRef(false);
    const retryCount = useRef(0);
    const MAX_RETRIES = 2;

    // Функция для получения актуальной статистики
    const fetchStatistics = useCallback(async () => {
      if (!post?.id) return;

      try {
        console.log(
          `[StatsCounter] Fetching statistics for track ID: ${post.id}`,
        );
        // Запрос к API для получения статистики
        const response = await fetch(`/api/track-stats/${post.id}`);

        if (!response.ok) {
          const errorText = await response.text().catch(() => "Unknown error");
          throw new Error(
            `Failed to fetch stats (${response.status}): ${errorText}`,
          );
        }

        const data = await response.json();

        if (data.success && data.statistics) {
          console.log(
            `[StatsCounter] Successfully fetched statistics for track ID: ${post.id}`,
          );
          setStats(data.statistics);
          setError(null);
          retryCount.current = 0; // Reset retry count on success
          hasLoadedRef.current = true; // Mark as loaded successfully
        } else {
          console.warn(
            `[StatsCounter] No statistics found for track ID: ${post.id}`,
            data,
          );
          throw new Error("No statistics data found");
        }
      } catch (error) {
        console.error(`[StatsCounter] Error fetching track statistics:`, error);
        setError(
          error instanceof Error ? error : new Error("Failed to fetch stats"),
        );

        // Attempt to retry failed requests, but not too many times
        if (retryCount.current < MAX_RETRIES) {
          retryCount.current += 1;
          console.log(
            `[StatsCounter] Retrying fetch (${retryCount.current}/${MAX_RETRIES})...`,
          );
          // Use exponential backoff for retries
          setTimeout(() => fetchStatistics(), 1000 * retryCount.current);
        }
      } finally {
        setLoading(false);
      }
    }, [post?.id]);

    // Инициализация и настройка загрузки статистики один раз при монтировании
    useEffect(() => {
      // Загружаем данные только один раз при монтировании компонента
      if (!hasLoadedRef.current) {
        fetchStatistics();
      }

      // Очистка при размонтировании
      return () => {
        // No interval to clear anymore
      };
    }, [fetchStatistics]);

    // Функция для обновления статистики после действия (например, воспроизведения)
    // Может быть вызвана извне через ref
    const updateAfterAction = useCallback(() => {
      fetchStatistics();
    }, [fetchStatistics]);

    // Expose the update function via ref
    useImperativeHandle(ref, () => ({
      updateStatistics: updateAfterAction,
    }));

    // Показываем скелетон при загрузке
    if (loading) {
      return (
        <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-md rounded-lg p-2 flex items-end">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-10 bg-white/20 animate-pulse rounded-full"></div>
          </div>
        </div>
      );
    }

    // Показываем ошибку, если не удалось загрузить данные после всех попыток
    if (error && retryCount.current >= MAX_RETRIES) {
      return (
        <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-md rounded-lg p-2 flex items-end">
          <div className="flex items-center gap-1.5">
            <FaHeadphones className="text-gray-400 text-xs" />
            <span className="text-white text-xs font-medium">-</span>
          </div>
        </div>
      );
    }

    // Показываем статистику, если есть данные
    return (
      <div className="absolute top-2 right-2 z-10 bg-black/40 backdrop-blur-md rounded-lg p-2 flex items-end">
        {/* Счетчик прослушиваний */}
        <div className="flex items-center gap-1.5">
          <FaHeadphones className="text-[#20DDBB] text-xs" />
          <span className="text-white text-xs font-medium">
            {stats?.plays_count
              ? parseInt(stats.plays_count, 10).toLocaleString()
              : "0"}
          </span>
        </div>
      </div>
    );
  }),
);

StatsCounter.displayName = "StatsCounter";

// Обновляем сигнатуру компонента для корректной работы с пропсами
interface PostMainProps {
  post: PostWithProfile;
}

const PostMain = memo(({ post }: PostMainProps) => {
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Получаем статистику трека и функции для записи взаимодействий
  const {
    statistics,
    isLoading: statsLoading,
    incrementPlayCount,
  } = useTrackStatistics(post?.id);
  const { recordInteraction, getUserDeviceInfo, getGeographicInfo } =
    useTrackInteraction();

  // Refs to avoid re-renders
  const imageUrlRef = useRef("");
  const avatarUrlRef = useRef("");
  const m3u8UrlRef = useRef("");
  const playCountRecordedRef = useRef(false);
  const statsCounterRef = useRef<StatsCounterRef>(null); // Ref for StatsCounter component

  // Memoized values to prevent unnecessary recalculations
  const userContext = useUser();
  const { setIsLoginOpen } = useGeneralStore();
  const { checkIfTrackPurchased } = useCheckPurchasedTrack();
  const { commentsByPost, setCommentsByPost, getCommentsByPostId } =
    useCommentStore();
  const cardRef = useRef<HTMLDivElement>(null);

  // Use stable audio player hook
  const { 
    isPlaying, 
    handlePlay, 
    handlePause,
    m3u8Url: stableM3u8Url 
  } = useStableAudioPlayer({
    postId: post?.id || '',
    m3u8Url: useCreateBucketUrl(post?.m3u8_url || ''),
    onPlayStatusChange: (isPlaying) => {
      if (isPlaying) {
        // Update stats when playing starts
        if (statsCounterRef.current) {
          statsCounterRef.current.updateStatistics();
        }
        incrementPlayCount();
      }
    }
  });

  // Добавляем состояния для реакций
  const [reactions, setReactions] = useState<Record<string, number>>({
    fire: 0,
  });
  const [currentReaction, setCurrentReaction] = useState<string | null>(null);

  // Calculate URLs only once when post changes
  useEffect(() => {
    if (post) {
      imageUrlRef.current = useCreateBucketUrl(post.image_url);
      avatarUrlRef.current = useCreateBucketUrl(post.profile?.image);
      
      // Проверяем наличие m3u8_url и правильно формируем URL
      if (post.m3u8_url) {
        m3u8UrlRef.current = useCreateBucketUrl(post.m3u8_url);
        console.log(`PostMain: m3u8Url для трека ${post.id} - ${m3u8UrlRef.current}`);
      } else {
        console.error(`PostMain: Отсутствует m3u8_url для трека ${post.id}`);
        m3u8UrlRef.current = "";
      }
    }
  }, [post]);

  // Pre-load images only once
  useEffect(() => {
    const loadImage = (url: string, setError: (error: boolean) => void) => {
      if (typeof window !== "undefined" && url) {
        const img = new window.Image();
        img.src = url;
        img.onerror = () => setError(true);
        img.onload = () => setError(false);
      }
    };

    if (imageUrlRef.current) loadImage(imageUrlRef.current, setImageError);
    if (avatarUrlRef.current) loadImage(avatarUrlRef.current, setAvatarError);
  }, [imageUrlRef.current, avatarUrlRef.current]);

  // Check if track is purchased
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (userContext?.user && post?.id) {
        const purchased = await checkIfTrackPurchased(
          userContext.user.id,
          post.id,
        );
        setIsPurchased(purchased);
      }
    };

    checkPurchaseStatus();
  }, [userContext?.user, post?.id]);

  // Load comments
  useEffect(() => {
    const loadData = async () => {
      if (post?.id) {
        await setCommentsByPost(post.id);
      }
    };

    // Debounce comments loading for performance
    const timer = setTimeout(() => {
      loadData();
    }, 100);

    return () => clearTimeout(timer);
  }, [post?.id]);

  // Проверяем наличие документа статистики при загрузке компонента
  useEffect(() => {
    if (post?.id) {
      // Статистика загружается один раз при монтировании StatsCounter компонента
      // Функция ensureTrackStatisticsExist больше не нужна здесь
    }
  }, [post?.id]);

  // Toggle play/pause function - simplified with stable audio player
  const handleTogglePlay = useCallback(() => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  }, [isPlaying, handlePlay, handlePause]);

  // Handle intersection observer for lazy loading
  useEffect(() => {
    if (!cardRef.current || !window.IntersectionObserver) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsLoading(false);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(cardRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Функция для обработки реакций
  const handleReaction = useCallback((reactionType: string) => {
    // Увеличиваем счетчик реакции
    setReactions((prev) => ({
      ...prev,
      [reactionType]: prev[reactionType] + 1,
    }));

    // Показываем анимацию реакции
    setCurrentReaction(reactionType);

    // Убираем анимацию через 1.5 секунды
    setTimeout(() => {
      setCurrentReaction(null);
    }, 1500);

    // Тут можно добавить логику сохранения реакции на сервер
    // например вызов API для сохранения реакции
  }, []);

  // Сбрасываем флаг записи прослушивания при размонтировании компонента
  useEffect(() => {
    return () => {
      playCountRecordedRef.current = false;
    };
  }, []);

  // Early return if no post
  if (!post) {
    console.log("PostMain: No post data provided");
    return <PostMainSkeleton />;
  }

  // SEO structured data for the music post
  const musicRecordingSchema = {
    "@context": "https://schema.org",
    "@type": "MusicRecording",
    "@id": `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
    name: post.trackname || post.text || "Music Track",
    alternateName: post.text || post.trackname,
    description:
      post.description ||
      post.text ||
      `Discover and listen to ${post.trackname || "this amazing music track"} by ${post.profile?.name || "Unknown Artist"} on SacralTrack`,
    genre: post.genre || "Electronic",

    url: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
    mainEntityOfPage: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
    image: {
      "@type": "ImageObject",
      url: post.image_url
        ? useCreateBucketUrl(post.image_url)
        : "https://sacraltrack.space/images/default-track.jpg",
      width: 400,
      height: 400,
      caption: `${post.trackname || "Music Track"} cover art`,
    },
    datePublished: post.created_at || new Date().toISOString(),
    dateModified: post.created_at || new Date().toISOString(),
    inLanguage: "en",
    contentUrl: post.audio_url ? useCreateBucketUrl(post.audio_url) : undefined,
    encodingFormat: "audio/mpeg",
    byArtist: {
      "@type": "MusicGroup",
      "@id": `https://sacraltrack.space/profile/${post.user_id}`,
      name: post.profile?.name || "Unknown Artist",
      url: `https://sacraltrack.space/profile/${post.user_id}`,
      image: {
        "@type": "ImageObject",
        url: post.profile?.image
          ? useCreateBucketUrl(post.profile.image)
          : "https://sacraltrack.space/images/default-avatar.jpg",
        width: 150,
        height: 150,
      },
      genre: post.genre,
      sameAs: `https://sacraltrack.space/profile/${post.user_id}`,
    },
    recordLabel: {
      "@type": "MusicLabel",
      name: "SacralTrack Records",
      url: "https://sacraltrack.space",
    },
    publisher: {
      "@type": "Organization",
      name: "SacralTrack",
      url: "https://sacraltrack.space",
      logo: {
        "@type": "ImageObject",
        url: "https://sacraltrack.space/images/logo.png",
        width: 200,
        height: 60,
      },
      sameAs: ["https://sacraltrack.space"],
    },
    offers:
      (Number(post.price) || 0) > 0
        ? {
            "@type": "Offer",
            price: ((Number(post.price) || 0) / 100).toFixed(2),
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
            seller: {
              "@type": "Organization",
              name: "SacralTrack",
            },
          }
        : undefined,
    aggregateRating:
      (Number(statistics?.plays_count) || 0) > 0 ||
      (Number(post.likes_count) || 0) > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Math.min(
              5,
              Math.max(1, (Number(post.likes_count) || 0) / 10 + 3),
            ),
            ratingCount:
              (Number(post.likes_count) || 0) +
              (Number(statistics?.plays_count) || 0),
            bestRating: 5,
            worstRating: 1,
            reviewCount: Number(post.likes_count) || 0,
          }
        : undefined,
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: Number(post.likes_count) || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/PlayAction",
        userInteractionCount: Number(statistics?.plays_count) || 0,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/ShareAction",
        userInteractionCount: Number(statistics?.shares_count) || 0,
      },
    ],
    potentialAction: [
      {
        "@type": "ListenAction",
        target: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
        expectsAcceptanceOf: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
      (Number(post.price) || 0) > 0
        ? {
            "@type": "BuyAction",
            target: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
            price: ((Number(post.price) || 0) / 100).toFixed(2),
            priceCurrency: "USD",
          }
        : undefined,
    ].filter(Boolean),
    keywords: `${post.trackname}, ${post.profile?.name}, ${post.genre}, music, track, audio, song, electronic music, streaming`,
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://sacraltrack.space",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Music Tracks",
        item: "https://sacraltrack.space/tracks",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.profile?.name || "Artist",
        item: `https://sacraltrack.space/profile/${post.user_id}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.trackname || post.text || "Music Track",
        item: `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
      },
    ],
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://sacraltrack.space/#website",
    url: "https://sacraltrack.space",
    name: "SacralTrack",
    description:
      "Discover, stream and purchase high-quality electronic music tracks from independent artists worldwide",
    publisher: {
      "@type": "Organization",
      name: "SacralTrack",
      url: "https://sacraltrack.space",
      logo: {
        "@type": "ImageObject",
        url: "https://sacraltrack.space/images/logo.png",
        width: 200,
        height: 60,
      },
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://sacraltrack.space/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    mainEntity: {
      "@type": "MusicRecording",
      "@id": `https://sacraltrack.space/post/${post.id}/${post.user_id}`,
    },
  };

  // Stripe checkout handler
  const handlePurchase = async () => {
    if (!userContext?.user) {
      setIsLoginOpen(true);
      return;
    }

    if (isProcessingPayment) return;

    try {
      setIsProcessingPayment(true);
      successToast("Processing your purchase...");

      // Простой и надежный способ отправки запроса
      try {
        const response = await fetch("/api/checkout_sessions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            trackId: post.id,
            trackName: post.trackname,
            userId: userContext.user.id,
            authorId: post.profile.user_id,
            image: post.image_url,
            amount: 200, // Fixed price in cents ($2.00)
          }),
        });

        console.log("Payment response status:", response.status);

        // Обработка ответа
        const data = await response.json();
        console.log("Payment response data:", data);

        if (!response.ok) {
          throw new Error(data.error || "Payment initialization failed");
        }

        if (!data.success || !data.session || !data.session.url) {
          throw new Error("Invalid checkout session response");
        }

        console.log("Redirecting to checkout URL:", data.session.url);

        // Простое и надежное перенаправление
        window.location.assign(data.session.url);
      } catch (error) {
        console.error("Payment process error:", error);
        errorToast("We couldn't process your payment. Please try again.");
      }
    } catch (error: any) {
      console.error("Purchase error:", error);
      errorToast("We couldn't process your payment. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleShare = () => {
    setIsShareModalOpen(true);
    successToast("Ready to share this awesome track!");
  };

  // SEO-friendly current URL for sharing
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/post/${post.user_id}/${post.id}`
      : "";

  return (
    <>
      {/* JSON-LD структурированные данные для SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(musicRecordingSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />

      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="bg-[#24183d] rounded-2xl overflow-hidden mb-6 w-full max-w-[100%] md:w-[450px] mx-auto shadow-lg shadow-black/20"
        itemScope
        itemType="https://schema.org/MusicRecording"
      >
        {/* Enhanced schema.org metadata for SEO */}
        <meta itemProp="name" content={post.trackname} />
        <meta itemProp="byArtist" content={post.profile.name} />
        <meta itemProp="genre" content={post.genre} />
        {post.description && (
          <meta itemProp="description" content={post.description} />
        )}
        <link itemProp="url" href={shareUrl} />
        <meta itemProp="inLanguage" content="en" />
        <meta
          itemProp="datePublished"
          content={post.created_at || new Date().toISOString()}
        />
        {imageUrlRef.current && (
          <meta itemProp="image" content={imageUrlRef.current} />
        )}

        {/* Hidden SEO metadata - only visible to search engines */}
        <div className="hidden" aria-hidden="true">
          <h1>
            {post.trackname} by {post.profile.name}
          </h1>
          <p>
            Listen to {post.trackname} by {post.profile.name}. {post.genre}{" "}
            music.
          </p>
          <span itemProp="duration">3:00</span>
          <div
            itemProp="potentialAction"
            itemScope
            itemType="https://schema.org/ListenAction"
          >
            <meta itemProp="target" content={shareUrl} />
          </div>
          <meta
            property="og:title"
            content={`${post.trackname} by ${post.profile.name}`}
          />
          <meta property="og:type" content="music.song" />
          <meta property="og:url" content={shareUrl} />
          <meta property="og:image" content={imageUrlRef.current} />
          <meta
            property="og:description"
            content={
              post.description ||
              `Listen to ${post.trackname} by ${post.profile.name}. ${post.genre} music.`
            }
          />
          <meta property="og:site_name" content="Music Platform" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content={`${post.trackname} by ${post.profile.name}`}
          />
          <meta
            name="twitter:description"
            content={
              post.description ||
              `Listen to ${post.trackname} by ${post.profile.name}. ${post.genre} music.`
            }
          />
          <meta name="twitter:image" content={imageUrlRef.current} />
          <meta
            name="keywords"
            content={`${post.trackname}, ${post.profile.name}, ${post.genre}, music, track, audio, song`}
          />
        </div>

        <PostHeader
          profile={post.profile}
          avatarUrl={avatarUrlRef.current}
          avatarError={avatarError}
          setAvatarError={setAvatarError}
          text={post.trackname}
          genre={post.genre}
        />

        <PostImage
          imageUrl={imageUrlRef.current}
          imageError={imageError}
          comments={post.id ? getCommentsByPostId(post.id) : []}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          post={post}
          onReact={handleReaction}
          reactions={reactions}
          currentReaction={currentReaction}
          statsCounterRef={statsCounterRef}
        />

        <div className="p-[5px] border-t border-white/5">
          <AudioPlayer
            m3u8Url={stableM3u8Url}
            isPlaying={isPlaying}
            onPlay={handlePlay}
            onPause={handlePause}
          />
        </div>

        <div className="p-[5px] flex justify-between items-center w-full">
          <div className="flex items-center gap-4 flex-shrink-0">
            <PostMainLikes post={post} />
          </div>

          {/* Action buttons section */}
          <div className="p-[5px] bg-gradient-to-r from-transparent via-white/[0.01] to-transparent">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {!isPurchased ? (
                  <motion.button
                    onClick={handlePurchase}
                    disabled={isProcessingPayment}
                    className="relative overflow-hidden bg-gradient-to-r from-[#20DDBB] to-[#5D59FF] text-white px-6 py-3 rounded-xl font-bold
                                          shadow-[0_8px_25px_rgba(32,221,187,0.25)] hover:shadow-[0_12px_35px_rgba(32,221,187,0.4)]
                                          transition-all duration-300 flex items-center gap-2 text-sm group/btn mr-5"
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    aria-label={`Buy track ${post.trackname} for $2`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative font-bold">Buy</span>
                    {isProcessingPayment && (
                      <motion.div
                        className="relative w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                      />
                    )}
                  </motion.button>
                ) : (
                  <motion.button
                    className="bg-gradient-to-r from-[#20DDBB]/20 to-[#018CFD]/20 text-[#20DDBB] px-4 sm:px-6 py-2 sm:py-2.5
                                          rounded-xl font-medium border border-[#20DDBB]/30 flex items-center gap-2 text-sm mr-5"
                    whileHover={{ scale: 1.01 }}
                    aria-label="Track already purchased"
                  >
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="font-semibold">Purchased</span>
                  </motion.button>
                )}
              </div>

              {/* Share button */}
              <motion.button
                onClick={handleShare}
                className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#20DDBB]/30 transition-all duration-300"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Share track"
              >
                <ShareIcon className="w-5 h-5 text-white/80 hover:text-[#20DDBB]" />
              </motion.button>
            </div>
          </div>
        </div>

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          post={post}
        />
      </motion.div>
    </>
  );
});

PostMain.displayName = "PostMain";

export default PostMain;
