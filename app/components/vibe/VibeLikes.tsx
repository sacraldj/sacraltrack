import { AiFillHeart } from "react-icons/ai"
import { useEffect, useState } from "react"
import { useUser } from "../../context/user"
import { BiLoaderCircle } from "react-icons/bi"
import { useGeneralStore } from "../../stores/general"
import { VibeLike } from "../../types"
import useGetLikesByVibeId from "../../hooks/useGetLikesByVibeId"
import useIsVibeLiked from "../../hooks/useIsVibeLiked"
import useCreateVibeLike from "../../hooks/useCreateVibeLike"
import useDeleteVibeLike from "../../hooks/useDeleteVibeLike"

interface VibeLikesProps {
  vibe: {
    id: string;
    user_id: string;
  };
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onLikeUpdated?: (count: number, isLiked: boolean) => void;
}

const VibeLikes = ({
  vibe,
  showCount = true,
  size = 'md',
  className = '',
  onLikeUpdated
}: VibeLikesProps) => {
  const { setIsLoginOpen } = useGeneralStore();
  const contextUser = useUser();

  const [hasClickedLike, setHasClickedLike] = useState<boolean>(false);
  const [userLiked, setUserLiked] = useState<boolean>(false);
  const [likes, setLikes] = useState<VibeLike[]>([]);

  // Получение всех лайков вайба
  useEffect(() => {
    getAllLikesByVibe();
  }, [vibe.id]);

  // Проверка, лайкнул ли пользователь
  useEffect(() => {
    hasUserLikedVibe();
  }, [likes, contextUser]);

  const getAllLikesByVibe = async () => {
    let result = await useGetLikesByVibeId(vibe.id);
    setLikes(result);

    // Уведомляем родительский компонент о новом количестве лайков
    if (onLikeUpdated) {
      onLikeUpdated(result?.length || 0, userLiked);
    }
  };

  const hasUserLikedVibe = () => {
    if (!contextUser) return;

    if (likes?.length < 1 || !contextUser?.user?.id) {
      setUserLiked(false);
      return;
    }
    let res = useIsVibeLiked(contextUser?.user?.id, vibe.id, likes);
    setUserLiked(res ? true : false);

    // Уведомляем родительский компонент о статусе лайка
    if (onLikeUpdated) {
      onLikeUpdated(likes?.length || 0, res ? true : false);
    }
  };

  const like = async () => {
    setHasClickedLike(true);
    await useCreateVibeLike(contextUser?.user?.id || '', vibe.id);
    await getAllLikesByVibe();
    hasUserLikedVibe();
    setHasClickedLike(false);
  };

  const unlike = async (id: string) => {
    setHasClickedLike(true);
    await useDeleteVibeLike(id);
    await getAllLikesByVibe();
    hasUserLikedVibe();
    setHasClickedLike(false);
  };

  const likeOrUnlike = () => {
    if (!contextUser?.user?.id) {
      setIsLoginOpen(true);
      return;
    }

    if (userLiked) {
      // Найти лайк пользователя и удалить его
      let userLike = likes.find(like =>
        like.user_id === contextUser.user?.id && like.vibe_id === vibe.id
      );
      if (userLike) {
        unlike(userLike.id);
      }
    } else {
      like();
    }
  };

  // Размеры в зависимости от size prop
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return { icon: 16, text: 'text-xs' };
      case 'lg':
        return { icon: 27, text: 'text-base' };
      default:
        return { icon: 20, text: 'text-sm' };
    }
  };

  const sizeClasses = getSizeClasses();

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

  return (
    <button
      disabled={hasClickedLike}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        likeOrUnlike();
      }}
      className={`flex items-center gap-2 ${className} ${hasClickedLike ? 'opacity-70' : 'hover:opacity-80'} transition-opacity`}
      aria-label={userLiked ? 'Unlike' : 'Like'}
      title={userLiked ? 'Unlike' : 'Like'}
    >
      {!hasClickedLike ? (
        <AiFillHeart
          color={userLiked ? '#FF0000' : 'white'}
          size={sizeClasses.icon}
        />
      ) : (
        <BiLoaderCircle
          className="animate-spin"
          color="white"
          size={sizeClasses.icon}
        />
      )}

      {showCount && (
        <span className={`${sizeClasses.text} text-white font-semibold`}>
          {formatNumber(likes?.length || 0)}
        </span>
      )}
    </button>
  );
};

export default VibeLikes;