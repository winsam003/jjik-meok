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
  User,
  Send,
} from "lucide-react"
import { db } from "@/lib/firebase"
import {
  doc,
  getDoc,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/useAuth"

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [post, setPost] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([]) // 댓글 리스트 상태
  const [commentInput, setCommentInput] = useState("") // 댓글 입력창 상태
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // 1. 게시글 및 댓글 실시간 가져오기
  useEffect(() => {
    if (!params.id) return

    const postRef = doc(db, "posts", params.id as string)

    // 게시글 단건 조회
    getDoc(postRef).then((docSnap) => {
      if (docSnap.exists()) {
        setPost({ id: docSnap.id, ...docSnap.data() })
      } else {
        alert("존재하지 않는 게시글입니다.")
        router.push("/community")
      }
      setIsLoading(false)
    })

    // 댓글 실시간 리스너 (서브 컬렉션 사용)
    const q = query(
      collection(db, "posts", params.id as string, "comments"),
      orderBy("createdAt", "asc")
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setComments(commentData)
    })

    return () => unsubscribe()
  }, [params.id, router])

  // 2. 댓글 등록 함수 (단순 카운트 업데이트)
  const handleCommentSubmit = async () => {
    if (!user) {
      alert("로그인이 필요합니다.")
      return
    }
    if (!commentInput.trim()) return

    try {
      // 댓글 서브 컬렉션에 추가
      await addDoc(collection(db, "posts", params.id as string, "comments"), {
        content: commentInput.trim(),
        author: user.displayName || user.email?.split("@")[0],
        authorId: user.uid,
        createdAt: serverTimestamp(),
      })

      // ⭐ 그냥 현재 DB에 저장된 post.comments 숫자에 +1만 합니다. (중복 체크 X)
      const postRef = doc(db, "posts", params.id as string)
      await updateDoc(postRef, {
        comments: (post.comments || 0) + 1,
      })

      // 로컬 상태도 즉시 반영해서 목록에 바로 전달되게 함
      setPost((prev: any) => ({
        ...prev,
        comments: (prev.comments || 0) + 1,
      }))

      setCommentInput("") // 입력창 초기화
    } catch (error) {
      console.error("댓글 등록 에러:", error)
    }
  }

  // 좋아요 핸들러
  const handleLike = async () => {
    if (!user) {
      alert("로그인이 필요한 기능입니다.")
      return
    }
    const postRef = doc(db, "posts", post.id)
    const isLiked = post.likedBy?.includes(user.uid)
    try {
      if (isLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likes: (post.likes || 1) - 1,
        })
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid),
          likes: (post.likes || 0) + 1,
        })
      }
      setPost((prev: any) => ({
        ...prev,
        likedBy: isLiked
          ? prev.likedBy.filter((uid: string) => uid !== user.uid)
          : [...(prev.likedBy || []), user.uid],
        likes: isLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1,
      }))
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = () => {
    const inputPassword = prompt("수정을 위해 비밀번호를 입력해주세요.")
    if (!inputPassword) return
    if (inputPassword !== post.password) {
      alert("비밀번호가 일치하지 않습니다.")
      return
    }
    router.push(`/community/write?edit=${post.id}`)
  }

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
      <div className="flex min-h-screen items-center justify-center">
        로딩 중...
      </div>
    )
  if (!post) return null

  const isUserLiked = post.likedBy?.includes(user?.uid)

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-white px-4 pt-24 pb-40 transition-colors duration-300 dark:bg-zinc-950">
      <div className="fixed top-0 right-0 left-0 z-50 flex justify-center bg-white/80 backdrop-blur-md dark:bg-zinc-950/80">
        <div className="flex w-full max-w-2xl items-center justify-between px-4 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEdit}
              className="rounded-full text-zinc-400 hover:text-orange-500"
            >
              <Pencil className="h-5 w-5" />
            </Button>
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
      </div>

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

      <h1 className="mb-6 text-2xl leading-tight font-black text-zinc-900 dark:text-zinc-50">
        {post.title}
      </h1>

      <div className="mb-8 flex items-center gap-3 border-b border-zinc-50 pb-6 dark:border-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
          <User className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-200">
            {post.author || "익명"}
          </p>
          <p className="text-xs text-zinc-400">{post.location || ""}</p>
        </div>
      </div>

      <div className="mb-12 min-h-[150px] text-[16px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        {post.content?.split("\n").map((line: string, i: number) => (
          <p key={i}>
            {line}
            <br />
          </p>
        ))}
      </div>

      <div className="mb-10 flex items-center gap-6 border-t border-zinc-50 pt-6 dark:border-zinc-900">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-2 transition-colors",
            isUserLiked
              ? "text-orange-500"
              : "text-zinc-400 hover:text-orange-500"
          )}
        >
          <ThumbsUp className={cn("h-5 w-5", isUserLiked && "fill-current")} />
          <span className="text-sm font-bold">{post.likes || 0}</span>
        </button>
        <div className="flex items-center gap-2 text-zinc-400">
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{comments.length}</span>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
          댓글 {comments.length}
        </h3>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
                <User className="h-4 w-4 text-zinc-400" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-[13px] font-bold text-zinc-900 dark:text-zinc-200">
                    {comment.author}
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    {comment.createdAt?.toDate().toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[14px] leading-snug text-zinc-600 dark:text-zinc-400">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-zinc-400">
            첫 댓글을 남겨보세요!
          </p>
        )}
        <div className="h-20" />
      </div>

      <div className="fixed right-0 bottom-35 left-0 z-50 flex justify-center border-t border-zinc-100 bg-white px-4 py-4 dark:border-zinc-900 dark:bg-zinc-950">
        <div className="flex w-full max-w-2xl items-center gap-3 rounded-2xl bg-zinc-100 px-4 py-3 dark:bg-zinc-900">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCommentSubmit()}
            placeholder={
              user ? "댓글을 남겨보세요" : "로그인 후 이용 가능합니다"
            }
            disabled={!user}
            className="flex-1 bg-transparent text-sm focus:outline-none dark:text-zinc-200"
          />
          <button
            onClick={handleCommentSubmit}
            disabled={!commentInput.trim()}
            className="text-orange-500 disabled:opacity-30"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
