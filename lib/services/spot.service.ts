/**
 * Spot Service (하이브리드)
 *
 * 기본 정보: 카카오 로컬 API에서 검색
 * 리뷰/좋아요/평점: Firestore에서 조회 (추후 연동)
 * 랭킹: 현재 mock → Firestore 연동 시 교체
 */

import type { Spot, RankedSpot } from "@/lib/types";
import { searchPlaces, kakaoPlaceToSpot } from "@/lib/services/kakao.service";
import { mockRanking } from "@/lib/mock-data";

// ─── Firestore (추후 활성화) ────────────────────────────────────────────
// import { db } from "@/lib/firebase";
// import { collection, getDocs, getDoc, doc, query, orderBy, limit, where } from "firebase/firestore";
// ────────────────────────────────────────────────────────────────────────

/**
 * 카카오 로컬 API로 주변 Spot 검색
 * @param keyword 검색어 (예: "강남 맛집")
 * @param options 좌표/반경 옵션
 */
export async function searchSpots(
  keyword: string,
  options?: { x?: string; y?: string; radius?: number; page?: number }
): Promise<Spot[]> {
  const result = await searchPlaces({
    query: keyword,
    x: options?.x,
    y: options?.y,
    radius: options?.radius,
    page: options?.page,
    size: 15,
    sort: options?.x ? "distance" : "accuracy",
  });

  return result.documents.map(kakaoPlaceToSpot);

  // ── Firestore 보강 (추후) ─────────────────────────────────────────────
  // Firestore에서 리뷰 수, 평점, 좋아요 수를 조회하여 merge
  // const spots = result.documents.map(kakaoPlaceToSpot);
  // return Promise.all(spots.map(async (spot) => {
  //   const firestoreSnap = await getDoc(doc(db, "spots", spot.id));
  //   if (firestoreSnap.exists()) {
  //     const fsData = firestoreSnap.data();
  //     return { ...spot, rating: fsData.rating, reviewCount: fsData.reviewCount, likeCount: fsData.likeCount };
  //   }
  //   return spot;
  // }));
}

/**
 * 인기 Spot 랭킹 조회
 * 현재: mock 데이터 / 추후: Firestore의 spots 컬렉션에서 평점 높은 순 조회
 */
export async function getRanking(count = 10): Promise<RankedSpot[]> {
  // ── mock ──────────────────────────────────────────────────────────────
  return mockRanking.slice(0, count);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const q = query(collection(db, "spots"), orderBy("rating", "desc"), limit(count));
  // const snap = await getDocs(q);
  // return snap.docs.map((doc, idx) => ({
  //   ...(doc.data() as Omit<RankedSpot, "id" | "rank">),
  //   id: doc.id,
  //   rank: idx + 1,
  //   timeSeries: {},
  // }));
}

/**
 * Spot 단건 조회
 */
export async function getSpotById(id: string): Promise<RankedSpot | null> {
  return mockRanking.find((s) => s.id === id) ?? null;
}

/**
 * 카테고리별 Spot 조회
 */
export async function getSpotsByCategory(category: string): Promise<RankedSpot[]> {
  if (category === "전체") return mockRanking;
  return mockRanking.filter((s) => s.category === category);
}
