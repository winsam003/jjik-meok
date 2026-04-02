/** 카카오 로컬 API 응답 타입 */

export interface KakaoPlace {
  id: string;                    // 장소 ID
  place_name: string;            // 장소명
  category_name: string;         // 카테고리 (예: "음식점 > 한식 > 육류,고기")
  category_group_code: string;   // 카테고리 그룹 코드 (FD6: 음식점, CE7: 카페)
  category_group_name: string;   // 카테고리 그룹명
  phone: string;                 // 전화번호
  address_name: string;          // 지번 주소
  road_address_name: string;     // 도로명 주소
  x: string;                     // 경도 (longitude)
  y: string;                     // 위도 (latitude)
  place_url: string;             // 카카오맵 상세 URL
  distance: string;              // 중심 좌표로부터 거리 (m)
}

export interface KakaoSearchMeta {
  total_count: number;
  pageable_count: number;
  is_end: boolean;
  same_name: {
    region: string[];
    keyword: string;
    selected_region: string;
  };
}

export interface KakaoSearchResponse {
  meta: KakaoSearchMeta;
  documents: KakaoPlace[];
}

/** 검색 요청 파라미터 */
export interface KakaoSearchParams {
  query: string;                         // 검색 키워드
  category_group_code?: string;          // FD6(음식점), CE7(카페) 등
  x?: string;                            // 중심 경도
  y?: string;                            // 중심 위도
  radius?: number;                       // 반경 (m, 최대 20000)
  page?: number;                         // 페이지 (1~45)
  size?: number;                         // 한 페이지 결과 수 (1~15)
  sort?: "accuracy" | "distance";        // 정렬 기준
}
