import { useEffect, useState } from "react";
import { useUser } from "@/app/context/user";
import { database, Query } from "@/libs/AppWriteClient";
import useCreateBucketUrl from "@/app/hooks/useCreateBucketUrl";
import {
  BsFillPlayFill,
  BsPauseFill,
  BsDownload,
  BsCalendar3,
} from "react-icons/bs";
import { usePlayerContext } from "@/app/context/playerContext";
import { FiDownload, FiPlay, FiPause } from "react-icons/fi";
import {
  FaPlay,
  FaPause,
  FaDownload,
  FaMusic,
  FaCalendarAlt,
} from "react-icons/fa";
import { Models } from "appwrite";
import { AudioPlayer } from "@/app/components/AudioPlayer";
import { toast } from "react-hot-toast";
import { TbLoader } from "react-icons/tb";
import { motion, AnimatePresence } from "framer-motion";
import EmptyPurchasesSkeleton from "./EmptyPurchasesSkeleton";
import useGetProfileByUserId from "@/app/hooks/useGetProfileByUserId";
import Link from "next/link";
import Image from "next/image";

interface TrackData {
  $id: string;
  user_id: string;
  created_at: string;
  audio_url: string;
  wav_url: string;
  trackname: string;
  image_url: string;
  price: number;
  mp3_url: string;
  genre: string;
  m3u8_url: string;
  profile: {
    name: string;
    image: string;
    display_name?: string;
  };
}

interface Purchase {
  $id: string;
  user_id: string;
  track_id: string;
  author_id: string;
  purchase_date: string;
  amount: string;
  track?: TrackData;
  authorProfile?: {
    name: string;
    image: string;
  };
}

const ITEMS_PER_PAGE = 10;

