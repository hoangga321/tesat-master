"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Target,
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Box,
  Orbit,
  Waves,
  Zap,
  Play,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { TesatQuestion, TesatSubcategory } from "@/lib/schemas/tesat-schema";

export type TargetTierType = "S급" | "1급" | "2급" | "3급";
export type Spatial3DLayoutType = "RING_3D" | "WAVE_3D" | "CUBE_3D";

export interface TierRoadmapConfig {
  tier: TargetTierType;
  minScore: number;
  maxScore: number;
  credits: number;
  badgeColor: string;
  gradientBg: string;
  headlineVi: string;
  strategySummaryVi: string;
  sectionTargets: {
    theory: number;
    affairs: number;
    applied: number;
  };
  pointMasteryTarget: {
    pt3Rate: number;
    pt4Rate: number;
    pt5Rate: number;
  };
  recommendedPointsFilter: "ALL" | 3 | 4 | 5;
  recommendedOnlyCharts: boolean;
  recommendedSubcategory: TesatSubcategory;
  recommendedSubcategoryTitleVi: string;
  recommendedExamSetId: string;
  dailyMissionVi: string;
}

export const TARGET_TIER_ROADMAPS: Record<TargetTierType, TierRoadmapConfig> = {
  "3급": {
    tier: "3급",
    minScore: 180,
    maxScore: 209,
    credits: 16,
    badgeColor: "bg-sky-600 text-white",
    gradientBg: "from-sky-600/15 via-blue-600/5 to-transparent",
    headlineVi: "Lộ trình Cấp 3급 (180~209đ · Công nhận 16 tín chỉ ĐH)",
    strategySummaryVi:
      "Chiến thuật an toàn & hiệu quả nhất: Ăn trọn 85% câu 3 điểm (Lý thuyết & Thời sự cơ bản) + 55% câu 4 điểm. Không cần mất quá nhiều thời gian cho các câu 5 điểm tính toán phức tạp.",
    sectionTargets: { theory: 65, affairs: 65, applied: 50 },
    pointMasteryTarget: { pt3Rate: 85, pt4Rate: 55, pt5Rate: 45 },
    recommendedPointsFilter: 3,
    recommendedOnlyCharts: false,
    recommendedSubcategory: "MICRO",
    recommendedSubcategoryTitleVi: "Kinh tế Vi mô (Câu 3 điểm nền tảng)",
    recommendedExamSetId: "BOOK_74",
    dailyMissionVi:
      "Nhiệm vụ 3급 hôm nay: Hoàn thành 5 câu Vi mô mức 3 điểm để nắm chắc điểm nền tảng.",
  },
  "2급": {
    tier: "2급",
    minScore: 210,
    maxScore: 239,
    credits: 18,
    badgeColor: "bg-emerald-600 text-white",
    gradientBg: "from-emerald-600/15 via-teal-600/5 to-transparent",
    headlineVi: "Lộ trình Cấp 2급 (210~239đ · Công nhận 18 tín chỉ ĐH)",
    strategySummaryVi:
      "Trọng tâm bức phá lên 210+ điểm: Nắm vững toàn bộ câu 3 điểm (90%) và giải quyết chính xác 70% câu 4 điểm (Mô hình IS-LM, Tỷ giá, Tài chính doanh nghiệp ROE/PER).",
    sectionTargets: { theory: 75, affairs: 75, applied: 65 },
    pointMasteryTarget: { pt3Rate: 90, pt4Rate: 72, pt5Rate: 60 },
    recommendedPointsFilter: 4,
    recommendedOnlyCharts: false,
    recommendedSubcategory: "MACRO",
    recommendedSubcategoryTitleVi: "Kinh tế Vĩ mô (Trọng tâm câu 4 điểm)",
    recommendedExamSetId: "BOOK_78",
    dailyMissionVi:
      "Nhiệm vụ 2급 hôm nay: Luyện 5 câu Vĩ mô 4 điểm (Chính sách lãi suất BOK & IS-LM).",
  },
  "1급": {
    tier: "1급",
    minScore: 240,
    maxScore: 269,
    credits: 20,
    badgeColor: "bg-[#1D4ED8] text-white",
    gradientBg: "from-blue-600/15 via-indigo-600/5 to-transparent",
    headlineVi: "Lộ trình Cấp 1급 (240~269đ · Tối đa 20 tín chỉ ĐH Hàn Quốc)",
    strategySummaryVi:
      "Để vượt mốc 240 điểm (1급), bạn bắt buộc phải làm chủ các câu 5 điểm (Phần 3: Phân tích số liệu BOK/KOSIS & Tình huống kinh tế) kết hợp độ chính xác >85% ở câu 4 điểm.",
    sectionTargets: { theory: 84, affairs: 84, applied: 75 },
    pointMasteryTarget: { pt3Rate: 95, pt4Rate: 85, pt5Rate: 75 },
    recommendedPointsFilter: 5,
    recommendedOnlyCharts: false,
    recommendedSubcategory: "DATA_EDITORIAL",
    recommendedSubcategoryTitleVi: "Phân tích Số liệu & Tình huống (Câu 5 điểm)",
    recommendedExamSetId: "BOOK_85",
    dailyMissionVi:
      "Nhiệm vụ 1급 hôm nay: Chinh phục 5 câu Phân tích số liệu 5 điểm để bứt phá mốc 240đ.",
  },
  "S급": {
    tier: "S급",
    minScore: 270,
    maxScore: 300,
    credits: 20,
    badgeColor: "bg-amber-500 text-slate-950",
    gradientBg: "from-amber-500/20 via-orange-500/5 to-transparent",
    headlineVi: "Lộ trình Đỉnh cao S급 (270~300đ · Top 1% Quốc gia Hàn Quốc)",
    strategySummaryVi:
      "Chế độ Huấn luyện Đặc biệt S급: Tập trung giải quyết 87 biểu đồ/bảng thống kê gốc từ đề sách thật (5 điểm), câu hỏi ghép <보기> ㄱ·ㄴ·ㄷ·ㄹ và bẫy phủ định (옳지 않은 것은).",
    sectionTargets: { theory: 92, affairs: 92, applied: 90 },
    pointMasteryTarget: { pt3Rate: 98, pt4Rate: 92, pt5Rate: 90 },
    recommendedPointsFilter: 5,
    recommendedOnlyCharts: true,
    recommendedSubcategory: "DATA_EDITORIAL",
    recommendedSubcategoryTitleVi: "87 Biểu đồ & Bảng số liệu gốc (5 điểm S급)",
    recommendedExamSetId: "BOOK_79",
    dailyMissionVi:
      "Nhiệm vụ S급 hôm nay: Giải 5 câu Biểu đồ & Bảng thống kê gốc 5 điểm với độ chính xác 100%.",
  },
};

