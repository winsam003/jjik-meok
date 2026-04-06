/**
 * Review Service
 *
 * Firestore 컬렉션: reviews
 * 리뷰 작성 시 spots/{spotId} 의 reviewCount, rating 도 함께 업데이트
 */

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  doc,
  increment,
  runTransaction,
  getDoc,
} from "firebase/firestore";
import type { Review, CreateReviewInput } from "@/lib/types";

/**
 * 특정 Spot의 리뷰 목록 조회 (최신순)
 */
export async function getReviews(spotId: string): Promise<Review[]> {
  const q = query(
    collection(db, "reviews"),
    where("spotId", "==", spotId),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      spotId: data.spotId,
      userId: data.userId,
      userNickname: data.userNickname,
      userPhotoUrl: data.userPhotoUrl ?? undefined,
      rating: data.rating,
      content: data.content,
      imageUrls: data.imageUrls ?? [],
      createdAt:
        data.createdAt?.toDate?.()?.toISOString() ?? new Date().toISOString(),
    } as Review;
  });
}

/**
 * 리뷰 작성
 * - reviews 컬렉션에 도큐먼트 추가
 * - spots/{spotId} 의 reviewCount +1, rating 재계산
 */
export async function createReview(input: CreateReviewInput): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  await runTransaction(db, async (tx) => {
    // 1. 현재 spot 평점 정보 조회
    const spotRef = doc(db, "spots", input.spotId);
    const spotSnap = await tx.get(spotRef);

    // 2. 리뷰 도큐먼트 추가
    const reviewRef = doc(collection(db, "reviews"));
    tx.set(reviewRef, {
      spotId: input.spotId,
      userId: user.uid,
      userNickname: user.displayName ?? "익명",
      userPhotoUrl: user.photoURL ?? null,
      rating: input.rating,
      content: input.content,
      imageUrls: input.imageUrls ?? [],
      createdAt: serverTimestamp(),
    });

    // 3. spot 통계 업데이트
    if (spotSnap.exists()) {
      const spotData = spotSnap.data();
      const prevCount = spotData.reviewCount ?? 0;
      const prevRating = spotData.rating ?? 0;
      // 누적 평균 재계산
      const newCount = prevCount + 1;
      const newRating =
        Math.round(
          ((prevRating * prevCount + input.rating) / newCount) * 10
        ) / 10;

      tx.update(spotRef, {
        reviewCount: newCount,
        rating: newRating,
        todayReviews: increment(1),
        updatedAt: serverTimestamp(),
      });

      // 4. 일별 평점 스냅샷 저장 (차트 데이터용)
      const today = new Date().toISOString().split("T")[0]; // "2026-04-03"
      const historyRef = doc(db, "ratingHistory", input.spotId, "daily", today);
      tx.set(historyRef, {
        rating: newRating,
        reviewCount: newCount,
        date: today,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    } else {
      // spots 도큐먼트가 없으면 새로 생성
      tx.set(spotRef, {
        reviewCount: 1,
        rating: input.rating,
        todayReviews: 1,
        likeCount: 0,
        updatedAt: serverTimestamp(),
      });

      // 일별 스냅샷도 생성
      const today = new Date().toISOString().split("T")[0];
      const historyRef = doc(db, "ratingHistory", input.spotId, "daily", today);
      tx.set(historyRef, {
        rating: input.rating,
        reviewCount: 1,
        date: today,
        updatedAt: serverTimestamp(),
      });
    }
  });
}

/**
 * Spot의 평균 평점 조회 (Firestore spots 도큐먼트 기준)
 */
export async function getSpotRating(
  spotId: string
): Promise<{ rating: number; reviewCount: number } | null> {
  const snap = await getDoc(doc(db, "spots", spotId));
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    rating: data.rating ?? 0,
    reviewCount: data.reviewCount ?? 0,
  };
}
