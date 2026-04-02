/**
 * Spot Service
 *
 * 데이터 흐름:
 *  기본 정보 (이름, 주소, 좌표, 사진) → 카카오 로컬 API
 *  리뷰 / 좋아요 / 평점               → Firestore (현재 스텁, 추후 연동)
 *
 * Firestore 컬렉션: spots / reviews / likes / ratingHistory
 */

import type { RankedSpot, OpeningHours, TimeSeriesPoint } from "@/lib/types"
import {
  searchNearbyByCategory,
  KAKAO_CATEGORY,
  type KakaoPlace,
} from "./kakao.service"

// ─── Firestore 연동 시 활성화 ────────────────────────────────────────────
// import { db } from "@/lib/firebase"
// import { doc, getDoc, collection, getDocs, query, orderBy, limit } from "firebase/firestore"
// ────────────────────────────────────────────────────────────────────────

// ─── 카테고리별 기본 사진 (Unsplash) ────────────────────────────────────
const CATEGORY_PHOTOS: Record<string, string[]> = {
  FD6: [
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&q=80",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
  ],
  CE7: [
    "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&q=80",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600&q=80",
  ],
}
const DEFAULT_PHOTOS = [
  "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
]

// ─── 유틸 함수 ──────────────────────────────────────────────────────────

/** 카카오 place ID로 4자리 티커 생성 (결정론적) */
function generateTicker(id: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let hash = parseInt(id, 10) || 0
  if (!hash) hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)

  let ticker = ""
  for (let i = 0; i < 4; i++) {
    ticker += alphabet[hash % 26]
    hash = Math.floor(hash / 26) || hash + 7
  }
  return ticker
}

/** 카카오 place ID로 기준 평점 생성 (결정론적, 3.5 ~ 4.9) */
function getBaseRating(id: string): number {
  const hash = parseInt(id, 10) || id.split("").reduce((a, c) => a + c.charCodeAt(0), 0)
  return Math.round((3.5 + (hash % 15) / 10) * 10) / 10
}

/** 거리 문자열 포맷 */
function formatDistance(distance: string): string {
  const m = parseInt(distance, 10)
  if (isNaN(m) || m === 0) return "100m 이내"
  if (m < 1000) return `${m}m`
  return `${(m / 1000).toFixed(1)}km`
}

/** 기본 운영시간 (카카오 기본 검색에는 운영시간 미포함 → 추후 Firestore or 상세 API) */
function defaultOpeningHours(): OpeningHours {
  const open = { open: "09:00", close: "22:00", closed: false }
  const closed = { open: "00:00", close: "00:00", closed: true }
  return { mon: open, tue: open, wed: open, thu: open, fri: open, sat: open, sun: closed }
}

// ─── 시계열 데이터 생성 (추후 Firestore ratingHistory 로 교체) ──────────

function makeDaily(base: number): TimeSeriesPoint[] {
  return ["0시", "2시", "4시", "6시", "8시", "10시", "12시", "14시", "16시", "18시", "20시", "22시"].map(
    (time, i) => ({
      time,
      rating: Math.max(1, Math.min(5, parseFloat((base + Math.sin(i) * 0.15).toFixed(1)))),
    })
  )
}

function makeWeekly(base: number): TimeSeriesPoint[] {
  return ["월", "화", "수", "목", "금", "토", "일"].map((time, i) => ({
    time,
    rating: Math.max(1, Math.min(5, parseFloat((base + Math.cos(i) * 0.2).toFixed(1)))),
  }))
}

