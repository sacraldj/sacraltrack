import { useState, useEffect, useRef, useCallback } from 'react';
import { usePlayerContext } from '@/app/context/playerContext';

interface UseStableAudioPlayerProps {
  postId: string;
  m3u8Url: string;
  onPlayStatusChange?: (isPlaying: boolean) => void;
}

export const useStableAudioPlayer = ({
  postId,
  m3u8Url,
  onPlayStatusChange,
}: UseStableAudioPlayerProps) => {
  const { 
    currentAudioId, 
    setCurrentAudioId, 
    isPlaying: globalIsPlaying, 
    togglePlayPause,
    stopAllPlayback 
  } = usePlayerContext();
  
  const m3u8UrlRef = useRef(m3u8Url);
  const isMounted = useRef(false);

  // Update URL ref when it changes
  useEffect(() => {
    if (m3u8Url && m3u8Url !== m3u8UrlRef.current) {
      m3u8UrlRef.current = m3u8Url;
    }
  }, [m3u8Url]);

  const isCurrentTrack = currentAudioId === postId;
  const isPlaying = isCurrentTrack && globalIsPlaying;

  // Handle play/pause state changes
  useEffect(() => {
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }
    if (onPlayStatusChange) {
      onPlayStatusChange(isPlaying);
    }
  }, [isPlaying, onPlayStatusChange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCurrentTrack && globalIsPlaying) {
        stopAllPlayback?.();
      }
    };
  }, [isCurrentTrack, globalIsPlaying, stopAllPlayback]);

  const handlePlay = useCallback(() => {
    if (currentAudioId && currentAudioId !== postId) {
      // Stop other tracks first
      stopAllPlayback?.();
    }
    
    // Set this track as current
    setCurrentAudioId(postId);
    
    // Start playing if not already playing
    if (!globalIsPlaying || currentAudioId !== postId) {
      togglePlayPause();
    }
  }, [currentAudioId, postId, setCurrentAudioId, togglePlayPause, stopAllPlayback, globalIsPlaying]);

  const handlePause = useCallback(() => {
    if (isCurrentTrack && globalIsPlaying) {
      togglePlayPause();
    }
  }, [isCurrentTrack, globalIsPlaying, togglePlayPause]);

  return {
    isPlaying,
    handlePlay,
    handlePause,
    m3u8Url: m3u8UrlRef.current,
  };
};
