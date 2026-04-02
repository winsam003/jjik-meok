"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const mapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.naver && mapRef.current) {
            new window.naver.maps.Map(mapRef.current, {
                center: new window.naver.maps.LatLng(37.420, 127.126),
                zoom: 15,
            });
        }
    }, []);

    return (
        <>
            {/* 1. 배경 지도 */}
            <div className="fixed inset-0 z-0">
                <div ref={mapRef} className="w-full h-full" />
            </div>

            {/* 2. 고정 헤더 */}
            <header className="fixed top-0 left-0 right-0 z-[100] p-4">
                {/* ... 헤더 내용 동일 ... */}
            </header>

            {/* 3. 콘텐츠 영역 */}
            <div className={cn(
                "fixed inset-0 z-50 transition-all duration-300",
                pathname === "/" ? "pointer-events-none opacity-0" : "bg-black/10 backdrop-blur-md opacity-100"
            )}>
                {children}
            </div>

            {/* 4. 하단 탭 바 */}
            <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100]">
                {/* ... 탭 바 내용 동일 ... */}
            </nav>
        </>
    );
}