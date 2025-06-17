"use client";

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { useVibeStore } from '@/app/stores/vibeStore';
import { useUser } from '@/app/context/user';
import { useGeneralStore } from '@/app/stores/general';
import Webcam from 'react-webcam';
import useDeviceDetect from '@/app/hooks/useDeviceDetect';
import useGeolocation from '@/app/hooks/useGeolocation';
import Image from 'next/image';
import {
  PhotoIcon,
  VideoCameraIcon,
  XMarkIcon,
  FaceSmileIcon,
  MapPinIcon,
  ArrowPathIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  CloudArrowUpIcon,
  TrashIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  PencilIcon,
  SparklesIcon,
  MusicalNoteIcon,
  CameraIcon,
  MicrophoneIcon,
  PaperAirplaneIcon,
  UserIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  MinusIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpTrayIcon,
  ArrowPathRoundedSquareIcon,
  ArrowTopRightOnSquareIcon,
  
  HandThumbDownIcon,
  HandThumbUpIcon,
  HashtagIcon,
  HomeIcon,
  
  WrenchIcon,
  WrenchScrewdriverIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { BiLoaderCircle } from 'react-icons/bi';
import { checkAppwriteConnection } from '@/libs/AppWriteClient';
import { BsVinyl, BsStars, BsCamera, BsCameraVideo } from 'react-icons/bs';

// Типы для временных компонентов
interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CropperStyle {
  containerStyle?: React.CSSProperties;
}

// Временная замена для модуля react-easy-crop
// Если он не установлен, мы создадим упрощенный компонент
const Cropper = ({ 
  image, 
  crop, 
  zoom, 
  aspect, 
  onCropChange, 
  onCropComplete, 
  onZoomChange, 
  cropShape, 
  showGrid, 
  style 
}: { 
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onCropComplete: (croppedArea: CropArea, croppedAreaPixels: CropArea) => void;
  onZoomChange: (zoom: number) => void;
  cropShape?: 'rect' | 'round';
  showGrid?: boolean;
  style?: CropperStyle;
}) => {
  // Это временная заглушка для компонента Cropper
  return (
    <div className="relative overflow-hidden rounded-xl" style={style?.containerStyle}>
      <img 
        src={image} 
        alt="Preview" 
        className="w-full h-full object-cover"
        style={{ 
          transform: `scale(${zoom}) translate(${-crop.x}px, ${-crop.y}px)`,
          transformOrigin: 'center',
          borderRadius: cropShape === 'round' ? '50%' : '0'
        }}
      />
    </div>
  );
};

// Временная замена для функции getCroppedImg
const getCroppedImg = async (imageSrc: string, pixelCrop: CropArea): Promise<string> => {
  // Простая заглушка, возвращающая исходное изображение
  return imageSrc;
};

// Кастомная функция для музыкальных тостов
const musicToast = {
  success: (message: string) => toast.success(message, {
    style: {
      background: '#1F2937',
      color: '#fff',
      borderRadius: '10px',
      border: '1px solid rgba(32, 221, 187, 0.3)'
    },
    iconTheme: {
      primary: '#20DDBB',
      secondary: '#1F2937',
    },
  }),
  error: (message: string) => toast.error(message, {
    style: {
      background: '#1F2937',
      color: '#fff',
      borderRadius: '10px',
      border: '1px solid rgba(239, 68, 68, 0.3)'
    },
    iconTheme: {
      primary: '#EF4444',
      secondary: '#1F2937',
    },
  }),
  info: (message: string) => toast(message, {
    icon: '🎵',
    style: {
      background: '#1F2937',
      color: '#fff',
      borderRadius: '10px',
      border: '1px solid rgba(59, 130, 246, 0.3)'
    },
  }),
};

type VibeType = 'photo' | 'video' | 'sticker';
type MoodType = 'Happy' | 'Excited' | 'Chill' | 'Creative' | 'Inspired' | 'Focused' | 'Relaxed' | '';
const VIBE_PHOTO_WIDTH = 450;
const VIBE_PHOTO_HEIGHT = 560;
const ASPECT_RATIO = VIBE_PHOTO_WIDTH / VIBE_PHOTO_HEIGHT;

// Интерфейсы для компонента Cropper
interface CropperProps {
  image: string;
  crop: { x: number; y: number };
  zoom: number;
  aspect: number;
  onCropChange: (crop: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onCropComplete: (croppedArea: CropArea, croppedAreaPixels: CropArea) => void;
  cropShape?: 'rect' | 'round';
  showGrid?: boolean;
  style?: { containerStyle?: React.CSSProperties };
}

interface VibeUploaderProps {
  onClose: () => void;
  onSuccess?: (vibeId: string) => void;
};

const tabButtonBase = 'flex flex-row items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 relative overflow-hidden group text-base font-bold min-w-[90px] h-12 shadow-xl border-2 border-[#4b3470] bg-[#2a2151] text-white hover:bg-[#3b2351] hover:border-[#7c4fd6]';

const TabButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (e?: React.MouseEvent) => void;
  isComingSoon?: boolean;
}> = ({ active, icon, label, onClick, isComingSoon }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.08, y: -2 }}
    whileTap={{ scale: 0.96, y: 0 }}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className={`${tabButtonBase} ${active ? ' ring-2 ring-[#ec4899]' : ''}`}
    style={{ minHeight: 48, letterSpacing: '0.01em', fontWeight: 600 }}
  >
    <span className="relative z-10 flex items-center text-xl">{icon}</span>
    <span className="relative z-10">{label}</span>
    {isComingSoon && (
      <div className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-[8px] font-semibold px-2 py-0.5 rounded-full shadow-lg">
        SOON
      </div>
    )}
  </motion.button>
);

