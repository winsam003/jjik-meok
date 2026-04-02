"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import AuthModal from "@/components/auth-modal";
import UserPanel from "@/components/user-panel";
import RankingPanel from "@/components/ranking-panel";
import SpotDetailPanel from "@/components/spot-detail-panel";
import { useAuth } from "@/hooks/useAuth";
import { getRanking } from "@/lib/services/spot.service";
import type { RankedSpot } from "@/lib/types";

type AuthMode = "login" | "signup";

const RANK_COLORS: Record<number, { bg: string; border: string; text: string }> = {
  1: { bg: "#f97316", border: "#ea580c", text: "#fff" },
  2: { bg: "#6366f1", border: "#4f46e5", text: "#fff" },
  3: { bg: "#10b981", border: "#059669", text: "#fff" },
};
const DEFAULT_COLOR = { bg: "#ffffff", border: "#d4d4d8", text: "#3f3f46" };

function makeMarkerHtml(r: RankedSpot): string {
  const color = RANK_COLORS[r.rank] ?? DEFAULT_COLOR;
  const isTop3 = r.rank <= 3;
  const size = isTop3 ? 52 : 40;
  const fontSize = isTop3 ? 11 : 10;
  const changeSign = r.change > 0 ? "▲" : r.change < 0 ? "▼" : "";
  const changeColor = r.change > 0 ? "#ef4444" : r.change < 0 ? "#3b82f6" : "transparent";

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
  `;
}

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<RankedSpot | undefined>(undefined);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (typeof window === "undefined" || !window.naver || !mapRef.current) return;

    const map = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.420, 127.126),
      zoom: 15,
      zoomControl: false,
    });

    // 서비스 레이어에서 랭킹 데이터 가져와서 마커 생성
    getRanking().then((spots) => {
      spots.forEach((spot) => {
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(spot.lat, spot.lng),
          map,
          icon: {
            content: makeMarkerHtml(spot),
            anchor: new window.naver.maps.Point(26, 26),
          },
        });

        window.naver.maps.Event.addListener(marker, "click", () => {
          setSelectedSpot(spot);
          setRankingOpen(true);
        });
      });
    });
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden bg-zinc-50">
      <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/90 backdrop-blur-md border border-zinc-200 p-3 px-6 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <Image
              src="/jjik-meok_logo.png"
              alt="찍먹 로고"
              width={32}
              height={32}
              className="rounded-full"
            />
            <span className="text-xl font-bold tracking-tight text-orange-500">찍먹</span>
          </div>

          {/* 버튼 영역 */}
          {!loading && (
            <div className="flex items-center gap-3">
              {user ? (
                <button
                  onClick={() => setPanelOpen(true)}
                  className="flex items-center gap-2 text-sm font-medium text-zinc-700 hover:text-orange-500 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                    <User size={14} className="text-orange-500" />
                  </div>
                  <span>{user.displayName ?? user.email}</span>
                </button>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setAuthMode("login")}>로그인</Button>
                  <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setAuthMode("signup")}>회원가입</Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 네이버 지도 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 랭킹 패널 (증권 거래소) */}
      <RankingPanel
        open={rankingOpen}
        onClose={() => setRankingOpen(false)}
        initialSelected={selectedSpot}
        onOpenDetail={(spot) => {
          setSelectedSpot(spot);
          setDetailOpen(true);
        }}
      />

      {/* Spot 상세 패널 */}
      <SpotDetailPanel
        spot={selectedSpot ?? null}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onOpenRanking={() => {
          setDetailOpen(false);
          setRankingOpen(true);
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
  );
}
