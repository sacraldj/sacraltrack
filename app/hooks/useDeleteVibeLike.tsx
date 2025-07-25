import { database } from "@/libs/AppWriteClient"

const useDeleteVibeLike = async (id: string) => {
    try {
        await database.deleteDocument(
            String(process.env.NEXT_PUBLIC_DATABASE_ID), 
            String(process.env.NEXT_PUBLIC_COLLECTION_ID_VIBE_LIKES), 
            id
        );
    } catch (error) {
        throw error
    }
}

export default useDeleteVibeLike
