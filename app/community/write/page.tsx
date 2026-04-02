"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  MapPin,
  X,
  ImageIcon,
  Lock,
  User as UserIcon,
} from "lucide-react" // UserIcon 추가
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore"

export default function WritePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WriteForm />
    </Suspense>
  )
}

function WriteForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const editId = searchParams.get("edit")

  const { user, loading: authLoading } = useAuth()

  const [category, setCategory] = useState<"찍먹" | "자유">("찍먹")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [authorName, setAuthorName] = useState("") // 비로그인 유저용 닉네임 상태 추가
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [existingLocation, setExistingLocation] = useState("")

  useEffect(() => {
    if (editId) {
      const fetchPost = async () => {
        try {
          const docRef = doc(db, "posts", editId)
          const docSnap = await getDoc(docRef)
          if (docSnap.exists()) {
            const data = docSnap.data()
            setCategory(data.type)
            setTitle(data.title)
            setContent(data.content)
            setAuthorName(data.author || "") // 수정 시 기존 닉네임 로드
            setPassword(data.password)
            setIsEditMode(true)
            setExistingLocation(data.location || "")
          }
        } catch (error) {
          console.error("데이터 불러오기 실패:", error)
        }
      }
      fetchPost()
    }
  }, [editId])

  // 제출 비활성화 조건: 제목, 본문, 비번 필수 + (로그인 안했으면 닉네임도 필수)
  const isSubmitDisabled =
    !title.trim() ||
    !content.trim() ||
    !password.trim() ||
    (!user && !authorName.trim()) || // 비로그인 시 닉네임 체크 추가
    isLoading

  const handleSubmit = async () => {
    if (isSubmitDisabled) return

    setIsLoading(true)
    try {
      const postData = {
        type: category,
        title: title.trim(),
        content: content.trim(),
        password: password,
        location: isEditMode
          ? existingLocation
          : category === "자유"
            ? "성남시 수정구"
            : "",
        // 로그인 유저면 유저 정보, 아니면 입력한 닉네임 사용
        author: user
          ? user.displayName || user.email?.split("@")[0]
          : authorName.trim(),
        authorId: user ? user.uid : null,
      }

      if (isEditMode && editId) {
        const docRef = doc(db, "posts", editId)
        await updateDoc(docRef, {
          ...postData,
          updatedAt: serverTimestamp(),
        })
        alert("수정되었습니다!")
      } else {
        await addDoc(collection(db, "posts"), {
          ...postData,
          comments: 0,
          likes: 0,
          likedBy: [],
          createdAt: serverTimestamp(),
        })
        alert("등록되었습니다!")
      }

      router.push("/community")
      router.refresh()
    } catch (error) {
      console.error("저장 에러:", error)
      alert("처리에 실패했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white transition-colors duration-300 dark:bg-zinc-950">
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
            {isEditMode ? "글 수정하기" : "글쓰기"}
          </span>
        </div>
        <Button
          disabled={isSubmitDisabled}
          onClick={handleSubmit}
          className={cn(
            "rounded-full px-6 font-bold transition-all",
            isSubmitDisabled
              ? "bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600"
              : "bg-orange-500 text-white shadow-md shadow-orange-200 hover:bg-orange-600 dark:shadow-none"
          )}
        >
          {isLoading ? "처리 중..." : isEditMode ? "수정완료" : "등록"}
        </Button>
      </div>

      <div className="px-4 pt-24 pb-10">
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

        {/* 닉네임 입력란: 로그인하지 않았을 때만 노출 */}
        {!user && (
          <div className="mb-3 flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/50">
            <UserIcon className="h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="사용하실 닉네임을 입력하세요"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none dark:text-zinc-200"
            />
          </div>
        )}

        <div className="mb-6 flex items-center gap-2 rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-900/50">
          <Lock className="h-4 w-4 text-zinc-400" />
          <input
            type="password"
            placeholder="수정/삭제용 비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none dark:text-zinc-200"
          />
        </div>

        {category === "찍먹" && (
          <div className="mb-6">
            <button className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-zinc-200 p-4 text-zinc-400 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/50">
              <MapPin className="h-5 w-5 text-orange-500" />
              <span className="text-sm font-medium">
                {existingLocation || "맛집 장소를 태그해 주세요 (선택)"}
              </span>
            </button>
          </div>
        )}

        <input
          type="text"
          placeholder="제목을 입력하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mb-4 w-full bg-transparent text-xl font-bold placeholder:text-zinc-300 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-700"
        />

        <textarea
          placeholder="이곳에 내용을 입력하세요."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[300px] w-full resize-none bg-transparent text-[16px] leading-relaxed placeholder:text-zinc-300 focus:outline-none dark:text-zinc-300 dark:placeholder:text-zinc-700"
        />
      </div>
    </div>
  )
}
