"use client";

import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { auth } from "@/lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

type AuthMode = "login" | "signup";

interface AuthModalProps {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
}

const FIREBASE_ERROR_MESSAGES: Record<string, string> = {
  "auth/email-already-in-use": "이미 사용 중인 이메일이에요.",
  "auth/invalid-email": "이메일 형식이 올바르지 않아요.",
  "auth/weak-password": "비밀번호는 6자리 이상이어야 해요.",
  "auth/user-not-found": "이메일 또는 비밀번호가 올바르지 않아요.",
  "auth/wrong-password": "이메일 또는 비밀번호가 올바르지 않아요.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 올바르지 않아요.",
  "auth/too-many-requests": "너무 많은 시도가 있었어요. 잠시 후 다시 시도해주세요.",
};

export default function AuthModal({ mode, onClose, onSwitchMode }: AuthModalProps) {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setNickname("");
    setEmail("");
    setPassword("");
    setConfirm("");
    setError("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  const handleSwitchMode = (newMode: AuthMode) => {
    resetForm();
    onSwitchMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (mode === "signup") {
      if (!nickname.trim()) return setError("닉네임을 입력해주세요.");
      if (password !== confirm) return setError("비밀번호가 일치하지 않아요.");
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(user, { displayName: nickname });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      const message = FIREBASE_ERROR_MESSAGES[err.code] ?? "오류가 발생했어요. 다시 시도해주세요.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm mx-4 bg-white rounded-3xl shadow-2xl p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* 로고 & 타이틀 */}
        <div className="flex flex-col items-center mb-6">
          <span className="text-3xl font-black text-orange-500 tracking-tight mb-1">찍먹</span>
          <p className="text-sm text-zinc-500">
            {mode === "login" ? "다시 만나서 반가워요!" : "찍먹과 함께 맛집을 탐험해요!"}
          </p>
        </div>

        {/* 탭 전환 */}
        <div className="flex bg-zinc-100 rounded-2xl p-1 mb-6">
          <button
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
              mode === "login" ? "bg-white text-orange-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
            )}
            onClick={() => handleSwitchMode("login")}
          >
            로그인
          </button>
          <button
            className={cn(
              "flex-1 py-2 text-sm font-semibold rounded-xl transition-all",
              mode === "signup" ? "bg-white text-orange-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
            )}
            onClick={() => handleSwitchMode("signup")}
          >
            회원가입
          </button>
        </div>

        {/* 폼 */}
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">닉네임</label>
              <input
                type="text"
                placeholder="닉네임을 입력하세요"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">이메일</label>
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-zinc-500">비밀번호</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === "signup" && (
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-zinc-500">비밀번호 확인</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="비밀번호를 한번 더 입력하세요"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 pr-10 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button type="button" className="text-xs text-zinc-400 hover:text-orange-500 transition-colors">
                비밀번호를 잊으셨나요?
              </button>
            </div>
          )}

          {/* 에러 메시지 */}
          {error && (
            <p className="text-xs text-red-500 text-center bg-red-50 rounded-xl px-3 py-2">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full mt-1 bg-orange-500 hover:bg-orange-600 text-white rounded-xl py-2.5 font-semibold text-sm disabled:opacity-60"
          >
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "회원가입"}
          </Button>
        </form>

        {/* 하단 전환 텍스트 */}
        <p className="text-center text-xs text-zinc-400 mt-4">
          {mode === "login" ? (
            <>
              아직 계정이 없으신가요?{" "}
              <button className="text-orange-500 font-semibold hover:underline" onClick={() => handleSwitchMode("signup")}>
                회원가입
              </button>
            </>
          ) : (
            <>
              이미 계정이 있으신가요?{" "}
              <button className="text-orange-500 font-semibold hover:underline" onClick={() => handleSwitchMode("login")}>
                로그인
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
