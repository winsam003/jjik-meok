"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Pencil, MessageCircle, ThumbsUp, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

const TABS = ["찍먹", "자유"]

const POSTS = [
  {
    id: 1,
    type: "찍먹",
    title: "서현역 돈까스 마스터, 소스 따로 달라고 안 해도 따로 나옴! 합격 🍖",
    location: "돈까스 마스터 성남점",
    author: "부먹은거절한다",
    comments: 8,
    likes: 15,
    time: "5분 전",
  },
  {
    id: 2,
    type: "자유",
    title: "오늘 성남시청 근처 날씨 미쳤네요. 산책하기 딱 좋음",
    author: "만보기대장",
    comments: 3,
    likes: 12,
    time: "12분 전",
  },
  {
    id: 3,
    type: "찍먹",
    title: "여기 탕수육 소스 부어서 나오나요? 아시는 분 제보 좀..",
    location: "황실 짜장",
    author: "신중한찍먹파",
    comments: 24,
    likes: 2,
    time: "25분 전",
  },
]

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState("찍먹")

  return (
    // 배경색을 시스템 테마에 맞게 (라이트: 흰색 / 다크: 아주 어두운 회색)
    <div className="mx-auto min-h-screen max-w-2xl bg-white px-4 pt-24 pb-32 transition-colors duration-300 dark:bg-zinc-950">
      {/* 1. 상단 헤더 */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            커뮤니티<span className="text-orange-500">.</span>
          </h1>
          <p className="text-sm font-medium text-zinc-400 dark:text-zinc-500">
            동네 맛집 실시간 소식
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

      {/* 2. 시그니처 탭 메뉴 */}
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

      {/* 3. 포스트 리스트 */}
      <div className="space-y-6">
        {POSTS.filter((p) => p.type === activeTab).map((post) => (
          <div
            key={post.id}
            className="group cursor-pointer border-b border-zinc-50 pb-6 transition-opacity last:border-0 hover:opacity-80 dark:border-zinc-900"
          >
            {/* 장소 정보: 다크모드에선 배경을 살짝 더 어둡게 */}
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
                  {post.author}
                </span>
                <span className="h-1 w-1 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span>{post.time}</span>
              </div>

              <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
                <div className="flex items-center gap-1 font-bold">
                  <ThumbsUp className="h-4 w-4" />
                  <span className="text-[11px]">{post.likes}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-[11px]">{post.comments}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
