/**
 * Spot Service
 *
 * 데이터 흐름:
 *  기본 정보 (이름, 주소, 좌표, 사진) → 카카오 로컬 API
 *  리뷰 / 좋아요 / 평점               → Firestore (현재 스텁, 추후 연동)
 *
 * Firestore 컬렉션: spots / reviews / likes / ratingHistory
 */

import type { RankedSpot, OpeningHours } from "@/lib/types"
import {
  searchNearbyByCategory,
  KAKAO_CATEGORY,
  type KakaoPlace,
  type KakaoCategoryCode,
} from "./kakao.service"

/** 앱에서 사용하는 카테고리 목록 */
export const SPOT_CATEGORIES = [
  { label: "전체",    code: null,                        emoji: "🗺️" },
  { label: "음식점",  code: KAKAO_CATEGORY.RESTAURANT,   emoji: "🍽️" },
  { label: "카페",    code: KAKAO_CATEGORY.CAFE,          emoji: "☕" },
  { label: "편의점",  code: KAKAO_CATEGORY.CONVENIENCE,  emoji: "🏪" },
  { label: "병원",    code: KAKAO_CATEGORY.HOSPITAL,     emoji: "🏥" },
  { label: "약국",    code: KAKAO_CATEGORY.PHARMACY,     emoji: "💊" },
] as const

export type SpotCategoryLabel = (typeof SPOT_CATEGORIES)[number]["label"]

/** 카테고리별 서브카테고리 (category_name 필터링용) */
export const SPOT_SUBCATEGORIES: Record<string, Array<{ label: string; emoji: string; keyword: string }>> = {
  FD6: [
    { label: "한식",      emoji: "🍚", keyword: "한식" },
    { label: "일식",      emoji: "🍣", keyword: "일식" },
    { label: "중식",      emoji: "🥢", keyword: "중식" },
    { label: "양식",      emoji: "🍝", keyword: "양식" },
    { label: "치킨",      emoji: "🍗", keyword: "치킨" },
    { label: "분식",      emoji: "🍜", keyword: "분식" },
    { label: "고기",      emoji: "🥩", keyword: "고기" },
    { label: "패스트푸드", emoji: "🍔", keyword: "패스트푸드" },
    { label: "술집",      emoji: "🍺", keyword: "술집" },
    { label: "해산물",    emoji: "🦞", keyword: "해산물" },
  ],
  CE7: [
    { label: "카페",      emoji: "☕", keyword: "카페" },
    { label: "베이커리",  emoji: "🥐", keyword: "베이커리" },
    { label: "디저트",    emoji: "🍰", keyword: "디저트" },
    { label: "아이스크림", emoji: "🍦", keyword: "아이스크림" },
    { label: "주스",      emoji: "🧃", keyword: "주스" },
  ],
  HP8: [
    { label: "내과",      emoji: "🩺", keyword: "내과" },
    { label: "치과",      emoji: "🦷", keyword: "치과" },
    { label: "피부과",    emoji: "💆", keyword: "피부과" },
    { label: "안과",      emoji: "👁️", keyword: "안과" },
    { label: "정형외과",  emoji: "🦴", keyword: "정형외과" },
    { label: "한의원",    emoji: "🌿", keyword: "한의원" },
    { label: "소아과",    emoji: "👶", keyword: "소아과" },
    { label: "이비인후과", emoji: "👂", keyword: "이비인후과" },
    { label: "산부인과",  emoji: "🤰", keyword: "산부인과" },
    { label: "정신건강의학과", emoji: "🧠", keyword: "정신건강의학과" },
  ],
}
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

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

// ─── Firestore stats 병합 ────────────────────────────────────────────────

interface FirestoreSpotStats {
  rating: number
  reviewCount: number
  todayReviews: number
  likeCount: number
}