/**
 * Responsive Viewport Hook for Mobile (<640px), Tablet (640-1024px), and Desktop (>=1024px)
 */
export function useResponsive3DViewport() {
  const [viewportWidth, setViewportWidth] = useState<number>(1200);

  useEffect(() => {
    const updateSize = () => setViewportWidth(window.innerWidth);
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return {
    isMobile: viewportWidth < 640,
    isTablet: viewportWidth >= 640 && viewportWidth < 1024,
    isDesktop: viewportWidth >= 1024,
    viewportWidth,
  };
}

/**
 * Zero-Re-Render GPU-Accelerated 3D Mouse-Tilt Wrapper
 * Automatically disables heavy tilt on small touch screens while keeping 3D depth styling.
 */
export function Interactive3DTiltWrapper({
  enabled,
  children,
  className = "",
  intensity = 3.8,
}: {
  enabled: boolean;
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled || !ref.current) return;
      if (typeof window !== "undefined" && window.innerWidth < 768) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const x = (clientX - rect.left) / Math.max(1, rect.width) - 0.5;
        const y = (clientY - rect.top) / Math.max(1, rect.height) - 0.5;
        const rotY = (x * intensity * 2).toFixed(2);
        const rotX = (-y * intensity * 2).toFixed(2);
        ref.current.style.transform = `perspective(1400px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(6px)`;
      });
    },
    [enabled, intensity]
  );

  const handleMouseLeave = useCallback(() => {
    if (!enabled || !ref.current) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    ref.current.style.transform =
      "perspective(1400px) rotateX(0deg) rotateY(0deg) translateZ(0px)";
  }, [enabled]);

  useEffect(() => {
    if (!enabled && ref.current) {
      ref.current.style.transform = "";
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled]);

  if (!enabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transition: "transform 0.16s cubic-bezier(0.22, 1, 0.36, 1)",
        willChange: "transform",
      }}
      className={`${className} ring-2 ring-blue-500/45 shadow-[0_24px_65px_rgba(29,78,216,0.28)]`}
    >
      {children}
    </div>
  );
}

/**
 * Personalized Target Grade Engine Banner & Mission Control
 * Supports both Original 2D Mode and Full-Website 3D Holographic Mode (Responsive Mobile & Laptop)
 */