const MoodChip: React.FC<{
  mood: string;
  selected: boolean;
  onClick: () => void;
}> = ({ mood, selected, onClick }) => (
  <button
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`px-3 py-3 rounded-full text-sm font-medium transition-all duration-200 h-11 ${
      selected
        ? 'bg-gradient-to-r from-[#3b82f6]/30 to-[#ec4899]/30 text-white border border-[#ec4899]/60'
        : 'bg-white/5 text-white/70 border border-white/10 hover:bg-white/10 hover:border-[#ec4899]/30 backdrop-blur-md'}
    `}
    style={{ minHeight: 44 }}
  >
    {mood}
  </button>
);

// Optimized motion variants that will be reused for better performance
const fadeInUpVariant = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

// Добавить новые стили для кнопок
const buttonStyles = {
  primary: "px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-[#20DDBB] to-[#018CFD] rounded-lg hover:opacity-90 transition-all shadow-lg shadow-[#20DDBB]/20 border border-[#20DDBB]/30 disabled:opacity-50 disabled:cursor-not-allowed",
  secondary: "px-6 py-3 text-sm font-medium text-white bg-white/10 rounded-lg hover:bg-white/20 transition-all border border-white/10 hover:border-white/30",
  icon: "p-2.5 text-gray-400 hover:text-white transition-colors rounded-full hover:bg-white/10 backdrop-blur-sm"
};

// Обновить стили для input и textarea
const inputStyles = "w-full px-4 py-3 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ec4899] transition-all border border-white/10 focus:border-[#ec4899]/30 shadow-[0_2px_12px_0_rgba(59,130,246,0.08)] backdrop-blur-md bg-[#2a2151]";

// Функция безопасного кропа, которая проверяет на null
const safeCropComplete = (
  currentCrop: CropArea, 
  croppedPixels: CropArea | null
) => {
  if (!croppedPixels) {
    musicToast.error('Failed to crop image');
    return;
  }
  
  // Здесь логика для применения кропа к изображению
  // ...
};

// Обработчик для кроппера изображений
const onCropComplete = (croppedArea: CropArea, croppedAreaPixels: CropArea) => {
  // Эта функция используется вне компонента, оставлена для совместимости
};

// Адаптер для Cropper компонента с правильными типами
const CropperAdapter = ({ 
  image, 
  crop, 
  zoom, 
  aspect, 
  onCropChange, 
  onCropComplete, 
  onZoomChange, 
  cropShape, 
  showGrid, 
  style 
}: CropperProps) => {
  // Безопасно преобразуем тип crop для компонента
  const handleCropChange = (newCrop: { x: number; y: number }) => {
    onCropChange({ ...crop, ...newCrop });
  };
  
  return (
    <Cropper
      image={image}
      crop={{ x: crop.x, y: crop.y }} 
      zoom={zoom}
      aspect={aspect}
      onCropChange={handleCropChange}
      onZoomChange={onZoomChange}
      onCropComplete={onCropComplete}
      cropShape={cropShape}
      showGrid={showGrid}
      style={style}
    />
  );
};

