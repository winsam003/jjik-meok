"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import AuthModal from "@/components/auth-modal";

type AuthMode = "login" | "signup";

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [authMode, setAuthMode] = useState<AuthMode | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && window.naver && mapRef.current) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.420, 127.126),
        zoom: 15,
        zoomControl: false,
      };
      new window.naver.maps.Map(mapRef.current, mapOptions);
    }
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
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline" onClick={() => setAuthMode("login")}>로그인</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setAuthMode("signup")}>회원가입</Button>
          </div>
        </div>
      </header>

      {/* 네이버 지도 */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 인증 모달 */}
      {authMode && (
        <AuthModal
          mode={authMode}
          onClose={() => setAuthMode(null)}
          onSwitchMode={(mode) => setAuthMode(mode)}
        />
      )}
    </main>
  );
}
