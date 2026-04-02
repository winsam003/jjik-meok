// ─────────────────────────────────────────────
// Firestore 컬렉션 구조
//
// spots/{spotId}
// reviews/{reviewId}
// likes/{likeId}
// ratingHistory/{spotId}/daily/{YYYY-MM-DD}
// ─────────────────────────────────────────────

export interface TimeSeriesPoint {
  time: string;
  rating: number;
}

export interface DayHours {
  open: string;    // "09:00"
  close: string;   // "22:00"
  closed: boolean; // 휴무일
}

export interface OpeningHours {
  mon: DayHours;
  tue: DayHours;
  wed: DayHours;
  thu: DayHours;
  fri: DayHours;
  sat: DayHours;
  sun: DayHours;
}

/** spots 컬렉션 도큐먼트 */
export interface Spot {
  id: string;              // Firestore document ID
  ticker: string;          // 증권 코드 (예: KPOT)
  name: string;
  category: string;        // 한식 | 양식 | 고기 | 카페 | 분식 | 의료 ...
  status: string;          // 영업 중 | 영업 준비 중 | 영업 종료
  distance: string;        // 사용자 위치 기반 계산값 (클라이언트 계산)
  address: string;         // 도로명 주소
  phone?: string;          // 전화번호
  lat: number;
  lng: number;

  openingHours: OpeningHours; // 요일별 운영시간
  photos: string[];           // 사진 URL 목록 (Firebase Storage)

  // 집계 필드 (리뷰 작성 시 Cloud Function 또는 트랜잭션으로 업데이트)
  rating: number;          // 평균 평점
  reviewCount: number;     // 전체 리뷰 수
  todayReviews: number;    // 오늘 리뷰 수
  likeCount: number;       // 좋아요 수
  change: number;          // 전일 대비 평점 변화
  waiting: number;         // 현재 대기 인원
  revisitRate: number;     // 재방문율 (%)
  avgPrice: number;        // 평균 가격 (원)
  high52: number;          // 52주 최고 평점
  low52: number;           // 52주 최저 평점

  createdAt: string;       // ISO string (Firestore Timestamp → 직렬화)
  updatedAt: string;
}

/** reviews 컬렉션 도큐먼트 */
export interface Review {
  id: string;              // Firestore document ID
  spotId: string;
  userId: string;
  userNickname: string;
  userPhotoUrl?: string;
  rating: number;          // 1 ~ 5
  content: string;
  imageUrls?: string[];    // Firebase Storage URL 목록
  createdAt: string;
}

/** likes 컬렉션 도큐먼트 */
export interface Like {
  id: string;              // Firestore document ID
  spotId: string;
  userId: string;
  createdAt: string;
}

/** 평점 히스토리 (차트용) */
export interface RatingHistory {
  spotId: string;
  period: "1일" | "1주" | "1달" | "3달";
  data: TimeSeriesPoint[];
}

/** 랭킹 조회 결과 (Spot + rank 순위 포함) */
export interface RankedSpot extends Spot {
  rank: number;
  timeSeries: Record<RatingHistory["period"], TimeSeriesPoint[]>;
}

/** 리뷰 작성 요청 */
export type CreateReviewInput = Pick<Review, "spotId" | "rating" | "content" | "imageUrls">;
