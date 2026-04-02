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
import { getRanking } from "@/lib/services/spot.service"
import type { RankedSpot } from "@/lib/types"

type AuthMode = "login" | "signup"

// 기본 위치 (서울 강남) - 위치 권한 거부 시 폴백
const DEFAULT_LAT = 37.4979
const DEFAULT_LNG = 127.0276

const RANK_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "#f97316", border: "#ea580c", text: "#fff" },
  2: { bg: "#6366f1", border: "#4f46e5", text: "#fff" },
  3: { bg: "#10b981", border: "#059669", text: "#fff" },
}
const DEFAULT_COLOR = { bg: "#ffffff", border: "#d4d4d8", text: "#3f3f46" }

function makeMarkerHtml(r: RankedSpot): string {
  const color = RANK_COLORS[r.rank] ?? DEFAULT_COLOR
  const isTop3 = r.rank <= 3
  const size = isTop3 ? 52 : 40
  const fontSize = isTop3 ? 11 : 10
  const changeSign = r.change > 0 ? "▲" : r.change < 0 ? "▼" : ""
  const changeColor =
    r.change > 0 ? "#ef4444" : r.change < 0 ? "#3b82f6" : "transparent"

  return `
    <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;user-select:none;">
      <div style="
        width:${size}px;height:${size}px;
        background:${color.bg};
        border:2.5px solid ${color.border};
        border-radius:50%;
        display:flex;flex-direction:column;
        align-items:center;justify-content:center;
        box-shadow:0 4px 12px rgba(0,0,0,0.18);
        transition:transform 0.15s;
        gap:1px;
      ">
        <span style="font-size:${fontSize}px;font-weight:900;color:${color.text};line-height:1;">${r.rank}위</span>
        <span style="font-size:9px;font-weight:700;color:${isTop3 ? "rgba(255,255,255,0.85)" : "#71717a"};line-height:1;">${r.rating}★</span>
      </div>
      <div style="
        background:white;
        border:1px solid #e4e4e7;
        border-radius:8px;
        padding:3px 7px;
        margin-top:4px;
        font-size:10px;
        font-weight:700;
        color:#27272a;
        white-space:nowrap;
        box-shadow:0 2px 6px rgba(0,0,0,0.1);
        max-width:90px;overflow:hidden;text-overflow:ellipsis;
      ">${r.name}</div>
      <div style="
        font-size:9px;font-weight:700;
        color:${changeColor};
        margin-top:1px;
        display:${changeSign ? "block" : "none"};
      ">${changeSign} ${Math.abs(r.change)}</div>
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
  const myLocationMarkerRef = useRef<any>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const myLocationCircleRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)
  const lastRankingLatLngRef = useRef<{ lat: number; lng: number } | null>(null)
  const isFirstLocationRef = useRef(true)

  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [rankingOpen, setRankingOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedSpot, setSelectedSpot] = useState<RankedSpot | undefined>(undefined)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<"idle" | "watching" | "denied">("idle")

  const { user, loading } = useAuth()

  // ── Spot 마커 초기화 헬퍼 ────────────────────────────────────────────
  function clearMarkers() {
    markersRef.current.forEach((m) => m.setMap(null))
    markersRef.current = []
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function placeMarkers(spots: RankedSpot[], map: any) {
    clearMarkers()
    spots.forEach((spot) => {
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(spot.lat, spot.lng),
        map,
        icon: {
          content: makeMarkerHtml(spot),
          anchor: new window.naver.maps.Point(26, 26),
        },
      })
      window.naver.maps.Event.addListener(marker, "click", () => {
        setSelectedSpot(spot)
        setRankingOpen(true)
      })
      markersRef.current.push(marker)
    })
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

  // ── 위치 변화 시 Spot 재로드 (200m 이상 이동했을 때만) ───────────────
  function reloadSpotsIfMoved(lat: number, lng: number, map: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    const last = lastRankingLatLngRef.current
    if (last) {
      const dist = getDistanceMeters(last.lat, last.lng, lat, lng)
      if (dist < 200) return // 200m 이하 이동은 재로드 스킵
    }
    lastRankingLatLngRef.current = { lat, lng }
    getRanking({ lat, lng }).then((spots) => placeMarkers(spots, map))
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

        // 첫 위치 수신 시 지도 이동
        if (isFirstLocationRef.current) {
          isFirstLocationRef.current = false
          map.setCenter(new window.naver.maps.LatLng(lat, lng))
          map.setZoom(15)
        }

        reloadSpotsIfMoved(lat, lng, map)
      },
      (err) => {
        console.warn("위치 오류:", err.message)
        setLocationStatus("denied")
        // 폴백: 기본 위치로 Spot 로드
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

      {/* 네이버 지도 */}
      <div ref={mapRef} className="h-full w-full" />

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
