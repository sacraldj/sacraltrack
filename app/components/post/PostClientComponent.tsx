"use client"

import { useEffect, useState, useCallback } from "react";
import Comments from "@/app/components/post/Comments"
import Link from "next/link"
import { AiOutlineClose } from "react-icons/ai"
import { useRouter, useParams } from "next/navigation"
import ClientOnly from "@/app/components/ClientOnly"
import { usePostStore } from "@/app/stores/post"
import { useLikeStore } from "@/app/stores/like"
import { useCommentStore } from "@/app/stores/comment"
import useCreateBucketUrl from "@/app/hooks/useCreateBucketUrl"
import { AudioPlayer } from '@/app/components/AudioPlayer'
import { useStableAudioPlayer } from '@/app/hooks/useStableAudioPlayer'
import Image from 'next/image'
import { FaHeart, FaMusic } from 'react-icons/fa'
import { IoMusicalNotes } from 'react-icons/io5'
import moment from 'moment'
import TopNav from '@/app/layouts/includes/TopNav'
import ShareModal from '@/app/components/ShareModal'
import { ShareIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const PostImageFallback = () => (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-[#2E2469] to-[#351E43]">
        <div className="flex flex-col items-center">
            <Image 
                src="/images/T-logo.svg" 
                alt="Default" 
                width={64}
                height={64}
                className="opacity-20"
            />
            <div className="mt-4 w-32 h-[1px] bg-white/10"></div>
            <div className="mt-4 space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div 
                        key={i} 
                        className="h-1 bg-white/10 rounded"
                        style={{
                            width: `${Math.random() * 100 + 100}px`
                        }}
                    ></div>
                ))}
            </div>
        </div>
    </div>
)

const StatsCard = ({ icon, value, label }: { icon: React.ReactNode, value: string | number, label: string }) => (
    <div className="flex items-center gap-1 glass-effect rounded-lg px-2 py-1 hover-lift">
        <div className="animate-glow">{icon}</div>
        <span className="text-white font-medium text-sm">{value}</span>
        <span className="gradient-text text-xs">{label}</span>
    </div>
)

