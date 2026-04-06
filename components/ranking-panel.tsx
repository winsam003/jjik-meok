"use client";

import { useState, useEffect } from "react";
import { X, TrendingUp, TrendingDown, ChevronRight } from "lucide-react";
import {
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";
import { getRanking } from "@/lib/services/spot.service";
import { getRatingHistory } from "@/lib/services/rating-history.service";
import type { RankedSpot, TimeSeriesPoint } from "@/lib/types";
import { cn } from "@/lib/utils";

type Period = "1일" | "1주" | "1달" | "3달";

interface RankingPanelProps {
  open: boolean;
  onClose: () => void;
  initialSelected?: RankedSpot;
  onOpenDetail?: (spot: RankedSpot) => void;
  userLocation?: { lat: number; lng: number };
  spots?: RankedSpot[];
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

export default function RankingPanel({ open, onClose, initialSelected, onOpenDetail, userLocation, spots: externalSpots }: RankingPanelProps) {
  const [ranking, setRanking] = useState<RankedSpot[]>([]);
  const [selected, setSelected] = useState<RankedSpot | null>(initialSelected ?? null);
  const [period, setPeriod] = useState<Period>("1일");
  const [chartData, setChartData] = useState<TimeSeriesPoint[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  // 외부에서 필터된 spots가 전달되면 그대로 사용, 없으면 직접 로드
  useEffect(() => {
    if (externalSpots && externalSpots.length > 0) {
      setRanking(externalSpots);
      if (!selected || !externalSpots.find(s => s.id === selected.id)) {
        setSelected(externalSpots[0] ?? null);
      }
      return;
    }
    getRanking(userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined).then((data) => {
      setRanking(data);
      if (!selected) setSelected(data[0] ?? null);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalSpots, userLocation?.lat, userLocation?.lng]);

  // 외부에서 마커 클릭 시 해당 맛집으로 전환
  useEffect(() => {
    if (initialSelected) setSelected(initialSelected);
  }, [initialSelected]);

  // 선택된 Spot 또는 기간 변경 시 차트 데이터 로드
  useEffect(() => {
    if (!selected || selected.reviewCount === 0) {
      setChartData([]);
      return;
    }
    let cancelled = false;
    setChartLoading(true);
    getRatingHistory(selected.id, period)
      .then((data) => {
        if (!cancelled) setChartData(data);
      })
      .catch(() => {
        if (!cancelled) setChartData([]);
      })
      .finally(() => {
        if (!cancelled) setChartLoading(false);
      });
    return () => { cancelled = true; };
  }, [selected?.id, selected?.reviewCount, period]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!selected) return null;

  // 차트 데이터 기반 변화량 계산
  const computedChange = chartData.length >= 2
    ? Math.round((chartData[chartData.length - 1].rating - chartData[0].rating) * 10) / 10
    : 0;
  const isUp = computedChange > 0;
  const isDown = computedChange < 0;
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
            <p className="text-xs text-zinc-400 mt-0.5">내 주변 실시간 맛집 시세</p>
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
              <p className="text-xl font-black text-zinc-900 mt-1">
                {r.reviewCount > 0 ? `${r.rating}★` : "-"}
              </p>
              {r.reviewCount > 0 ? (
                <span className="text-[10px] text-zinc-400">{r.reviewCount}개 리뷰</span>
              ) : (
                <span className="text-[10px] text-zinc-300">리뷰 없음</span>
              )}
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
                {selected.reviewCount > 0 ? `${selected.rating}★` : "리뷰 없음"}
              </p>
              {selected.reviewCount > 0 && (
                <p className={cn(
                  "text-xs font-bold",
                  isUp ? "text-red-500" : isDown ? "text-blue-500" : "text-zinc-400"
                )}>
                  {isUp ? "▲" : isDown ? "▼" : "-"} {Math.abs(computedChange)} (오늘 리뷰 +{selected.todayReviews})
                </p>
              )}
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

          {/* 평점 추이 차트 */}
          {chartLoading ? (
            <div className="flex items-center justify-center h-[160px]">
              <div className="flex flex-col items-center gap-2">
                <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-zinc-400">차트 로딩중...</span>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-[160px] bg-zinc-50 rounded-xl">
              <div className="text-center">
                <p className="text-2xl mb-1">📊</p>
                <p className="text-xs text-zinc-400 font-medium">
                  {selected.reviewCount === 0 ? "아직 리뷰가 없어요" : "이 기간에 리뷰 데이터가 없어요"}
                </p>
                <p className="text-[10px] text-zinc-300 mt-0.5">리뷰가 쌓이면 평점 추이를 볼 수 있어요</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="ratingGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColor} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#a1a1aa" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis
                  domain={[
                    (dataMin: number) => Math.max(0, Math.floor((dataMin - 0.5) * 10) / 10),
                    (dataMax: number) => Math.min(5, Math.ceil((dataMax + 0.3) * 10) / 10),
                  ]}
                  tick={{ fontSize: 10, fill: "#a1a1aa" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="rating"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill="url(#ratingGrad)"
                  dot={chartData.length <= 10}
                  activeDot={{ r: 4, fill: chartColor }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {/* 통계 그리드 (실제 데이터) */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: "전체 리뷰", value: selected.reviewCount > 0 ? `${selected.reviewCount}건` : "-" },
              { label: "오늘 리뷰", value: selected.todayReviews > 0 ? `+${selected.todayReviews}건` : "-" },
              { label: "좋아요", value: selected.likeCount > 0 ? `${selected.likeCount}개` : "-" },
              ...(chartData.length >= 2
                ? [
                    { label: "기간 최고", value: `${Math.max(...chartData.map(d => d.rating))}★` },
                    { label: "기간 최저", value: `${Math.min(...chartData.map(d => d.rating))}★` },
                    { label: "평점 변화", value: `${computedChange > 0 ? "+" : ""}${computedChange}` },
                  ]
                : [
                    { label: "기간 최고", value: "-" },
                    { label: "기간 최저", value: "-" },
                    { label: "평점 변화", value: "-" },
                  ]
              ),
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

        {/* Spot 목록 */}
        <div className="mx-4 mb-8 bg-white rounded-2xl border border-zinc-100 shadow-sm p-4">
          <h4 className="text-sm font-black text-zinc-800 mb-4">종목 리스트</h4>
          <div className="flex flex-col gap-2.5">
            {ranking.map((r, idx) => {
              const num = idx + 1;
              const isTop3 = num <= 3;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-2 py-2 transition-colors text-left",
                    selected.id === r.id ? "bg-orange-50" : "hover:bg-zinc-50"
                  )}
                >
                  {/* 순위 번호 */}
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0",
                    num === 1 ? "bg-orange-500 text-white" :
                    num === 2 ? "bg-indigo-500 text-white" :
                    num === 3 ? "bg-emerald-500 text-white" :
                    "bg-zinc-100 text-zinc-400"
                  )}>
                    {num}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 truncate">{r.name}</p>
                    <p className="text-[10px] text-zinc-400">{r.category} · {r.distance}</p>
                  </div>
                  <div className="text-right shrink-0">
                    {r.reviewCount > 0 ? (
                      <>
                        <span className="text-xs font-black text-orange-500">{r.rating}★</span>
                        <p className="text-[9px] text-zinc-300">{r.reviewCount}리뷰</p>
                      </>
                    ) : (
                      <span className="text-[10px] text-zinc-300">리뷰 없음</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
