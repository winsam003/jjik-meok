"use client";

import { useState, useEffect } from "react";
import {
  X, Heart, Phone, MapPin, Clock,
  ChevronDown, ChevronUp, Star, TrendingUp, PenLine,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { RankedSpot, Review } from "@/lib/types";
import { getReviews, createReview } from "@/lib/services/review.service";
import { toggleLike, isLiked } from "@/lib/services/like.service";
import { useAuth } from "@/hooks/useAuth";

interface SpotDetailPanelProps {
  spot: RankedSpot | null;
  open: boolean;
  onClose: () => void;
  onOpenRanking: () => void;
}

const DAY_LABELS: Record<string, string> = {
  mon: "월", tue: "화", wed: "수", thu: "목",
  fri: "금", sat: "토", sun: "일",
};

const TODAY_KEY = ["sun","mon","tue","wed","thu","fri","sat"][new Date().getDay()];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange?.(s)}
          className={cn("transition-colors", onChange ? "cursor-pointer" : "cursor-default")}
        >
          <Star
            size={18}
            className={s <= value ? "fill-orange-400 text-orange-400" : "text-zinc-200"}
          />
        </button>
      ))}
    </div>
  );
}

export default function SpotDetailPanel({ spot, open, onClose, onOpenRanking }: SpotDetailPanelProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [hoursOpen, setHoursOpen] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!spot || !open) return;
    setLikeCount(spot.likeCount);
    getReviews(spot.id).then(setReviews);
    isLiked(spot.id).then(setLiked);
    setShowReviewForm(false);
    setHoursOpen(false);
  }, [spot, open]);

  if (!spot) return null;

  const handleLike = async () => {
    if (!user) return;
    const added = await toggleLike(spot.id);
    setLiked(added);
    setLikeCount((c) => added ? c + 1 : c - 1);
  };

  const handleSubmitReview = async () => {
    if (!reviewContent.trim() || submitting) return;
    setSubmitting(true);
    await createReview({ spotId: spot.id, rating: reviewRating, content: reviewContent });
    const updated = await getReviews(spot.id);
    setReviews(updated);
    setReviewContent("");
    setReviewRating(5);
    setShowReviewForm(false);
    setSubmitting(false);
  };

  const todayHours = spot.openingHours[TODAY_KEY as keyof typeof spot.openingHours];
  const isOpen = !todayHours.closed && spot.status === "영업 중";

  // 별점 분포
  const ratingDist = [5,4,3,2,1].map((s) => ({
    star: s,
    count: reviews.filter((r) => r.rating === s).length,
  }));

  return (
    <>
      {/* 백드롭 */}
      <div
        className={cn(
          "fixed inset-0 z-[165] bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[170] h-full w-full max-w-[420px] bg-white shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 상단 여백 */}
        <div className="pt-4" />

        {/* 닫기 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 사진 갤러리 */}
        {spot.photos.length > 0 && (
          <div className="flex gap-2 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {spot.photos.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`${spot.name} 사진 ${idx + 1}`}
                className="shrink-0 w-52 h-36 object-cover rounded-2xl"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            ))}
          </div>
        )}

        {/* 기본 정보 */}
        <div className="px-5 pb-4 border-b border-zinc-100">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-orange-100 text-orange-600 font-semibold px-2 py-0.5 rounded-full">
                  {spot.category}
                </span>
                <span className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded-full",
                  isOpen ? "bg-green-100 text-green-600" : "bg-zinc-100 text-zinc-500"
                )}>
                  {spot.status}
                </span>
              </div>
              <h2 className="text-xl font-black text-zinc-900">{spot.name}</h2>
              <div className="flex items-center gap-1 mt-1 text-zinc-400">
                <MapPin size={12} />
                <span className="text-xs">{spot.address}</span>
              </div>
              {spot.phone && (
                <div className="flex items-center gap-1 mt-0.5 text-zinc-400">
                  <Phone size={12} />
                  <span className="text-xs">{spot.phone}</span>
                </div>
              )}
            </div>
            {/* 좋아요 버튼 */}
            <button
              onClick={handleLike}
              className={cn(
                "flex flex-col items-center gap-0.5 transition-all",
                !user && "opacity-40 cursor-not-allowed"
              )}
              disabled={!user}
            >
              <Heart
                size={24}
                className={cn(
                  "transition-all",
                  liked ? "fill-red-500 text-red-500 scale-110" : "text-zinc-300"
                )}
              />
              <span className="text-xs font-bold text-zinc-500">{likeCount.toLocaleString()}</span>
            </button>
          </div>

          {/* 평점 요약 */}
          <div className="flex items-center gap-2 mt-3">
            <span className="text-2xl font-black text-zinc-900">{spot.rating}★</span>
            <span className="text-sm text-zinc-400">({spot.reviewCount.toLocaleString()}개 리뷰)</span>
            <span className="text-xs font-bold text-zinc-400">· {spot.distance}</span>
          </div>
        </div>

        {/* 운영시간 */}
        <div className="px-5 py-4 border-b border-zinc-100">
          <button
            onClick={() => setHoursOpen(!hoursOpen)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-orange-400" />
              <span className="text-sm font-bold text-zinc-800">운영시간</span>
              {!hoursOpen && (
                <span className="text-xs text-zinc-400">
                  {todayHours.closed ? "오늘 휴무" : `${todayHours.open} - ${todayHours.close}`}
                </span>
              )}
            </div>
            {hoursOpen ? <ChevronUp size={15} className="text-zinc-400" /> : <ChevronDown size={15} className="text-zinc-400" />}
          </button>

          {hoursOpen && (
            <div className="mt-3 flex flex-col gap-1.5">
              {Object.entries(spot.openingHours).map(([key, hours]) => {
                const isToday = key === TODAY_KEY;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex justify-between text-sm",
                      isToday ? "font-bold text-zinc-900" : "text-zinc-500"
                    )}
                  >
                    <span>{DAY_LABELS[key]}</span>
                    <span>
                      {hours.closed ? (
                        <span className="text-red-400">휴무</span>
                      ) : (
                        `${hours.open} - ${hours.close}`
                      )}
                      {isToday && <span className="ml-2 text-xs text-orange-500">(오늘)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 리뷰 섹션 */}
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black text-zinc-800">리뷰 {reviews.length}개</h3>
            {user ? (
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
              >
                <PenLine size={13} />
                리뷰 작성
              </button>
            ) : (
              <span className="text-xs text-zinc-400">로그인 후 리뷰를 작성할 수 있어요</span>
            )}
          </div>

          {/* 별점 분포 */}
          {reviews.length > 0 && (
            <div className="bg-zinc-50 rounded-2xl p-4 mb-4 flex gap-4">
              <div className="flex flex-col items-center justify-center">
                <span className="text-4xl font-black text-zinc-900">{spot.rating}</span>
                <StarRating value={Math.round(spot.rating)} />
              </div>
              <div className="flex-1 flex flex-col gap-1">
                {ratingDist.map(({ star, count }) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs text-zinc-400 w-3">{star}</span>
                    <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-400 rounded-full transition-all"
                        style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : "0%" }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-3">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 리뷰 작성 폼 */}
          {showReviewForm && (
            <div className="bg-orange-50 rounded-2xl p-4 mb-4 border border-orange-100">
              <p className="text-sm font-bold text-zinc-800 mb-2">별점을 선택해주세요</p>
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                placeholder="이 곳에 대한 솔직한 리뷰를 남겨주세요"
                className="w-full mt-3 border border-zinc-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none transition-all bg-white"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  size="sm"
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                  onClick={handleSubmitReview}
                  disabled={submitting || !reviewContent.trim()}
                >
                  {submitting ? "등록 중..." : "등록"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowReviewForm(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          )}

          {/* 리뷰 목록 */}
          <div className="flex flex-col gap-4">
            {reviews.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <p className="text-sm">아직 리뷰가 없어요</p>
                <p className="text-xs mt-1">첫 번째 리뷰를 남겨보세요!</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="pb-4 border-b border-zinc-100 last:border-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center text-xs font-bold text-orange-500">
                        {review.userNickname[0]}
                      </div>
                      <span className="text-sm font-semibold text-zinc-800">{review.userNickname}</span>
                    </div>
                    <span className="text-xs text-zinc-400">
                      {new Date(review.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <StarRating value={review.rating} />
                  <p className="text-sm text-zinc-600 mt-1.5 leading-relaxed">{review.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 증권 보기 버튼 */}
        <div className="px-5 pb-10">
          <button
            onClick={() => { onClose(); onOpenRanking(); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-zinc-200 text-sm font-semibold text-zinc-500 hover:border-orange-300 hover:text-orange-500 hover:bg-orange-50 transition-all"
          >
            <TrendingUp size={15} />
            증권 거래소에서 보기
          </button>
        </div>
      </div>
    </>
  );
}