async function fetchFirestoreStats(spotId: string): Promise<FirestoreSpotStats | null> {
  try {
    const snap = await getDoc(doc(db, "spots", spotId))
    if (!snap.exists()) return null
    const d = snap.data()
    return {
      rating: d.rating ?? 0,
      reviewCount: d.reviewCount ?? 0,
      todayReviews: d.todayReviews ?? 0,
      likeCount: d.likeCount ?? 0,
    }
  } catch {
    return null
  }
}

// ─── 카카오 Place → RankedSpot 변환 ─────────────────────────────────────

function kakaoToRankedSpot(place: KakaoPlace, rank: number = 0, fsStats?: FirestoreSpotStats | null): RankedSpot {
  const photos = CATEGORY_PHOTOS[place.category_group_code] ?? DEFAULT_PHOTOS

  // Firestore 실데이터 우선 사용, 리뷰 없으면 rating 0 (가짜 데이터 표시 안 함)
  const reviewCount = fsStats?.reviewCount ?? 0
  const rating = reviewCount > 0 ? (fsStats?.rating ?? 0) : 0
  const todayReviews = fsStats?.todayReviews ?? 0
  const likeCount = fsStats?.likeCount ?? 0

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

    rating,
    reviewCount,
    todayReviews,
    likeCount,
    change: 0,
    waiting: 0,
    revisitRate: 0,
    avgPrice: 0,
    high52: rating,
    low52: rating > 0 ? Math.max(1.0, rating - 0.5) : 0,

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    rank,

    // 차트 데이터는 ranking-panel에서 getRatingHistory로 lazy load
    timeSeries: { "1일": [], "1주": [], "1달": [], "3달": [] },
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
  categoryCode?: KakaoCategoryCode | null
  subFilter?: string | null
}): Promise<RankedSpot[]> {
  const lat = options?.lat ?? 37.4979
  const lng = options?.lng ?? 127.0276
  const radius = options?.radius ?? 1000
  const count = options?.count ?? 20
  const categoryCode = options?.categoryCode ?? null
  const subFilter = options?.subFilter ?? null

  let places: KakaoPlace[]

  if (categoryCode) {
    // 특정 카테고리만 검색 (카카오 카테고리 API size 최대 15)
    places = await searchNearbyByCategory({
      categoryCode,
      lat,
      lng,
      radius,
      size: Math.min(15, count),
    })
  } else {
    // 전체: 모든 카테고리 동시 검색
    const allCategories = Object.values(KAKAO_CATEGORY)
    const results = await Promise.all(
      allCategories.map((code) =>
        searchNearbyByCategory({
          categoryCode: code,
          lat,
          lng,
          radius,
          size: 15,
        }).catch(() => [] as KakaoPlace[])
      )
    )
    // 중복 제거 (같은 place ID)
    const seen = new Set<string>()
    places = results.flat().filter((p) => {
      if (seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }

  // 서브카테고리 필터 (category_name에 keyword 포함 여부)
  const filtered = subFilter
    ? places.filter((p) => p.category_name.includes(subFilter))
    : places

  // 거리순 정렬 (전체 카테고리일 때는 전부 표시, 개별 카테고리는 count 제한)
  const sorted = filtered
    .sort((a, b) => parseInt(a.distance || "0") - parseInt(b.distance || "0"))
  const combined = categoryCode ? sorted.slice(0, count) : sorted

  // Firestore stats 병렬 조회
  const statsArray = await Promise.all(
    combined.map((place) => fetchFirestoreStats(place.id))
  )

  // 모든 Spot은 기본 rank = 0 (순위 없음)
  const spots = combined.map((place, idx) =>
    kakaoToRankedSpot(place, 0, statsArray[idx])
  )

  // 리뷰 있는 Spot만 평점순으로 순위 부여
  const withReview = spots.filter((s) => s.reviewCount > 0)
  if (withReview.length > 0) {
    withReview.sort((a, b) => b.rating - a.rating)
    withReview.forEach((s, i) => { s.rank = i + 1 })
  }

  // 리뷰 있는 Spot 상단, 없는 Spot 하단
  const withoutReview = spots.filter((s) => s.reviewCount === 0)
  return [...withReview, ...withoutReview]
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
