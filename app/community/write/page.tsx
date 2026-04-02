"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MapPin, X, ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export default function WritePage() {
  const router = useRouter()
  const [category, setCategory] = useState<"찍먹" | "자유">("찍먹")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [location, setLocation] = useState("") // 나중에 장소 검색 기능 연동

  const isSubmitDisabled = !title.trim() || !content.trim()

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white transition-colors duration-300 dark:bg-zinc-950">
      {/* 상단 네비바 */}
      <div className="fixed top-0 z-50 flex w-full max-w-2xl items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md dark:bg-zinc-950/80">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full text-zinc-600 dark:text-zinc-400"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <span className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
            글쓰기
          </span>
        </div>
        <Button
          disabled={isSubmitDisabled}
          className={cn(
            "rounded-full px-6 font-bold transition-all",
            isSubmitDisabled
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
              : "bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600 dark:shadow-none"
          )}
        >
          등록
        </Button>
      </div>

      <div className="px-4 pt-24 pb-10">
        {/* 카테고리 선택 */}
        <div className="mb-6 flex gap-2">
          {["찍먹", "자유"].map((t) => (
            <button
              key={t}
              onClick={() => setCategory(t as any)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition-all",
                category === t
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-950"
                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* 장소 추가 (찍먹 카테고리일 때만 노출) */}
        {category === "찍먹" && (
          <div className="mb-6">
            <button className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-zinc-200 p-4 text-zinc-400 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">
                맛집 장소를 태그해 주세요 (선택)
              </span>
            </button>
          </div>
        )}

        {/* 제목 입력 */}
        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="dark:placeholder:zinc-700 mb-4 w-full bg-transparent text-xl font-bold placeholder:text-zinc-300 focus:outline-none dark:text-zinc-100"
        />

        {/* 본문 입력 */}
        <textarea
          placeholder="이곳에 내용을 입력하세요. 맛집에 대한 찍먹 리포트나 자유로운 이야기를 들려주세요!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="dark:placeholder:zinc-700 min-h-[300px] w-full resize-none bg-transparent text-[16px] leading-relaxed placeholder:text-zinc-300 focus:outline-none dark:text-zinc-300"
        />
      </div>

      {/* 하단 툴바 (이미지 업로드 등) */}
      <div className="fixed bottom-30 left-1/2 z-[40] w-[90%] max-w-2xl -translate-x-1/2">
        <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 bg-white/90 p-4 shadow-lg backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90">
          <button className="flex items-center gap-1.5 text-zinc-500 transition-colors hover:text-orange-500">
            <ImageIcon className="h-6 w-6" />
            <span className="text-sm font-bold">사진</span>
          </button>

          <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-700" />

          <p className="text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
            부적절한 게시물 등록 시<br />
            서비스 이용이 제한될 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  )
}
