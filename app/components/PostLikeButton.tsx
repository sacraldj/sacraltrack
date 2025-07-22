"use client";

import React, { useState, useEffect, useRef } from 'react';
import { usePostLikesManager } from '@/app/hooks/usePostLikesManager';
import { useUser } from '@/app/context/user';
import { useGeneralStore } from '@/app/stores/general';
import { AiFillHeart } from "react-icons/ai";
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

interface PostLikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  onLikeUpdated?: (count: number, isLiked: boolean) => void;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const PostLikeButton: React.FC<PostLikeButtonProps> = ({
  postId,
  initialLikeCount = 0,
  onLikeUpdated,
  showCount = true,
  size = 'md',
  className = '',
}) => {
  const { user } = useUser() || { user: null };
  const { setIsLoginOpen } = useGeneralStore();
  
  // Используем новый менеджер лайков
  const {
    count: likesCount,
    hasLiked: isLiked,
    isUpdating,
    error,
    toggleLike,
  } = usePostLikesManager(postId, user?.id);

  // Состояние для анимаций
  const [animationState, setAnimationState] = useState<'idle' | 'liking' | 'unliking'>('idle');
  const [showRipple, setShowRipple] = useState(false);
  const rippleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Уведомляем родительский компонент об изменениях
  useEffect(() => {
    if (onLikeUpdated) {
      onLikeUpdated(likesCount, isLiked);
    }
  }, [likesCount, isLiked, onLikeUpdated]);

  // Функция для обработки клика с анимациями
  const handleLikeClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    // Запускаем анимацию
    const newState = isLiked ? 'unliking' : 'liking';
    setAnimationState(newState);
    
    // Показываем ripple эффект
    setShowRipple(true);
    if (rippleTimeoutRef.current) {
      clearTimeout(rippleTimeoutRef.current);
    }
    rippleTimeoutRef.current = setTimeout(() => {
      setShowRipple(false);
    }, 600);

    try {
      // Выполняем переключение лайка
      const success = await toggleLike();
      
      // Сбрасываем анимацию
      setTimeout(() => {
        setAnimationState('idle');
      }, success ? 400 : 300);
    } catch (error) {
      console.error('[PostLikeButton] Toggle error:', error);
      toast.error("Please log in to like posts");
      setTimeout(() => {
        setAnimationState('idle');
      }, 300);
    }
  };

  // Cleanup функция для таймеров
  useEffect(() => {
    return () => {
      if (rippleTimeoutRef.current) {
        clearTimeout(rippleTimeoutRef.current);
      }
    };
  }, []);

  // Функция для форматирования числа лайков
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  // Размеры в зависимости от size prop
  const sizeClasses = {
    sm: { icon: 16, text: 'text-xs' },
    md: { icon: 20, text: 'text-sm' },
    lg: { icon: 27, text: 'text-base' }
  };

  const currentSize = sizeClasses[size];
  
  return (
    <button
      onClick={handleLikeClick}
      aria-label={isLiked ? 'Unlike' : 'Like'}
      title={isLiked ? 'Unlike' : 'Like'}
      className={`group relative flex items-center gap-2 ${className} focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-full transition-all duration-200`}
    >
      {/* Ripple effect */}
      {showRipple && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-8 h-8 bg-red-500/20 rounded-full animate-ripple" />
        </div>
      )}
      
      {/* Heart icon container */}
      <motion.div 
        className={`relative flex items-center justify-center transition-all duration-300 ${
          animationState === 'liking' 
            ? 'animate-likePopIn' 
            : animationState === 'unliking'
              ? 'animate-likePopOut'
              : isLiked 
                ? 'scale-110 hover:scale-105' 
                : 'hover:scale-110'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AiFillHeart 
          color={isLiked ? '#FF0000' : 'white'} 
          size={currentSize.icon}
          className={`transition-colors ${!isLiked ? 'group-hover:text-red-500' : ''} ${animationState === 'idle' && isLiked ? 'animate-heartbeat' : ''}`}
        />
      </motion.div>
      
      {/* Like count */}
      {showCount && (
        <div className={`flex items-center transition-all duration-300 ${
          animationState === 'liking' ? 'animate-countUp' : animationState === 'unliking' ? 'animate-countDown' : ''
        }`}>
          <span className={`${
            isLiked ? 'text-red-500' : 'text-white group-hover:text-red-500'
          } transition-colors font-semibold ${currentSize.text}`}>
            {formatNumber(likesCount)}
          </span>
          
          {/* Error indicator */}
          {error && (
            <div className="ml-1 w-2 h-2 bg-red-400 rounded-full animate-pulse" title={error} />
          )}
        </div>
      )}
    </button>
  );
};

export default PostLikeButton;
