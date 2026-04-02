/**
 * Like Service
 *
 * 현재: mock (로컬 상태, 새로고침 시 초기화)
 * 추후: 아래 주석 처리된 Firestore 코드로 교체
 *
 * Firestore 컬렉션: likes
 * 필드 구조는 lib/types/index.ts 의 Like 인터페이스 참고
 */

// ─── 추후 Firestore 연동 시 활성화 ───────────────────────────────────────
// import { db, auth } from "@/lib/firebase";
// import {
//   collection, addDoc, deleteDoc, getDocs,
//   query, where, serverTimestamp, doc, increment, updateDoc,
// } from "firebase/firestore";
// ────────────────────────────────────────────────────────────────────────

// mock용 로컬 좋아요 저장소
const likedSpots = new Set<string>();

/**
 * 좋아요 여부 확인
 * @param spotId
 */
export async function isLiked(spotId: string): Promise<boolean> {
  // ── mock ──────────────────────────────────────────────────────────────
  return likedSpots.has(spotId);

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const user = auth.currentUser;
  // if (!user) return false;
  // const q = query(
  //   collection(db, "likes"),
  //   where("spotId", "==", spotId),
  //   where("userId", "==", user.uid)
  // );
  // const snap = await getDocs(q);
  // return !snap.empty;
}

/**
 * 좋아요 토글 (좋아요 추가 or 취소)
 * @param spotId
 * @returns true = 좋아요 추가됨, false = 좋아요 취소됨
 */
export async function toggleLike(spotId: string): Promise<boolean> {
  // ── mock ──────────────────────────────────────────────────────────────
  if (likedSpots.has(spotId)) {
    likedSpots.delete(spotId);
    console.log("[mock] 좋아요 취소:", spotId);
    return false;
  } else {
    likedSpots.add(spotId);
    console.log("[mock] 좋아요 추가:", spotId);
    return true;
  }

  // ── Firestore 연동 시 아래로 교체 ──────────────────────────────────────
  // const user = auth.currentUser;
  // if (!user) throw new Error("로그인이 필요합니다.");
  //
  // const q = query(
  //   collection(db, "likes"),
  //   where("spotId", "==", spotId),
  //   where("userId", "==", user.uid)
  // );
  // const snap = await getDocs(q);
  //
  // if (!snap.empty) {
  //   // 좋아요 취소
  //   await deleteDoc(snap.docs[0].ref);
  //   await updateDoc(doc(db, "spots", spotId), { likeCount: increment(-1) });
  //   return false;
  // } else {
  //   // 좋아요 추가
  //   await addDoc(collection(db, "likes"), {
  //     spotId,
  //     userId: user.uid,
  //     createdAt: serverTimestamp(),
  //   });
  //   await updateDoc(doc(db, "spots", spotId), { likeCount: increment(1) });
  //   return true;
  // }
}
