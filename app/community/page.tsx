"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Pencil, MessageCircle, ThumbsUp, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

import { db } from "@/lib/firebase"
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
} from "firebase/firestore"

const TABS = ["찍먹", "자유"]
const PAGE_SIZE = 20

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("찍먹")
  const [posts, setPosts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState<any>(null)
  const [hasMore, setHasMore] = useState(true)
  const observerRef = useRef<HTMLDivElement>(null)

  // 1. 실시간 데이터 가져오기 로직
  useEffect(() => {
    setIsLoading(true)
    setPosts([]) // 탭 변경 시 기존 포스트 완전 초기화 (중복 방지 핵심)
    setLastDoc(null)
    setHasMore(true)

    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    )

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsArray: any[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        postsArray.push({
          id: doc.id,
          ...data,
          time: formatTime(data.createdAt),
        })
      })

      setPosts(postsArray)
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      if (querySnapshot.docs.length < PAGE_SIZE) setHasMore(false)
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [activeTab]) // 탭이 바뀔 때마다 리스너 재설정 및 초기화

  // 2. 추가 데이터 불러오기 (무한 스크롤)
  const fetchMorePosts = async () => {
    if (!lastDoc || !hasMore || isLoading) return

    setIsLoading(true) // 추가 로딩 중 상태 처리
    const nextQ = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      startAfter(lastDoc),
      limit(PAGE_SIZE)
    )

    try {
      const querySnapshot = await getDocs(nextQ)
      if (querySnapshot.empty) {
        setHasMore(false)
        return
      }

      const nextPosts = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: formatTime(doc.data().createdAt),
      }))

      // 기존 데이터와 중복되지 않는 것만 필터링하여 추가
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const uniqueNextPosts = nextPosts.filter((p) => !existingIds.has(p.id))
        return [...prev, ...uniqueNextPosts]
      })

      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1])
      if (querySnapshot.docs.length < PAGE_SIZE) setHasMore(false)
    } catch (error) {
      console.error("Fetch more posts error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // 스크롤 감지 Observer 설정
  useEffect(() => {
    if (isLoading || !hasMore) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchMorePosts()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) observer.observe(observerRef.current)
    return () => observer.disconnect()
  }, [lastDoc, hasMore, isLoading])

  function formatTime(createdAt: any) {
    if (!createdAt) return "방금 전"
    const date = createdAt.toDate()
    const diff = (new Date().getTime() - date.getTime()) / 1000
    if (diff < 60) return "방금 전"
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
    if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
    return date.toLocaleDateString()
  }

  const filteredPosts = posts.filter((p) => p.type === activeTab)

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white px-4 pt-24 pb-32 transition-colors duration-300 dark:bg-zinc-950">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            커뮤니티<span className="text-orange-500">.</span>
          </h1>
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            동네 핫플 실시간 소식
          </p>
        </div>
        <Link href="/community/write">
          <Button
            size="icon"
            className="h-12 w-12 rounded-2xl bg-orange-500 shadow-lg shadow-orange-200 transition-transform hover:bg-orange-600 active:scale-95 dark:shadow-orange-900/20"
          >
            <Pencil className="h-5 w-5 text-white" />
          </Button>
        </Link>
      </div>

      <div className="mb-8 flex gap-4 border-b border-zinc-100 dark:border-zinc-800">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative px-2 pb-4 text-lg font-bold transition-all",
              activeTab === tab
                ? "text-zinc-900 dark:text-zinc-50"
                : "text-zinc-300 hover:text-zinc-400 dark:text-zinc-600 dark:hover:text-zinc-400"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute right-0 bottom-0 left-0 h-1 rounded-full bg-orange-500" />
            )}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredPosts.length > 0
          ? filteredPosts.map((post) => (
              <Link
                key={post.id}
                href={`/community/${post.id}`}
                className="block"
              >
                <div className="group cursor-pointer border-b border-zinc-50 pb-6 transition-opacity last:border-0 hover:opacity-80 dark:border-zinc-900">
                  {post.type === "찍먹" && post.location && (
                    <div className="mb-2 flex w-fit items-center gap-1.5 rounded-md bg-orange-50 px-2 py-0.5 text-orange-500 dark:bg-orange-950/30 dark:text-orange-400">
                      <MapPin className="h-3 w-3" />
                      <span className="text-[10px] font-black tracking-tight uppercase">
                        {post.location}
                      </span>
                    </div>
                  )}

                  <h2 className="mb-3 text-[17px] leading-tight font-bold tracking-tight text-zinc-800 group-hover:text-orange-500 dark:text-zinc-200 dark:group-hover:text-orange-400">
                    {post.title}
                  </h2>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                      <span className="font-bold text-zinc-900 dark:text-zinc-300">
                        {post.author || "익명"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <span>{post.time}</span>
                    </div>

                    <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
                      <div className="flex items-center gap-1 font-bold">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-[11px]">{post.likes || 0}</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-[11px]">
                          {post.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          : !isLoading && (
              <div className="py-20 text-center text-zinc-400 dark:text-zinc-600">
                아직 등록된 게시글이 없어요.
              </div>
            )}

        <div ref={observerRef} className="py-10 text-center text-zinc-400">
          {isLoading
            ? "데이터를 가져오는 중..."
            : hasMore
              ? "더 불러오기"
              : "마지막 게시글입니다."}
        </div>
      </div>
    </div>
  )
}
