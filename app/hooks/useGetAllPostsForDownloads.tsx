import { database, Query } from "@/libs/AppWriteClient";
import useGetProfileByUserId from "./useGetProfileByUserId";

interface Post {
  id: string;
  user_id: string;
  audio_url: string;
  mp3_url: string;
  trackname: string;
  image_url: string;
  text: string;
  created_at: string;
  price: number;
  genre: string;
}

interface PostWithProfile extends Post {
  profile: {
    user_id: string | null;
    name: string;
    image: string;
  };
}

const useGetAllPostsForDownloads = async (): Promise<(PostWithProfile | null)[]> => {
  try {
    // Получаем все документы из коллекции 'Post' отсортированные по убыванию id
    const response = await database.listDocuments(
      String(process.env.NEXT_PUBLIC_DATABASE_ID),
      String(process.env.NEXT_PUBLIC_COLLECTION_ID_POST),
      [Query.orderDesc("$id")]
    );
    const documents = response.documents;
    
    // Кэш для профилей пользователей
    const profileCache: { [key: string]: { user_id: string | null; name: string; image: string } } = {};

    // Получаем информацию о профилях пользователей
    const objPromises = documents.map(async (doc) => {
      if (!doc?.user_id) {
        console.warn('Document missing user_id:', doc?.$id);
        return null;
      }

      let profile = profileCache[doc.user_id];
      if (!profile) {
        profile = await useGetProfileByUserId(doc.user_id);
        if (profile) {
          profileCache[doc.user_id] = {
            user_id: profile.user_id,
            name: profile.name || 'Unknown User',
            image: profile.image || '/images/placeholder-avatar.svg'
          };
        }
      }

      if (!profile) {
        console.warn('Failed to fetch profile for user:', doc.user_id);
        return null;
      }

      return {
        id: doc.$id,
        user_id: doc.user_id,
        audio_url: doc.audio_url,
        mp3_url: doc.mp3_url,
        image_url: doc.image_url,
        trackname: doc.trackname,
        text: doc.text,
        created_at: doc.created_at,
        price: doc.price,
        genre: doc.genre,
        profile: {
          user_id: profile.user_id,
          name: profile.name,
          image: profile.image,
        },
      };
    });

    const result = await Promise.all(objPromises);
    return result.filter((post): post is PostWithProfile => post !== null);
  } catch (error) {
    console.error("Failed to fetch posts:", error);
    throw new Error("Failed to fetch posts");
  }
};

export default useGetAllPostsForDownloads;