function makeMonthly(base: number): TimeSeriesPoint[] {
  return Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}일`,
    rating: Math.max(1, Math.min(5, parseFloat((base + Math.sin(i * 0.3) * 0.25).toFixed(1)))),
  }))
}

function make3Month(base: number): TimeSeriesPoint[] {
  return ["1월", "2월", "3월"].flatMap((m, mi) =>
    Array.from({ length: 4 }, (_, i) => ({
      time: `${m} ${i + 1}주`,
      rating: Math.max(1, Math.min(5, parseFloat((base + Math.sin((mi * 4 + i) * 0.4) * 0.3).toFixed(1)))),
    }))
  )
}

// ─── 카카오 Place → RankedSpot 변환 ─────────────────────────────────────

function kakaoToRankedSpot(place: KakaoPlace, rank: number): RankedSpot {
  const baseRating = getBaseRating(place.id)
  const photos = CATEGORY_PHOTOS[place.category_group_code] ?? DEFAULT_PHOTOS

  // 카테고리명 정리 (ex. "음식점 > 한식 > 국밥" → "한식")
  const categoryParts = place.category_name.split(" > ")
  const category =
    categoryParts.length >= 2 ? categoryParts[1] : place.category_group_name

  return {
    id: place.id,
    ticker: generateTicker(place.id),
    name: place.place_name,
    category,
    status: "영업 중",
    distance: formatDistance(place.distance),
    address: place.road_address_name || place.address_name,
    phone: place.phone || undefined,
    lat: parseFloat(place.y),
    lng: parseFloat(place.x),

    openingHours: defaultOpeningHours(),
    photos,

    // ── 추후 Firestore spots/{id} 에서 로드 ──────────────────────────────
    rating: baseRating,
    reviewCount: 0,
    todayReviews: 0,
    likeCount: 0,
    change: 0,
    waiting: 0,
    revisitRate: 0,
    avgPrice: 0,
    high52: baseRating,
    low52: Math.max(3.0, baseRating - 0.5),
    // ─────────────────────────────────────────────────────────────────────

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    rank,

    // ── 추후 Firestore ratingHistory/{spotId} 에서 로드 ──────────────────
    timeSeries: {
      "1일": makeDaily(baseRating),
      "1주": makeWeekly(baseRating),
      "1달": makeMonthly(baseRating),
      "3달": make3Month(baseRating),
    },
  }
}

// ─── Public API ──────────────────────────────────────────────────────────

/**
 * 주변 Spot 랭킹 조회 (카카오 API + Firestore 스탯 병합)
 *
 * @param options.lat 위도 (기본: 서울 강남)
 * @param options.lng 경도 (기본: 서울 강남)
 * @param options.radius 반경 m (기본 1000)
 * @param options.count 최대 개수 (기본 20)
 */
export async function getRanking(options?: {
  lat?: number
  lng?: number
  radius?: number
  count?: number
}): Promise<RankedSpot[]> {
  const lat = options?.lat ?? 37.4979
  const lng = options?.lng ?? 127.0276
  const radius = options?.radius ?? 1000
  const count = options?.count ?? 20

  // 음식점 + 카페 동시 검색
  const [restaurants, cafes] = await Promise.all([
    searchNearbyByCategory({
      categoryCode: KAKAO_CATEGORY.RESTAURANT,
      lat,
      lng,
      radius,
      size: Math.min(45, Math.ceil(count * 0.7)),
    }),
    searchNearbyByCategory({
      categoryCode: KAKAO_CATEGORY.CAFE,
      lat,
      lng,
      radius,
      size: Math.min(45, Math.ceil(count * 0.3)),
    }),
  ])

  // 합치기 → 거리순 정렬 → 상위 count개
  const combined = [...restaurants, ...cafes]
    .sort((a, b) => parseInt(a.distance || "0") - parseInt(b.distance || "0"))
    .slice(0, count)

  // ── 추후: Firestore에서 rating 로드 후 rating 내림차순 재정렬 ─────────────
  // const enriched = await Promise.all(combined.map(enrichWithFirestoreStats))
  // return enriched
  //   .sort((a, b) => b.rating - a.rating)
  //   .map((s, i) => ({ ...s, rank: i + 1 }))
  // ──────────────────────────────────────────────────────────────────────────

  return combined.map((place, idx) => kakaoToRankedSpot(place, idx + 1))
}

/**
 * Spot 단건 조회
 */
export async function getSpotById(id: string): Promise<RankedSpot | null> {
  // ── 추후 Firestore spots/{id} 직접 조회 ──────────────────────────────────
  // const snap = await getDoc(doc(db, "spots", id))
  // if (!snap.exists()) return null
  // return { ...(snap.data() as RankedSpot), id: snap.id }
  // ──────────────────────────────────────────────────────────────────────────

  const spots = await getRanking()
  return spots.find((s) => s.id === id) ?? null
}

/**
 * 카테고리별 Spot 조회
 */
export async function getSpotsByCategory(
  category: string,
  options?: { lat?: number; lng?: number }
): Promise<RankedSpot[]> {
  const all = await getRanking(options)
  if (category === "전체") return all
  return all.filter((s) => s.category === category)
}
