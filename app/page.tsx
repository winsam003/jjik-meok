"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { User, LocateFixed } from "lucide-react"
import AuthModal from "@/components/auth-modal"
import UserPanel from "@/components/user-panel"
import RankingPanel from "@/components/ranking-panel"
import SpotDetailPanel from "@/components/spot-detail-panel"
import { useAuth } from "@/hooks/useAuth"
import { getRanking, SPOT_CATEGORIES, SPOT_SUBCATEGORIES } from "@/lib/services/spot.service"
import type { RankedSpot } from "@/lib/types"
import type { KakaoCategoryCode } from "@/lib/services/kakao.service"

type AuthMode = "login" | "signup"

// 기본 위치 (서울 강남) - 위치 권한 거부 시 폴백
const DEFAULT_LAT = 37.4979
const DEFAULT_LNG = 127.0276

const CATEGORY_EMOJI: Record<string, string> = {
  "음식점": "🍽️",
  "한식": "🍚",
  "일식": "🍣",
  "중식": "🥢",
  "양식": "🍝",
  "고기": "🥩",
  "분식": "🍜",
  "치킨": "🍗",
  "패스트푸드": "🍔",
  "카페": "☕",
  "편의점": "🏪",
  "병원": "🏥",
  "약국": "💊",
}

const RANK_COLORS: Record<number, { bg: string; border: string }> = {
  1: { bg: "#f97316", border: "#ea580c" },
  2: { bg: "#6366f1", border: "#4f46e5" },
  3: { bg: "#10b981", border: "#059669" },
}

function makeGroupMarkerHtml(rep: RankedSpot, count: number): string {
  const base = makeMarkerHtml(rep)
  return `
    <div style="position:relative;display:inline-flex;flex-direction:column;align-items:center;cursor:pointer;">
      ${base}
      <div style="
        position:absolute;top:-2px;right:-6px;
        background:#ef4444;color:white;
        border-radius:99px;
        min-width:16px;height:16px;
        padding:0 4px;
        font-size:9px;font-weight:900;
        display:flex;align-items:center;justify-content:center;
        border:1.5px solid white;
        box-shadow:0 1px 4px rgba(0,0,0,0.25);
        line-height:1;
      ">+${count - 1}</div>
    </div>
  `
}

