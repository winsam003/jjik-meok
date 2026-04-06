/**
 * Rating History Service
 *
 * Firestore reviews 컬렉션에서 시계열 차트 데이터를 생성합니다.
 * 리뷰가 쌓이면 실제 평점 변화 추이를 차트로 표시합니다.
 */

import { db } from "@/lib/firebase"
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from "firebase/firestore"
import type { TimeSeriesPoint } from "@/lib/types"

type Period = "1일" | "1주" | "1달" | "3달"

const PERIOD_MS: Record<Period, number> = {
  "1일": 24 * 60 * 60 * 1000,
  "1주": 7 * 24 * 60 * 60 * 1000,
  "1달": 30 * 24 * 60 * 60 * 1000,
  "3달": 90 * 24 * 60 * 60 * 1000,
}

/**
 * Spot의 평점 시계열 데이터 조회 (리뷰 기반)
 *
 * @param spotId Spot ID (카카오 place ID)
 * @param period 조회 기간
 * @returns 시간순 평점 시계열 배열
 */
export async function getRatingHistory(
  spotId: string,
  period: Period
): Promise<TimeSeriesPoint[]> {
  // reviews 쿼리 (spotId + createdAt desc — 기존 composite index 활용)
  const q = query(
    collection(db, "reviews"),
    where("spotId", "==", spotId),
    orderBy("createdAt", "desc")
  )
  const snap = await getDocs(q)
  if (snap.empty) return []

  const now = new Date()
  const startDate = new Date(now.getTime() - PERIOD_MS[period])

  // oldest first
  const allReviews = snap.docs
    .map((d) => {
      const data = d.data()
      const createdAt: Date = data.createdAt?.toDate?.() ?? new Date()
      return { rating: data.rating as number, createdAt }
    })
    .reverse()

  // 기간 내 리뷰 필터
  let reviews = allReviews.filter((r) => r.createdAt >= startDate)

  // 기간 내 리뷰 없으면 전체 리뷰 사용 (데이터가 있는 기간을 보여줌)
  if (reviews.length === 0) reviews = allReviews

  // ── 시간 버킷별 그룹핑 + 누적 평균 계산 ────────────────────────────
  const buckets = new Map<string, number[]>()
  const bucketOrder: string[] = []

  reviews.forEach((r) => {
    const label = formatTimeLabel(r.createdAt, period)
    if (!buckets.has(label)) {
      buckets.set(label, [])
      bucketOrder.push(label)
    }
    buckets.get(label)!.push(r.rating)
  })

  // 버킷별 평균 평점 계산
  let cumulativeSum = 0
  let cumulativeCount = 0

  return bucketOrder.map((label) => {
    const ratings = buckets.get(label)!
    cumulativeSum += ratings.reduce((s, r) => s + r, 0)
    cumulativeCount += ratings.length
    const avg = cumulativeSum / cumulativeCount
    return {
      time: label,
      rating: Math.round(avg * 10) / 10,
    }
  })
}

/** 기간에 따라 시간 레이블 포맷 */
function formatTimeLabel(date: Date, period: Period): string {
  switch (period) {
    case "1일":
      return `${date.getHours()}시`
    case "1주":
      return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    case "1달":
      return `${date.getMonth() + 1}/${date.getDate()}`
    case "3달": {
      const weekStart = new Date(date)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      return `${weekStart.getMonth() + 1}/${weekStart.getDate()}주`
    }
  }
}
