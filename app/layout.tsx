"use client" // 추가: 현재 경로를 감지하기 위해 클라이언트 컴포넌트로 변경

import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import Script from "next/script"
import Link from "next/link"
import { usePathname } from "next/navigation" // 추가: 현재 경로를 가져오는 훅
import { Flame, Gamepad2, MapIcon, MessageCircle, Ticket } from "lucide-react"

// 클라이언트 컴포넌트에서는 metadata를 직접 내보낼 수 없으므로,
// 만약 에러가 난다면 metadata 부분만 별도의 layout 파일이나 상위로 옮겨야 할 수도 있습니다.
// 일단은 작동을 위해 metadata는 생략하거나 주석 처리하고 기능을 먼저 구현하세요.

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() // 현재 경로 (예: "/", "/community")

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <body className="relative" suppressHydrationWarning>
        <ThemeProvider>
          {children}

          {/* 하단 네비게이션 탭 바 */}
          <nav className="fixed bottom-6 left-1/2 z-[100] w-[90%] max-w-md -translate-x-1/2">
            <div className="flex items-center justify-between rounded-3xl border border-zinc-200 bg-white/95 p-2 px-4 shadow-2xl backdrop-blur-xl">
              {/* active 조건에 pathname 비교를 넣었습니다 */}
              <NavItem
                href="/"
                icon={<MapIcon />}
                label="지도"
                active={pathname === "/"}
              />
              <NavItem
                href="/community"
                icon={<MessageCircle />}
                label="커뮤니티"
                active={pathname === "/community"}
              />
              <NavItem
                href="/hotdeal"
                icon={<Flame />}
                label="핫딜"
                active={pathname === "/hotdeal"}
              />
              <NavItem
                href="/mileage"
                icon={<Ticket />}
                label="쿠폰"
                active={pathname === "/mileage"}
              />
              <NavItem
                href="/mini_game"
                icon={<Gamepad2 />}
                label="게임"
                active={pathname === "/mini_game"}
              />
            </div>
          </nav>
        </ThemeProvider>

        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}

function NavItem({
  href,
  icon,
  label,
  active = false,
}: {
  href: string
  icon: React.ReactNode
  label: string
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 rounded-xl p-2 px-3 transition-all hover:bg-zinc-100"
    >
      <div
        className={cn("h-6 w-6", active ? "text-orange-500" : "text-zinc-400")}
      >
        {icon}
      </div>
      <span
        className={cn(
          "text-[10px] font-medium",
          active ? "font-bold text-orange-500" : "text-zinc-500"
        )}
      >
        {label}
      </span>
    </Link>
  )
}

declare global {
  interface Window {
    naver: any
  }
}
