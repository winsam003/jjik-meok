/**
 * Like Service
 *
 * Firestore 컬렉션: likes
 * 좋아요 추가/취소 시 spots/{spotId} 의 likeCount 도 함께 업데이트
 */

import { db, auth } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  doc,
  increment,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";

/**
 * 현재 로그인 유저가 해당 Spot을 좋아요 했는지 확인
 */
export async function isLiked(spotId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) return false;

  const q = query(
    collection(db, "likes"),
    where("spotId", "==", spotId),
    where("userId", "==", user.uid)
  );
  const snap = await getDocs(q);
  return !snap.empty;
}

/**
 * 좋아요 토글 (추가 or 취소)
 * @returns true = 좋아요 추가됨, false = 좋아요 취소됨
 */
export async function toggleLike(spotId: string): Promise<boolean> {
  const user = auth.currentUser;
  if (!user) throw new Error("로그인이 필요합니다.");

  const q = query(
    collection(db, "likes"),
    where("spotId", "==", spotId),
    where("userId", "==", user.uid)
  );
  const snap = await getDocs(q);

  const spotRef = doc(db, "spots", spotId);
  const spotSnap = await getDoc(spotRef);

  if (!snap.empty) {
    // 좋아요 취소
    await deleteDoc(snap.docs[0].ref);
    if (spotSnap.exists()) {
      await updateDoc(spotRef, { likeCount: increment(-1) });
    }
    return false;
  } else {
    // 좋아요 추가
    await addDoc(collection(db, "likes"), {
      spotId,
      userId: user.uid,
      createdAt: serverTimestamp(),
    });
    if (spotSnap.exists()) {
      await updateDoc(spotRef, { likeCount: increment(1) });
    } else {
      // spots 도큐먼트 없으면 새로 생성
      await setDoc(spotRef, {
        likeCount: 1,
        reviewCount: 0,
        rating: 0,
        todayReviews: 0,
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  }
}
