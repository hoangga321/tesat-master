"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Brain,
  Target,
  ShieldCheck,
  UserPlus,
  LogIn,
  Trophy,
  Star,
  Clock,
  Layers,
  Orbit,
} from "lucide-react";
import { SM2CardState, IncorrectNoteRecord } from "@/lib/engine/srs-sm2";
import { SEED_VOCABULARY } from "@/lib/data/vocabulary-seed";
import { Interactive3DTiltWrapper } from "@/components/Tesat3DAndGoalEngine";

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  targetTier: "S급" | "1급" | "2급" | "3급";
  createdAt: string;
}

export interface UserStudyProgress {
  userId: string;
  currentStreak: number; // Always starts at 0! Only increments when completing an exercise
  longestStreak: number;
  lastStreakDate: string | null; // YYYY-MM-DD
  completedExercisesCount: number;
  xpPoints: number;
  questionsAnsweredInCurrentSession: number;
  selectedAnswers: Record<string, number | undefined>;
  errorLog: Record<string, IncorrectNoteRecord>;
  srsStates: Record<string, SM2CardState>;
}

export interface CelebrationPayload {
  title: string;
  subtitle: string;
  streakUnlocked?: boolean;
  newStreakCount?: number;
  xpEarned: number;
  scoreSummary?: string;
  tone?: "EXCELLENT" | "GOOD" | "NEEDS_WORK" | "WARNING";
  badgeLabel?: string;
}

const USERS_STORAGE_KEY = "tesat_master_users_v2";
const ACTIVE_USER_KEY = "tesat_master_active_user_v2";
const PROGRESS_PREFIX = "tesat_master_progress_v2_";

export function createInitialUserProgress(userId: string): UserStudyProgress {
  const initSrs: Record<string, SM2CardState> = {};
  for (const v of SEED_VOCABULARY) {
    initSrs[v.id] = {
      repetition: 0,
      intervalDays: 0,
      easinessFactor: 2.5,
      nextReviewAt: new Date().toISOString(),
      lastQuality: 0,
    };
  }
  return {
    userId,
    currentStreak: 0, // Bắt đầu từ 0 theo đúng yêu cầu!
    longestStreak: 0,
    lastStreakDate: null,
    completedExercisesCount: 0,
    xpPoints: 0,
    questionsAnsweredInCurrentSession: 0,
    selectedAnswers: {},
    errorLog: {},
    srsStates: initSrs,
  };
}

