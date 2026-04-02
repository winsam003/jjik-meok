import type { KakaoSearchResponse, KakaoSearchParams, KakaoPlace } from "@/lib/types/kakao";
import type { Spot } from "@/lib/types";

/**
 * 카카오 로컬 검색 (Next.js API Route 프록시 경유)
 */
export async function searchPlaces(params: KakaoSearchParams): Promise<KakaoSearchResponse> {
  const qs = new URLSearchParams();
  qs.set("query", params.query);
  if (params.category_group_code) qs.set("category_group_code", params.category_group_code);
  if (params.x) qs.set("x", params.x);
  if (params.y) qs.set("y", params.y);
  if (params.radius) qs.set("radius", String(params.radius));
  if (params.page) qs.set("page", String(params.page));
  if (params.size) qs.set("size", String(params.size));
  if (params.sort) qs.set("sort", params.sort);

  const res = await fetch(`/api/kakao/search?${qs.toString()}`);
  if (!res.ok) throw new Error("카카오 검색 실패");
  return res.json();
}

/**
 * 카카오 카테고리 코드 → 앱 카테고리 매핑
 */
function mapCategory(place: KakaoPlace): string {
  const cat = place.category_name;
  if (cat.includes("한식")) return "한식";
  if (cat.includes("중식") || cat.includes("중국")) return "중식";
  if (cat.includes("일식") || cat.includes("초밥") || cat.includes("스시")) return "일식";
  if (cat.includes("양식") || cat.includes("이탈리안") || cat.includes("프렌치")) return "양식";
  if (cat.includes("고기") || cat.includes("육류") || cat.includes("삼겹") || cat.includes("갈비")) return "고기";
  if (cat.includes("분식") || cat.includes("떡볶이")) return "분식";
  if (cat.includes("치킨")) return "치킨";
  if (cat.includes("피자") || cat.includes("햄버거") || cat.includes("패스트")) return "패스트푸드";
  if (place.category_group_code === "CE7") return "카페";
  return "기타";
}

/**
 * 티커 코드 생성 (이름 기반)
 */
function generateTicker(name: string): string {
  // 한글 이름에서 자음 추출하거나, 영문이면 앞 4글자
  const clean = name.replace(/\s/g, "");
  if (/^[a-zA-Z]/.test(clean)) {
    return clean.slice(0, 4).toUpperCase();
  }
  // 한글: 앞 2글자 + 랜덤
  return clean.slice(0, 2);
}

/**
 * KakaoPlace → Spot 변환
 * 카카오에서 제공하지 않는 필드는 기본값으로 채움
 * (리뷰/좋아요/평점 등은 Firestore에서 별도 조회)
 */
export function kakaoPlaceToSpot(place: KakaoPlace): Spot {
  return {
    id: `kakao_${place.id}`,
    ticker: generateTicker(place.place_name),
    name: place.place_name,
    category: mapCategory(place),
    status: "영업 중",
    distance: place.distance ? `${place.distance}m` : "",
    address: place.road_address_name || place.address_name,
    phone: place.phone || undefined,
    lat: parseFloat(place.y),
    lng: parseFloat(place.x),
    openingHours: {
      mon: { open: "09:00", close: "22:00", closed: false },
      tue: { open: "09:00", close: "22:00", closed: false },
      wed: { open: "09:00", close: "22:00", closed: false },
      thu: { open: "09:00", close: "22:00", closed: false },
      fri: { open: "09:00", close: "22:00", closed: false },
      sat: { open: "10:00", close: "22:00", closed: false },
      sun: { open: "10:00", close: "21:00", closed: false },
    },
    photos: [],
    rating: 0,
    reviewCount: 0,
    todayReviews: 0,
    likeCount: 0,
    change: 0,
    waiting: 0,
    revisitRate: 0,
    avgPrice: 0,
    high52: 0,
    low52: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