export default function PurchasedTracks() {
  const userContext = useUser();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const { currentAudioId, setCurrentAudioId } = usePlayerContext();
  const [isPlaying, setIsPlaying] = useState<{ [key: string]: boolean }>({});
  const [downloadingFiles, setDownloadingFiles] = useState<{
    [key: string]: string;
  }>({});

  // Проверяем, просматривает ли пользователь свой собственный профиль
  const isOwner = Boolean(userContext?.user);

  const fetchPurchasedTracks = async (currentPage: number) => {
    if (!userContext?.user?.id) return;

    try {
      setLoading(true);

      // 1. Get paginated purchases for current user
      const purchasesResponse = await database.listDocuments(
        String(process.env.NEXT_PUBLIC_DATABASE_ID),
        String(process.env.NEXT_PUBLIC_COLLECTION_ID_PURCHASES),
        [
          Query.equal("user_id", userContext.user.id),
          Query.orderDesc("purchase_date"),
          Query.limit(ITEMS_PER_PAGE),
          Query.offset(currentPage * ITEMS_PER_PAGE),
        ],
      );

      // Check if we have more items to load
      setHasMore(purchasesResponse.documents.length === ITEMS_PER_PAGE);

      // Get array of track_ids from purchases
      const trackIds = purchasesResponse.documents.map(
        (purchase) => purchase.track_id,
      );

      // Collect all author_ids for profile fetching
      const authorIds = purchasesResponse.documents.map(
        (purchase) => purchase.author_id,
      );

      console.log("Fetching profiles for author IDs:", authorIds);

      // 2. Get all tracks in one query
      const tracksResponse = await database.listDocuments(
        String(process.env.NEXT_PUBLIC_DATABASE_ID),
        String(process.env.NEXT_PUBLIC_COLLECTION_ID_POST),
        [Query.equal("$id", trackIds)],
      );

      console.log("Tracks response:", tracksResponse.documents);

      // Create a map of tracks for quick access
      const tracksMap = new Map(
        tracksResponse.documents.map((track) => {
          // Ensure track has profile data
          const trackWithDefaults = {
            ...track,
            profile: track.profile || {
              name: "Unknown User",
              image: null,
            },
          };
          return [track.$id, trackWithDefaults];
        }),
      );

      // 3. Fetch author profiles in one batch query
      // Изменим подход и запросим каждый профиль по отдельности
      // Это может решить проблему, если запрос по массиву ID работает некорректно
      console.log("Using individual profile fetch approach");

      // Создаем массив промисов для запроса каждого профиля
      const profilePromises = authorIds.map(async (authorId) => {
        try {
          console.log(`Fetching profile for author ID: ${authorId}`);

          // Пробуем найти профиль по user_id
          let response = await database.listDocuments(
            String(process.env.NEXT_PUBLIC_DATABASE_ID),
            String(process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE),
            [Query.equal("user_id", authorId)],
          );

          // Если не нашли по user_id, попробуем по id
          if (response.documents.length === 0) {
            console.log(
              `No profile found by user_id for author ID: ${authorId}, trying to find by id`,
            );
            response = await database.listDocuments(
              String(process.env.NEXT_PUBLIC_DATABASE_ID),
              String(process.env.NEXT_PUBLIC_COLLECTION_ID_PROFILE),
              [Query.equal("id", authorId)],
            );
          }

          console.log(
            `For author ID ${authorId}, found ${response.documents.length} profiles`,
          );

          // Возвращаем первый профиль, если найден
          if (response.documents.length > 0) {
            console.log(
              `Profile for author ID ${authorId}:`,
              response.documents[0],
            );
            return response.documents[0];
          }

          console.log(
            `No profile found for author ID: ${authorId} (tried both user_id and id fields)`,
          );
          return null;
        } catch (error) {
          console.error(
            `Error fetching profile for author ID: ${authorId}`,
            error,
          );
          return null;
        }
      });

      // Ждем завершения всех запросов
      const profileResults = await Promise.all(profilePromises);

      // Фильтруем null значения и создаем новый массив профилей
      const authorProfiles = profileResults.filter(
        (profile): profile is NonNullable<typeof profile> => profile !== null,
      );

      console.log("Individual profile fetch results:", authorProfiles);

      // Создаем карту профилей как раньше
      const authorProfilesMap = new Map(
        authorProfiles.map((profile) => [
          profile.user_id,
          {
            // Используем только name, без display_name
            name: profile.name || "Unknown User",
            image: profile.image || profile.banner_image || null,
          },
        ]),
      );

      // 4. Combine purchases with their corresponding tracks and author profiles
      const purchasesWithTracks = purchasesResponse.documents.map(
        (purchase: Models.Document) => {
          const track = tracksMap.get(purchase.track_id);
          const authorProfile = authorProfilesMap.get(purchase.author_id);

          // Log details about this purchase for debugging
          console.log(
            `Processing purchase: ${purchase.$id}, author_id: ${purchase.author_id}`,
          );
          console.log(`Found authorProfile:`, authorProfile);

          // Создаем объект Purchase с правильными типами
          const purchaseObj: Purchase = {
            $id: purchase.$id,
            user_id: purchase.user_id,
            track_id: purchase.track_id,
            author_id: purchase.author_id,
            purchase_date: purchase.purchase_date,
            amount: purchase.amount,
            track: track
              ? ({
                  ...track,
                  profile: track.profile || {
                    name: "Unknown User",
                    image: null,
                  },
                } as unknown as TrackData)
              : undefined,
            authorProfile: authorProfile || {
              name: "Unknown User",
              image: null,
            },
          };

          return purchaseObj;
        },
      );

      // Append new purchases to existing ones when loading more
      setPurchases((prev) =>
        currentPage === 0
          ? purchasesWithTracks
          : [...prev, ...purchasesWithTracks],
      );
    } catch (error) {
      console.error("Error in fetchPurchasedTracks:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPurchasedTracks(0);
  }, [userContext?.user?.id]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPurchasedTracks(nextPage);
    }
  };

  const handleDownloadFormat = async (
    trackId: string,
    url: string,
    trackName: string,
    format: string,
  ) => {
    try {
      // Устанавливаем состояние загрузки
      setDownloadingFiles((prev) => ({ ...prev, [trackId]: format }));

      const response = await fetch(useCreateBucketUrl(url));
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${trackName}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      // Сбрасываем состояние загрузки
      setDownloadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[trackId];
        return newState;
      });

      // Показываем уведомление об успешной загрузке
      toast.success(`${trackName}.${format} successfully downloaded`, {
        duration: 3000,
        style: {
          background: "#1E2136",
          color: "#fff",
          border: "1px solid #20DDBB",
        },
        icon: "✅",
      });
    } catch (error) {
      // Сбрасываем состояние загрузки при ошибке
      setDownloadingFiles((prev) => {
        const newState = { ...prev };
        delete newState[trackId];
        return newState;
      });

      console.error(`Error downloading ${format} track:`, error);

      // Показываем уведомление об ошибке
      toast.error(`Error downloading ${format} file. Please try again.`, {
        duration: 4000,
        style: {
          background: "#1E2136",
          color: "#fff",
          border: "1px solid #ff5555",
        },
        icon: "❌",
      });
    }
  };

  // Показываем скелетон во время загрузки
  if (loading && purchases.length === 0) {
    return (
      <div className="w-full max-w-[1500px] mx-auto py-6">
        <div className="grid gap-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-[#1E2136] rounded-2xl overflow-hidden w-full max-w-[400px] mx-auto"
            >
              {/* Header skeleton */}
              <div className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#2D2D44] animate-pulse"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[#2D2D44] rounded-lg w-32 animate-pulse"></div>
                    <div className="h-3 bg-[#2D2D44] rounded-lg w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Image skeleton */}
              <div className="relative w-full">
                <div className="w-full aspect-[4/3] bg-[#2D2D44] animate-pulse">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                      className="w-12 h-12 text-[#3D3D54] animate-spin"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Audio player skeleton */}
              <div className="px-3 py-2">
                <div className="h-10 bg-[#2D2D44] rounded-lg animate-pulse"></div>
              </div>

              {/* Info and buttons skeleton */}
              <div className="p-3 flex justify-between items-center">
                <div className="space-y-2">
                  <div className="h-3 bg-[#2D2D44] rounded-lg w-36 animate-pulse"></div>
                  <div className="h-3 bg-[#2D2D44] rounded-lg w-24 animate-pulse"></div>
                  <div className="h-3 bg-[#2D2D44] rounded-lg w-28 animate-pulse"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-16 h-8 bg-[#2D2D44] rounded-lg animate-pulse"></div>
                  <div className="w-16 h-8 bg-[#2D2D44] rounded-lg animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Показываем скелетон пустого состояния, когда загрузка завершена, но покупок нет
  if (!loading && purchases.length === 0) {
    return <EmptyPurchasesSkeleton isOwner={isOwner} />;
  }

  return (
    <div className="w-full max-w-[1500px] mx-auto py-3 overflow-auto pb-20">
      <div className="grid gap-4 mx-auto px-0 md:max-w-[400px] purchases-grid-mobile">
        {purchases.map((purchase) =>
          purchase.track ? (
            <div
              key={purchase.$id}
              className="bg-[#1E2136] rounded-xl overflow-hidden w-full shadow-lg border border-[#3f2d63]/20 hover:border-[#3f2d63]/50 transition-all"
            >
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <img
                    className="w-10 h-10 rounded-full object-cover border border-[#3f2d63]/50"
                    src={
                      purchase.authorProfile?.image
                        ? useCreateBucketUrl(purchase.authorProfile.image)
                        : "/images/placeholders/user-placeholder.svg"
                    }
                    alt={purchase.authorProfile?.name || "Artist"}
                  />
                  <div>
                    <p className="text-white font-medium text-sm">
                      {purchase.authorProfile?.name &&
                      purchase.authorProfile.name !== "Unknown User"
                        ? purchase.authorProfile.name
                        : purchase.track?.profile?.name &&
                            purchase.track.profile.name !== "Unknown User"
                          ? purchase.track.profile.name
                          : "Unknown User"}
                    </p>
                    <p className="text-[#818BAC] text-xs">
                      {purchase.track?.trackname || "Untitled Track"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative w-full">
                <div
                  className="w-full aspect-[1/1] bg-cover bg-center"
                  style={{
                    backgroundImage: purchase.track?.image_url
                      ? `url(${useCreateBucketUrl(purchase.track.image_url)})`
                      : "linear-gradient(45deg, #2E2469, #351E43)",
                  }}
                ></div>
              </div>

              <div className="px-3 py-2 w-full">
                {purchase.track?.m3u8_url && (
                  <AudioPlayer
                    m3u8Url={useCreateBucketUrl(purchase.track.m3u8_url)}
                    isPlaying={isPlaying[purchase.track_id] || false}
                    onPlay={() =>
                      setIsPlaying((prev) => ({
                        ...prev,
                        [purchase.track_id]: true,
                      }))
                    }
                    onPause={() =>
                      setIsPlaying((prev) => ({
                        ...prev,
                        [purchase.track_id]: false,
                      }))
                    }
                  />
                )}
              </div>

              <div className="p-3">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      purchase.track?.mp3_url &&
                      handleDownloadFormat(
                        purchase.track_id,
                        purchase.track.mp3_url,
                        purchase.track.trackname || "track",
                        "mp3",
                      )
                    }
                    className="flex items-center gap-1 bg-[#2D2D44] text-white px-3 py-1.5 rounded-lg hover:bg-[#3D3D54] transition-colors disabled:opacity-50 text-xs"
                    disabled={
                      !purchase.track?.mp3_url ||
                      downloadingFiles[purchase.track_id] === "mp3"
                    }
                  >
                    {downloadingFiles[purchase.track_id] === "mp3" ? (
                      <>
                        <TbLoader className="animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload />
                        <span>MP3</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      // Используем wav_url, если оно есть, иначе используем audio_url (оригинальный WAV)
                      const downloadUrl =
                        purchase.track?.wav_url || purchase.track?.audio_url;
                      if (downloadUrl) {
                        handleDownloadFormat(
                          purchase.track_id,
                          downloadUrl,
                          purchase.track?.trackname || "track",
                          "wav",
                        );
                      }
                    }}
                    className="flex items-center gap-1 bg-[#20DDBB] text-white px-3 py-1.5 rounded-lg hover:bg-[#1CB99D] transition-colors disabled:opacity-50 relative overflow-hidden text-xs"
                    // Кнопка активна, если есть wav_url или audio_url и файл не загружается в данный момент
                    disabled={
                      (!purchase.track?.wav_url &&
                        !purchase.track?.audio_url) ||
                      downloadingFiles[purchase.track_id] === "wav"
                    }
                  >
                    {downloadingFiles[purchase.track_id] === "wav" ? (
                      <>
                        <TbLoader className="animate-spin" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      <>
                        <FiDownload />
                        <span>WAV</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex flex-col">
                  <p className="text-[#818BAC] text-xs">
                    Purchased on{" "}
                    {new Date(purchase.purchase_date).toLocaleDateString()}
                  </p>
                  <p className="text-[#818BAC] text-xs">
                    Amount: ${purchase.amount}
                  </p>
                  <p className="text-[#818BAC] text-xs">
                    Genre: {purchase.track?.genre || "Unknown Genre"}
                  </p>
                </div>
              </div>
            </div>
          ) : null,
        )}

        {hasMore && (
          <div className="flex justify-center mt-4 mb-6">
            <button
              onClick={handleLoadMore}
              disabled={loading}
              className="bg-[#2D2D44] text-white px-5 py-1.5 rounded-lg hover:bg-[#3D3D54] transition-colors disabled:opacity-50 text-sm"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