export function loadUsersFromStorage(): UserAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveUsersToStorage(users: UserAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadActiveUserFromStorage(): UserAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveActiveUserToStorage(user: UserAccount | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      window.localStorage.removeItem(ACTIVE_USER_KEY);
    } else {
      window.localStorage.setItem(ACTIVE_USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore
  }
}

export function loadUserProgressFromStorage(userId: string): UserStudyProgress {
  if (typeof window === "undefined") return createInitialUserProgress(userId);
  try {
    const raw = window.localStorage.getItem(`${PROGRESS_PREFIX}${userId}`);
    if (!raw) return createInitialUserProgress(userId);
    return JSON.parse(raw);
  } catch {
    return createInitialUserProgress(userId);
  }
}

export function saveUserProgressToStorage(progress: UserStudyProgress): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${PROGRESS_PREFIX}${progress.userId}`,
      JSON.stringify(progress)
    );
  } catch {
    // Ignore
  }
}

/**
 * Custom SVG Emblem Logo for TESAT Master
 */
export function TesatLogoCrest({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1D4ED8] via-[#2563EB] to-[#0F172A] shadow-md ring-1 ring-white/20"
    >
      <svg
        viewBox="0 0 40 40"
        fill="none"
        className="h-3/4 w-3/4"
        aria-hidden="true"
      >
        {/* Open Book Base */}
        <path
          d="M7 13C7 11.8954 7.89543 11 9 11H17C18.6569 11 20 12.3431 20 14V29C20 27.8954 19.1046 27 18 27H9C7.89543 27 7 26.1046 7 25V13Z"
          fill="white"
          fillOpacity="0.92"
        />
        <path
          d="M33 13C33 11.8954 32.1046 11 31 11H23C21.3431 11 20 12.3431 20 14V29C20 27.8954 20.8954 27 22 27H31C32.1046 27 33 26.1046 33 25V13Z"
          fill="#93C5FD"
          fillOpacity="0.92"
        />
        {/* Rising Economic Chart Arrow */}
        <path
          d="M12 22L17 17L21 20L28 12"
          stroke="#F59E0B"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M24 12H28V16"
          stroke="#F59E0B"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/**
 * Animated Celebration Modal when user completes an exercise or unlocks a new streak
 */
export function CelebrationPopupModal({
  payload,
  onClose,
  darkMode,
}: {
  payload: CelebrationPayload | null;
  onClose: () => void;
  darkMode: boolean;
}) {
  if (!payload) return null;

  const tone = payload.tone ?? "EXCELLENT";
  const isWarningOrNeedsWork = tone === "WARNING" || tone === "NEEDS_WORK";

  const bannerGradient =
    tone === "WARNING"
      ? "from-rose-500 to-red-600 ring-rose-500/20"
      : tone === "NEEDS_WORK"
        ? "from-amber-500 to-orange-600 ring-amber-500/20"
        : tone === "GOOD"
          ? "from-blue-500 to-indigo-600 ring-blue-500/20"
          : "from-amber-400 to-orange-500 ring-amber-400/20";

  const pillClasses =
    tone === "WARNING"
      ? "bg-rose-500/15 text-rose-600 dark:text-rose-300"
      : tone === "NEEDS_WORK"
        ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
        : "bg-amber-500/15 text-amber-600 dark:text-amber-300";

  const defaultBadgeLabel = payload.badgeLabel
    ? payload.badgeLabel
    : payload.streakUnlocked
      ? `Mở khóa Chuỗi ${payload.newStreakCount} Ngày Học Liên Tiếp!`
      : tone === "WARNING"
        ? "Cảnh báo: Chưa đủ điều kiện chấm điểm & nhận Chuỗi!"
        : tone === "NEEDS_WORK"
          ? "Cần cố gắng hơn · Hãy ôn kỹ lại lý thuyết!"
          : tone === "GOOD"
            ? "Hoàn thành phiên luyện tập tốt!"
            : "Hoàn thành bài luyện tập xuất sắc!";

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
    >
      <div
        className={`animate-celebration-pop relative w-full max-w-md overflow-hidden rounded-3xl border p-7 text-center shadow-2xl ${
          darkMode
            ? "border-blue-500/30 bg-[#111827] text-white"
            : "border-blue-200 bg-white text-slate-900"
        }`}
      >
        {/* Top Glow Banner */}
        <div
          className={`relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ring-4 ${bannerGradient}`}
        >
          {payload.streakUnlocked ? (
            <Flame className="animate-flame h-9 w-9" aria-hidden="true" />
          ) : isWarningOrNeedsWork ? (
            <Target className="h-9 w-9" aria-hidden="true" />
          ) : (
            <Trophy className="animate-flame h-9 w-9" aria-hidden="true" />
          )}
          {!isWarningOrNeedsWork && (
            <Star
              className="absolute -top-2 -right-2 h-5 w-5 fill-amber-300 text-amber-400"
              aria-hidden="true"
            />
          )}
        </div>

        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${pillClasses}`}
        >
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{defaultBadgeLabel}</span>
        </div>

        <h3 className="mt-3 text-2xl font-extrabold tracking-tight">
          {payload.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {payload.subtitle}
        </p>

        {/* Stats Box */}
        <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
          <div>
            <div className="text-xs font-medium text-slate-500">
              Điểm kinh nghiệm
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold ${
                payload.xpEarned > 0
                  ? "text-[#1D4ED8] dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              +{payload.xpEarned} XP
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">
              {payload.scoreSummary ? "Kết quả bài làm" : "Chuỗi hiện tại"}
            </div>
            <div
              className={`mt-0.5 text-lg font-extrabold ${
                isWarningOrNeedsWork && !payload.streakUnlocked
                  ? "text-amber-600 dark:text-amber-400"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {payload.scoreSummary ?? `${payload.newStreakCount ?? 0} ngày`}
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
        >
          <span>
            {tone === "WARNING"
              ? "Quay lại làm bài ngay"
              : "Tiếp tục chinh phục TESAT"}
          </span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Beautiful Commercial Landing Page + Registration / Login Flow
 */
export function TesatLandingPage({
  darkMode,
  onToggleDarkMode,
  is3DMode = false,
  onToggle3DMode,
  onAuthSuccess,
  totalQuestionsCount,
  examSetsCount,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  is3DMode?: boolean;
  onToggle3DMode?: () => void;
  onAuthSuccess: (user: UserAccount, serverProgress?: UserStudyProgress) => void;
  totalQuestionsCount: number;
  examSetsCount: number;
}) {
  const [authTab, setAuthTab] = useState<"REGISTER" | "LOGIN">("REGISTER");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [targetTier, setTargetTier] = useState<"S급" | "1급" | "2급" | "3급">("1급");
  const [errorMsg, setErrorMsg] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingAuth) return;
    setErrorMsg("");

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setErrorMsg("Vui lòng nhập đầy đủ Tên đăng nhập và Mật khẩu.");
      return;
    }

    if (authTab === "REGISTER" && !fullName.trim()) {
      setErrorMsg("Vui lòng nhập Họ và tên của bạn.");
      return;
    }

    setSubmittingAuth(true);
    const existingUsers = loadUsersFromStorage();

    try {
      const res = await fetch("/api/db/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authTab,
          email: cleanUser,
          password: cleanPass,
          fullName: fullName.trim(),
          targetTier,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Fallback check: if user tried to LOGIN and existed only in local browser storage from an older session, sync them to DB
        if (authTab === "LOGIN" && res.status === 404) {
          const localMatched = existingUsers.find(
            (u) => u.username === cleanUser && u.passwordHash === cleanPass
          );
          if (localMatched) {
            const localProg = loadUserProgressFromStorage(localMatched.id);
            await fetch("/api/db/auth", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "REGISTER",
                email: localMatched.username,
                password: localMatched.passwordHash,
                fullName: localMatched.fullName,
                targetTier: localMatched.targetTier,
              }),
            }).catch(() => {});
            saveActiveUserToStorage(localMatched);
            onAuthSuccess(localMatched, localProg);
            return;
          }
        }
        setErrorMsg(
          data?.error ||
            "Không thể xác thực tài khoản. Vui lòng kiểm tra lại thông tin."
        );
        return;
      }

      const dbUser: UserAccount = {
        id: data.user.id,
        fullName: data.user.fullName,
        username: data.user.username || data.user.email || cleanUser,
        passwordHash: cleanPass,
        targetTier: (data.user.targetTier || targetTier || "1급") as
          | "S급"
          | "1급"
          | "2급"
          | "3급",
        createdAt: data.user.createdAt || new Date().toISOString(),
      };

      const baseProg = createInitialUserProgress(dbUser.id);
      const syncedProgress: UserStudyProgress = {
        ...baseProg,
        userId: dbUser.id,
        currentStreak: data.progress?.currentStreak ?? 0,
        longestStreak: data.progress?.longestStreak ?? 0,
        lastStreakDate: data.progress?.lastStreakDate ?? null,
        completedExercisesCount: data.progress?.completedExercisesCount ?? 0,
        xpPoints: data.progress?.xpPoints ?? 0,
        questionsAnsweredInCurrentSession:
          data.progress?.questionsAnsweredInCurrentSession ?? 0,
        selectedAnswers: data.progress?.selectedAnswers ?? {},
        errorLog: data.progress?.errorLog ?? {},
        srsStates:
          data.progress?.srsStates &&
          Object.keys(data.progress.srsStates).length > 0
            ? data.progress.srsStates
            : baseProg.srsStates,
      };

      const filteredUsers = existingUsers.filter(
        (u) => u.username !== dbUser.username
      );
      saveUsersToStorage([...filteredUsers, dbUser]);
      saveActiveUserToStorage(dbUser);
      saveUserProgressToStorage(syncedProgress);

      onAuthSuccess(dbUser, syncedProgress);
    } catch {
      // Offline / Unit-Test fallback using localStorage
      if (authTab === "REGISTER") {
        if (existingUsers.some((u) => u.username === cleanUser)) {
          setErrorMsg(
            "Tên đăng nhập này đã tồn tại. Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập."
          );
          return;
        }
        const newUser: UserAccount = {
          id: `user_${Date.now()}`,
          fullName: fullName.trim(),
          username: cleanUser,
          passwordHash: cleanPass,
          targetTier,
          createdAt: new Date().toISOString(),
        };
        saveUsersToStorage([...existingUsers, newUser]);
        saveActiveUserToStorage(newUser);
        const freshProgress = createInitialUserProgress(newUser.id);
        saveUserProgressToStorage(freshProgress);
        onAuthSuccess(newUser, freshProgress);
      } else {
        const matched = existingUsers.find(
          (u) => u.username === cleanUser && u.passwordHash === cleanPass
        );
        if (!matched) {
          setErrorMsg("Tên đăng nhập hoặc mật khẩu chưa chính xác.");
          return;
        }
        saveActiveUserToStorage(matched);
        const prog = loadUserProgressFromStorage(matched.id);
        onAuthSuccess(matched, prog);
      }
    } finally {
      setSubmittingAuth(false);
    }
  };

  const pageBg = is3DMode
    ? "dark world-3d-universe text-white"
    : darkMode
      ? "dark bg-[#0B0F17] text-white"
      : "bg-[#F6F5F1] text-[#0F172A]";
  const cardSurface = is3DMode
    ? "bg-gradient-to-br from-[#0B1325] via-[#0F172A] to-[#080D1A] border-2 border-blue-500/40 text-white shadow-[0_20px_55px_rgba(15,23,42,0.65)]"
    : darkMode
      ? "bg-[#111827] border-[#1E293B] text-white"
      : "bg-white border-[#E2E0D8] text-[#0F172A] shadow-sm";
  const subtleSurface = is3DMode
    ? "bg-[#090F1E] border-blue-400/25 text-slate-200"
    : darkMode
      ? "bg-[#0F172A] border-[#1E293B] text-slate-200"
      : "bg-[#F8F7F4] border-[#E5E3DC] text-slate-700";
  const mutedText = is3DMode
    ? "text-slate-300"
    : darkMode
      ? "text-slate-400"
      : "text-slate-600";

  return (
    <div
      className={`relative min-h-screen transition-colors duration-200 ${pageBg}`}
    >
      {is3DMode && (
        <div
          aria-hidden="true"
          className="world-3d-horizon-floor pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[44vh] opacity-65"
        />
      )}

      {/* Top Navbar */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-md transition-all ${
          is3DMode
            ? "hud-3d-floating-bar border-blue-500/40 bg-[#060B16]/95 shadow-[0_12px_40px_rgba(29,78,216,0.3)]"
            : darkMode
              ? "border-[#1E293B] bg-[#0B0F17]/90"
              : "border-[#E2E0D8] bg-[#F6F5F1]/90"
        }`}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2 px-4 py-3.5 sm:px-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <TesatLogoCrest size={36} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="truncate text-sm font-extrabold tracking-tight sm:text-base">
                  {is3DMode ? "TESAT 3D World" : "TESAT Master"}
                </span>
                <span className="hidden rounded-md bg-blue-600/15 px-2 py-0.5 text-xs font-bold text-[#1D4ED8] sm:inline-block dark:text-blue-400">
                  한국경제 TESAT
                </span>
              </div>
              <p className={`hidden text-[11px] md:block ${mutedText}`}>
                Nền tảng luyện thi Kinh tế Hàn Quốc dành cho người Việt
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2.5">
            {onToggle3DMode && (
              <button
                type="button"
                onClick={onToggle3DMode}
                title="Chuyển đổi toàn bộ trang web giữa Không gian 3D và Chế độ Gốc (2D)"
                className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition sm:px-3.5 ${
                  is3DMode
                    ? "border-amber-400 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.5)]"
                    : subtleSurface
                }`}
              >
                <Orbit
                  className={`h-4 w-4 shrink-0 ${
                    is3DMode ? "animate-spin text-slate-950" : "text-[#1D4ED8]"
                  }`}
                  aria-hidden="true"
                />
                <span>{is3DMode ? "Về Bản Gốc (2D)" : "Chế độ 3D ✨"}</span>
              </button>
            )}
            <button
              onClick={onToggleDarkMode}
              className={`hidden min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold transition sm:inline-flex sm:items-center ${subtleSurface}`}
            >
              {darkMode ? "Giao diện Sáng" : "Giao diện Tối"}
            </button>
            <a
              href="#auth-section"
              className="flex min-h-[38px] items-center rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700 sm:px-4 sm:py-2"
            >
              Đăng ký / Đăng nhập
            </a>
          </div>
        </div>
      </header>

      {/* Main Hero + Auth Grid */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 py-8 sm:px-8 sm:py-14">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          {/* Left 7 Cols: Value Proposition & Features */}
          <div
            className={`animate-screen-enter space-y-6 lg:col-span-7 ${
              is3DMode ? "cockpit-3d-left-wing" : ""
            }`}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-600/20 bg-blue-600/10 px-3.5 py-1.5 text-xs font-bold text-[#1D4ED8] dark:text-blue-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                Tích hợp Gia sư AI Gemini & Ngân hàng {totalQuestionsCount} câu đề thật ({examSetsCount} bộ đề)
              </span>
            </div>

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Chinh phục chứng chỉ kinh tế{" "}
              <span className="text-[#1D4ED8] dark:text-blue-400">
                Hankyung TESAT
              </span>{" "}
              với lộ trình cá nhân hóa.
            </h1>

            <p className={`max-w-2xl text-base leading-relaxed sm:text-lg ${mutedText}`}>
              Vượt qua rào cản thuật ngữ kinh tế Hàn Quốc bằng hệ thống giải thích bình dân dễ hiểu, mẹo khoanh nhanh 5 giây, từ điển Hán-Hàn theo từng câu hỏi và bộ đề thi thử 80 câu chuẩn.
            </p>

            {/* Key Metrics Strip */}
            <div className={`grid grid-cols-3 gap-4 pt-2 ${is3DMode ? "grid-3d-stage" : ""}`}>
              <div className={`rounded-2xl border p-4 sm:p-5 ${cardSurface} ${is3DMode ? "card-3d-prism" : ""}`}>
                <div className="tabular-nums text-2xl font-black text-[#1D4ED8] dark:text-blue-400 sm:text-3xl">
                  {totalQuestionsCount}
                </div>
                <div className={`mt-1 text-xs font-medium sm:text-sm ${mutedText}`}>
                  Câu hỏi đề thi thật từ báo 한국경제
                </div>
              </div>
              <div className={`rounded-2xl border p-4 sm:p-5 ${cardSurface} ${is3DMode ? "card-3d-prism" : ""}`}>
                <div className="tabular-nums text-2xl font-black text-emerald-600 dark:text-emerald-400 sm:text-3xl">
                  {examSetsCount} Bộ đề
                </div>
                <div className={`mt-1 text-xs font-medium sm:text-sm ${mutedText}`}>
                  Chuẩn form 80 câu · 300 điểm · 100 phút
                </div>
              </div>
              <div className={`rounded-2xl border p-4 sm:p-5 ${cardSurface} ${is3DMode ? "card-3d-prism" : ""}`}>
                <div className="tabular-nums text-2xl font-black text-amber-600 dark:text-amber-400 sm:text-3xl">
                  Live AI
                </div>
                <div className={`mt-1 text-xs font-medium sm:text-sm ${mutedText}`}>
                  Dịch đề, chỉ mẹo giải & sinh câu tương tự
                </div>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className={`grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2 ${is3DMode ? "grid-3d-stage" : ""}`}>
              <div className={`flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 ${subtleSurface} ${is3DMode ? "card-3d-prism" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white">
                  <Brain className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold sm:text-base">
                    AI Giải thích bình dân & Mẹo 5s
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${mutedText}`}>
                    Nhận diện đúng nội dung câu hỏi, dịch nghĩa 5 phương án và chỉ rõ từ khóa để khoanh nhanh đáp án.
                  </p>
                </div>
              </div>

              <div className={`flex items-start gap-3.5 rounded-2xl border p-4 sm:p-5 ${subtleSurface} ${is3DMode ? "card-3d-prism" : ""}`}>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <BookOpen className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-bold sm:text-base">
                    Từ vựng Hán-Hàn theo từng câu
                  </h3>
                  <p className={`mt-1 text-xs leading-relaxed sm:text-sm ${mutedText}`}>
                    Tự động trích xuất các thuật ngữ kinh tế xuất hiện ngay trong câu hỏi đang làm kèm phát âm.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right 5 Cols: Account Registration / Login Card */}
          <div
            id="auth-section"
            className={`lg:col-span-5 ${
              is3DMode ? "cockpit-3d-right-wing" : ""
            }`}
          >
            <Interactive3DTiltWrapper
              enabled={is3DMode}
              intensity={3}
              className={`rounded-3xl border p-5 sm:p-7 shadow-lg ${cardSurface}`}
            >
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-extrabold">
                    {authTab === "REGISTER"
                      ? "Tạo tài khoản học tập mới"
                      : "Đăng nhập tài khoản"}
                  </h2>
                  <p className={`text-xs ${mutedText}`}>
                    Lưu trữ riêng biệt tiến độ, chuỗi ngày học và sổ tay câu sai của bạn
                  </p>
                </div>
              </div>

              {/* Tab Switcher */}
              <div
                className={`mb-5 grid grid-cols-2 gap-1 rounded-xl border p-1 ${subtleSurface}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("REGISTER");
                    setErrorMsg("");
                  }}
                  className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
                    authTab === "REGISTER"
                      ? "bg-[#1D4ED8] text-white"
                      : "hover:opacity-80"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đăng ký mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab("LOGIN");
                    setErrorMsg("");
                  }}
                  className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition ${
                    authTab === "LOGIN"
                      ? "bg-[#1D4ED8] text-white"
                      : "hover:opacity-80"
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Đăng nhập</span>
                </button>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs">
                {authTab === "REGISTER" && (
                  <div>
                    <label
                      htmlFor="reg-fullname"
                      className="mb-1.5 block font-semibold"
                    >
                      Họ và tên của bạn
                    </label>
                    <input
                      id="reg-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="VD: Nguyễn Văn An"
                      className={`min-h-[42px] w-full rounded-xl border px-3.5 py-2 text-sm ${subtleSurface}`}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-username"
                    className="mb-1.5 block font-semibold"
                  >
                    Tên đăng nhập (hoặc Email)
                  </label>
                  <input
                    id="auth-username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="VD: hocvien01"
                    className={`min-h-[42px] w-full rounded-xl border px-3.5 py-2 text-sm ${subtleSurface}`}
                  />
                </div>

                <div>
                  <label
                    htmlFor="auth-password"
                    className="mb-1.5 block font-semibold"
                  >
                    Mật khẩu
                  </label>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className={`min-h-[42px] w-full rounded-xl border px-3.5 py-2 text-sm ${subtleSurface}`}
                  />
                </div>

                {authTab === "REGISTER" && (
                  <div>
                    <label
                      htmlFor="reg-tier"
                      className="mb-1.5 block font-semibold"
                    >
                      Mục tiêu cấp bậc TESAT của bạn
                    </label>
                    <select
                      id="reg-tier"
                      value={targetTier}
                      onChange={(e) =>
                        setTargetTier(
                          e.target.value as "S급" | "1급" | "2급" | "3급"
                        )
                      }
                      className={`min-h-[42px] w-full rounded-xl border px-3.5 py-2 text-sm ${subtleSurface}`}
                    >
                      <option value="S급">Hạng S급 (270 ~ 300 điểm)</option>
                      <option value="1급">Hạng 1급 (240 ~ 269 điểm)</option>
                      <option value="2급">Hạng 2급 (210 ~ 239 điểm)</option>
                      <option value="3급">Hạng 3급 (180 ~ 209 điểm)</option>
                    </select>
                  </div>
                )}

                {errorMsg && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 font-semibold text-rose-600 dark:text-rose-300">
                    {errorMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <span>
                    {authTab === "REGISTER"
                      ? "Tạo tài khoản & Bắt đầu học ngay"
                      : "Đăng nhập vào không gian học tập"}
                  </span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>

                <div className="pt-1 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      const existingUsers = loadUsersFromStorage();
                      let demoUser = existingUsers.find(
                        (u) => u.username === "hocvien_demo"
                      );
                      if (!demoUser) {
                        demoUser = {
                          id: "user_demo_tesat",
                          fullName: "Học viên TESAT",
                          username: "hocvien_demo",
                          passwordHash: "demo123",
                          targetTier: "1급",
                          createdAt: new Date().toISOString(),
                        };
                        saveUsersToStorage([...existingUsers, demoUser]);
                        saveUserProgressToStorage(
                          createInitialUserProgress(demoUser.id)
                        );
                      }
                      saveActiveUserToStorage(demoUser);
                      onAuthSuccess(demoUser);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold underline-offset-4 hover:underline ${mutedText}`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                    <span>Vào học thử nhanh 1 chạm (Tài khoản Học viên Demo)</span>
                  </button>
                </div>
              </form>
            </Interactive3DTiltWrapper>
          </div>
        </div>
      </main>
    </div>
  );
}
