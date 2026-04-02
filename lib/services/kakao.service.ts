/**
 * 카카오 로컬 API 서비스
 *
 * 브라우저 → /api/kakao/places (Next.js 서버) → 카카오 API
 * CORS 우회 + API 키 보호를 위해 서버 프록시 경유
 */

/** 카카오 장소 검색 결과 도큐먼트 */
export interface KakaoPlace {
  id: string
  place_name: string
  category_name: string       // ex) "음식점 > 한식 > 국밥"
  category_group_code: string // ex) "FD6"
  category_group_name: string // ex) "음식점"
  phone: string
  address_name: string        // 지번 주소
  road_address_name: string   // 도로명 주소
  x: string                   // 경도 (longitude)
  y: string                   // 위도 (latitude)
  place_url: string
  distance: string            // 단위: m (검색 중심 기준)
}

export interface KakaoSearchResult {
  documents: KakaoPlace[]
  meta: {
    total_count: number
    pageable_count: number
    is_end: boolean
  }
}

/** 카카오 카테고리 그룹 코드 */
export const KAKAO_CATEGORY = {
  RESTAURANT: "FD6",  // 음식점
  CAFE: "CE7",        // 카페
  CONVENIENCE: "CS2", // 편의점
  HOSPITAL: "HP8",    // 병원
  PHARMACY: "PM9",    // 약국
} as const

export type KakaoCategoryCode = (typeof KAKAO_CATEGORY)[keyof typeof KAKAO_CATEGORY]

/**
 * 주변 장소 검색 (카테고리 기반)
 * @param options.categoryCode 카테고리 코드 (FD6, CE7 등)
 * @param options.lng 경도 (x)
 * @param options.lat 위도 (y)
 * @param options.radius 반경 (m), 기본 1000
 * @param options.size 결과 수, 기본 15 (max 45)
 */
export async function searchNearbyByCategory(options: {
  categoryCode: KakaoCategoryCode
  lng: number
  lat: number
  radius?: number
  size?: number
}): Promise<KakaoPlace[]> {
  const params = new URLSearchParams({
    category_group_code: options.categoryCode,
    x: options.lng.toString(),
    y: options.lat.toString(),
    radius: (options.radius ?? 1000).toString(),
    size: (options.size ?? 15).toString(),
  })

  const res = await fetch(`/api/kakao/places?${params.toString()}`)
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    console.error("[kakao.service] 카테고리 검색 실패:", res.status, errBody)
    throw new Error(`카카오 카테고리 검색 실패 (${res.status}): ${JSON.stringify(errBody)}`)
  }

  const data: KakaoSearchResult = await res.json()
  return data.documents ?? []
}

/**
 * 키워드로 주변 장소 검색
 * @param options.query 검색어
 * @param options.lng 경도 (x)
 * @param options.lat 위도 (y)
 * @param options.radius 반경 (m), 기본 1000
 * @param options.size 결과 수, 기본 15
 */
export async function searchNearbyByKeyword(options: {
  query: string
  lng: number
  lat: number
  radius?: number
  size?: number
}): Promise<KakaoPlace[]> {
  const params = new URLSearchParams({
    query: options.query,
    x: options.lng.toString(),
    y: options.lat.toString(),
    radius: (options.radius ?? 1000).toString(),
    size: (options.size ?? 15).toString(),
  })

  const res = await fetch(`/api/kakao/places?${params.toString()}`)
  if (!res.ok) throw new Error("카카오 키워드 검색 실패")

  const data: KakaoSearchResult = await res.json()
  return data.documents ?? []
}
