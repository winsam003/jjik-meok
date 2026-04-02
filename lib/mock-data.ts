/**
 * 개발용 Mock 데이터
 * Firestore 연동 후 이 파일은 삭제하거나 테스트용으로만 유지
 */

import type { RankedSpot, Review, OpeningHours } from "@/lib/types";

const makeDaily = (base: number) =>
  ["0:00","2:00","4:00","6:00","8:00","10:00","12:00","14:00","16:00","18:00","20:00","22:00"].map((time, i) => ({
    time,
    rating: parseFloat((base + (Math.random() - 0.5) * 0.3 + (i === 11 ? 0.2 : 0)).toFixed(1)),
  }));

const makeWeekly = (base: number) =>
  ["월","화","수","목","금","토","일"].map((time) => ({
    time,
    rating: parseFloat((base + (Math.random() - 0.5) * 0.4).toFixed(1)),
  }));

const makeMonthly = (base: number) =>
  Array.from({ length: 30 }, (_, i) => ({
    time: `${i + 1}일`,
    rating: parseFloat((base + (Math.random() - 0.5) * 0.5).toFixed(1)),
  }));

const make3Month = (base: number) =>
  ["1월","2월","3월"].flatMap((m) =>
    Array.from({ length: 4 }, (_, i) => ({
      time: `${m} ${i + 1}주`,
      rating: parseFloat((base + (Math.random() - 0.5) * 0.6).toFixed(1)),
    }))
  );

const weekdayHours = (open: string, close: string): OpeningHours => ({
  mon: { open, close, closed: false },
  tue: { open, close, closed: false },
  wed: { open, close, closed: false },
  thu: { open, close, closed: false },
  fri: { open, close, closed: false },
  sat: { open, close, closed: false },
  sun: { open, close, closed: true },
});