// Новый TabButton в стиле TopNav
const UploaderTabButton: React.FC<{
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: (e?: React.MouseEvent) => void;
}> = ({ active, icon, label, onClick }) => (
  <motion.button
    type="button"
    whileHover={{ scale: 1.07, boxShadow: "0 0 18px rgba(32,221,187,0.18)" }}
    whileTap={{ scale: 0.96 }}
    onClick={(e) => {
      e.preventDefault();
      onClick(e);
    }}
    className={`relative flex flex-col items-center justify-center h-[56px] px-4 rounded-full transition-all duration-300 font-medium text-sm mr-3 shadow-xl border ${active ? 'border-[#20DDBB]/60' : 'border-white/10'} ${active ? 'bg-gradient-to-r from-[#20DDBB]/30 to-[#3b82f6]/20' : 'bg-white/10'} text-white backdrop-blur-[18px]`}
    style={{ minHeight: 56, marginTop: 25, WebkitBackdropFilter: 'blur(18px) saturate(1.2)' }}
  >
    <span className="z-10 flex items-center justify-center mb-1" style={{ width: 18, height: 18 }}>
      {icon}
    </span>
    <span className="z-10 text-sm font-medium" style={{ letterSpacing: '0.01em' }}>{label}</span>
    {active && (
      <motion.div
        className="absolute inset-0 rounded-full border border-[#20DDBB]/40 pointer-events-none"
        initial={{ opacity: 0.8, scale: 1 }}
        animate={{ opacity: 0, scale: 1.5 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, repeat: Infinity }}
      />
    )}
  </motion.button>
);

