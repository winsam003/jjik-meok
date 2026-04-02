"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 네이버 지도 초기화 (스크립트 로드 확인 후)
    if (typeof window !== "undefined" && window.naver && mapRef.current) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.420, 127.126), // 성남시청 기준
        zoom: 15,
        zoomControl: true,
      };

      const map = new window.naver.maps.Map(mapRef.current, mapOptions);
    }
  }, []);

  return (
    <main className="relative w-full h-screen overflow-hidden">
      {/* 1. 헤더 (지도 위에 떠 있는 형태) */}
      <header className="absolute top-0 left-0 right-0 z-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 p-3 px-6 rounded-2xl shadow-lg">
          {/* 로고 영역 */}
          <div className="flex items-center gap-2">
            <Image
              src="/jjik-meok_logo.png"
              alt="찍먹 로고"
              width={32}
              height={32}
              className="rounded-full"
            />
          </div>

          {/* 버튼 영역 */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm">로그인</Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white">회원가입</Button>
          </div>
        </div>
      </header>

      {/* 2. 네이버 지도 (전체 화면) */}
      <div ref={mapRef} className="w-full h-full" />

      {/* 다크모드 토글 안내 (원하시면 남겨두세요) */}
      <div className="absolute bottom-6 left-6 z-10 font-mono text-[10px] text-muted-foreground bg-white/50 dark:bg-black/50 p-2 rounded">
        (Press <kbd>d</kbd> to toggle dark mode)
      </div>
    </main>
  );
}