export const mockRanking: RankedSpot[] = [
  {
    id: "spot_001", rank: 1, ticker: "KPOT", name: "맛있는 감자탕",
    category: "한식", status: "영업 중", distance: "도보 3분",
    address: "서울시 강남구 테헤란로 123", phone: "02-1234-5678",
    rating: 4.8, change: +0.2, reviewCount: 320, todayReviews: 12,
    likeCount: 142, waiting: 7, revisitRate: 68, avgPrice: 12000,
    high52: 4.9, low52: 4.2,
    lat: 37.4215, lng: 127.1255,
    photos: [
      "https://images.unsplash.com/photo-1547592180-85f173990554?w=400",
      "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400",
    ],
    openingHours: weekdayHours("10:00", "22:00"),
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.6), "1주": makeWeekly(4.6), "1달": makeMonthly(4.6), "3달": make3Month(4.5) },
  },
  {
    id: "spot_002", rank: 2, ticker: "SUSH", name: "스시 미야코",
    category: "양식", status: "영업 중", distance: "도보 7분",
    address: "서울시 강남구 역삼동 456", phone: "02-2345-6789",
    rating: 4.6, change: -0.1, reviewCount: 218, todayReviews: 8,
    likeCount: 98, waiting: 3, revisitRate: 72, avgPrice: 35000,
    high52: 4.8, low52: 4.1,
    lat: 37.4195, lng: 127.1285,
    photos: [
      "https://images.unsplash.com/photo-1611143669185-af224c5e3252?w=400",
      "https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=400",
    ],
    openingHours: {
      ...weekdayHours("11:30", "21:30"),
      mon: { open: "11:30", close: "21:30", closed: true },
    },
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.5), "1주": makeWeekly(4.5), "1달": makeMonthly(4.5), "3달": make3Month(4.4) },
  },
  {
    id: "spot_003", rank: 3, ticker: "PZZA", name: "화덕피자 공방",
    category: "양식", status: "영업 중", distance: "차량 5분",
    address: "서울시 강남구 논현동 789", phone: "02-3456-7890",
    rating: 4.5, change: +0.3, reviewCount: 195, todayReviews: 15,
    likeCount: 76, waiting: 5, revisitRate: 61, avgPrice: 18000,
    high52: 4.7, low52: 3.9,
    lat: 37.4225, lng: 127.1235,
    photos: [
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400",
    ],
    openingHours: weekdayHours("11:00", "21:00"),
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.3), "1주": makeWeekly(4.3), "1달": makeMonthly(4.3), "3달": make3Month(4.2) },
  },
  {
    id: "spot_004", rank: 4, ticker: "RMEN", name: "하카타 라멘",
    category: "한식", status: "영업 중", distance: "도보 10분",
    address: "서울시 강남구 삼성동 321", phone: "02-4567-8901",
    rating: 4.4, change: +0.1, reviewCount: 162, todayReviews: 6,
    likeCount: 54, waiting: 2, revisitRate: 55, avgPrice: 10000,
    high52: 4.6, low52: 4.0,
    lat: 37.4180, lng: 127.1270,
    photos: [
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400",
    ],
    openingHours: weekdayHours("11:00", "22:00"),
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.3), "1주": makeWeekly(4.3), "1달": makeMonthly(4.3), "3달": make3Month(4.2) },
  },
  {
    id: "spot_005", rank: 5, ticker: "PORK", name: "흑돼지 본가",
    category: "고기", status: "영업 준비 중", distance: "도보 5분",
    address: "서울시 강남구 청담동 654",
    rating: 4.3, change: -0.2, reviewCount: 138, todayReviews: 3,
    likeCount: 31, waiting: 0, revisitRate: 49, avgPrice: 22000,
    high52: 4.7, low52: 3.8,
    lat: 37.4205, lng: 127.1245,
    photos: [
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400",
      "https://images.unsplash.com/photo-1558030006-450675393462?w=400",
    ],
    openingHours: { ...weekdayHours("17:00", "23:00"), sat: { open: "16:00", close: "23:00", closed: false } },
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.4), "1주": makeWeekly(4.4), "1달": makeMonthly(4.4), "3달": make3Month(4.3) },
  },
  {
    id: "spot_006", rank: 6, ticker: "CAFE", name: "브런치 카페 모닝",
    category: "카페", status: "영업 중", distance: "도보 2분",
    address: "서울시 강남구 압구정동 987", phone: "02-5678-9012",
    rating: 4.7, change: +0.1, reviewCount: 180, todayReviews: 9,
    likeCount: 203, waiting: 1, revisitRate: 75, avgPrice: 8000,
    high52: 4.8, low52: 4.3,
    lat: 37.4210, lng: 127.1300,
    photos: [
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400",
    ],
    openingHours: weekdayHours("08:00", "20:00"),
    createdAt: "2024-01-01T00:00:00Z", updatedAt: "2025-04-02T00:00:00Z",
    timeSeries: { "1일": makeDaily(4.6), "1주": makeWeekly(4.6), "1달": makeMonthly(4.6), "3달": make3Month(4.5) },
  },
];

export const mockReviews: Review[] = [
  {
    id: "rev_001", spotId: "spot_001",
    userId: "user_001", userNickname: "맛집탐험가",
    rating: 5, content: "국물이 진짜 끝내줘요! 뼈가 푹 고아진 맛이 일품입니다.",
    createdAt: "2025-04-01T12:00:00Z",
  },
  {
    id: "rev_002", spotId: "spot_001",
    userId: "user_002", userNickname: "서울미식가",
    rating: 4, content: "양도 많고 맛도 좋아요. 점심시간엔 줄이 좀 있어요.",
    createdAt: "2025-04-01T13:30:00Z",
  },
  {
    id: "rev_003", spotId: "spot_001",
    userId: "user_004", userNickname: "골목식객",
    rating: 5, content: "사장님이 너무 친절하시고 재료도 신선해요. 단골 됐습니다!",
    createdAt: "2025-04-02T09:00:00Z",
  },
  {
    id: "rev_004", spotId: "spot_002",
    userId: "user_003", userNickname: "초밥러버",
    rating: 5, content: "오마카세급 퀄리티! 가성비 최고입니다.",
    createdAt: "2025-04-02T11:00:00Z",
  },
  {
    id: "rev_005", spotId: "spot_006",
    userId: "user_001", userNickname: "맛집탐험가",
    rating: 5, content: "커피도 맛있고 브런치 메뉴가 다양해요. 주말 아침에 오기 딱 좋아요.",
    createdAt: "2025-04-02T10:30:00Z",
  },
];
