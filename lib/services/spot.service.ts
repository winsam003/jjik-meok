/**
 * Spot Service
 *
 * 현재: mock 데이터 반환
 * 추후: 아래 주석 처리된 Firestore 코드로 교체
 *
 * Firestore 컬렉션: spots
 * 필드 구조는 lib/types/index.ts 의 Spot 인터페이스 참고
 */

import type { RankedSpot } from "@/lib/types";
import { mockRanking } from "@/lib/mock-data";

// ─── 추후 Firestore 연동 시 활성화 ───────────────────────────────────────
// import { db } from "@/lib/firebase";
// import {
//   collection, getDocs, getDoc, doc,
//   query, orderBy, limit, where,
// } from "firebase/firestore";
// ────────────────────────────────────────────────────────────────────────

/**
 * 인기 Spot 랭킹 조회
 * @param count 가져올 개수 (기본 10)
 */
export async function getRanking(count = 10): Promise<RankedSpot[]> {
  // ── mock ──────────────────────────────────────────────────────────────
  return mockRanking.slice(0, count);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const q = query(
  //   collection(db, "spots"),
  //   orderBy("rating", "desc"),
  //   limit(count)
  // );
  // const snap = await getDocs(q);
  // return snap.docs.map((doc, idx) => ({
  //   ...(doc.data() as Omit<RankedSpot, "id" | "rank">),
  //   id: doc.id,
  //   rank: idx + 1,
  //   timeSeries: await getAllRatingHistories(doc.id),
  // }));
}

/**
 * Spot 단건 조회
 * @param id Firestore document ID
 */
export async function getSpotById(id: string): Promise<RankedSpot | null> {
  // ── mock ──────────────────────────────────────────────────────────────
  return mockRanking.find((s) => s.id === id) ?? null;

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const snap = await getDoc(doc(db, "spots", id));
  // if (!snap.exists()) return null;
  // return {
  //   ...(snap.data() as Omit<RankedSpot, "id" | "rank">),
  //   id: snap.id,
  //   rank: 0,
  //   timeSeries: await getAllRatingHistories(snap.id),
  // };
}

/**
 * 카테고리별 Spot 조회
 * @param category 카테고리명
 */
export async function getSpotsByCategory(category: string): Promise<RankedSpot[]> {
  // ── mock ──────────────────────────────────────────────────────────────
  if (category === "전체") return mockRanking;
  return mockRanking.filter((s) => s.category === category);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const q = query(
  //   collection(db, "spots"),
  //   where("category", "==", category),
  //   orderBy("rating", "desc")
  // );
  // const snap = await getDocs(q);
  // return snap.docs.map((doc, idx) => ({
  //   ...(doc.data() as Omit<RankedSpot, "id" | "rank">),
  //   id: doc.id,
  //   rank: idx + 1,
  //   timeSeries: await getAllRatingHistories(doc.id),
  // }));
}
