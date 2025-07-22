import { useState, useEffect, useCallback } from 'react';
import useGetLikesByPostId from './useGetLikesByPostId';
import useIsLiked from './useIsLiked';
import useCreateLike from './useCreateLike';
import useDeleteLike from './useDeleteLike';

interface PostLikeData {
  count: number;
  hasLiked: boolean;
  lastUpdated: number;
  likes: any[];
}

// Глобальный кэш для лайков постов
const postLikesCache = new Map<string, PostLikeData>();
const postSubscribers = new Map<string, Set<(data: PostLikeData) => void>>();

// Время жизни кэша (30 секунд)
const CACHE_TTL = 30000;

// Функция для получения лайков поста
async function fetchPostLikes(postId: string): Promise<any[]> {
  try {
    const likes = await useGetLikesByPostId(postId);
    return likes || [];
  } catch (error) {
    console.error(`[PostLikesManager] Error fetching likes for post ${postId}:`, error);
    return [];
  }
}

// Хук для управления лайками постов (совместимый с существующей системой)
export function usePostLikesManager(postId: string, userId?: string) {
  const [data, setData] = useState<PostLikeData>({ 
    count: 0, 
    hasLiked: false, 
    lastUpdated: 0,
    likes: []
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const cacheKey = `${postId}_${userId || 'anonymous'}`;
  
  // Функция для обновления данных
  const updateData = useCallback(async () => {
    try {
      const likes = await fetchPostLikes(postId);
      const hasLiked = userId ? Boolean(useIsLiked(userId, postId, likes)) : false;

      const newData: PostLikeData = {
        count: likes.length,
        hasLiked,
        lastUpdated: Date.now(),
        likes
      };
      
      // Обновляем кэш
      postLikesCache.set(cacheKey, newData);
      
      // Уведомляем подписчиков
      const subs = postSubscribers.get(cacheKey);
      if (subs) {
        subs.forEach(callback => callback(newData));
      }
      
      return newData;
    } catch (error) {
      console.error('[usePostLikesManager] Update error:', error);
      throw error;
    }
  }, [postId, userId, cacheKey]);
  
  // Подписка на обновления
  useEffect(() => {
    const callback = (newData: PostLikeData) => {
      setData(newData);
      setError(null);
    };
    
    if (!postSubscribers.has(cacheKey)) {
      postSubscribers.set(cacheKey, new Set());
    }
    postSubscribers.get(cacheKey)!.add(callback);
    
    // Проверяем кэш
    const cached = postLikesCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.lastUpdated) < CACHE_TTL) {
      callback(cached);
    } else {
      // Загружаем данные
      updateData().then(callback).catch(err => {
        console.error('[usePostLikesManager] Initial fetch error:', err);
        setError('Failed to load likes');
      });
    }
    
    return () => {
      const subs = postSubscribers.get(cacheKey);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          postSubscribers.delete(cacheKey);
        }
      }
    };
  }, [postId, userId, cacheKey, updateData]);
  
  // Функция для переключения лайка
  const toggleLike = useCallback(async () => {
    if (!userId) {
      throw new Error('User not logged in');
    }
    
    if (isUpdating) return false;
    
    setIsUpdating(true);
    setError(null);
    
    // Оптимистичное обновление
    const optimisticData: PostLikeData = {
      count: data.hasLiked ? Math.max(0, data.count - 1) : data.count + 1,
      hasLiked: !data.hasLiked,
      lastUpdated: Date.now(),
      likes: data.likes
    };
    setData(optimisticData);
    
    try {
      if (data.hasLiked) {
        // Unlike - найти лайк пользователя и удалить
        const userLike = data.likes.find(like => 
          like.user_id === userId && like.post_id === postId
        );
        if (userLike) {
          await useDeleteLike(userLike.id);
        }
      } else {
        // Like
        await useCreateLike(userId, postId);
      }
      
      // Обновляем данные с сервера
      await updateData();
      return true;
    } catch (error: any) {
      console.error('[usePostLikesManager] Toggle error:', error);
      setError('Failed to update like');
      // Откатываем оптимистичное обновление
      setData(data);
      return false;
    } finally {
      setIsUpdating(false);
    }
  }, [userId, postId, data, isUpdating, updateData]);
  
  // Функция для принудительного обновления
  const refresh = useCallback(() => {
    postLikesCache.delete(cacheKey);
    updateData().then(newData => {
      setData(newData);
      setError(null);
    }).catch(err => {
      console.error('[usePostLikesManager] Refresh error:', err);
      setError('Failed to refresh likes');
    });
  }, [cacheKey, updateData]);
  
  return {
    count: data.count,
    hasLiked: data.hasLiked,
    likes: data.likes,
    isUpdating,
    error,
    toggleLike,
    refresh,
    lastUpdated: data.lastUpdated,
  };
}