function makeMarkerHtml(r: RankedSpot): string {
  const emoji = CATEGORY_EMOJI[r.category] ?? "📍"
  const hasRank = r.rank > 0
  const rankColor = RANK_COLORS[r.rank]

  if (hasRank) {
    // 리뷰 있는 Spot: 순위 뱃지 표시
    const bg = rankColor?.bg ?? "#f97316"
    const border = rankColor?.border ?? "#ea580c"
    return `
      <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;">
        <div style="
          width:44px;height:44px;
          background:${bg};
          border:2.5px solid ${border};
          border-radius:50%;
          display:flex;flex-direction:column;
          align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.18);
          gap:1px;
        ">
          <span style="font-size:11px;font-weight:900;color:#fff;line-height:1;">${r.rank}위</span>
          <span style="font-size:9px;font-weight:700;color:rgba(255,255,255,0.85);line-height:1;">${r.rating}★</span>
        </div>
        <div style="
          background:white;border:1px solid #e4e4e7;border-radius:8px;
          padding:3px 7px;margin-top:3px;font-size:10px;font-weight:700;color:#27272a;
          white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.08);
          max-width:90px;overflow:hidden;text-overflow:ellipsis;
        ">${r.name}</div>
      </div>
    `
  }

  // 리뷰 없는 Spot: 카테고리 이모지 마커
  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;">
      <div style="
        background:white;border:2px solid #e4e4e7;border-radius:50%;
        width:36px;height:36px;
        display:flex;align-items:center;justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.1);font-size:16px;
      ">${emoji}</div>
      <div style="
        background:white;border:1px solid #e4e4e7;border-radius:8px;
        padding:2px 6px;margin-top:3px;font-size:10px;font-weight:700;color:#71717a;
        white-space:nowrap;box-shadow:0 2px 4px rgba(0,0,0,0.06);
        max-width:80px;overflow:hidden;text-overflow:ellipsis;
      ">${r.name}</div>
    </div>
  `
}

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapInstanceRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clusterRef = useRef<any[]>([])
  const spotsRef = useRef<RankedSpot[]>([])
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLocationMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLocationCircleRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchRadiusCircleRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastRankingLatLngRef = useRef<{ lat: number; lng: number } | null>(null)
  const isFirstLocationRef = useRef(true)
  const activeCategoryRef = useRef<KakaoCategoryCode | null>(null)
  const activeSubCategoryRef = useRef<string | null>(null)

  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<RankedSpot | undefined>(undefined)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "watching" | "denied">("idle")
  const [activeCategory, setActiveCategory] = useState<KakaoCategoryCode | null>(null)
  const [activeSubCategory, setActiveSubCategory] = useState<string | null>(null)
  const [currentSpots, setCurrentSpots] = useState<RankedSpot[]>([])
  const [spotGroupPopup, setSpotGroupPopup] = useState<{
    spots: RankedSpot[]
    top: number
    left: number
  } | null>(null)

  const { user, loading } = useAuth()

  // ── 마커 전체 제거 ───────────────────────────────────────────────────
  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
    clusterRef.current = []
  }

  // ── Spot 마커 배치 ───────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function placeMarkers(spots: RankedSpot[], map: any) {
    spotsRef.current = spots
    setCurrentSpots(spots)
    renderCluster(map)
  }

  // ── 줌 레벨에 따른 클러스터 렌더링 ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderCluster(map: any) {
    clearMarkers()
    const spots = spotsRef.current
    if (!spots.length) return

    const zoom = map.getZoom()
    const newMarkers: any[] = []

    // zoom 15 이상: 아주 가까운 마커만 그룹으로 묶어 리스트 팝업 표시
    if (zoom >= 15) {
      const OVERLAP_DEG = 0.0003 // ~33m 이내면 겹침으로 판단
      const used2 = new Array(spots.length).fill(false)

      spots.forEach((spot, i) => {
        if (used2[i]) return
        used2[i] = true
        const group: RankedSpot[] = [spot]

        spots.forEach((other, j) => {
          if (used2[j]) return
          if (
            Math.abs(spot.lat - other.lat) < OVERLAP_DEG &&
            Math.abs(spot.lng - other.lng) < OVERLAP_DEG
          ) {
            group.push(other)
            used2[j] = true
          }
        })

        if (group.length === 1) {
          // 단일 마커
          const m = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(spot.lat, spot.lng),
            map,
            icon: { content: makeMarkerHtml(spot), anchor: new window.naver.maps.Point(22, 22) },
            zIndex: spot.rank > 0 ? 100 : 50,
          })
          window.naver.maps.Event.addListener(m, "click", () => {
            setSpotGroupPopup(null)
            setSelectedSpot(spot)
            setRankingOpen(true)
          })
          newMarkers.push(m)
        } else {
          // 겹침 그룹: 대표 마커 + +N 뱃지 → 클릭 시 리스트 팝업
          const rep = group.find((g) => g.rank > 0) ?? group[0]
          const avgLat = group.reduce((s, g) => s + g.lat, 0) / group.length
          const avgLng = group.reduce((s, g) => s + g.lng, 0) / group.length

          const m = new window.naver.maps.Marker({
            position: new window.naver.maps.LatLng(avgLat, avgLng),
            map,
            icon: {
              content: makeGroupMarkerHtml(rep, group.length),
              anchor: new window.naver.maps.Point(22, 22),
            },
            zIndex: 150,
          })
          window.naver.maps.Event.addListener(m, "click", () => {
            const proj = map.getProjection()
            const offset = proj.fromCoordToOffset(
              new window.naver.maps.LatLng(avgLat, avgLng)
            )
            setSpotGroupPopup({ spots: group, top: offset.y, left: offset.x })
          })
          newMarkers.push(m)
        }
      })

      markersRef.current = newMarkers
      clusterRef.current = newMarkers
      return
    }

    const gridDeg = zoom >= 14 ? 0.004 : zoom >= 13 ? 0.008 : 0.016

    const used = new Array(spots.length).fill(false)

    spots.forEach((spot, i) => {
      if (used[i]) return
      used[i] = true
      const group = [spot]

      spots.forEach((other, j) => {
        if (used[j]) return
        if (
          Math.abs(spot.lat - other.lat) < gridDeg &&
          Math.abs(spot.lng - other.lng) < gridDeg
        ) {
          group.push(other)
          used[j] = true
        }
      })

      if (group.length === 1) {
        // 단일 마커
        const m = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(spot.lat, spot.lng),
          map,
          icon: { content: makeMarkerHtml(spot), anchor: new window.naver.maps.Point(22, 22) },
          zIndex: spot.rank > 0 ? 100 : 50,
        })
        window.naver.maps.Event.addListener(m, "click", () => {
          setSelectedSpot(spot)
          setRankingOpen(true)
        })
        newMarkers.push(m)
      } else {
        // 클러스터 마커
        const lat = group.reduce((s, g) => s + g.lat, 0) / group.length
        const lng = group.reduce((s, g) => s + g.lng, 0) / group.length
        const count = group.length
        const size = count >= 10 ? 52 : count >= 5 ? 46 : 40
        const color = count >= 10 ? "#dc2626" : count >= 5 ? "#ef4444" : "#f97316"

        const m = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(lat, lng),
          map,
          icon: {
            content: `<div style="
              width:${size}px;height:${size}px;background:${color};
              border:3px solid white;border-radius:50%;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 3px 12px rgba(0,0,0,0.25);
              font-size:15px;font-weight:900;color:white;cursor:pointer;
            ">${count}</div>`,
            size: new window.naver.maps.Size(size, size),
            anchor: new window.naver.maps.Point(size / 2, size / 2),
          },
          zIndex: 200,
        })
        window.naver.maps.Event.addListener(m, "click", () => {
          map.setCenter(new window.naver.maps.LatLng(lat, lng))
          map.setZoom(map.getZoom() + 2)
        })
        newMarkers.push(m)
      }
    })

    markersRef.current = newMarkers
    clusterRef.current = newMarkers
  }

  // ── 내 위치 마커 업데이트 ─────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function updateMyLocationMarker(lat: number, lng: number, map: any, accuracy: number) {
    const pos = new window.naver.maps.LatLng(lat, lng)

    // 내 위치 점 마커 (없으면 생성, 있으면 위치만 업데이트)
    if (!myLocationMarkerRef.current) {
      myLocationMarkerRef.current = new window.naver.maps.Marker({
        position: pos,
        map,
        icon: {
          content: `
            <div style="position:relative;width:20px;height:20px;">
              <div style="
                position:absolute;inset:0;
                background:#3b82f6;
                border:3px solid white;
                border-radius:50%;
                box-shadow:0 2px 8px rgba(59,130,246,0.5);
                z-index:2;
              "></div>
              <div style="
                position:absolute;
                width:40px;height:40px;
                top:-10px;left:-10px;
                background:rgba(59,130,246,0.15);
                border-radius:50%;
                z-index:1;
                animation:pulse 2s infinite;
              "></div>
            </div>
            <style>
              @keyframes pulse {
                0%,100%{transform:scale(1);opacity:1}
                50%{transform:scale(1.4);opacity:0.4}
              }
            </style>
          `,
          anchor: new window.naver.maps.Point(10, 10),
        },
        zIndex: 200,
      })
    } else {
      myLocationMarkerRef.current.setPosition(pos)
    }

    // 정확도 원 (반경 표시) - 정확도 100m 이상일 때만 표시
    if (accuracy > 50) {
      if (!myLocationCircleRef.current) {
        myLocationCircleRef.current = new window.naver.maps.Circle({
          map,
          center: pos,
          radius: accuracy,
          fillColor: "#3b82f6",
          fillOpacity: 0.06,
          strokeColor: "#3b82f6",
          strokeOpacity: 0.3,
          strokeWeight: 1,
        })
      } else {
        myLocationCircleRef.current.setCenter(pos)
        myLocationCircleRef.current.setRadius(accuracy)
      }
    } else {
      // 정확도 충분하면 원 제거
      if (myLocationCircleRef.current) {
        myLocationCircleRef.current.setMap(null)
        myLocationCircleRef.current = null
      }
    }
  }

  // ── 검색 반경 원 업데이트 ─────────────────────────────────────────────
  function updateSearchRadiusCircle(lat: number, lng: number, map: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const center = new window.naver.maps.LatLng(lat, lng)
    if (!searchRadiusCircleRef.current) {
      searchRadiusCircleRef.current = new window.naver.maps.Circle({
        map,
        center,
        radius: 1000, // 검색 반경 1km
        fillColor: "#f97316",
        fillOpacity: 0.04,
        strokeColor: "#f97316",
        strokeOpacity: 0.3,
        strokeWeight: 1.5,
        strokeStyle: "dash",
      })
    } else {
      searchRadiusCircleRef.current.setCenter(center)
    }
  }

  // ── 위치 변화 시 Spot 재로드 (200m 이상 이동했을 때만) ───────────────
  function reloadSpotsIfMoved(lat: number, lng: number, map: any, categoryCode?: KakaoCategoryCode | null, subFilter?: string | null) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const last = lastRankingLatLngRef.current
    if (last) {
      const dist = getDistanceMeters(last.lat, last.lng, lat, lng)
      if (dist < 200) return // 200m 이하 이동은 재로드 스킵
    }
    lastRankingLatLngRef.current = { lat, lng }
    getRanking({ lat, lng, categoryCode: categoryCode ?? null, subFilter: subFilter ?? null }).then((spots) => placeMarkers(spots, map))
  }

  // ── 지도 드래그 후 해당 위치 Spot 로드 ────────────────────────────────
  function handleMapDragEnd(map: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const center = map.getCenter()
    const lat = center.lat()
    const lng = center.lng()
    updateSearchRadiusCircle(lat, lng, map)
    lastRankingLatLngRef.current = null // 강제 재로드
    getRanking({
      lat,
      lng,
      categoryCode: activeCategoryRef.current,
      subFilter: activeSubCategoryRef.current,
    }).then((spots) => placeMarkers(spots, map))
  }

  // ── 카테고리 변경 시 즉시 재로드 ─────────────────────────────────────
  // ── 현재 지도 중심 좌표 가져오기 ───────────────────────────────────────
  function getMapCenter(): { lat: number; lng: number } {
    const map = mapInstanceRef.current
    if (map) {
      const center = map.getCenter()
      return { lat: center.lat(), lng: center.lng() }
    }
    return userLocation ?? { lat: DEFAULT_LAT, lng: DEFAULT_LNG }
  }

  function handleCategoryChange(code: KakaoCategoryCode | null) {
    setActiveCategory(code)
    activeCategoryRef.current = code
    setActiveSubCategory(null)
    activeSubCategoryRef.current = null
    const map = mapInstanceRef.current
    if (!map) return
    const loc = getMapCenter()
    lastRankingLatLngRef.current = null
    getRanking({ lat: loc.lat, lng: loc.lng, categoryCode: code, subFilter: null }).then((spots) =>
      placeMarkers(spots, map)
    )
  }

  // ── 서브카테고리 변경 ───────────────────────────────────────────────
  function handleSubCategoryChange(keyword: string | null) {
    setActiveSubCategory(keyword)
    activeSubCategoryRef.current = keyword
    const map = mapInstanceRef.current
    if (!map) return
    const loc = getMapCenter()
    lastRankingLatLngRef.current = null
    getRanking({ lat: loc.lat, lng: loc.lng, categoryCode: activeCategoryRef.current, subFilter: keyword }).then((spots) =>
      placeMarkers(spots, map)
    )
  }

  // ── 두 좌표 간 거리 계산 (Haversine) ────────────────────────────────
  function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number) {
    const R = 6371000
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // ── 위치 추적 시작 ────────────────────────────────────────────────────
  function startWatchingLocation(map: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!navigator.geolocation) {
      setLocationStatus("denied")
      // 위치 없으면 기본 위치로 Spot 로드
      getRanking({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }).then((spots) =>
        placeMarkers(spots, map)
      )
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const accuracy = pos.coords.accuracy // 정확도 (m)

        setLocationStatus("watching")
        setUserLocation({ lat, lng })
        updateMyLocationMarker(lat, lng, map, accuracy)

        // 첫 위치 수신 시 지도 이동 + 검색 반경 표시
        if (isFirstLocationRef.current) {
          isFirstLocationRef.current = false
          map.setCenter(new window.naver.maps.LatLng(lat, lng))
          map.setZoom(15)
          updateSearchRadiusCircle(lat, lng, map)
        }

        reloadSpotsIfMoved(lat, lng, map, activeCategoryRef.current, activeSubCategoryRef.current)
      },
      (err) => {
        console.warn("위치 오류:", err.message)
        setLocationStatus("denied")
        // 폴백: 기본 위치로 Spot 로드
        updateSearchRadiusCircle(DEFAULT_LAT, DEFAULT_LNG, map)
        getRanking({ lat: DEFAULT_LAT, lng: DEFAULT_LNG }).then((spots) =>
          placeMarkers(spots, map)
        )
      },
      {
        enableHighAccuracy: true, // GPS 사용 (정확도 우선)
        maximumAge: 3000,         // 3초 이내 캐시된 위치 허용
        timeout: 10000,           // 10초 내 응답 없으면 오류
      }
    )

    watchIdRef.current = watchId
  }

  // ── 지도 초기화 (최초 1회) ───────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.naver || !mapRef.current) return

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(DEFAULT_LAT, DEFAULT_LNG),
      zoom: 15,
      zoomControl: false,
    })
    mapInstanceRef.current = map

    // 줌 변경 시 클러스터 재계산 (최초 1회만 등록)
    window.naver.maps.Event.addListener(map, "zoom_changed", () => {
      setSpotGroupPopup(null)
      renderCluster(map)
    })

    // 지도 클릭 시 그룹 팝업 닫기
    window.naver.maps.Event.addListener(map, "click", () => {
      setSpotGroupPopup(null)
    })

    // 지도 드래그 완료 시 해당 위치 Spot 로드
    window.naver.maps.Event.addListener(map, "dragend", () => {
      handleMapDragEnd(map)
    })

    startWatchingLocation(map)

    // 언마운트 시 위치 추적 해제
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── 현재 위치로 이동 버튼 ─────────────────────────────────────────────
  function handleLocate() {
    const map = mapInstanceRef.current
    if (!map) return

    if (userLocation) {
      // 이미 위치 알고 있으면 바로 이동
      map.setCenter(new window.naver.maps.LatLng(userLocation.lat, userLocation.lng))
      map.setZoom(15)
    } else {
      // 위치 추적 재시도
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
      isFirstLocationRef.current = true
      startWatchingLocation(map)
    }
  }

  return (
    <main className="relative h-screen w-full overflow-hidden bg-zinc-50">
      {/* 헤더 */}
      <header className="absolute top-0 right-0 left-0 z-50 p-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between rounded-2xl border border-zinc-200 bg-white/90 p-3 px-6 shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Image
              src="/jjik-meok_logo.png"
              alt="찍먹 로고"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-bold tracking-tight text-orange-500">
              찍먹
            </span>
          </div>

          {!loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => setPanelOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-700 transition-colors hover:text-orange-500"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100">
                    <User size={14} className="text-orange-500" />
                  </div>
                  <span>{user.displayName ?? user.email}</span>
                </button>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAuthMode("login")}
                  >
                    로그인
                  </Button>
                  <Button
                    size="sm"
                    className="bg-orange-500 text-white hover:bg-orange-600"
                    onClick={() => setAuthMode("signup")}
                  >
                    회원가입
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 카테고리 필터 바 */}
      <div className="absolute top-[76px] left-0 right-0 z-40 px-4 flex flex-col gap-1.5">
        {/* 1단: 메인 카테고리 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {SPOT_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.code
            return (
              <button
                key={cat.label}
                onClick={() => handleCategoryChange(cat.code as KakaoCategoryCode | null)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold shadow-sm transition-all ${
                  isActive
                    ? "border-orange-400 bg-orange-500 text-white shadow-orange-200"
                    : "border-zinc-200 bg-white/90 text-zinc-600 backdrop-blur-sm hover:border-orange-300 hover:text-orange-500"
                }`}
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* 2단: 서브카테고리 (해당 카테고리에 서브가 있을 때만 표시) */}
        {activeCategory && SPOT_SUBCATEGORIES[activeCategory] && (
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            {/* 전체 버튼 */}
            <button
              onClick={() => handleSubCategoryChange(null)}
              className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                activeSubCategory === null
                  ? "border-zinc-700 bg-zinc-800 text-white"
                  : "border-zinc-200 bg-white/90 text-zinc-500 backdrop-blur-sm hover:border-zinc-400"
              }`}
            >
              전체
            </button>
            {SPOT_SUBCATEGORIES[activeCategory].map((sub) => {
              const isSubActive = activeSubCategory === sub.keyword
              return (
                <button
                  key={sub.keyword}
                  onClick={() => handleSubCategoryChange(sub.keyword)}
                  className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold transition-all ${
                    isSubActive
                      ? "border-zinc-700 bg-zinc-800 text-white"
                      : "border-zinc-200 bg-white/90 text-zinc-500 backdrop-blur-sm hover:border-zinc-400"
                  }`}
                >
                  <span>{sub.emoji}</span>
                  <span>{sub.label}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* 네이버 지도 */}
      <div ref={mapRef} className="h-full w-full" />

      {/* 겹침 스팟 그룹 리스트 팝업 */}
      {spotGroupPopup && (
        <div
          className="absolute z-[200] bg-white rounded-2xl shadow-2xl border border-zinc-100 overflow-hidden"
          style={{
            top: Math.max(10, spotGroupPopup.top - 80),
            left: Math.min(
              spotGroupPopup.left + 12,
              window.innerWidth - 210
            ),
            minWidth: 190,
            maxWidth: 230,
          }}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-100">
            <span className="text-[11px] font-bold text-zinc-500">
              이 위치 {spotGroupPopup.spots.length}곳
            </span>
            <button
              onClick={() => setSpotGroupPopup(null)}
              className="text-zinc-400 hover:text-zinc-600 p-0.5"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          {/* 리스트 */}
          <div className="flex flex-col py-1">
            {spotGroupPopup.spots.map((spot) => (
              <button
                key={spot.id}
                onClick={() => {
                  setSelectedSpot(spot)
                  setRankingOpen(true)
                  setSpotGroupPopup(null)
                }}
                className="flex items-center gap-2 px-3 py-2 hover:bg-orange-50 text-left transition-colors"
              >
                <span className="text-base shrink-0">
                  {CATEGORY_EMOJI[spot.category] ?? "📍"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">
                    {spot.name}
                  </p>
                  <p className="text-[10px] text-zinc-400">{spot.category}</p>
                </div>
                {spot.reviewCount > 0 ? (
                  <span className="text-xs font-bold text-orange-500 shrink-0">
                    {spot.rating}★
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-300 shrink-0">리뷰없음</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 현재 위치 버튼 */}
      <button
        onClick={handleLocate}
        className="absolute bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-lg transition hover:bg-zinc-50"
        title="현재 위치로 이동"
      >
        <LocateFixed
          size={20}
          className={
            locationStatus === "watching"
              ? "text-blue-500"
              : locationStatus === "denied"
              ? "text-zinc-300"
              : "text-zinc-400 animate-pulse"
          }
        />
      </button>

      {/* 위치 상태 토스트 */}
      {locationStatus === "denied" && (
        <div className="absolute bottom-20 right-4 z-50 rounded-xl bg-zinc-800/90 px-4 py-2 text-xs text-white shadow-lg backdrop-blur-sm">
          위치 권한이 거부됐어요. 브라우저 설정에서 허용해주세요.
        </div>
      )}

      {/* 랭킹 패널 (증권 거래소) */}
      <RankingPanel
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        initialSelected={selectedSpot}
        userLocation={userLocation ?? undefined}
        spots={currentSpots}
        onOpenDetail={(spot) => {
          setSelectedSpot(spot)
          setDetailOpen(true)
        }}
      />

      {/* Spot 상세 패널 */}
      <SpotDetailPanel
        spot={selectedSpot ?? null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onOpenRanking={() => {
          setDetailOpen(false)
          setRankingOpen(true)
        }}
      />

      {/* 인증 모달 */}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}

      {/* 유저 사이드 패널 */}
      <UserPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </main>
  )
}
