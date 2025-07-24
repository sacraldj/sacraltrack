"use client";

// PlayerContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import toast from "react-hot-toast";

// Define the type for the current track
export type CurrentTrackType = {
  id: string;
  audio_url: string;
  image_url: string;
  name: string;
  artist: string;
} | null;

// Define the PlayerContextType
export type PlayerContextType = {
  currentAudioId: string | null;
  currentTrack: CurrentTrackType;
  isPlaying: boolean;
  setCurrentAudioId: (id: string | null) => void;
  setCurrentTrack: (track: CurrentTrackType) => void;
  togglePlayPause: () => void;
  stopAllPlayback: () => void;
};

// Create the context
const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

// Create the provider component
export const PlayerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentAudioId, setCurrentAudioId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<CurrentTrackType>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Toggle play/pause state with better error handling
  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const newState = !prev;
      console.log(
        `PlayerContext: Toggle playback - ${newState ? "Playing" : "Paused"}`,
      );
      return newState;
    });
  };

  // Stop all playback with better cleanup
  const stopAllPlayback = () => {
    console.log("PlayerContext: Stopping all playback");
    setIsPlaying(false);
    // Keep currentAudioId to maintain track selection state
    // Only reset when a different track is explicitly selected
  };

  // Handle track changes with improved timing
  useEffect(() => {
    if (currentAudioId && currentTrack) {
      console.log(`PlayerContext: New track selected - ${currentTrack.name}`);
      // Give AudioPlayer more time to initialize HLS
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 200);

      return () => clearTimeout(timer);
    } else if (!currentAudioId) {
      // Reset playing state when no track is selected
      setIsPlaying(false);
    }
  }, [currentAudioId, currentTrack]);

  // Enhanced cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("PlayerContext: Cleaning up on unmount");
      setIsPlaying(false);
      setCurrentAudioId(null);
      setCurrentTrack(null);
    };
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentAudioId,
        setCurrentAudioId,
        currentTrack,
        isPlaying,
        setCurrentTrack,
        togglePlayPause,
        stopAllPlayback,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

// Create a custom hook to use the PlayerContext
export const usePlayerContext = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayerContext must be used within a PlayerProvider");
  }
  return context;
};

export default PlayerContext;
