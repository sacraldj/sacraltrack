"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

interface AudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  buffered: number;
  bufferHealth: number;
  playbackRate: number;
  error: string | null;
  retryCount: number;
}

interface AudioPlayerConfig {
  preload?: "auto" | "metadata" | "none";
  crossOrigin?: "anonymous" | "use-credentials" | null;
  autoRetry?: boolean;
  maxRetryAttempts?: number;
  retryDelay?: number;
  updateInterval?: number;
  bufferThreshold?: number;
}

interface AudioPlayerHook extends AudioPlayerState {
  play: () => Promise<void>;
  pause: () => void;
  togglePlay: () => Promise<void>;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  retry: () => Promise<void>;
  reset: () => void;
  formatTime: (timeInSeconds: number) => string;
  getBufferedRanges: () => TimeRanges | null;
  isReady: boolean;
  canPlay: boolean;
}

const DEFAULT_CONFIG: Required<AudioPlayerConfig> = {
  preload: "metadata",
  crossOrigin: "anonymous",
  autoRetry: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
  updateInterval: 250,
  bufferThreshold: 5,
};

export const useAudioPlayer = (
  audioUrl: string,
  config: AudioPlayerConfig = {},
): AudioPlayerHook => {
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  // Refs для управления аудио и состоянием
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef<boolean>(true);
  const lastUpdateTimeRef = useRef<number>(0);

  // Основное состояние плеера
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    isPaused: false,
    isLoading: true,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    buffered: 0,
    bufferHealth: 100,
    playbackRate: 1,
    error: null,
    retryCount: 0,
  });

  // Оптимизированное обновление состояния
  const updateState = useCallback((updates: Partial<AudioPlayerState>) => {
    if (!mountedRef.current) return;

    setState((prevState) => {
      const newState = { ...prevState, ...updates };

      // Оптимизация: не обновляем состояние если значения не изменились
      const hasChanges = Object.keys(updates).some(
        (key) =>
          prevState[key as keyof AudioPlayerState] !==
          newState[key as keyof AudioPlayerState],
      );

      return hasChanges ? newState : prevState;
    });
  }, []);

  // Расчет здоровья буфера
  const calculateBufferHealth = useCallback(
    (audio: HTMLAudioElement): number => {
      if (!audio.buffered.length) return 0;

      const currentTime = audio.currentTime;
      let bufferedAhead = 0;

      for (let i = 0; i < audio.buffered.length; i++) {
        const start = audio.buffered.start(i);
        const end = audio.buffered.end(i);

        if (currentTime >= start && currentTime <= end) {
          bufferedAhead = end - currentTime;
          break;
        }
      }

      return Math.min(100, (bufferedAhead / finalConfig.bufferThreshold) * 100);
    },
    [finalConfig.bufferThreshold],
  );

  // Оптимизированное обновление времени воспроизведения
  const updateTimeAndBuffer = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !mountedRef.current) return;

    const now = Date.now();
    if (now - lastUpdateTimeRef.current < finalConfig.updateInterval) return;

    const currentTime = audio.currentTime;
    const buffered = audio.buffered.length
      ? audio.buffered.end(audio.buffered.length - 1)
      : 0;
    const bufferHealth = calculateBufferHealth(audio);

    updateState({
      currentTime,
      buffered,
      bufferHealth,
      isBuffering:
        audio.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA && !audio.paused,
    });

    lastUpdateTimeRef.current = now;
  }, [finalConfig.updateInterval, calculateBufferHealth, updateState]);

  // Запуск периодического обновления
  const startTimeUpdates = useCallback(() => {
    if (updateIntervalRef.current) return;

    updateIntervalRef.current = setInterval(
      updateTimeAndBuffer,
      finalConfig.updateInterval,
    );
  }, [updateTimeAndBuffer, finalConfig.updateInterval]);

  // Остановка периодического обновления
  const stopTimeUpdates = useCallback(() => {
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, []);

  // Безопасное воспроизведение с retry логикой
  const play = useCallback(async (): Promise<void> => {
    const audio = audioRef.current;
    if (!audio || !mountedRef.current) return;

    // Отменяем предыдущий промис воспроизведения
    if (playPromiseRef.current) {
      try {
        await playPromiseRef.current;
      } catch (error) {
        // Игнорируем ошибки отмененного промиса
      }
    }

    try {
      if (audio.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        updateState({ isLoading: true });

        // Ждем готовности аудио
        await new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(
            () => reject(new Error("Audio load timeout")),
            10000,
          );

          const onCanPlay = () => {
            clearTimeout(timeoutId);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            resolve();
          };

          const onError = () => {
            clearTimeout(timeoutId);
            audio.removeEventListener("canplay", onCanPlay);
            audio.removeEventListener("error", onError);
            reject(new Error("Audio load failed"));
          };

          audio.addEventListener("canplay", onCanPlay);
          audio.addEventListener("error", onError);

          if (audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            onCanPlay();
          }
        });
      }

      updateState({ isLoading: false });

      if (audio.paused) {
        playPromiseRef.current = audio.play();
        await playPromiseRef.current;
        playPromiseRef.current = null;

        updateState({
          isPlaying: true,
          isPaused: false,
          error: null,
          retryCount: 0,
        });

        startTimeUpdates();
      }
    } catch (error: any) {
      playPromiseRef.current = null;

      if (error.name === "AbortError" || error.name === "NotAllowedError") {
        console.warn("Play request aborted or not allowed:", error.name);
        return;
      }

      console.error("Error playing audio:", error);

      // Retry логика
      if (
        finalConfig.autoRetry &&
        state.retryCount < finalConfig.maxRetryAttempts
      ) {
        const retryCount = state.retryCount + 1;
        updateState({ retryCount });

        console.log(
          `Retrying play attempt ${retryCount}/${finalConfig.maxRetryAttempts}`,
        );

        retryTimeoutRef.current = setTimeout(async () => {
          if (mountedRef.current) {
            await play();
          }
        }, finalConfig.retryDelay * retryCount);
      } else {
        updateState({
          error: error.message || "Playback failed",
          isPlaying: false,
          isPaused: true,
          isLoading: false,
        });
      }
    }
  }, [state.retryCount, finalConfig, updateState, startTimeUpdates]);

  // Пауза воспроизведения
  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !mountedRef.current) return;

    try {
      if (!audio.paused) {
        audio.pause();
      }

      playPromiseRef.current = null;
      stopTimeUpdates();

      updateState({
        isPlaying: false,
        isPaused: true,
        isBuffering: false,
      });
    } catch (error) {
      console.error("Error pausing audio:", error);
    }
  }, [updateState, stopTimeUpdates]);

  // Переключение воспроизведение/пауза
  const togglePlay = useCallback(async () => {
    if (state.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [state.isPlaying, play, pause]);

  // Перемотка
  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;
      if (!audio || !mountedRef.current) return;

      const clampedTime = Math.max(0, Math.min(time, audio.duration || 0));

      try {
        audio.currentTime = clampedTime;
        updateState({ currentTime: clampedTime });
      } catch (error) {
        console.error("Error seeking audio:", error);
      }
    },
    [updateState],
  );

  // Установка громкости
  const setVolume = useCallback(
    (volume: number) => {
      const audio = audioRef.current;
      if (!audio || !mountedRef.current) return;

      const clampedVolume = Math.max(0, Math.min(1, volume));

      try {
        audio.volume = clampedVolume;
        updateState({ volume: clampedVolume });
      } catch (error) {
        console.error("Error setting volume:", error);
      }
    },
    [updateState],
  );

  // Установка скорости воспроизведения
  const setPlaybackRate = useCallback(
    (rate: number) => {
      const audio = audioRef.current;
      if (!audio || !mountedRef.current) return;

      const clampedRate = Math.max(0.25, Math.min(4, rate));

      try {
        audio.playbackRate = clampedRate;
        updateState({ playbackRate: clampedRate });
      } catch (error) {
        console.error("Error setting playback rate:", error);
      }
    },
    [updateState],
  );

  // Повторная попытка воспроизведения
  const retry = useCallback(async () => {
    updateState({
      error: null,
      retryCount: 0,
      isLoading: true,
    });

    const audio = audioRef.current;
    if (audio) {
      audio.load();
      await play();
    }
  }, [updateState, play]);

  // Сброс состояния
  const reset = useCallback(() => {
    pause();

    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
    }

    updateState({
      currentTime: 0,
      error: null,
      retryCount: 0,
      isBuffering: false,
    });
  }, [pause, updateState]);

  // Форматирование времени
  const formatTime = useCallback((timeInSeconds: number): string => {
    if (isNaN(timeInSeconds) || !isFinite(timeInSeconds)) return "0:00";

    const totalSeconds = Math.floor(timeInSeconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }, []);

  // Получение буферизованных диапазонов
  const getBufferedRanges = useCallback((): TimeRanges | null => {
    const audio = audioRef.current;
    return audio ? audio.buffered : null;
  }, []);

  // Вычисляемые свойства
  const isReady = useMemo(() => {
    const audio = audioRef.current;
    return audio
      ? audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      : false;
  }, [state.currentTime]); // Используем currentTime как зависимость для периодического обновления

  const canPlay = useMemo(() => {
    const audio = audioRef.current;
    return audio
      ? audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA
      : false;
  }, [state.currentTime]);

  // Инициализация аудио элемента
  useEffect(() => {
    if (typeof window === "undefined" || !audioUrl) return;

    const audio = new Audio();
    audioRef.current = audio;

    // Настройка аудио элемента
    audio.preload = finalConfig.preload;
    audio.crossOrigin = finalConfig.crossOrigin;
    audio.src = audioUrl;

    // Обработчики событий
    const handleLoadedMetadata = () => {
      if (!mountedRef.current) return;
      updateState({
        duration: audio.duration,
        isLoading: false,
      });
    };

    const handleTimeUpdate = () => {
      updateTimeAndBuffer();
    };

    const handleEnded = () => {
      if (!mountedRef.current) return;
      stopTimeUpdates();
      updateState({
        isPlaying: false,
        isPaused: true,
        currentTime: 0,
      });
      audio.currentTime = 0;
    };

    const handlePlay = () => {
      if (!mountedRef.current) return;
      updateState({
        isPlaying: true,
        isPaused: false,
        error: null,
      });
    };

    const handlePause = () => {
      if (!mountedRef.current) return;
      updateState({
        isPlaying: false,
        isPaused: true,
      });
    };

    const handleWaiting = () => {
      if (!mountedRef.current) return;
      updateState({ isBuffering: true });
    };

    const handleCanPlay = () => {
      if (!mountedRef.current) return;
      updateState({
        isLoading: false,
        isBuffering: false,
      });
    };

    const handleError = (event: Event) => {
      if (!mountedRef.current) return;
      const error = audio.error;
      const errorMessage = error
        ? `Audio error: ${error.message} (Code: ${error.code})`
        : "Unknown audio error";

      console.error("Audio error:", errorMessage, event);
      updateState({
        error: errorMessage,
        isLoading: false,
        isPlaying: false,
        isPaused: true,
      });
    };

    const handleVolumeChange = () => {
      if (!mountedRef.current) return;
      updateState({ volume: audio.volume });
    };

    const handleRateChange = () => {
      if (!mountedRef.current) return;
      updateState({ playbackRate: audio.playbackRate });
    };

    // Добавление обработчиков
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);
    audio.addEventListener("volumechange", handleVolumeChange);
    audio.addEventListener("ratechange", handleRateChange);

    // Начальная загрузка
    audio.load();

    return () => {
      // Очистка
      stopTimeUpdates();

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Удаление обработчиков
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("volumechange", handleVolumeChange);
      audio.removeEventListener("ratechange", handleRateChange);

      // Очистка аудио
      audio.pause();
      audio.src = "";
      audio.load();

      audioRef.current = null;
    };
  }, [
    audioUrl,
    finalConfig,
    updateState,
    updateTimeAndBuffer,
    stopTimeUpdates,
  ]);

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopTimeUpdates();

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [stopTimeUpdates]);

  return {
    ...state,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    setPlaybackRate,
    retry,
    reset,
    formatTime,
    getBufferedRanges,
    isReady,
    canPlay,
  };
};

export default useAudioPlayer;