export function PersonalizedTargetRoadmapCard({
  targetTier,
  onChangeTargetTier,
  allQuestions,
  selectedAnswers,
  onStartTargetedDrill,
  onStartTargetedMockSet,
  darkMode,
  is3DMode = false,
}: {
  targetTier: TargetTierType;
  onChangeTargetTier: (newTier: TargetTierType) => void;
  allQuestions: TesatQuestion[];
  selectedAnswers: Record<string, number | undefined>;
  onStartTargetedDrill: (
    subcat: TesatSubcategory,
    pointsFilter: "ALL" | 3 | 4 | 5,
    onlyCharts: boolean
  ) => void;
  onStartTargetedMockSet: (setId: string) => void;
  darkMode: boolean;
  is3DMode?: boolean;
}) {
  const config = TARGET_TIER_ROADMAPS[targetTier] ?? TARGET_TIER_ROADMAPS["1급"];

  const stats = React.useMemo(() => {
    let pt3Correct = 0;
    let pt3Answered = 0;
    let pt4Correct = 0;
    let pt4Answered = 0;
    let pt5Correct = 0;
    let pt5Answered = 0;
    let totalEarnedPoints = 0;

    for (const q of allQuestions) {
      const ans = selectedAnswers[q.id];
      if (ans === undefined) continue;
      const isRight = ans === q.correctIndex;
      if (isRight) totalEarnedPoints += q.points;
      if (q.points === 3) {
        pt3Answered++;
        if (isRight) pt3Correct++;
      } else if (q.points === 4) {
        pt4Answered++;
        if (isRight) pt4Correct++;
      } else if (q.points === 5) {
        pt5Answered++;
        if (isRight) pt5Correct++;
      }
    }

    const totalAnswered = pt3Answered + pt4Answered + pt5Answered;
    const accuracyRate =
      totalAnswered > 0
        ? (pt3Correct + pt4Correct + pt5Correct) / totalAnswered
        : 0;
    const projectedScore =
      totalAnswered === 0
        ? 0
        : Math.min(
            300,
            Math.round(
              accuracyRate * 300 * Math.min(1, 0.45 + totalAnswered / 40)
            )
          );

    return {
      pt3Correct,
      pt3Answered,
      pt4Correct,
      pt4Answered,
      pt5Correct,
      pt5Answered,
      totalAnswered,
      totalEarnedPoints,
      projectedScore,
    };
  }, [allQuestions, selectedAnswers]);

  const cardSurface = is3DMode
    ? "bg-gradient-to-br from-[#0B1325] via-[#0F172A] to-[#080D1A] border-2 border-blue-500/40 text-white shadow-[0_20px_60px_rgba(29,78,216,0.28)]"
    : darkMode
      ? "bg-[#111827] border-[#1E293B] text-[#F8FAFC]"
      : "bg-white border-[#E2E0D8] text-[#0F172A] shadow-sm";
  const subtleSurface = is3DMode
    ? "bg-[#090F1E] border-blue-400/25 text-slate-200 shadow-inner"
    : darkMode
      ? "bg-[#0F172A] border-[#1E293B] text-slate-200"
      : "bg-[#F8F7F4] border-[#E5E3DC] text-slate-700";
  const mutedText = is3DMode
    ? "text-slate-300"
    : darkMode
      ? "text-slate-400"
      : "text-slate-600";

  const readinessPercent = Math.min(
    100,
    Math.round((stats.projectedScore / config.minScore) * 100)
  );

  return (
    <Interactive3DTiltWrapper
      enabled={is3DMode}
      intensity={2.5}
      className={`relative overflow-hidden rounded-3xl border p-4 sm:p-6 lg:p-7 ${cardSurface}`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${config.gradientBg}`}
      />

      <div className="relative space-y-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-extrabold ${config.badgeColor}`}
              >
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mục tiêu cá nhân: Hạng {config.tier}</span>
              </span>
              <span
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${subtleSurface}`}
              >
                Điểm chuẩn: {config.minScore}~{config.maxScore}/300đ ·{" "}
                {config.credits} tín chỉ ĐH
              </span>
            </div>
            <h2 className="text-base font-extrabold tracking-tight sm:text-xl">
              {config.headlineVi}
            </h2>
            <p
              className={`max-w-3xl text-xs leading-relaxed sm:text-sm ${mutedText}`}
            >
              {config.strategySummaryVi}
            </p>
          </div>

          <div className={` shrink-0 rounded-2xl border p-2 ${subtleSurface}`}>
            <span
              className={`mb-1.5 block px-1 text-[11px] font-bold ${mutedText}`}
            >
              Đổi cấp độ mục tiêu:
            </span>
            <div className="grid grid-cols-4 gap-1">
              {(["S급", "1급", "2급", "3급"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChangeTargetTier(t)}
                  className={`min-h-[34px] rounded-xl px-3 py-1 text-xs font-extrabold transition ${
                    targetTier === t
                      ? "bg-[#1D4ED8] text-white shadow-xs"
                      : "hover:bg-blue-600/15"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          <div className={`rounded-2xl border p-4 ${subtleSurface}`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold">Tiến độ chạm mốc {config.tier}</span>
              <span className="tabular-nums font-extrabold text-amber-400">
                {stats.projectedScore} / {config.minScore}đ
              </span>
            </div>
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#1D4ED8] to-emerald-500 transition-all duration-500"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
            <p className={`mt-2 text-[11px] ${mutedText}`}>
              {stats.totalAnswered === 0
                ? `Hãy bắt đầu làm bài để hệ thống đo khoảng cách tới mốc ${config.minScore}đ.`
                : stats.projectedScore >= config.minScore
                  ? `Xuất sắc! Phong độ hiện tại của bạn đã đạt chuẩn ${config.tier}.`
                  : `Cần tích lũy thêm +${config.minScore - stats.projectedScore} điểm dự kiến để đạt ${config.tier}.`}
            </p>
          </div>

          <div className={`rounded-2xl border p-4 ${subtleSurface}`}>
            <div className="text-xs font-bold">
              Chỉ tiêu 3 phần cho hạng {config.tier}
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className={mutedText}>Phần 1 · Lý thuyết:</span>
                <span className="tabular-nums font-bold">
                  ≥ {config.sectionTargets.theory}/100đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Phần 2 · Thời sự:</span>
                <span className="tabular-nums font-bold">
                  ≥ {config.sectionTargets.affairs}/100đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Phần 3 · Ứng dụng 5점:</span>
                <span className="tabular-nums font-bold text-blue-400">
                  ≥ {config.sectionTargets.applied}/100đ
                </span>
              </div>
            </div>
          </div>

          <div className={`rounded-2xl border p-4 ${subtleSurface}`}>
            <div className="text-xs font-bold">
              Trọng số câu hỏi cần ưu tiên ({config.tier})
            </div>
            <div className="mt-2 space-y-1 text-xs">
              <div className="flex justify-between">
                <span className={mutedText}>Câu 3 điểm (Cơ bản):</span>
                <span className="tabular-nums font-semibold">
                  Đúng {stats.pt3Correct}/{stats.pt3Answered} (Mục tiêu{" "}
                  {config.pointMasteryTarget.pt3Rate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Câu 4 điểm (Mô hình):</span>
                <span className="tabular-nums font-semibold">
                  Đúng {stats.pt4Correct}/{stats.pt4Answered} (Mục tiêu{" "}
                  {config.pointMasteryTarget.pt4Rate}%)
                </span>
              </div>
              <div className="flex justify-between">
                <span className={mutedText}>Câu 5 điểm (Biểu đồ):</span>
                <span className="tabular-nums font-bold text-amber-500 dark:text-amber-400">
                  Đúng {stats.pt5Correct}/{stats.pt5Answered} (Mục tiêu{" "}
                  {config.pointMasteryTarget.pt5Rate}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-blue-500/40 bg-blue-600/10 p-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-amber-400">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Bài tập thiết kế riêng cho {config.tier}</span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed">
                {config.dailyMissionVi}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onStartTargetedDrill(
                    config.recommendedSubcategory,
                    config.recommendedPointsFilter,
                    config.recommendedOnlyCharts
                  )
                }
                className="flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-blue-700"
              >
                <Zap className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Luyện ngay câu {config.recommendedPointsFilter} điểm (
                  {config.tier})
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onStartTargetedMockSet(config.recommendedExamSetId)
                }
                className={`flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-1 text-[11px] font-bold transition hover:border-[#1D4ED8] ${subtleSurface}`}
              >
                <Play className="h-3 w-3 text-blue-400" aria-hidden="true" />
                <span>Thi thử Đề sách gốc chuẩn {config.tier}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Interactive3DTiltWrapper>
  );
}

/**
 * Interactive 3D Spatial Experience Stage (Supports 3D Ring Carousel, 3D Curved Wave, and 3D 6-Faced Cube)
 * Fully responsive across Mobile (<640px), Tablet (640-1024px), and Laptop/Desktop (>=1024px)
 * Supports Touch Swipe on Mobile, Mouse Drag & Wheel on Laptop, and Keyboard Arrows!
 */
export interface Spatial3DItem {
  id: string;
  badge: string;
  titleVi: string;
  subtitleKo: string;
  descVi: string;
  metaStat: string;
  accentColor: string;
  onSelect: () => void;
}

export function Spatial3DStage({
  titleVi,
  subtitleVi,
  items,
  topicCubeItems,
  darkMode,
  onExit3DMode,
  externalLayoutMode,
  onChangeExternalLayoutMode,
}: {
  titleVi: string;
  subtitleVi: string;
  items: Spatial3DItem[];
  topicCubeItems?: Spatial3DItem[];
  darkMode: boolean;
  onExit3DMode: () => void;
  externalLayoutMode?: Spatial3DLayoutType;
  onChangeExternalLayoutMode?: (mode: Spatial3DLayoutType) => void;
}) {
  const [internalLayout, setInternalLayout] =
    useState<Spatial3DLayoutType>("RING_3D");
  const layoutMode = externalLayoutMode ?? internalLayout;
  const setLayoutMode = (m: Spatial3DLayoutType) => {
    setInternalLayout(m);
    onChangeExternalLayoutMode?.(m);
  };

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const { isMobile, isTablet } = useResponsive3DViewport();

  // 3D Cube Rotation angles
  const [cubeRotX, setCubeRotX] = useState<number>(-14);
  const [cubeRotY, setCubeRotY] = useState<number>(-28);
  const [activeCubeFace, setActiveCubeFace] = useState<number>(0);

  // Pointer & Touch swipe refs
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const waveContainerRef = useRef<HTMLDivElement>(null);
  const waveRafRef = useRef<number | null>(null);

  const safeItems = items.length > 0 ? items : [];
  const count = safeItems.length;

  const rotatePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % Math.max(1, count));
  }, [count]);

  const rotateNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % Math.max(1, count));
  }, [count]);

  const focusCubeFace = useCallback((faceIdx: number) => {
    setActiveCubeFace(faceIdx);
    const faceAngles: Array<{ rx: number; ry: number }> = [
      { rx: -8, ry: 0 },
      { rx: -8, ry: -90 },
      { rx: -8, ry: -180 },
      { rx: -8, ry: 90 },
      { rx: -90, ry: 0 },
      { rx: 90, ry: 0 },
    ];
    const target = faceAngles[faceIdx % 6] ?? { rx: -12, ry: -25 };
    setCubeRotX(target.rx);
    setCubeRotY(target.ry);
  }, []);

  // Keyboard navigation in 3D Stage (←, →, ↑, ↓, Enter)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (layoutMode === "CUBE_3D") {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          setCubeRotY((prev) => prev - 45);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          setCubeRotY((prev) => prev + 45);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          setCubeRotX((prev) => Math.min(85, prev + 45));
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          setCubeRotX((prev) => Math.max(-85, prev - 45));
        } else if (e.key === "Enter") {
          const cubePool = topicCubeItems ?? safeItems;
          cubePool[activeCubeFace % Math.max(1, cubePool.length)]?.onSelect();
        }
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        rotateNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        rotatePrev();
      } else if (e.key === "Enter") {
        e.preventDefault();
        safeItems[activeIndex]?.onSelect();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [
    layoutMode,
    rotateNext,
    rotatePrev,
    safeItems,
    activeIndex,
    topicCubeItems,
    activeCubeFace,
  ]);

  const handleGestureEnd = (dx: number, dy: number) => {
    if (layoutMode === "CUBE_3D") {
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) {
        setCubeRotY((prev) => prev + dx * 0.55);
        setCubeRotX((prev) => Math.max(-85, Math.min(85, prev - dy * 0.55)));
      }
      return;
    }
    if (dx < -22) rotateNext();
    else if (dx > 22) rotatePrev();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragStartRef.current = null;
    handleGestureEnd(dx, dy);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    if (!t) return;
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.changedTouches[0];
    if (!t || !touchStartRef.current) return;
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;
    handleGestureEnd(dx, dy);
  };

  const handleWaveMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMobile || !waveContainerRef.current) return;
      const clientX = e.clientX;
      const clientY = e.clientY;
      if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
      waveRafRef.current = requestAnimationFrame(() => {
        if (!waveContainerRef.current) return;
        const rect = waveContainerRef.current.getBoundingClientRect();
        const nx = (clientX - rect.left) / Math.max(1, rect.width) - 0.5;
        const ny = (clientY - rect.top) / Math.max(1, rect.height) - 0.5;
        const rx = (-ny * 10).toFixed(2);
        const ry = (nx * 14).toFixed(2);
        waveContainerRef.current.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
    },
    [isMobile]
  );

  const handleWaveMouseLeave = useCallback(() => {
    if (!waveContainerRef.current) return;
    if (waveRafRef.current) cancelAnimationFrame(waveRafRef.current);
    waveContainerRef.current.style.transform = "rotateX(0deg) rotateY(0deg)";
  }, []);

  const cubeFacesData = (topicCubeItems ?? safeItems).slice(0, 6);
  const activeItem = safeItems[activeIndex] ?? safeItems[0];
  const cubeHalfSize = isMobile ? 92 : 115;

  const stageSurface = darkMode
    ? "bg-gradient-to-b from-[#070B14] via-[#0F172A] to-[#080C17] border-blue-500/40 text-white"
    : "bg-gradient-to-b from-[#0A1020] via-[#0F172A] to-[#090D16] border-blue-500/40 text-white";

  return (
    <div
      className={`animate-3d-stage-enter relative overflow-hidden rounded-3xl border-2 p-4 sm:p-6 lg:p-7 shadow-[0_25px_70px_rgba(15,23,42,0.55)] ${stageSurface}`}
    >
      {/* 3D Perspective Grid Floor Background */}
      <div className="grid-floor-3d pointer-events-none absolute inset-x-0 bottom-0 h-60 opacity-45" />

      {/* Top 3D Control Header (Responsive Mobile + Laptop) */}
      <div className="relative z-10 flex flex-col justify-between gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-center">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-extrabold text-amber-300 ring-1 ring-blue-400/40">
            <Orbit className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>
              KHÔNG GIAN 3D TOÀN DIỆN · HỖ TRỢ VUỐT CẢM ỨNG MOBILE & CHUỘT/PHÍM
            </span>
          </div>
          <h2 className="text-lg font-extrabold tracking-tight sm:text-2xl">
            {titleVi}
          </h2>
          <p className="text-xs text-slate-300 sm:text-sm">{subtitleVi}</p>
        </div>

        {/* 3D Sub-Mode Switcher (Vòng Tròn 3D / Đường Uốn Lượn 3D / Khối Lập Phương 3D) */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="grid w-full grid-cols-3 gap-1 rounded-2xl border border-white/15 bg-[#090D16] p-1 sm:flex sm:w-auto">
            <button
              type="button"
              onClick={() => setLayoutMode("RING_3D")}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${
                layoutMode === "RING_3D"
                  ? "bg-[#1D4ED8] text-white shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Orbit className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Vòng tròn 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("WAVE_3D")}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${
                layoutMode === "WAVE_3D"
                  ? "bg-[#1D4ED8] text-white shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Waves className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Đường sóng 3D</span>
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode("CUBE_3D")}
              className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-bold transition sm:px-3 ${
                layoutMode === "CUBE_3D"
                  ? "bg-[#1D4ED8] text-white shadow-md"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <Box className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span className="truncate">Khối 6 mặt 3D</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onExit3DMode}
            className="min-h-[38px] w-full rounded-xl border border-amber-400/50 bg-amber-500/20 px-3.5 py-1.5 text-xs font-extrabold text-amber-200 transition hover:bg-amber-500/30 sm:w-auto"
          >
            Về Chế độ Gốc (2D)
          </button>
        </div>
      </div>

      {/* ===================================================================
          SUB-MODE 1: 3D CYLINDRICAL RING CAROUSEL (RESPONSIVE MOBILE + LAPTOP)
         =================================================================== */}
      {layoutMode === "RING_3D" && (
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) > 15 || Math.abs(e.deltaY) > 25) {
              if (e.deltaX > 0 || e.deltaY > 0) rotateNext();
              else rotatePrev();
            }
          }}
          className="relative z-10 my-2 select-none sm:my-3"
        >
          <div className="stage-3d-perspective relative mx-auto flex h-[310px] w-full items-center justify-center sm:h-[340px]">
            <div className="preserve-3d relative flex h-[265px] w-full items-center justify-center sm:h-[280px]">
              {safeItems.map((item, idx) => {
                let relIdx = idx - activeIndex;
                const half = count / 2;
                if (relIdx > half) relIdx -= count;
                if (relIdx < -half) relIdx += count;

                const isCurrent = idx === activeIndex;
                const absRel = Math.abs(relIdx);
                const maxVisibleArc = isMobile ? 2 : 3;
                const isVisibleInArc = absRel <= maxVisibleArc;

                // Responsive 3D cylindrical geometry for Mobile vs Tablet vs Desktop
                const thetaDeg =
                  relIdx * (isMobile ? 34 : count <= 4 ? 52 : 38);
                const thetaRad = (thetaDeg * Math.PI) / 180;
                const radiusX = isMobile
                  ? 90
                  : isTablet
                    ? 210
                    : count <= 4
                      ? 270
                      : 320;
                const radiusZ = isMobile ? 140 : 220;

                const tx = Math.round(Math.sin(thetaRad) * radiusX);
                const tz = Math.round(Math.cos(thetaRad) * radiusZ - radiusZ);
                const ty = Math.round(absRel * (isMobile ? 5 : 8));
                const rotY = Math.round(-thetaDeg * 0.78);
                const scale = isCurrent
                  ? 1.02
                  : Math.max(0.72, 0.9 - absRel * 0.09);
                const zIndex = 50 - Math.round(absRel * 10);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isCurrent) {
                        item.onSelect();
                      } else {
                        setActiveIndex(idx);
                      }
                    }}
                    style={{
                      transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${rotY}deg) scale(${scale})`,
                      zIndex,
                      opacity: isVisibleInArc
                        ? isCurrent
                          ? 1
                          : Math.max(0.35, 0.85 - absRel * 0.2)
                        : 0,
                      pointerEvents: isVisibleInArc ? "auto" : "none",
                      transition:
                        "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.3s ease",
                    }}
                    className={`gpu-3d-card absolute flex h-[250px] w-[258px] cursor-pointer flex-col justify-between rounded-3xl border-2 p-4 sm:h-[265px] sm:w-[335px] sm:p-5 ${
                      isCurrent
                        ? "border-amber-400 bg-gradient-to-br from-[#131F3A] via-[#0F172A] to-[#090F1E] shadow-[0_18px_50px_rgba(37,99,235,0.5)]"
                        : "border-blue-400/35 bg-[#0D1527] hover:border-blue-400"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate rounded-lg bg-blue-600/35 px-2.5 py-1 text-[11px] font-extrabold text-blue-200 ring-1 ring-blue-400/40">
                          {item.badge}
                        </span>
                        <span className="tabular-nums shrink-0 text-xs font-extrabold text-amber-300">
                          {item.metaStat}
                        </span>
                      </div>
                      <div>
                        <p className="truncate text-[11px] font-medium text-slate-400">
                          {item.subtitleKo}
                        </p>
                        <h3 className="mt-1 line-clamp-2 text-base font-extrabold leading-snug text-white sm:text-lg">
                          {item.titleVi}
                        </h3>
                      </div>
                      <p className="line-clamp-3 text-xs leading-relaxed text-slate-300">
                        {item.descVi}
                      </p>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/15 pt-2.5 text-xs font-extrabold">
                      <span
                        className={
                          isCurrent ? "text-amber-300" : "text-blue-300"
                        }
                      >
                        {isCurrent
                          ? "Chạm / Click để mở ngay"
                          : "Chạm để xoay ra giữa"}
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-amber-300" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3D Ring Controls & Active Item Launcher (Mobile & Desktop friendly) */}
          <div className="mt-2 flex flex-col justify-between gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-start">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={rotatePrev}
                  className="flex min-h-[42px] items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Xoay trái</span>
                </button>
                <button
                  type="button"
                  onClick={rotateNext}
                  className="flex min-h-[42px] items-center gap-1 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-white/20"
                >
                  <span>Xoay phải</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <span className="text-xs text-slate-300">
                Thẻ{" "}
                <strong className="text-amber-300">
                  {activeIndex + 1}/{count}
                </strong>
                :{" "}
                <strong className="text-white">{activeItem?.titleVi}</strong>
              </span>
            </div>

            {activeItem && (
              <button
                type="button"
                onClick={() => activeItem.onSelect()}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg transition hover:brightness-110 sm:w-auto"
              >
                <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate">
                  Mở &ldquo;{activeItem.titleVi}&rdquo; ngay
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-MODE 2: 3D CURVED SINE WAVE / HELIX PATH (MOBILE S-CURVE & DESKTOP WAVE)
         =================================================================== */}
      {layoutMode === "WAVE_3D" && (
        <div
          onMouseMove={handleWaveMouseMove}
          onMouseLeave={handleWaveMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="stage-3d-perspective relative z-10 my-3 py-2"
        >
          <svg
            viewBox="0 0 1200 220"
            fill="none"
            className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-44 w-full -translate-y-1/2 opacity-45"
            aria-hidden="true"
          >
            <path
              d="M 0 110 Q 150 10, 300 110 T 600 110 T 900 110 T 1200 110"
              stroke="url(#waveGrad)"
              strokeWidth="4"
              strokeDasharray="8 8"
            />
            <defs>
              <linearGradient id="waveGrad" x1="0" y1="0" x2="1200" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
          </svg>

          <div
            ref={waveContainerRef}
            style={{
              transition: "transform 0.18s ease-out",
            }}
            className="preserve-3d grid grid-cols-1 gap-4 px-1 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-center sm:gap-5 sm:py-5"
          >
            {safeItems.map((item, idx) => {
              // Mobile: S-curve horizontal + Z depth wave; Desktop: vertical sine wave + Z depth
              const waveXMobile = Math.round(Math.sin(idx * 1.2) * 10);
              const waveY = isMobile
                ? 0
                : Math.round(Math.sin(idx * 1.15) * 24);
              const waveZ = Math.round(Math.cos(idx * 1.15) * (isMobile ? 18 : 32));
              const waveRotZ = isMobile
                ? 0
                : Math.round(Math.cos(idx * 1.15) * 2.5);
              const isSelected = idx === activeIndex;

              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setActiveIndex(idx)}
                  onClick={() => item.onSelect()}
                  style={{
                    transform: isSelected
                      ? `translate3d(${waveXMobile}px, ${waveY - (isMobile ? 2 : 10)}px, ${waveZ + (isMobile ? 16 : 38)}px) rotateZ(0deg) scale(1.03)`
                      : `translate3d(${waveXMobile}px, ${waveY}px, ${waveZ}px) rotateZ(${waveRotZ}deg)`,
                    transition:
                      "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
                  }}
                  className={`gpu-3d-card flex w-full flex-col justify-between rounded-3xl border-2 p-4 text-left sm:max-w-[268px] sm:p-5 ${
                    isSelected
                      ? "border-amber-400 bg-gradient-to-br from-[#152240] to-[#0B1222] shadow-[0_18px_45px_rgba(245,158,11,0.3)]"
                      : "border-white/15 bg-[#0E1629] hover:border-blue-400"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-lg bg-blue-500/25 px-2.5 py-0.5 text-[11px] font-bold text-blue-200">
                        #{idx + 1} · {item.badge}
                      </span>
                      <span className="tabular-nums text-[11px] font-bold text-amber-300">
                        {item.metaStat}
                      </span>
                    </div>
                    <h3 className="line-clamp-1 text-base font-extrabold text-white">
                      {item.titleVi}
                    </h3>
                    <p className="line-clamp-2 text-xs leading-relaxed text-slate-300">
                      {item.descVi}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs font-bold text-amber-300">
                    <span>Chạm / Click để vào học ngay</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ===================================================================
          SUB-MODE 3: INTERACTIVE 3D 6-FACED KNOWLEDGE CUBE (MOBILE & LAPTOP)
         =================================================================== */}
      {layoutMode === "CUBE_3D" && (
        <div
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative z-10 my-3 grid grid-cols-1 items-center gap-6 lg:grid-cols-12 lg:gap-8"
        >
          <div className="stage-3d-perspective flex h-[260px] flex-col items-center justify-center select-none sm:h-[340px] lg:col-span-7">
            <div
              className="preserve-3d relative"
              style={{
                width: cubeHalfSize * 2,
                height: cubeHalfSize * 2,
                transform: `rotateX(${cubeRotX}deg) rotateY(${cubeRotY}deg)`,
                transition: "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {cubeFacesData.map((face, fIdx) => {
                const transforms = [
                  `rotateY(0deg) translateZ(${cubeHalfSize}px)`,
                  `rotateY(90deg) translateZ(${cubeHalfSize}px)`,
                  `rotateY(180deg) translateZ(${cubeHalfSize}px)`,
                  `rotateY(-90deg) translateZ(${cubeHalfSize}px)`,
                  `rotateX(90deg) translateZ(${cubeHalfSize}px)`,
                  `rotateX(-90deg) translateZ(${cubeHalfSize}px)`,
                ];
                const isSelectedFace = activeCubeFace === fIdx;
                return (
                  <div
                    key={face.id}
                    onClick={() => {
                      setActiveCubeFace(fIdx);
                      face.onSelect();
                    }}
                    style={{ transform: transforms[fIdx] }}
                    className={`gpu-3d-card absolute inset-0 flex cursor-pointer flex-col justify-between rounded-2xl border-2 p-3.5 transition sm:p-5 ${
                      isSelectedFace
                        ? "border-amber-400 bg-[#13203D] shadow-[0_0_35px_rgba(59,130,246,0.5)]"
                        : "border-blue-400/50 bg-[#0D1527] hover:border-white"
                    }`}
                  >
                    <div>
                      <span className="inline-block rounded-md bg-blue-500/30 px-2 py-0.5 text-[10px] font-extrabold text-blue-200">
                        Mặt #{fIdx + 1} · {face.badge}
                      </span>
                      <h3 className="mt-1.5 line-clamp-2 text-sm font-extrabold text-white sm:text-base">
                        {face.titleVi}
                      </h3>
                      <p className="mt-0.5 text-[11px] font-bold text-amber-300">
                        {face.metaStat}
                      </p>
                      <p className="mt-1.5 hidden line-clamp-3 text-[11px] leading-relaxed text-slate-300 sm:block">
                        {face.descVi}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-white/15 pt-1.5 text-[11px] font-bold text-emerald-300">
                      <span>Chạm để học</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-white/15 bg-[#0D1527] p-4 sm:p-5 lg:col-span-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-300">
                ĐIỀU KHIỂN KHỐI 6 MẶT 3D
              </span>
              <span className="text-[11px] text-slate-400">
                Vuốt tay hoặc Phím [←][→][↑][↓]
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {cubeFacesData.map((face, idx) => (
                <button
                  key={face.id}
                  type="button"
                  onClick={() => focusCubeFace(idx)}
                  className={`min-h-[42px] rounded-xl border px-3 py-2 text-left text-xs transition ${
                    activeCubeFace === idx
                      ? "border-amber-400 bg-blue-600/30 font-bold text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <div className="truncate font-bold">
                    Mặt {idx + 1}: {face.titleVi}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {face.metaStat}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCubeRotY((p) => p + 45)}
                  aria-label="Xoay khối sang trái"
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/15 bg-white/10 p-2 hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCubeRotY((p) => p - 45)}
                  aria-label="Xoay khối sang phải"
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/15 bg-white/10 p-2 hover:bg-white/20"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCubeRotX((p) => Math.min(85, p + 45))}
                  aria-label="Xoay khối lên trên"
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/15 bg-white/10 p-2 hover:bg-white/20"
                >
                  <ChevronUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setCubeRotX((p) => Math.max(-85, p - 45))}
                  aria-label="Xoay khối xuống dưới"
                  className="min-h-[40px] min-w-[40px] rounded-lg border border-white/15 bg-white/10 p-2 hover:bg-white/20"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>

              {cubeFacesData[activeCubeFace] && (
                <button
                  type="button"
                  onClick={() => cubeFacesData[activeCubeFace].onSelect()}
                  className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400"
                >
                  <span>Vào học mặt này</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 3D Curved Question Carousel Ribbon for Active Study Screens (Responsive Mobile & Laptop)
 */
export function ActiveQuestion3DCarouselRibbon({
  questions,
  activeIdx,
  selectedAnswers,
  onSelectIndex,
  onExit3DMode,
}: {
  questions: TesatQuestion[];
  activeIdx: number;
  selectedAnswers: Record<string, number | undefined>;
  onSelectIndex: (idx: number) => void;
  onExit3DMode: () => void;
}) {
  const { isMobile } = useResponsive3DViewport();
  const touchStartXRef = useRef<number | null>(null);
  const count = questions.length;
  if (count === 0) return null;

  const windowOffsets = isMobile ? [-1, 0, 1] : [-3, -2, -1, 0, 1, 2, 3];

  return (
    <div
      onTouchStart={(e) => {
        touchStartXRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0]?.clientX;
        if (endX === undefined || touchStartXRef.current === null) return;
        const dx = endX - touchStartXRef.current;
        touchStartXRef.current = null;
        if (dx < -25 && activeIdx < count - 1) onSelectIndex(activeIdx + 1);
        else if (dx > 25 && activeIdx > 0) onSelectIndex(activeIdx - 1);
      }}
      className="animate-3d-stage-enter relative overflow-hidden rounded-3xl border-2 border-blue-500/40 bg-gradient-to-b from-[#080D1A] via-[#0F172A] to-[#090E1A] p-3.5 sm:p-5 text-white shadow-xl"
    >
      <div className="grid-floor-3d pointer-events-none absolute inset-x-0 bottom-0 h-32 opacity-40" />

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/25 px-3 py-1 text-[11px] font-extrabold text-amber-300 ring-1 ring-blue-400/40">
            <Orbit className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            <span>BĂNG CHUYỀN CÂU HỎI 3D ({activeIdx + 1}/{count})</span>
          </span>
          <span className="hidden text-xs text-slate-300 md:inline">
            Vuốt tay / Click thẻ trên vòng cung 3D hoặc bấm [←] [→] để lật câu
          </span>
        </div>

        <button
          type="button"
          onClick={onExit3DMode}
          className="rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-1 text-xs font-extrabold text-amber-200 transition hover:bg-amber-500/30"
        >
          Về Chế độ Gốc (2D)
        </button>
      </div>

      {/* 3D Curved Question Deck */}
      <div className="stage-3d-perspective relative z-10 flex h-[145px] w-full items-center justify-center select-none sm:h-[155px]">
        <div className="preserve-3d relative flex h-[125px] w-full items-center justify-center">
          {windowOffsets.map((offset) => {
            const targetIdx = activeIdx + offset;
            if (targetIdx < 0 || targetIdx >= count) return null;
            const q = questions[targetIdx];
            const isCurr = offset === 0;
            const ans = selectedAnswers[q.id];
            const isAnswered = ans !== undefined;
            const isCorrect = isAnswered && ans === q.correctIndex;

            const tx = offset * (isMobile ? 96 : 155);
            const tz = -Math.abs(offset) * (isMobile ? 35 : 45);
            const ty = Math.abs(offset) * 6;
            const rotY = -offset * 14;
            const scale = isCurr
              ? 1.04
              : Math.max(0.76, 0.92 - Math.abs(offset) * 0.08);

            return (
              <button
                key={q.id}
                type="button"
                onClick={() => onSelectIndex(targetIdx)}
                style={{
                  transform: `translate3d(${tx}px, ${ty}px, ${tz}px) rotateY(${rotY}deg) scale(${scale})`,
                  zIndex: 30 - Math.abs(offset) * 5,
                  transition: "transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)",
                }}
                className={`gpu-3d-card absolute flex h-[112px] w-[168px] cursor-pointer flex-col justify-between rounded-2xl border-2 p-2.5 text-left sm:h-[116px] sm:w-[195px] sm:p-3 ${
                  isCurr
                    ? "border-amber-400 bg-gradient-to-br from-[#162544] to-[#0C1426] shadow-[0_12px_35px_rgba(37,99,235,0.5)]"
                    : "border-white/15 bg-[#0D1527] opacity-85 hover:border-blue-400 hover:opacity-100"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="rounded-md bg-blue-600/40 px-2 py-0.5 text-[10px] font-extrabold text-blue-200 sm:text-[11px]">
                    Câu {targetIdx + 1}
                  </span>
                  <span className="tabular-nums text-[10px] font-bold text-amber-300 sm:text-[11px]">
                    {q.points}점
                  </span>
                </div>
                <p className="line-clamp-2 text-[11px] font-medium leading-snug text-slate-200">
                  {q.questionKo}
                </p>
                <div className="flex items-center justify-between border-t border-white/10 pt-1 text-[10px] font-bold">
                  {isAnswered ? (
                    <span
                      className={`inline-flex items-center gap-1 ${
                        isCorrect ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      <span>{isCorrect ? "Đúng" : "Sai"}</span>
                    </span>
                  ) : (
                    <span className="text-slate-400">Chưa làm</span>
                  )}
                  <span className="text-amber-300">
                    {isCurr ? "Đang mở" : "Chọn"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
