import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import Script from "next/script"; // 추가

export const metadata: Metadata = {
  title: "찍먹 - 맛집 방문 & 포인트 적립",
  description: "대화가 곧 포인트가 되는 맛집 찍먹 서비스",
  icons: {
    icon: "/jjik-meok_logo.png",
  },
};

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" })

export default function RootLayout({ children }: { children: React.ReactNode }) {
  console.log("네이버 클라이언트 ID:", process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID);
  return (
    <html lang="ko" suppressHydrationWarning className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Script
          src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID}`}
          strategy="beforeInteractive"
        />
      </body>
    </html>
  )
}

// TypeScript 에러 방지
declare global {
  interface Window {
    naver: any;
  }
}