export const VibeUploader: React.FC<VibeUploaderProps> = ({ onClose, onSuccess }) => {
  const { user } = useUser() || { user: null };
  const { createVibePost, isCreatingVibe } = useVibeStore();
  const { setIsLoginOpen } = useGeneralStore();
  const { isMobile } = useDeviceDetect();
  const { getCurrentLocation, locationName, isLoading: isLoadingLocation } = useGeolocation();
  
  const [selectedTab, setSelectedTab] = useState<VibeType>('photo');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedMood, setSelectedMood] = useState<MoodType>('');
  const [hasCamera, setHasCamera] = useState(false);
  const [useCameraMode, setUseCameraMode] = useState(false);
  const [webcamPermission, setWebcamPermission] = useState<boolean | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [isOptimizingImage, setIsOptimizingImage] = useState(false);
  const [cameraPermissionChecked, setCameraPermissionChecked] = useState(false);
  const [step, setStep] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const webcamRef = useRef<Webcam>(null);
  const formRef = useRef<HTMLDivElement>(null);
  
  // Fix for onCropComplete handler inside component
  const handleCropComplete = useCallback((croppedArea: CropArea, croppedAreaPixels: CropArea) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Check if camera is available only when needed
  const checkCameraAvailability = useCallback(() => {
    if (!cameraPermissionChecked && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(() => {
          setHasCamera(true);
          setCameraPermissionChecked(true);
        })
        .catch(() => {
          setHasCamera(false);
          setCameraPermissionChecked(true);
        });
    }
  }, [cameraPermissionChecked]);

  // Автоматически заполнить местоположение при открытии
  useEffect(() => {
    const detectLocation = async () => {
      try {
        setIsDetectingLocation(true);
        const placeName = await getCurrentLocation(true);
        if (placeName) {
          setLocation(placeName);
          musicToast.success('Location detected - your music scene is set!');
        }
      } catch (error) {
        console.log('Failed to detect location', error);
      } finally {
        setIsDetectingLocation(false);
      }
    };

    // Запускаем определение местоположения с небольшой задержкой
    const timer = setTimeout(() => {
      detectLocation();
    }, 500);

    return () => clearTimeout(timer);
  }, []);
  
  const handleTabChange = (tab: VibeType, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    setSelectedTab(tab);
    setPhotoFile(null);
    setPhotoPreview(null);
    setImagePreview(null);
    setSelectedFile(null);
    setUseCameraMode(false);
    setError(null);
  };
  
  const processAndOptimizeImage = async (file: File) => {
    try {
      setIsOptimizingImage(true);
      
      // Вместо оптимизации используем исходный файл
      console.log(`Using original file without optimization: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
      
      // Создаем URL для предпросмотра из оригинального файла
      const previewUrl = URL.createObjectURL(file);
      
      setPhotoFile(file);
      setPhotoPreview(previewUrl);
      
      musicToast.success('Image ready for upload');
      return file;
    } catch (error) {
      console.error('Failed to prepare image:', error);
      musicToast.error('Problem preparing image');
      
      // В случае ошибки также используем оригинальный файл
      const previewUrl = URL.createObjectURL(file);
      setPhotoFile(file);
      setPhotoPreview(previewUrl);
      
      return file;
    } finally {
      setIsOptimizingImage(false);
    }
  };
  
  // 1. Проверка длительности видео при выборе файла
  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        const duration = video.duration;
        if (duration > 480) {
          setError('Video duration exceeds 8 minutes limit');
          resolve(false);
        } else {
          resolve(true);
        }
      };
      video.onerror = () => {
        setError('Could not read video duration');
        resolve(false);
      };
      video.src = url;
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (selectedTab === 'photo') {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPhotoFile(file);
    } else if (selectedTab === 'video') {
      if (!file.type.startsWith('video/')) {
        setError('Please select a video file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100MB limit');
        return;
      }
      const isValid = await checkVideoDuration(file);
      if (!isValid) return;
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };
  
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setError(null);
    if (selectedTab === 'photo') {
      if (!file.type.startsWith('image/')) {
        setError('Please drop an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds 5MB limit');
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPhotoFile(file);
    } else if (selectedTab === 'video') {
      if (!file.type.startsWith('video/')) {
        setError('Please drop a video file');
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        setError('File size exceeds 100MB limit');
        return;
      }
      const isValid = await checkVideoDuration(file);
      if (!isValid) return;
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setPhotoFile(file);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleCapturePhoto = useCallback(async () => {
    if (!webcamRef.current) return;
    
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    
    // Временно устанавливаем превью, чтобы показать пользователю что фото сделано
    setPhotoPreview(imageSrc);
    
    // Convert base64 to file
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
      
      // Используем оригинальный файл без оптимизации
      setPhotoFile(file);
      console.log(`Using original camera file: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
      musicToast.success('Camera image captured');
    } catch (error) {
      console.error('Error converting webcam image:', error);
      musicToast.error('Failed to process captured image');
    }
      
  }, [webcamRef]);
  
  const handleDetectLocation = async (e?: React.MouseEvent) => {
    // Предотвращаем отправку формы, если это событие клика
    if (e) {
      e.preventDefault();
    }
    
    try {
      toast.loading('Getting your location...');
      const placeName = await getCurrentLocation(true);
      
      if (placeName) {
        setLocation(placeName);
        toast.success('Location detected!');
      } else {
        toast.error('Could not detect location');
      }
    } catch (error) {
      console.warn('Location detection failed:', error);
      toast.error('Location detection failed');
    } finally {
      toast.dismiss();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!user || !user.id) {
        musicToast.error('You need to be logged in to publish a vibe!');
        console.error('User not authorized:', user);
        return;
      }
      if (selectedTab === 'sticker') {
        musicToast.info('🎵 Musical Sticker Vibes - Coming Soon! Express your musical emotions with animated stickers in the next update!');
        return;
      }
      if ((selectedTab === 'photo' || selectedTab === 'video') && !photoFile && !caption.trim()) {
        musicToast.error('Please add a file or write some text for your vibe!');
        return;
      }
      setIsLoading(true);
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.floor(Math.random() * 10) + 1;
        });
      }, 300);
      try {
        const connectionStatus = await checkAppwriteConnection();
        if (!connectionStatus.connected || !connectionStatus.storageValid) {
          throw new Error('Cannot connect to Appwrite storage service. Please try again later.');
        }
        if (!connectionStatus.sessionValid) {
          musicToast.info('Your session might have expired. Please log in again if upload fails.');
        }
      } catch (connectionError) {
        console.error('Error checking Appwrite connection:', connectionError);
      }
      let vibeId: string = '';
      if (selectedTab === 'photo' || selectedTab === 'video') {
        if (!user.id) {
          musicToast.error('Could not determine your user ID. Please log in again.');
          clearInterval(progressInterval);
          setIsLoading(false);
          setUploadProgress(0);
          return;
        }
        try {
          if (photoFile) {
            if (!(photoFile instanceof File) || photoFile.size === 0) {
              musicToast.error('Invalid file for upload');
              clearInterval(progressInterval);
              setIsLoading(false);
              setUploadProgress(0);
              return;
            }
          }
          const result = await createVibePost({
            user_id: user.id,
            type: selectedTab,
            media: photoFile || undefined,
            caption,
            mood: selectedMood,
            location,
            tags: [],
          });
          vibeId = result || '';
          setUploadProgress(100);
          setTimeout(() => {
            clearInterval(progressInterval);
            musicToast.success('Your musical vibe has been published! 🎵');
            if (onSuccess && vibeId) onSuccess(vibeId);
            setTimeout(() => onClose(), 800);
          }, 500);
        } catch (createError: any) {
          clearInterval(progressInterval);
          setIsLoading(false);
          setUploadProgress(0);
          musicToast.error('Failed to publish vibe. Please try again later.');
        }
      }
    } catch (error) {
      console.error('General error when publishing vibe:', error);
      musicToast.error('Your musical masterpiece could not be published. Let\'s try again!');
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentTag.trim()) {
      if (tags.length >= 5) {
        toast.error('Maximum 5 tags allowed', {
          style: {
            background: 'linear-gradient(to right, #2A2151, #1E1A36)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 12px rgba(88, 28, 135, 0.15)',
            padding: '12px 16px',
            borderRadius: '12px',
          },
          icon: '🎤',
        });
        return;
      }
      setTags([...tags, currentTag.trim()]);
      setCurrentTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Проверка на валидность формы для активации кнопки
  useEffect(() => {
    if (selectedTab === 'photo') {
      const hasImage = selectedFile && selectedFile.type.startsWith('image/');
      const hasCaption = caption ? caption.trim().length > 0 : false;
      setIsValid(!!hasImage || hasCaption);
    } else if (selectedTab === 'video') {
      const hasVideo = selectedFile && selectedFile.type.startsWith('video/');
      const hasCaption = caption ? caption.trim().length > 0 : false;
      setIsValid(!!hasVideo || hasCaption);
    }
  }, [selectedFile, imagePreview, photoFile, caption, selectedTab]);

  // Теперь объявляю renderGlassShareButton:
  const renderGlassShareButton = () => (
    <motion.button
      type="submit"
      disabled={!isValid || isLoading}
      className="fixed left-1/2 bottom-6 z-50 -translate-x-1/2 px-6 py-3 rounded-2xl font-semibold text-base flex items-center gap-2 transition-all duration-200 shadow-xl hover:scale-105 cursor-pointer"
      style={{
        background: 'linear-gradient(90deg, rgba(32,221,187,0.85) 0%, rgba(1,140,253,0.85) 100%)',
        color: '#fff',
        boxShadow: '0 8px 32px 0 rgba(32,221,187,0.18)',
        border: 'none',
        fontWeight: 500,
        letterSpacing: '0.01em',
        fontSize: '1rem',
        backdropFilter: 'blur(24px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(24px) saturate(1.2)',
        opacity: isValid && !isLoading ? 1 : 0.7,
      }}
      whileHover={isValid && !isLoading ? { scale: 1.08 } : {}}
      whileTap={isValid && !isLoading ? { scale: 0.97 } : {}}
      onClick={(e) => {
        e.preventDefault();
        if (isValid && !isLoading) handleSubmit(e as any);
      }}
    >
      {isLoading ? (
        <>
          <motion.div
            className="mr-2"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </motion.div>
          <span className="tracking-wide">Sharing Vibe...</span>
        </>
      ) : (
        <>
          <span className="tracking-wide">Share Your Vibe</span>
          <PaperAirplaneIcon className="w-5 h-5 ml-1" />
        </>
      )}
    </motion.button>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'photo':
        return (
          <div className="px-[5px] pt-2 pb-2">
            <form onSubmit={(e) => { 
                e.preventDefault(); 
                handleSubmit(e); 
              }} 
              className="space-y-3">
            {/* Image Upload Area */}
            <div
              className={`relative w-full h-64 rounded-2xl border-2 border-dashed transition-colors duration-200 px-[5px] flex flex-col justify-center items-center bg-[#2a2151]`
                + (isDragging ? ' border-primary bg-primary/10' : ' border-gray-300 hover:border-primary')}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Processing image...</span>
                  </div>
                ) : imagePreview ? (
                  <div className="relative w-full h-full">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded-2xl"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImagePreview(null); setSelectedFile(null); }}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <PhotoIcon className="w-14 h-14 text-[#3b82f6]" />
                    <div className="text-base text-white font-semibold">Drag and drop an image here, or <span className="text-[#ec4899] font-bold">click to select</span></div>
                    <div className="text-xs text-gray-400">JPG, PNG, WebP (max 5MB)</div>
                  </div>
                )}
              </div>
            </div>

            {/* Mood Selection */}
            <div className="space-y-2 px-[5px]">
              <div className="flex items-center space-x-2">
                <FaceSmileIcon className="w-5 h-5 text-[#20DDBB]" />
                <span className="text-white font-medium">How are you feeling?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Happy', 'Excited', 'Chill', 'Creative', 'Inspired', 'Focused', 'Relaxed'].map((mood) => (
                  <MoodChip
                    key={mood}
                    mood={mood as MoodType}
                    selected={selectedMood === mood}
                    onClick={() => {
                      // Просто устанавливаем настроение, но не отправляем форму
                      setSelectedMood(mood as MoodType);
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Caption Input */}
            <div className="relative px-[5px]">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Share your musical thoughts..."
                className={inputStyles}
                rows={3}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {caption.length}/500
              </div>
            </div>

            {/* Location */}
            <div className="space-y-2 px-[5px]">
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-5 h-5 text-[#20DDBB]" />
                <span className="text-white font-medium">Add Location</span>
              </div>
              <div className="flex items-center space-x-2">
                {location ? (
                  <div className="flex-1 flex items-center bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10 overflow-hidden">
                    <MapPinIcon className="w-4 h-4 text-[#20DDBB] mr-2 flex-shrink-0" />
                    <span className="text-gray-200 text-sm truncate max-w-[70vw] md:max-w-[300px] whitespace-nowrap overflow-hidden text-ellipsis">{location}</span>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setLocation('')}
                      className="ml-auto p-1 text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleDetectLocation(e)}
                    disabled={isDetectingLocation}
                    className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors rounded-lg px-4 py-3 border border-white/10 hover:border-[#20DDBB]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetectingLocation ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <ArrowPathIcon className="w-4 h-4 text-[#20DDBB]" />
                        </motion.div>
                        <span className="text-gray-300">Detecting location...</span>
                      </>
                    ) : (
                      <>
                        <MapPinIcon className="w-4 h-4 text-[#20DDBB] mr-2" />
                        <span className="text-gray-300">Detect my location</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </form>
        </div>
      );
    
    case 'video':
      return (
        <div className="px-[5px] pt-2 pb-2">
          <form onSubmit={(e) => { 
              e.preventDefault(); 
              handleSubmit(e); 
            }} 
            className="space-y-3">
            {/* Video Upload Area */}
            <div
              className={`relative w-full h-64 rounded-2xl border-2 border-dashed transition-colors duration-200 px-[5px] flex flex-col justify-center items-center bg-[#2a2151]`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
              }}
              onDrop={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (!file) return;
                setError(null);
                if (!file.type.startsWith('video/')) {
                  setError('Please drop a video file');
                  return;
                }
                if (file.size > 100 * 1024 * 1024) {
                  setError('File size exceeds 100MB limit');
                  return;
                }
                const isValid = await checkVideoDuration(file);
                if (!isValid) return;
                setSelectedFile(file);
                setImagePreview(URL.createObjectURL(file));
                setPhotoFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="video/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setError(null);
                  if (!file.type.startsWith('video/')) {
                    setError('Please select a video file');
                    return;
                  }
                  if (file.size > 100 * 1024 * 1024) {
                    setError('File size exceeds 100MB limit');
                    return;
                  }
                  const isValid = await checkVideoDuration(file);
                  if (!isValid) return;
                  setSelectedFile(file);
                  setImagePreview(URL.createObjectURL(file));
                  setPhotoFile(file);
                }}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                {isLoading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Processing video...</span>
                  </div>
                ) : imagePreview ? (
                  <div className="relative w-full h-full flex flex-col items-center justify-center">
                    <video
                      src={imagePreview}
                      controls
                      className="w-full h-full object-contain rounded-2xl max-h-60"
                    />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImagePreview(null); setSelectedFile(null); setPhotoFile(null); }}
                      className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-center">
                    <VideoCameraIcon className="w-14 h-14 text-[#3b82f6]" />
                    <div className="text-base text-white font-semibold">Drag and drop a video here, or <span className="text-[#ec4899] font-bold">click to select</span></div>
                    <div className="text-xs text-gray-400">MP4, WebM, MOV (max 100MB)</div>
                  </div>
                )}
              </div>
            </div>
            {/* Caption Input */}
            <div className="relative px-[5px]">
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Describe your video vibe..."
                className={inputStyles}
                rows={3}
              />
              <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                {caption.length}/500
              </div>
            </div>
            {/* Mood Selection */}
            <div className="space-y-2 px-[5px]">
              <div className="flex items-center space-x-2">
                <FaceSmileIcon className="w-5 h-5 text-[#20DDBB]" />
                <span className="text-white font-medium">How are you feeling?</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Happy', 'Excited', 'Chill', 'Creative', 'Inspired', 'Focused', 'Relaxed'].map((mood) => (
                  <MoodChip
                    key={mood}
                    mood={mood as MoodType}
                    selected={selectedMood === mood}
                    onClick={() => setSelectedMood(mood as MoodType)}
                  />
                ))}
              </div>
            </div>
            {/* Location */}
            <div className="space-y-2 px-[5px]">
              <div className="flex items-center space-x-2">
                <MapPinIcon className="w-5 h-5 text-[#20DDBB]" />
                <span className="text-white font-medium">Add Location</span>
              </div>
              <div className="flex items-center space-x-2">
                {location ? (
                  <div className="flex-1 flex items-center bg-white/5 backdrop-blur-sm rounded-lg px-4 py-3 border border-white/10 overflow-hidden">
                    <MapPinIcon className="w-4 h-4 text-[#20DDBB] mr-2 flex-shrink-0" />
                    <span className="text-gray-200 text-sm truncate max-w-[70vw] md:max-w-[300px] whitespace-nowrap overflow-hidden text-ellipsis">{location}</span>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setLocation('')}
                      className="ml-auto p-1 text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </motion.button>
                  </div>
                ) : (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => handleDetectLocation(e)}
                    disabled={isDetectingLocation}
                    className="flex-1 flex items-center justify-center bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors rounded-lg px-4 py-3 border border-white/10 hover:border-[#20DDBB]/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDetectingLocation ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="mr-2"
                        >
                          <ArrowPathIcon className="w-4 h-4 text-[#20DDBB]" />
                        </motion.div>
                        <span className="text-gray-300">Detecting location...</span>
                      </>
                    ) : (
                      <>
                        <MapPinIcon className="w-4 h-4 text-[#20DDBB] mr-2" />
                        <span className="text-gray-300">Detect my location</span>
                      </>
                    )}
                  </motion.button>
                )}
              </div>
            </div>
          </form>
        </div>
      );
    
    case 'sticker':
      return (
        <div className="py-12 px-4">
          {/* Улучшенный UI для функции в разработке */}
          <div className="relative bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-sm rounded-xl p-8 text-center shadow-lg border border-white/10 overflow-hidden">
            {/* Бейдж "Скоро" */}
            <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
              COMING SOON
            </div>
            
            {/* Графический элемент для фона */}
            <div className="absolute inset-0 overflow-hidden opacity-10">
              <div className="absolute -right-28 -bottom-28 w-96 h-96 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 blur-3xl"></div>
              <div className="absolute -left-28 -top-28 w-96 h-96 rounded-full bg-gradient-to-r from-[#20DDBB] to-[#018CFD] blur-3xl"></div>
            </div>
            
            {/* Содержимое */}
            <div className="relative z-10">
              <div className="relative w-24 h-24 mx-auto mb-6 bg-white/5 rounded-full flex items-center justify-center">
                <FaceSmileIcon className="h-12 w-12 text-[#20DDBB]" />
                <div className="absolute inset-0 border-4 border-white/10 rounded-full"></div>
              </div>
              
              <h3 className="text-white text-2xl font-bold mb-4">Musical Sticker Vibes</h3>
              
              <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Express your musical emotions with animated stickers - from guitar riffs to drum solos.
                Our design team is creating a unique collection of music-themed stickers for you to share!
              </p>
              
              <div className="inline-flex items-center bg-gradient-to-r from-[#20DDBB]/10 to-[#018CFD]/10 border border-[#20DDBB]/30 text-[#20DDBB] px-6 py-3 rounded-full">
                <SparklesIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">Coming in the next update</span>
              </div>
              
              {/* Индикатор прогресса разработки */}
              <div className="mt-8">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <span>Development progress</span>
                  <span>60%</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-[#20DDBB] to-[#018CFD] w-3/5"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    
    default:
      return null;
  }
};
  
  if (!user) {
    return (
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-gradient-to-br from-[#2A2151] to-[#1E1A36] rounded-2xl max-w-md w-full p-8 text-center border border-white/10 shadow-xl"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-white text-2xl font-bold mb-4">Sign In Required</h3>
          <p className="text-gray-300 mb-8">
            You need to be signed in to share your vibe.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 8px 20px rgba(167, 139, 250, 0.3)" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsLoginOpen(true)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-medium shadow-lg shadow-purple-600/20"
          >
            Sign In
          </motion.button>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div 
      className={`modal-overlay flex items-center justify-center overflow-y-auto ${isMobile ? 'fixed inset-0 w-full h-full bg-black/80 z-[99999] rounded-none p-0' : 'fixed inset-0 z-[99999]'}`}
      style={{ zIndex: 99999 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* 1. Подложка под модальным окном: bg-black/70 + backdrop-blur-2xl всегда */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-2xl" style={{ zIndex: 99998 }} />
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className={`relative ${isMobile ? 'w-full p-0 rounded-none min-h-screen max-h-screen' : 'w-[95%] max-w-[500px] mx-auto rounded-2xl'} border border-white/10 shadow-2xl overflow-hidden`}
        style={{
          padding: 5,
          minHeight: isMobile ? '100vh' : undefined,
          maxHeight: isMobile ? '100vh' : '96vh',
          background: 'linear-gradient(120deg, #24143a 0%, #2a2151 100%)',
          backdropFilter: 'blur(36px) saturate(1.25)',
          WebkitBackdropFilter: 'blur(36px) saturate(1.25)',
          zIndex: 99999,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 2. Кнопка закрытия светлая */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[100] w-12 h-12 flex items-center justify-center rounded-full bg-white/30 text-black/80 hover:bg-white/60 hover:text-black transition duration-200 shadow-xl"
          style={{ fontSize: 26 }}
          aria-label="Close"
        >
          <XMarkIcon className="w-7 h-7" />
        </button>
        {/* Form content */}
        <div className={`pt-2 pb-2 px-1 flex items-center space-x-4 ${isMobile ? 'justify-start' : 'justify-center'} mt-[25px]`}>
          <UploaderTabButton
            active={selectedTab === 'photo'}
            icon={<BsCamera className="w-[18px] h-[18px] text-[#20DDBB]" />}
            label="Photo"
            onClick={(e) => handleTabChange('photo', e)}
          />
          <UploaderTabButton
            active={selectedTab === 'video'}
            icon={<BsCameraVideo className="w-[18px] h-[18px] text-[#3b82f6]" />}
            label="Vibe"
            onClick={(e) => handleTabChange('video', e)}
          />
          {isMobile && (
            <UploaderTabButton
              active={useCameraMode}
              icon={<BsCamera className="w-[18px] h-[18px] text-[#20DDBB]" />}
              label="Selfie"
              onClick={() => { setUseCameraMode(true); checkCameraAvailability(); }}
            />
          )}
        </div>
        {/* Content */}
        <div className="pt-1 pb-1 px-1 overflow-y-auto max-h-[calc(90vh-120px)]">
          {renderTabContent()}
        </div>
        {/* Фиксированная главная кнопка Share Vibe */}
        {user && (selectedTab === 'photo' || selectedTab === 'video') && (
          <motion.button
            type="submit"
            disabled={!isValid || isLoading}
            className={`${isMobile ? 'fixed left-1/2 bottom-6 z-50 -translate-x-1/2' : 'mt-8 w-full'} px-8 py-4 rounded-full font-semibold text-lg flex items-center gap-3 transition-all duration-200 shadow-2xl hover:scale-105 cursor-pointer border border-[#20DDBB]/40 bg-gradient-to-r from-[#20DDBB]/30 to-[#3b82f6]/20 text-white backdrop-blur-[18px]`}
            style={{
              color: '#fff',
              fontWeight: 800,
              letterSpacing: '0.01em',
              fontSize: '1.15rem',
              WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
              opacity: 1,
            }}
            whileHover={isValid && !isLoading ? { scale: 1.08 } : {}}
            whileTap={isValid && !isLoading ? { scale: 0.97 } : {}}
            onClick={(e) => {
              e.preventDefault();
              if (isValid && !isLoading) handleSubmit(e as any);
            }}
          >
            {isLoading ? (
              <>
                <motion.div
                  className="mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                >
                  <ArrowPathIcon className="w-5 h-5" />
                </motion.div>
                <span className="tracking-wide">Vibing...</span>
              </>
            ) : (
              <>
                <span className="tracking-wide">Vibe it</span>
                <PaperAirplaneIcon className="w-5 h-5 ml-1" />
              </>
            )}
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default VibeUploader; 