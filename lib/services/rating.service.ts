/**
 * Rating History Service
 *
 * 현재: mock 데이터 반환
 * 추후: 아래 주석 처리된 Firestore 코드로 교체
 *
 * Firestore 컬렉션: ratingHistory/{spotId}/daily/{YYYY-MM-DD}
 * 도큐먼트 필드: { date: string, rating: number }
 */

import type { RatingHistory, TimeSeriesPoint } from "@/lib/types";
import { mockRanking } from "@/lib/mock-data";

// ─── 추후 Firestore 연동 시 활성화 ───────────────────────────────────────
// import { db } from "@/lib/firebase";
// import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
// ────────────────────────────────────────────────────────────────────────

/**
 * Spot 평점 히스토리 조회
 * @param spotId
 * @param period 기간 (1일 | 1주 | 1달 | 3달)
 */
export async function getRatingHistory(
  spotId: string,
  period: RatingHistory["period"]
): Promise<TimeSeriesPoint[]> {
  // ── mock ──────────────────────────────────────────────────────────────
  const spot = mockRanking.find((s) => s.id === spotId);
  return spot?.timeSeries[period] ?? [];

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const periodLimitMap: Record<RatingHistory["period"], number> = {
  //   "1일":  24,
  //   "1주":   7,
  //   "1달":  30,
  //   "3달":  12,
  // };
  // const q = query(
  //   collection(db, "ratingHistory", spotId, "daily"),
  //   orderBy("date", "desc"),
  //   limit(periodLimitMap[period])
  // );
  // const snap = await getDocs(q);
  // return snap.docs
  //   .map((doc) => ({ time: doc.data().date as string, rating: doc.data().rating as number }))
  //   .reverse();
}

/**
 * 평점 히스토리 전체 기간 조회
 */
export async function getAllRatingHistories(spotId: string): Promise<Record<RatingHistory["period"], TimeSeriesPoint[]>> {
  const [d1, d7, d30, d90] = await Promise.all([
    getRatingHistory(spotId, "1일"),
    getRatingHistory(spotId, "1주"),
    getRatingHistory(spotId, "1달"),
    getRatingHistory(spotId, "3달"),
  ]);
  return { "1일": d1, "1주": d7, "1달": d30, "3달": d90 };
}
