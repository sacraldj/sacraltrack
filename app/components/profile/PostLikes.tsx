"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import useCreateBucketUrl from "@/app/hooks/useCreateBucketUrl";
import { usePlayerContext } from "@/app/context/playerContext";
import { AudioPlayer } from "@/app/components/AudioPlayer";
import PostMainLikes from "./PostMainLikes";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import useGetCommentsByPostId from "@/app/hooks/useGetCommentsByPostId";
import { FaCommentDots } from "react-icons/fa";
import { BsPlayFill, BsPauseFill } from "react-icons/bs";

interface PostLikesProps {
  post: {
    $id: string;
    user_id: string;
    trackname: string;
    audio_url: string;
    image_url: string;
    m3u8_url: string;
    created_at: string;
    profile: {
      user_id: string;
      name: string;
      image: string;
    };
  };
}

const PostLikes = ({ post }: PostLikesProps) => {
  console.log("PostLikes received post:", post);

  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    setCurrentTrack,
    togglePlayPause,
    currentAudioId,
    setCurrentAudioId,
    stopAllPlayback,
  } = usePlayerContext();
  const [imageError, setImageError] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [comments, setComments] = useState<any[]>([]);

  const imageUrl = useCreateBucketUrl(post?.image_url);
  const avatarUrl = useCreateBucketUrl(post?.profile?.image);
  const m3u8Url = useCreateBucketUrl(post?.m3u8_url);

  const isCurrentTrack = currentTrack?.id === post.$id;
  const isActiveInPlayer = currentAudioId === post.$id;

  console.log("PostLikes - Raw post data:", post);

  // Преобразуем пост в формат, который ожидает PostMainLikes
  const formattedPost = {
    id: post.$id,
    user_id: post.user_id,
    trackname: post.trackname,
    audio_url: post.audio_url,
    image_url: post.image_url,
    m3u8_url: post.m3u8_url,
    created_at: post.created_at,
    text: "",
    price: 0,
    mp3_url: "",
    genre: "",
    profile: post.profile,
  };

  console.log("PostLikes - Formatted post for PostMainLikes:", formattedPost);

  // Загрузка комментариев для поста
  useEffect(() => {
    const loadComments = async () => {
      try {
        const result = await useGetCommentsByPostId(post.$id);
        setComments(result);
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    loadComments();
  }, [post.$id]);

  const handlePlay = useCallback(() => {
    if (!post.m3u8_url) return;

    if (isCurrentTrack && isPlaying) {
      // Если трек уже воспроизводится, останавливаем его
      stopAllPlayback();
      setCurrentAudioId(null);
    } else {
      // Устанавливаем текущий трек
      setCurrentTrack({
        id: post.$id,
        audio_url: m3u8Url,
        image_url: imageUrl,
        name: post.trackname,
        artist: post.profile.name,
      });

      // Активируем его в PlayerContext
      setCurrentAudioId(post.$id);

      // Если воспроизведение остановлено, запускаем
      if (!isPlaying) {
        togglePlayPause();
      }
    }
  }, [
    isCurrentTrack,
    isPlaying,
    post,
    m3u8Url,
    imageUrl,
    setCurrentTrack,
    togglePlayPause,
    setCurrentAudioId,
    stopAllPlayback,
  ]);

  // Переход на страницу комментариев
  const navigateToComments = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling up to parent elements
    router.push(`/post/${post.$id}/${post.user_id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ x: 4, transition: { duration: 0.2 } }}
      className="group w-full max-w-[600px] mx-auto rounded-xl bg-gradient-to-r from-[#24183d]/60 to-[#1E1432]/70 backdrop-blur-md border border-white/5 hover:border-[#20DDBB]/20 shadow-[0_4px_15px_rgba(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(32,221,187,0.1)] transition-all duration-300 overflow-hidden mb-2"
    >
      <div className="flex items-center gap-3 p-3">
        {/* Compact artwork */}
        <div className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden">
          <img
            className="w-full h-full object-cover"
            src={imageError ? "/images/T-logo.svg" : imageUrl}
            alt={post.trackname}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handlePlay}
              className="w-8 h-8 bg-[#20DDBB] rounded-full flex items-center justify-center shadow-lg"
            >
              {isCurrentTrack && isPlaying ? (
                <BsPauseFill className="text-white text-sm" />
              ) : (
                <BsPlayFill className="text-white text-sm ml-0.5" />
              )}
            </motion.button>
          </div>
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/profile/${post.user_id}`}
              className="text-[#A6B1D0] text-sm font-medium hover:text-[#20DDBB] transition-colors truncate"
            >
              {post.profile.name}
            </Link>
            <span className="text-[#20DDBB]/50 text-xs">•</span>
            <span className="text-xs text-[#818BAC]">
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <h3 className="text-white font-semibold text-sm truncate group-hover:text-[#20DDBB] transition-colors">
            {post.trackname}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={navigateToComments}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
          >
            <FaCommentDots className="text-[#A6B1D0] text-xs" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handlePlay}
            className="p-2 rounded-lg bg-gradient-to-r from-[#20DDBB]/10 to-[#5D59FF]/10 hover:from-[#20DDBB]/20 hover:to-[#5D59FF]/20 border border-[#20DDBB]/20 transition-all"
          >
            {isCurrentTrack && isPlaying ? (
              <BsPauseFill className="text-[#20DDBB] text-sm" />
            ) : (
              <BsPlayFill className="text-[#20DDBB] text-sm" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Compact audio player - only visible when playing */}
      {isCurrentTrack && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/5 px-3 pb-2"
        >
          <div className="py-1">
            <AudioPlayer
              m3u8Url={m3u8Url}
              isPlaying={isCurrentTrack && isPlaying}
              onPlay={() => {
                setCurrentAudioId(post.$id);
                setCurrentTrack({
                  id: post.$id,
                  audio_url: m3u8Url,
                  image_url: imageUrl,
                  name: post.trackname,
                  artist: post.profile.name,
                });
              }}
              onPause={() => {
                stopAllPlayback();
              }}
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PostLikes;
