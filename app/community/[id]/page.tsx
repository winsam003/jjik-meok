"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  ChevronLeft,
  MapPin,
  ThumbsUp,
  MessageCircle,
  Pencil,
  Trash2,
} from "lucide-react"
import { db } from "@/lib/firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { cn } from "@/lib/utils"

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [post, setPost] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. 게시글 데이터 가져오기
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const docRef = doc(db, "posts", params.id as string)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setPost({ id: docSnap.id, ...docSnap.data() })
        } else {
          alert("존재하지 않는 게시글입니다.")
          router.push("/community")
        }
      } catch (error) {
        console.error("Error fetching post:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) fetchPost()
  }, [params.id, router])

  // 2. 수정 핸들러 (비밀번호 확인 후 글쓰기 페이지로 데이터 전달)
  const handleEdit = () => {
    const inputPassword = prompt("수정을 위해 비밀번호를 입력해주세요.")
    if (!inputPassword) return

    if (inputPassword !== post.password) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    // 수정 페이지로 이동 (id를 쿼리 파라미터로 넘기거나 해서 글쓰기 페이지에서 활용 가능)
    // 여기서는 간단하게 기존 정보를 로컬 스토리지에 잠깐 담거나 쿼리로 보낼 수 있음
    router.push(`/community/write?edit=${post.id}`)
  }

  // 3. 삭제 핸들러 (비밀번호 확인 포함)
  const handleDelete = async () => {
    const inputPassword = prompt("삭제를 위해 비밀번호를 입력해주세요.")
    if (!inputPassword) return

    if (inputPassword !== post.password) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }

    if (confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
      setIsProcessing(true)
      try {
        await deleteDoc(doc(db, "posts", params.id as string))
        alert("삭제되었습니다.")
        router.push("/community")
        router.refresh()
      } catch (error) {
        alert("삭제 중 오류가 발생했습니다.")
      } finally {
        setIsProcessing(false)
      }
    }
  }

  if (isLoading)
    return (
      <div className="flex min-h-screen items-center justify-center dark:text-white">
        로딩 중...
      </div>
    )
  if (!post) return null

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white transition-colors duration-300 dark:bg-zinc-950">
      {/* 상단 네비바 */}
      <div className="fixed top-0 z-50 flex w-full max-w-2xl items-center justify-between bg-white/80 px-4 py-4 backdrop-blur-md dark:bg-zinc-950/80">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="rounded-full text-zinc-600 dark:text-zinc-400"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <div className="flex gap-1">
          {/* 수정 버튼 추가 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleEdit}
            className="rounded-full text-zinc-400 hover:text-orange-500"
          >
            <Pencil className="h-5 w-5" />
          </Button>
          {/* 삭제 버튼 */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isProcessing}
            className="rounded-full text-zinc-400 hover:text-red-500"
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 pt-24 pb-32">
        {/* 카테고리 & 장소 */}
        <div className="mb-4 flex items-center gap-2">
          <span className="rounded-full bg-zinc-900 px-3 py-1 text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-950">
            {post.type}
          </span>
          {post.type === "찍먹" && post.location && (
            <div className="flex items-center gap-1 text-orange-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="text-sm font-bold">{post.location}</span>
            </div>
          )}
        </div>

        {/* 제목 */}
        <h1 className="mb-6 text-2xl leading-tight font-black text-zinc-900 dark:text-zinc-50">
          {post.title}
        </h1>

        {/* 작성자 정보 */}
        <div className="mb-8 flex items-center gap-3 border-b border-zinc-50 pb-6 dark:border-zinc-900">
          <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20" />
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
              {post.author || "익명"}
            </p>
            <p className="text-xs text-zinc-400">성남시 수정구</p>
          </div>
        </div>

        {/* 본문 내용 */}
        <div className="mb-12 min-h-[200px] text-[16px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {post.content?.split("\n").map((line: string, i: number) => (
            <p key={i}>
              {line}
              <br />
            </p>
          ))}
        </div>

        {/* 하단 반응 (좋아요/댓글수) */}
        <div className="flex items-center gap-6 border-t border-zinc-50 pt-6 dark:border-zinc-900">
          <button className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-orange-500">
            <ThumbsUp className="h-5 w-5" />
            <span className="text-sm font-bold">{post.likes || 0}</span>
          </button>
          <button className="flex items-center gap-2 text-zinc-400 transition-colors hover:text-orange-500">
            <MessageCircle className="h-5 w-5" />
            <span className="text-sm font-bold">{post.comments || 0}</span>
          </button>
        </div>
      </div>

      {/* 댓글 입력창 (UI만) */}
      <div className="fixed bottom-0 w-full max-w-2xl border-t border-zinc-100 bg-white px-4 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
          <input
            type="text"
            placeholder="댓글을 남겨보세요"
            className="flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-200"
          />
          <button className="text-sm font-bold text-orange-500 hover:text-orange-600">
            전송
          </button>
        </div>
      </div>
    </div>
  )
}
