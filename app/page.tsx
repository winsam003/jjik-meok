"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

export default function Page() {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.naver && mapRef.current) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(37.42, 127.126),
        zoom: 15,
        zoomControl: false,
      }
      new window.naver.maps.Map(mapRef.current, mapOptions)
    }
  }, [])

  return (
    <main className="relative h-screen w-full overflow-hidden bg-zinc-50">
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

          {/* 버튼 영역 */}

          <div className="flex items-center gap-3">
            <Button className="hover:bg-orange-600" size="sm">
              로그인
            </Button>

            <Button
              size="sm"
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              회원가입
            </Button>
          </div>
        </div>
      </header>

      {/* 네이버 지도 */}
      <div ref={mapRef} className="h-full w-full" />
    </main>
  )
}