export default function PostClientComponent() {
    const params = useParams();
    const postId = (params?.postId ? (Array.isArray(params.postId) ? params.postId[0] : params.postId) : "") as string;
    const userId = (params?.userId ? (Array.isArray(params.userId) ? params.userId[0] : params.userId) : "") as string;
    
    const { postById, setPostById, setPostsByUser } = usePostStore()
    const { setLikesByPost, likesByPost } = useLikeStore()
    const { setCommentsByPost, commentsByPost } = useCommentStore()
    const { 
        isPlaying, 
        handlePlay, 
        handlePause
    } = useStableAudioPlayer({
        postId: postById?.id || '',
        m3u8Url: postById?.m3u8_url ? useCreateBucketUrl(postById.m3u8_url) : '',
        onPlayStatusChange: (isPlaying) => {
            // Update UI or track info if needed
        }
    });
    const [imageError, setImageError] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const router = useRouter()

    const imageUrl = postById?.image_url ? useCreateBucketUrl(postById.image_url) : ''
    const m3u8Url = postById?.m3u8_url ? useCreateBucketUrl(postById.m3u8_url) : ''

    useEffect(() => { 
        const loadData = async () => {
            try {
                await Promise.all([
                    setPostById(postId),
                    setCommentsByPost(postId),
                    setLikesByPost(postId),
                    setPostsByUser(userId) 
                ])
            } catch (error) {
                console.error('Error loading data:', error)
            }
        }
        loadData()
    }, [postId, userId])

    useEffect(() => {
        if (imageUrl) {
            const img = document.createElement('img')
            img.src = imageUrl
            img.onerror = () => setImageError(true)
            img.onload = () => setImageError(false)
        }
    }, [imageUrl])

    const handleShare = () => {
        setIsShareModalOpen(true)
        toast.success("Ready to share this awesome track!", {
            style: {
                background: 'rgba(46, 36, 105, 0.9)',
                color: '#fff',
                borderLeft: '4px solid #20DDBB',
                padding: '16px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            },
            icon: '🎵',
            duration: 3000,
        })
    }

    return (
        <div className="min-h-screen bg-[#1A1A2E]">
            <TopNav params={{ id: userId }} />
            <div className="max-w-full sm:max-w-[1200px] mx-auto content-with-top-nav px-[5px] sm:px-5 py-6">
                {/* Track Section */}
                <div className="bg-[#24183D] rounded-2xl overflow-hidden shadow-xl relative animate-scaleIn">
                    {/* Track Header */}
                    <div className="relative h-[300px] md:h-[400px]">
                        {/* Background Image with Gradient Overlay */}
                        <div 
                            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
                            style={!imageError ? { 
                                backgroundImage: `url(${imageUrl})`,
                            } : undefined}
                        >
                            {imageError && <PostImageFallback />}
                            {/* Gradient Overlays */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#24183D]/50 to-[#24183D]" />
                            <div className="absolute inset-0 bg-gradient-to-r from-[#24183D]/30 via-transparent to-[#24183D]/30" />
                        </div>

                        {/* Close Button */}
                        <Link
                            href="/"
                            className="absolute top-6 right-6 z-30 p-2.5 rounded-xl 
                                     glass-effect text-white hover-lift
                                     hover:text-[#20DDBB] transition-all duration-200"
                        >
                            <AiOutlineClose size="24"/>
                        </Link>

                        {/* Track Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 z-10">
                            <ClientOnly>
                                {postById && (
                                    <div className="space-y-6 animate-fadeInUp">
                                        <h1 className="text-3xl md:text-5xl font-bold gradient-text 
                                                     drop-shadow-lg tracking-tight animate-floatY">
                                            {postById.trackname}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-4">
                                            <Link 
                                                href={`/profile/${postById.profile.user_id}`}
                                                className="flex items-center gap-3 glass-effect
                                                         hover:text-[#20DDBB] transition-all 
                                                         rounded-full px-4 py-2 group hover-lift"
                                            >
                                                <img 
                                                    src={useCreateBucketUrl(postById.profile.image)}
                                                    alt={postById.profile.name}
                                                    className="w-10 h-10 rounded-full ring-2 ring-[#20DDBB] 
                                                             group-hover:ring-white transition-all animate-glow"
                                                />
                                                <span className="text-white text-base font-medium">
                                                    {postById.profile.name}
                                                </span>
                                            </Link>
                                            <div className="flex items-center gap-1 px-3 py-1 
                                                          glass-effect rounded-full hover-lift">
                                                <span className="gradient-text text-xs">Released:</span>
                                                <span className="text-sm text-white">
                                                    {moment(postById.created_at).format('MMMM D, YYYY')}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1 px-3 py-1 
                                                          glass-effect rounded-full hover-lift">
                                                <span className="gradient-text text-xs">Genre:</span>
                                                <span className="text-sm text-white">{postById.genre}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </ClientOnly>
                        </div>
                    </div>

                    {/* Audio Player */}
                    <div className="relative z-20 -mt-8 animate-fadeInUp animation-delay-200">
                        <ClientOnly>
                            {m3u8Url && (
                                <div className="px-[5px] mb-6">
                                    <div className="bg-[#1A1A2E] p-3 rounded-md shadow border border-[#2E2469]/30 flex items-center gap-4 mt-3">
                                        <div className="flex-grow">
                                            {postById?.m3u8_url && (
                                                <AudioPlayer 
                                                    m3u8Url={useCreateBucketUrl(postById.m3u8_url)}
                                                    isPlaying={isPlaying}
                                                    onPlay={handlePlay}
                                                    onPause={handlePause}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </ClientOnly>
                    </div>

                    {/* Stats Section */}
                    <div className="px-[5px] sm:px-8 py-6 flex flex-wrap gap-4 animate-fadeInUp animation-delay-200 sm:border-t border-[#2E2469]/30">
                        <StatsCard 
                            icon={<FaHeart className="text-[#FF69B4]" size={20} />}
                            value={likesByPost.length}
                            label="Likes"
                        />
                        <StatsCard 
                            icon={<FaMusic className="text-[#20DDBB]" size={20} />}
                            value={postById?.price || '1.99'}
                            label="USD"
                        />
                        <div 
                            onClick={handleShare}
                            className="flex items-center gap-1 glass-effect rounded-lg px-2 py-1 hover-lift cursor-pointer"
                        >
                            <div className="animate-glow">
                                <ShareIcon className="w-5 h-5 text-[#20DDBB]" />
                            </div>
                            <span className="gradient-text text-xs">Share</span>
                        </div>
                    </div>

                    {/* Comments Section */}
                    <div className="sm:border-t border-[#2E2469]/30">
                        <div className="bg-[#24183D] rounded-b-2xl animate-fadeInUp animation-delay-200">
                            <ClientOnly>
                                {postById && postId && (
                                    <div className="p-[5px] sm:p-8">
                                        <Comments params={{ userId, postId }}/>
                                    </div>
                                )}
                            </ClientOnly>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            <ClientOnly>
                {postById && (
                    <ShareModal 
                        isOpen={isShareModalOpen}
                        onClose={() => setIsShareModalOpen(false)}
                        post={postById}
                    />
                )}
            </ClientOnly>
        </div>
    )
} 