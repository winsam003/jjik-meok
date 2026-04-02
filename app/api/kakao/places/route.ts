/**
 * 카카오 로컬 API 프록시
 *
 * 브라우저에서 직접 카카오 API 호출 시 CORS 오류 발생 → 서버에서 중계
 * API 키도 서버에서만 사용되므로 노출 위험 없음
 *
 * 지원 API:
 *  - 키워드 검색: ?query=강남 맛집&x=127.02&y=37.49&radius=1000
 *  - 카테고리 검색: ?category_group_code=FD6&x=127.02&y=37.49&radius=1000
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const apiKey = process.env.KAKAO_REST_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: "Kakao API key not configured" },
      { status: 500 }
    )
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query")
  const category_group_code = searchParams.get("category_group_code")
  const x = searchParams.get("x")
  const y = searchParams.get("y")
  const radius = searchParams.get("radius") ?? "1000"
  const size = searchParams.get("size") ?? "15"
  const page = searchParams.get("page") ?? "1"

  // 키워드 검색 vs 카테고리 검색 분기
  let apiUrl: string
  const params = new URLSearchParams()

  if (query) {
    apiUrl = "https://dapi.kakao.com/v2/local/search/keyword.json"
    params.set("query", query)
  } else {
    apiUrl = "https://dapi.kakao.com/v2/local/search/category.json"
    if (category_group_code) params.set("category_group_code", category_group_code)
  }

  if (x) params.set("x", x)
  if (y) params.set("y", y)
  params.set("radius", radius)
  params.set("size", size)
  params.set("page", page)
  params.set("sort", "distance") // 거리순 정렬

  try {
    const res = await fetch(`${apiUrl}?${params.toString()}`, {
      headers: { Authorization: `KakaoAK ${apiKey}` },
      next: { revalidate: 60 }, // 60초 캐시
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("[Kakao API Error]", res.status, text)
      return NextResponse.json({ error: text, status: res.status }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(
      { error: "Kakao API request failed" },
      { status: 500 }
    )
  }
}
