"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  User, Mail, Star, MessageCircle,
  Gamepad2, Ticket, ChevronRight,
  LogOut, Settings, Heart, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UserPanelProps {
  open: boolean;
  onClose: () => void;
}

export default function UserPanel({ open, onClose }: UserPanelProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    onClose();
  };

  const navigate = (path: string) => {
    router.push(path);
    onClose();
  };

  const stats = [
    { icon: <Star size={16} className="text-orange-400" />, label: "리뷰", value: 0 },
    { icon: <MessageCircle size={16} className="text-blue-400" />, label: "커뮤니티", value: 0 },
    { icon: <Gamepad2 size={16} className="text-purple-400" />, label: "게임", value: 0 },
    { icon: <Heart size={16} className="text-red-400" />, label: "저장", value: 0 },
  ];

  const menuItems = [
    { icon: <Star size={15} className="text-orange-400" />, label: "내 리뷰", onClick: () => {} },
    { icon: <Heart size={15} className="text-red-400" />, label: "저장한 맛집", onClick: () => {} },
    { icon: <Ticket size={15} className="text-green-500" />, label: "포인트 내역", onClick: () => navigate("/mileage") },
    { icon: <Settings size={15} className="text-zinc-400" />, label: "계정 설정", onClick: () => {} },
  ];

  return (
    <>
      {/* 백드롭 */}
      <div
        className={cn(
          "fixed inset-0 z-[150] bg-black/30 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* 패널 */}
      <div
        className={cn(
          "fixed top-0 right-0 z-[160] h-full w-full max-w-[360px] bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 프로필 */}
        <div className="bg-gradient-to-br from-orange-400 to-orange-500 px-6 pt-12 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-base">
                {user?.displayName ?? "닉네임 없음"}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Mail size={11} className="text-white/70" />
                <p className="text-white/70 text-xs">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* 포인트 */}
          <div className="mt-4 bg-white/20 rounded-2xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-xs">보유 포인트</p>
              <p className="text-white font-black text-xl">0 <span className="text-sm font-semibold">P</span></p>
            </div>
            <Button
              size="sm"
              className="bg-white text-orange-500 hover:bg-orange-50 text-xs font-bold rounded-xl"
              onClick={() => navigate("/mileage")}
            >
              교환하기
            </Button>
          </div>
        </div>

        {/* 활동 통계 */}
        <div className="px-6 py-4 border-b border-zinc-100">
          <div className="grid grid-cols-4 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <div className="w-9 h-9 bg-zinc-50 rounded-xl flex items-center justify-center">
                  {s.icon}
                </div>
                <p className="text-sm font-bold text-zinc-800">{s.value}</p>
                <p className="text-[10px] text-zinc-400">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 메뉴 */}
        <div className="flex-1 overflow-y-auto">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                "w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-50 transition-colors",
                idx !== menuItems.length - 1 && "border-b border-zinc-100"
              )}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="text-sm font-medium text-zinc-700">{item.label}</span>
              </div>
              <ChevronRight size={15} className="text-zinc-300" />
            </button>
          ))}
        </div>

        {/* 로그아웃 */}
        <div className="p-4 border-t border-zinc-100">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
          >
            <LogOut size={15} />
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
}
