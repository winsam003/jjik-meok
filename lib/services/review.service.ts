/**
 * Review Service
 *
 * 현재: mock 데이터 반환 / 작성은 콘솔 로그
 * 추후: 아래 주석 처리된 Firestore 코드로 교체
 *
 * Firestore 컬렉션: reviews
 * 필드 구조는 lib/types/index.ts 의 Review 인터페이스 참고
 */

import type { Review, CreateReviewInput } from "@/lib/types";
import { mockReviews } from "@/lib/mock-data";

// ─── 추후 Firestore 연동 시 활성화 ───────────────────────────────────────
// import { db, auth } from "@/lib/firebase";
// import {
//   collection, addDoc, getDocs, query,
//   orderBy, where, serverTimestamp,
//   doc, increment, runTransaction,
// } from "firebase/firestore";
// ────────────────────────────────────────────────────────────────────────

/**
 * 특정 Spot의 리뷰 목록 조회
 * @param spotId
 */
export async function getReviews(spotId: string): Promise<Review[]> {
  // ── mock ──────────────────────────────────────────────────────────────
  return mockReviews.filter((r) => r.spotId === spotId);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const q = query(
  //   collection(db, "reviews"),
  //   where("spotId", "==", spotId),
  //   orderBy("createdAt", "desc")
  // );
  // const snap = await getDocs(q);
  // return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Review));
}

/**
 * 리뷰 작성
 * 리뷰 작성 후 spots 도큐먼트의 rating, reviewCount, todayReviews 업데이트
 */
export async function createReview(input: CreateReviewInput): Promise<void> {
  // ── mock ──────────────────────────────────────────────────────────────
  console.log("[mock] 리뷰 작성:", input);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const user = auth.currentUser;
  // if (!user) throw new Error("로그인이 필요합니다.");
  //
  // await runTransaction(db, async (tx) => {
  //   const reviewRef = doc(collection(db, "reviews"));
  //   tx.set(reviewRef, {
  //     ...input,
  //     userId: user.uid,
  //     userNickname: user.displayName ?? "익명",
  //     userPhotoUrl: user.photoURL ?? null,
  //     createdAt: serverTimestamp(),
  //   });
  //
  //   const spotRef = doc(db, "spots", input.spotId);
  //   tx.update(spotRef, {
  //     reviewCount: increment(1),
  //     todayReviews: increment(1),
  //     // rating 재계산은 Cloud Function 권장
  //   });
  // });
}
