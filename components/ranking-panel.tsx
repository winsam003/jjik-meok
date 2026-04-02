"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart,
  BarChart, Bar, Cell,
} from "recharts";
import { getRanking } from "@/lib/services/spot.service";
import type { RankedSpot } from "@/lib/types";
import { cn } from "@/lib/utils";

type Period = "1일" | "1주" | "1달" | "3달";

interface RankingPanelProps {
  open: boolean;
  onClose: () => void;
  initialSelected?: RankedSpot;
  onOpenDetail?: (spot: RankedSpot) => void;
  userLocation?: { lat: number; lng: number };
}

function ChangeChip({ change }: { change: number }) {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-red-500 font-bold text-xs">
      <TrendingUp size={11} /> +{change}
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-blue-500 font-bold text-xs">
      <TrendingDown size={11} /> {change}
    </span>
  );
  return <span className="text-zinc-400 text-xs">-</span>;
}

const ChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-zinc-100 rounded-xl shadow px-3 py-1.5 text-xs">
        <p className="text-zinc-400">{label}</p>
        <p className="font-bold text-orange-500">{payload[0].value}★</p>
      </div>
    );
  }
  return null;
};

export default function RankingPanel({ open, onClose, initialSelected, onOpenDetail, userLocation }: RankingPanelProps) {
  const [ranking, setRanking] = useState<RankedSpot[]>([]);
  const [selected, setSelected] = useState<RankedSpot | null>(initialSelected ?? null);
  const [period, setPeriod] = useState<Period>("1일");

  // 랭킹 데이터 로드 (위치 정보 있으면 위치 기반, 없으면 기본값)
  useEffect(() => {
    getRanking(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined).then((data) => {
      setRanking(data);
      if (!selected) setSelected(data[0] ?? null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation?.lat, userLocation?.lng]);

  // 외부에서 마커 클릭 시 해당 맛집으로 전환
  useEffect(() => {
    if (initialSelected) setSelected(initialSelected);
  }, [initialSelected]);

  if (!selected) return null;

  const chartData = selected.timeSeries[period];
  const isUp = selected.change > 0;
  const isDown = selected.change < 0;
  const chartColor = isUp ? "#ef4444" : isDown ? "#3b82f6" : "#f97316";

  return (
    <>
      {/* 백드롭 */}
      <div
        className={cn(
          "fixed inset-0 z-[140] bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[150] h-full w-full max-w-[420px] bg-[#f8f8f8] shadow-2xl transition-transform duration-300 ease-in-out overflow-y-auto",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div>
            <h2 className="text-base font-black text-zinc-900">맛집 증권 거래소</h2>
            <p className="text-xs text-zinc-400 mt-0.5">내 위치 반경 1km · 실시간 인기 지수</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors p-1">
            <X size={18} />
          </button>
        </div>

        {/* 티커 카드 리스트 */}
        <div className="flex gap-3 px-5 pb-4 overflow-x-auto scrollbar-hide">
          {ranking.map((r) => (
            <button
              key={r.ticker}
              onClick={() => setSelected(r)}
              className={cn(
                "shrink-0 w-36 rounded-2xl p-3 text-left transition-all border",
                selected.ticker === r.ticker
                  ? "bg-white border-orange-300 shadow-md"
                  : "bg-white border-zinc-100 hover:border-zinc-200"
              )}
            >
              <p className="text-[10px] font-bold text-zinc-400 tracking-widest">{r.ticker}</p>
              <p className="text-sm font-bold text-zinc-800 mt-0.5 truncate">{r.name}</p>
              <p className="text-xl font-black text-zinc-900 mt-1">{r.rating}★</p>
              <ChangeChip change={r.change} />
            </button>
          ))}
        </div>

        {/* 선택된 맛집 상세 */}
        <div className="mx-4 mb-4 bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          {/* 맛집명 & 현재 평점 */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-base font-black text-zinc-900">{selected.name}</h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                {selected.category} · {selected.status} · {selected.distance}
              </p>
            </div>
            <div className="text-right">
              <p className={cn(
                "text-2xl font-black",
                isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-zinc-800"
              )}>
                {selected.rating}★
              </p>
              <p className={cn(
                "text-xs font-bold",
                isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-zinc-400"
              )}>
                {isUp ? "▲" : isDown ? "▼" : "-"} {Math.abs(selected.change)} (오늘 리뷰 +{selected.todayReviews})
              </p>
            </div>
          </div>

          {/* 기간 선택 */}
          <div className="flex gap-2 mb-3">
            {(["1일", "1주", "1달", "3달"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-semibold border transition-all",
                  period === p
                    ? "bg-zinc-800 text-white border-zinc-800"
                    : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* 라인 차트 */}
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis domain={[3.5, 5.0]} tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area
                type="monotone"
                dataKey="rating"
                stroke={chartColor}
                strokeWidth={2}
                fill="url(#ratingGrad)"
                dot={false}
                activeDot={{ r: 4, fill: chartColor }}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* 통계 그리드 */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "오늘 리뷰", value: `+${selected.todayReviews}건` },
              { label: "대기 인원", value: `${selected.waiting}명` },
              { label: "재방문율", value: `${selected.revisitRate}%` },
              { label: "평균 가격", value: `${selected.avgPrice.toLocaleString()}원` },
              { label: "52주 최고", value: `${selected.high52}★` },
              { label: "52주 최저", value: `${selected.low52}★` },
            ].map((stat) => (
              <div key={stat.label} className="bg-zinc-50 rounded-xl p-2.5">
                <p className="text-[10px] text-zinc-400">{stat.label}</p>
                <p className="text-sm font-bold text-zinc-800 mt-0.5">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* 자세히 보기 버튼 */}
          {onOpenDetail && (
            <button
              onClick={() => { onOpenDetail(selected); onClose(); }}
              className="w-full mt-3 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-orange-50 text-orange-500 text-sm font-bold hover:bg-orange-100 transition-colors"
            >
              자세히 보기
              <ChevronRight size={15} />
            </button>
          )}
        </div>

        {/* 인기 순위 호가창 */}
        <div className="mx-4 mb-8 bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <h4 className="text-sm font-black text-zinc-800 mb-4">인기 순위 · 호가창</h4>
          <div className="flex flex-col gap-2.5">
            {ranking.map((r) => {
              const pct = ((r.rating - 4.0) / (5.0 - 4.0)) * 100;
              const isRed = r.change > 0;
              const isBlue = r.change < 0;
              return (
                <button
                  key={r.rank}
                  onClick={() => setSelected(r)}
                  className="flex items-center gap-3 hover:bg-zinc-50 rounded-xl px-1 py-0.5 transition-colors"
                >
                  <span className="w-4 text-xs text-zinc-400 font-bold">{r.rank}</span>
                  <span className="w-24 text-xs font-semibold text-zinc-700 truncate text-left">{r.name}</span>
                  <div className="flex-1 h-4 bg-zinc-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        isRed ? "bg-red-400" : isBlue ? "bg-blue-400" : "bg-orange-400"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className={cn(
                    "w-10 text-right text-xs font-black",
                    isRed ? "text-red-500" : isBlue ? "text-blue-500" : "text-zinc-700"
                  )}>
                    {r.rating}★
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
