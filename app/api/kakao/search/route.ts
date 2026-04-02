import { NextRequest, NextResponse } from "next/server";

const KAKAO_API_URL = "https://dapi.kakao.com/v2/local/search/keyword.json";

/**
 * 카카오 로컬 검색 API 프록시
 * 브라우저 → /api/kakao/search?query=강남맛집 → 카카오 API → 결과 반환
 *
 * CORS 우회 + API 키 보호 목적
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "query 파라미터가 필요합니다" }, { status: 400 });
  }

  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "KAKAO_REST_API_KEY가 설정되지 않았습니다" }, { status: 500 });
  }

  // 클라이언트에서 넘긴 파라미터를 그대로 카카오 API에 전달
  const params = new URLSearchParams();
  params.set("query", query);

  const x = searchParams.get("x");
  const y = searchParams.get("y");
  const radius = searchParams.get("radius");
  const page = searchParams.get("page");
  const size = searchParams.get("size");
  const sort = searchParams.get("sort");
  const categoryGroupCode = searchParams.get("category_group_code");

  if (x) params.set("x", x);
  if (y) params.set("y", y);
  if (radius) params.set("radius", radius);
  if (page) params.set("page", page);
  if (size) params.set("size", size);
  if (sort) params.set("sort", sort);
  if (categoryGroupCode) params.set("category_group_code", categoryGroupCode);

  const res = await fetch(`${KAKAO_API_URL}?${params.toString()}`, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
  });

  if (!res.ok) {
    const errorText = await res.text();
    return NextResponse.json(
      { error: "카카오 API 요청 실패", detail: errorText },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}
