"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVibeStore, VibePostWithProfile } from '@/app/stores/vibeStore';
import VibeCard from '@/app/components/vibe/VibeCard';
import { VibeCardSkeleton } from '@/app/components/vibe/VibeCardSkeleton';
import { MdOutlineMusicNote } from 'react-icons/md';
import { VibeUploader } from '@/app/components/vibe/VibeUploader';

interface UserVibesProps {
  userId: string;
  isProfileOwner: boolean;
}

const UserVibes: React.FC<UserVibesProps> = ({ userId, isProfileOwner }) => {
  const { vibePostsByUser, fetchVibesByUser, isLoadingVibes, error } = useVibeStore();
  const [showVibeUploader, setShowVibeUploader] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const loadVibes = async () => {
      try {
        await fetchVibesByUser(userId);
      } catch (error) {
        console.error('Error loading vibes:', error);
      }
    };

    loadVibes();
  }, [userId, fetchVibesByUser, refreshTrigger]);

  const handleVibeUploaderSuccess = () => {
    // Обновляем вайбы после успешной загрузки нового
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="w-full">
      {/* Заголовок и кнопка добавления вайба */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <MdOutlineMusicNote className="text-purple-500 w-6 h-6 mr-2" />
          <h2 className="text-2xl font-bold text-white">
            {isProfileOwner ? 'My Vibes' : 'Musical Vibes'}
          </h2>
        </div>
      </div>

      {/* Отображение вайбов */}
      {isLoadingVibes ? (
        <div className="grid grid-cols-1 gap-6 max-w-[450px] mx-auto px-0 vibes-grid-mobile">
          {[1, 2, 3].map(i => (
            <VibeCardSkeleton key={i} />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-500 text-center">
          <p>Error loading vibes. Please try again later.</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      ) : vibePostsByUser && vibePostsByUser.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 max-w-[450px] mx-auto px-0 vibes-grid-mobile">
          <AnimatePresence>
            {vibePostsByUser.map((vibe) => (
              <motion.div
                key={vibe.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <VibeCard vibe={vibe} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="relative w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-purple-500/20 animate-pulse rounded-full"></div>
            <MdOutlineMusicNote className="w-full h-full text-purple-500/50" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {isProfileOwner ? 'Share Your First Vibe' : 'No Vibes Yet'}
          </h3>
          <p className="text-gray-400 max-w-md mb-6">
            {isProfileOwner
              ? 'Share your musical journey with photos, videos, and creative content.'
              : 'This user hasn\'t shared any musical vibes yet.'}
          </p>
        </div>
      )}

      {/* Модальное окно загрузки вайба */}
      {showVibeUploader && (
        <VibeUploader
          onClose={() => setShowVibeUploader(false)}
          onSuccess={handleVibeUploaderSuccess}
        />
      )}
    </div>
  );
};

export default UserVibes; 