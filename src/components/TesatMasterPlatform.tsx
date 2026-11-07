"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BookOpen,
  Brain,
  Flame,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Volume2,
  KeyRound,
  Moon,
  Sun,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Search,
  Target,
  Home,
  LayoutGrid,
  ArrowRight,
  HelpCircle,
  EyeOff,
  Check,
  BarChart3,
  GraduationCap,
  Lightbulb,
  BookMarked,
  GitCompare,
  AlertCircle,
  Table2,
  Languages,
  MousePointerClick,
  Sigma,
  RotateCcw,
  Send,
  Loader2,
  Bot,
  LogOut,
  User,
  Trophy,
  Zap,
  ZoomIn,
  X,
  Box,
  Orbit,
} from "lucide-react";
import {
  TESAT_EXAM_SETS,
  ALL_TESAT_QUESTIONS_POOL,
  getExamSetById,
} from "@/lib/data/questions-seed";
import { SEED_VOCABULARY } from "@/lib/data/vocabulary-seed";
import {
  TesatQuestion,
  SentenceDeconstruction,
  TwinQuestion,
  TesatSubcategory,
} from "@/lib/schemas/tesat-schema";
import {
  evaluateExamSubmission,
  OFFICIAL_TESAT_CONSTANTS,
} from "@/lib/engine/tesat-matrix";
import {
  SM2CardState,
  SM2Quality,
  calculateSM2Review,
  IncorrectNoteRecord,
  scheduleIncorrectNoteReview,
} from "@/lib/engine/srs-sm2";
import {
  calculateTesatGoalPlan,
  TesatGoalSimulatorInput,
} from "@/lib/engine/gamification-visa";
import {
  createLLMService,
  DEFAULT_CONFIGURED_GEMINI_KEY,
  RegularQuestionAiHelp,
  TwinAnswerEvaluation,
  QuestionTranslationResult,
  ExtractedQuestionVocabItem,
  scanLocalVocabInQuestion,
  isUntranslatedPlaceholder,
} from "@/lib/ai/llm-service";
import {
  UserAccount,
  UserStudyProgress,
  CelebrationPayload,
  TesatLogoCrest,
  CelebrationPopupModal,
  TesatLandingPage,
  loadActiveUserFromStorage,
  saveActiveUserToStorage,
  loadUsersFromStorage,
  saveUsersToStorage,
  loadUserProgressFromStorage,
  saveUserProgressToStorage,
} from "@/components/TesatLandingAndAuth";
import {
  TesatVisualChart,
  TesatDataTableAutoChart,
} from "@/components/TesatVisualChart";
import {
  TargetTierType,
  TARGET_TIER_ROADMAPS,
  PersonalizedTargetRoadmapCard,
  Interactive3DTiltWrapper,
} from "@/components/Tesat3DAndGoalEngine";

type ScreenMode =
  | "HOME_HUB"
  | "MOCK_EXAM_LOBBY"
  | "MOCK_EXAM_ACTIVE"
  | "TOPIC_DRILL_LOBBY"
  | "TOPIC_DRILL_ACTIVE"
  | "VOCAB_LOBBY"
  | "VOCAB_ACTIVE"
  | "ERROR_ANALYTICS";

type AiSidebarTab = "HINTS" | "VOCAB" | "TWIN";

const TOPIC_METADATA: Array<{
  id: TesatSubcategory;
  titleVi: string;
  titleKo: string;
  sectionLabel: string;
  descVi: string;
  accentBorder: string;
  badgeStyle: string;
}> = [
  {
    id: "MICRO",
    titleVi: "Kinh tế Vi mô",
    titleKo: "미시경제",
    sectionLabel: "Phần 1 · Lý thuyết kinh tế",
    descVi: "Cung cầu, độ co giãn, thặng dư tiêu dùng, cấu trúc thị trường và thất bại thị trường.",
    accentBorder: "hover:border-blue-600",
    badgeStyle: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
  },
  {
    id: "MACRO",
    titleVi: "Kinh tế Vĩ mô",
    titleKo: "거시경제",
    sectionLabel: "Phần 1 · Lý thuyết kinh tế",
    descVi: "GDP, lạm phát, thất nghiệp, mô hình IS-LM, chính sách tài khóa và tiền tệ.",
    accentBorder: "hover:border-indigo-600",
    badgeStyle: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
  },
  {
    id: "INTL",
    titleVi: "Kinh tế Quốc tế",
    titleKo: "국제경제",
    sectionLabel: "Phần 1 · Lý thuyết kinh tế",
    descVi: "Tỷ giá hối đoái, cán cân thanh toán, lợi thế so sánh và thương mại quốc tế.",
    accentBorder: "hover:border-sky-600",
    badgeStyle: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  },
  {
    id: "CURRENT_ISSUES",
    titleVi: "Thời sự Kinh tế",
    titleKo: "시사경제·트렌드",
    sectionLabel: "Phần 2 · Thời sự & Thực tiễn",
    descVi: "Thuật ngữ thời sự Hàn Quốc, chính sách lãi suất của BOK và xu hướng thị trường.",
    accentBorder: "hover:border-emerald-600",
    badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "FINANCE_STRATEGY",
    titleVi: "Tài chính & Quản trị",
    titleKo: "기업금융·경영전략",
    sectionLabel: "Phần 2 · Thời sự & Thực tiễn",
    descVi: "Báo cáo tài chính, ROE/ROA, định giá trái phiếu, cổ phiếu, ESG và quản trị doanh nghiệp.",
    accentBorder: "hover:border-amber-600",
    badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  {
    id: "DATA_EDITORIAL",
    titleVi: "Phân tích Số liệu & Tình huống",
    titleKo: "응용복합·자료해석 (5점)",
    sectionLabel: "Phần 3 · Ứng dụng 5 điểm",
    descVi: "Đọc bảng thống kê BOK/KOSIS, bình luận xã luận kinh tế và suy luận tổng hợp.",
    accentBorder: "hover:border-rose-600",
    badgeStyle: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
  },
];

const VOCAB_CATEGORIES = [
  {
    id: "ALL",
    titleVi: "Tất cả Từ vựng Trọng tâm",
    titleKo: "전체 핵심 어휘",
    descVi: "Toàn bộ từ điển thuật ngữ kinh tế Hàn - Việt kèm gốc từ Hán-Hàn.",
  },
  {
    id: "MICRO",
    titleVi: "Từ vựng Kinh tế Vi mô",
    titleKo: "미시경제 어휘",
    descVi: "Chi phí cơ hội, độ co giãn, ngoại tác, độc quyền, thông tin bất cân xứng.",
  },
  {
    id: "MACRO",
    titleVi: "Từ vựng Kinh tế Vĩ mô",
    titleKo: "거시경제 어휘",
    descVi: "Lãi suất cơ bản, lạm phát đình trệ, nới lỏng định lượng, bẫy thanh khoản.",
  },
  {
    id: "INTL",
    titleVi: "Từ vựng Kinh tế Quốc tế",
    titleKo: "국제경제·환율 어휘",
    descVi: "Tỷ giá hối đoái, cán cân vãng lai, ngang giá sức mua, hiệu ứng đường cong J.",
  },
  {
    id: "FINANCE",
    titleVi: "Từ vựng Tài chính & Doanh nghiệp",
    titleKo: "금융·재무·경영 어휘",
    descVi: "ROE, PER, PBR, lợi suất trái phiếu, đòn bẩy tài chính, quản trị ESG.",
  },
  {
    id: "CURRENT_AFFAIRS",
    titleVi: "Từ vựng Thời sự Kinh tế",
    titleKo: "시사경제 신조어",
    descVi: "Các thuật ngữ thời sự xuất hiện thường xuyên trên báo Hàn Quốc Kinh Tế.",
  },
];

const EXERCISE_MILESTONE_COUNT = 5; // Hoàn thành 5 câu sẽ tính là hoàn thành 1 bài luyện tập
const STORAGE_3D_MODE_KEY = "tesat_master_is_3d_mode_v2";
const STORAGE_DARK_MODE_KEY = "tesat_master_dark_mode_v2";

export default function TesatMasterPlatform() {
  // =========================================================================
  // 1. AUTHENTICATION & USER PROGRESS STATE (Streak starts at 0!)
  // =========================================================================
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authHydrated, setAuthHydrated] = useState<boolean>(false);

  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [longestStreak, setLongestStreak] = useState<number>(0);
  const [lastStreakDate, setLastStreakDate] = useState<string | null>(null);
  const [completedExercisesCount, setCompletedExercisesCount] =
    useState<number>(0);
  const [xpPoints, setXpPoints] = useState<number>(0);
  const [sessionAnsweredCount, setSessionAnsweredCount] = useState<number>(0);
  const [sessionCorrectCount, setSessionCorrectCount] = useState<number>(0);

  // XP Perks & Power-ups State
  const [showXpModal, setShowXpModal] = useState<boolean>(false);
  const [eliminatedOptionsMap, setEliminatedOptionsMap] = useState<
    Record<string, number[]>
  >({});
  const [streakFreezesCount, setStreakFreezesCount] = useState<number>(0);
  const [vipCheatSheetUnlocked, setVipCheatSheetUnlocked] =
    useState<boolean>(false);

  const [celebrationModal, setCelebrationModal] =
    useState<CelebrationPayload | null>(null);

  // =========================================================================
  // 2. NAVIGATION, THEME & PAGE-TURN ANIMATION STATE
  // =========================================================================
  const [screen, setScreen] = useState<ScreenMode>("HOME_HUB");
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [showApiModal, setShowApiModal] = useState<boolean>(false);
  const [showOmrDrawer, setShowOmrDrawer] = useState<boolean>(false);
  const [pageTurnAnim, setPageTurnAnim] = useState<"" | "NEXT" | "PREV">("");
  const [zoomedFigure, setZoomedFigure] = useState<{
    url: string;
    captionKo?: string;
    captionVi?: string;
  } | null>(null);

  const [apiConfig, setApiConfig] = useState<{
    DEFAULT_LLM_PROVIDER: "gemini" | "openai" | "anthropic";
    GEMINI_API_KEY: string;
    OPENAI_API_KEY: string;
    ANTHROPIC_API_KEY: string;
  }>({
    DEFAULT_LLM_PROVIDER: "gemini",
    GEMINI_API_KEY:
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? DEFAULT_CONFIGURED_GEMINI_KEY,
    OPENAI_API_KEY: "",
    ANTHROPIC_API_KEY: "",
  });

  // =========================================================================
  // 3. MODE 1 & MODE 2 STATE
  // =========================================================================
  const [selectedSetId, setSelectedSetId] = useState<string>("BOOK_85");
  const [mockIdx, setMockIdx] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(
    OFFICIAL_TESAT_CONSTANTS.DURATION_SECONDS
  );
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);

  const [drillSubcategory, setDrillSubcategory] =
    useState<TesatSubcategory>("MICRO");
  const [drillPointsFilter, setDrillPointsFilter] = useState<"ALL" | 3 | 4 | 5>(
    "ALL"
  );
  const [onlyChartQuestions, setOnlyChartQuestions] = useState<boolean>(false);
  const [drillSearchQuery, setDrillSearchQuery] = useState<string>("");
  const [drillIdx, setDrillIdx] = useState<number>(0);

  // =========================================================================
  // 4. SHARED QUESTION, LIVE AI TRANSLATION, VOCAB & TUTOR STATE
  // =========================================================================
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<string, number | undefined>
  >({});

  // Live AI Translation Cache (questionId -> QuestionTranslationResult)
  const [showVietnameseTranslation, setShowVietnameseTranslation] =
    useState<boolean>(false);
  const [translationCache, setTranslationCache] = useState<
    Record<string, QuestionTranslationResult>
  >({});
  const [loadingTranslation, setLoadingTranslation] = useState<boolean>(false);

  // Dynamic Per-Question Vocabulary Cache (questionId -> ExtractedQuestionVocabItem[])
  const [vocabCache, setVocabCache] = useState<
    Record<string, ExtractedQuestionVocabItem[]>
  >({});
  const [loadingQuestionVocab, setLoadingQuestionVocab] =
    useState<boolean>(false);

  // AI Tutor Sidebar State
  const [aiSidebarTab, setAiSidebarTab] = useState<AiSidebarTab>("HINTS");
  const [revealedHintLevel, setRevealedHintLevel] = useState<0 | 1 | 2 | 3>(0);
  const [aiDeconstruction, setAiDeconstruction] =
    useState<SentenceDeconstruction | null>(null);
  const [loadingDeconstruction, setLoadingDeconstruction] =
    useState<boolean>(false);

  const [regularAiHelp, setRegularAiHelp] =
    useState<RegularQuestionAiHelp | null>(null);
  const [loadingRegularAiHelp, setLoadingRegularAiHelp] =
    useState<boolean>(false);
  const [customTutorPrompt, setCustomTutorPrompt] = useState<string>("");

  // Live AI Twin Question + Automatic Grading
  const [twinQuestion, setTwinQuestion] = useState<TwinQuestion | null>(null);
  const [loadingTwin, setLoadingTwin] = useState<boolean>(false);
  const [twinSelectedOption, setTwinSelectedOption] = useState<number | null>(
    null
  );
  const [twinEvaluation, setTwinEvaluation] =
    useState<TwinAnswerEvaluation | null>(null);
  const [loadingTwinEval, setLoadingTwinEval] = useState<boolean>(false);

  // =========================================================================
  // 5. VOCAB FLASHCARDS & ERROR LOG STATE
  // =========================================================================
  const [vocabCategoryFilter, setVocabCategoryFilter] = useState<string>("ALL");
  const [vocabSearch, setVocabSearch] = useState<string>("");
  const [activeCardIdx, setActiveCardIdx] = useState<number>(0);
  const [cardFlipped, setCardFlipped] = useState<boolean>(false);
  const [showFullVocabTable, setShowFullVocabTable] = useState<boolean>(false);
  const [flashcardsReviewedInSession, setFlashcardsReviewedInSession] =
    useState<number>(0);

  const [srsStates, setSrsStates] = useState<Record<string, SM2CardState>>(
    () => {
      const init: Record<string, SM2CardState> = {};
      for (const v of SEED_VOCABULARY) {
        init[v.id] = {
          repetition: 0,
          intervalDays: 0,
          easinessFactor: 2.5,
          nextReviewAt: new Date().toISOString(),
          lastQuality: 0,
        };
      }
      return init;
    }
  );

  const [errorLog, setErrorLog] = useState<
    Record<string, IncorrectNoteRecord>
  >({});

  const [goalInput, setGoalInput] = useState<TesatGoalSimulatorInput>({
    targetTier: "1급",
    predictedTheoryScore: 84,
    predictedAffairsScore: 82,
    predictedAppliedScore: 80,
  });

  const [serverSyncReady, setServerSyncReady] = useState<boolean>(false);

  // =========================================================================
  // HYDRATE USER FROM SERVER DATABASE + LOCAL STORAGE
  // =========================================================================
  const applyUserProgress = useCallback(
    (user: UserAccount, explicitProgress?: UserStudyProgress) => {
      const prog = explicitProgress ?? loadUserProgressFromStorage(user.id);
      setCurrentStreak(prog.currentStreak ?? 0);
      setLongestStreak(prog.longestStreak ?? 0);
      setLastStreakDate(prog.lastStreakDate ?? null);
      setCompletedExercisesCount(prog.completedExercisesCount ?? 0);
      setXpPoints(prog.xpPoints ?? 0);
      // Always start a fresh answer sheet on reload/login so previous session answers don't pre-fill questions
      setSessionAnsweredCount(0);
      setSessionCorrectCount(0);
      setSelectedAnswers({});
      setEliminatedOptionsMap({});
      setErrorLog(prog.errorLog ?? {});
      if (prog.srsStates && Object.keys(prog.srsStates).length > 0) {
        setSrsStates(prog.srsStates);
      }
      setGoalInput((prev) => ({ ...prev, targetTier: user.targetTier }));
    },
    []
  );

  useEffect(() => {
    try {
      const saved3D = window.localStorage.getItem(STORAGE_3D_MODE_KEY);
      if (saved3D !== null) {
        setIs3DMode(saved3D === "true");
      }
      const savedDark = window.localStorage.getItem(STORAGE_DARK_MODE_KEY);
      if (savedDark !== null) {
        setDarkMode(savedDark === "true");
      }
    } catch {
      // Ignore storage access errors
    }

    const savedUser = loadActiveUserFromStorage();
    if (savedUser) {
      setCurrentUser(savedUser);
      const localProg = loadUserProgressFromStorage(savedUser.id);
      applyUserProgress(savedUser, localProg);

      // Fetch latest progress from Server Database so cross-browser/cross-device state stays 100% synced
      fetch(
        `/api/db/progress?email=${encodeURIComponent(savedUser.username)}`
      )
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.found && data.progress) {
            const srv = data.progress;
            const mergedUser: UserAccount = data.user
              ? {
                  ...savedUser,
                  id: data.user.id || savedUser.id,
                  fullName: data.user.fullName || savedUser.fullName,
                  targetTier: (data.user.targetTier ||
                    savedUser.targetTier) as TargetTierType,
                }
              : savedUser;

            const mergedProgress: UserStudyProgress = {
              userId: mergedUser.id,
              currentStreak: Math.max(
                localProg.currentStreak ?? 0,
                srv.currentStreak ?? 0
              ),
              longestStreak: Math.max(
                localProg.longestStreak ?? 0,
                srv.longestStreak ?? 0
              ),
              lastStreakDate:
                srv.lastStreakDate ?? localProg.lastStreakDate ?? null,
              completedExercisesCount: Math.max(
                localProg.completedExercisesCount ?? 0,
                srv.completedExercisesCount ?? 0
              ),
              xpPoints: Math.max(localProg.xpPoints ?? 0, srv.xpPoints ?? 0),
              questionsAnsweredInCurrentSession: 0,
              selectedAnswers: {},
              errorLog: {
                ...(localProg.errorLog ?? {}),
                ...(srv.errorLog ?? {}),
              },
              srsStates:
                srv.srsStates && Object.keys(srv.srsStates).length > 0
                  ? { ...(localProg.srsStates ?? {}), ...srv.srsStates }
                  : localProg.srsStates,
            };

            setCurrentUser(mergedUser);
            saveActiveUserToStorage(mergedUser);
            saveUserProgressToStorage(mergedProgress);
            applyUserProgress(mergedUser, mergedProgress);
          }
        })
        .catch(() => {})
        .finally(() => {
          setServerSyncReady(true);
        });
    } else {
      setServerSyncReady(true);
    }
    setAuthHydrated(true);
  }, [applyUserProgress]);

  // Persist 3D Mode and Dark Mode across browser reloads (F5)
  useEffect(() => {
    if (!authHydrated) return;
    try {
      window.localStorage.setItem(STORAGE_3D_MODE_KEY, String(is3DMode));
      window.localStorage.setItem(STORAGE_DARK_MODE_KEY, String(darkMode));
    } catch {
      // Ignore storage access errors
    }
  }, [is3DMode, darkMode, authHydrated]);

  // Persist user progress whenever key states change (LocalStorage + SQLite/Server Database sync)
  useEffect(() => {
    if (!currentUser || !authHydrated || !serverSyncReady) return;
    const payload = {
      userId: currentUser.id,
      currentStreak,
      longestStreak,
      lastStreakDate,
      completedExercisesCount,
      xpPoints,
      questionsAnsweredInCurrentSession: 0,
      selectedAnswers: {},
      errorLog,
      srsStates,
    };
    saveUserProgressToStorage(payload);

    fetch("/api/db/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: currentUser.username,
        passwordHash: currentUser.passwordHash,
        fullName: currentUser.fullName,
        targetTier: currentUser.targetTier,
        ...payload,
      }),
    }).catch(() => {});
  }, [
    currentUser,
    authHydrated,
    serverSyncReady,
    currentStreak,
    longestStreak,
    lastStreakDate,
    completedExercisesCount,
    xpPoints,
    errorLog,
    srsStates,
  ]);

  // =========================================================================
  // DERIVED DATA
  // =========================================================================
  const llmService = useMemo(() => createLLMService(apiConfig), [apiConfig]);
  const llmStatus = useMemo(() => llmService.getStatus(), [llmService]);

  const currentExamSet = useMemo(
    () => getExamSetById(selectedSetId),
    [selectedSetId]
  );

  const currentSubcategoryPool = useMemo(
    () =>
      ALL_TESAT_QUESTIONS_POOL.filter(
        (q) => q.subcategory === drillSubcategory
      ),
    [drillSubcategory]
  );

  const filteredDrillQuestions = useMemo(() => {
    const qLower = drillSearchQuery.trim().toLowerCase();
    return currentSubcategoryPool.filter((q) => {
      const matchPts =
        drillPointsFilter === "ALL" || q.points === drillPointsFilter;
      const matchChart =
        !onlyChartQuestions ||
        Boolean(q.figureImageUrl || q.visualChart || q.dataTable);
      const matchQuery =
        qLower.length === 0 ||
        q.questionKo.toLowerCase().includes(qLower) ||
        q.questionVi.toLowerCase().includes(qLower) ||
        q.code.toLowerCase().includes(qLower);
      return matchPts && matchChart && matchQuery;
    });
  }, [
    currentSubcategoryPool,
    drillPointsFilter,
    onlyChartQuestions,
    drillSearchQuery,
  ]);

  const isMockActive = screen === "MOCK_EXAM_ACTIVE";
  const isDrillActive = screen === "TOPIC_DRILL_ACTIVE";

  const activeQuestionList = isDrillActive
    ? filteredDrillQuestions.length > 0
      ? filteredDrillQuestions
      : currentSubcategoryPool
    : currentExamSet.questions;

  const activeListAnsweredCount = useMemo(
    () =>
      activeQuestionList.filter((q) => selectedAnswers[q.id] !== undefined)
        .length,
    [activeQuestionList, selectedAnswers]
  );

  const activeIdx = isDrillActive
    ? Math.min(drillIdx, Math.max(0, activeQuestionList.length - 1))
    : Math.min(mockIdx, Math.max(0, activeQuestionList.length - 1));

  const currentQuestion: TesatQuestion =
    activeQuestionList[activeIdx] ?? currentExamSet.questions[0];

  const liveEvaluation = useMemo(
    () => evaluateExamSubmission(currentExamSet.questions, selectedAnswers),
    [currentExamSet, selectedAnswers]
  );

  const tesatGoalPlan = useMemo(
    () => calculateTesatGoalPlan(goalInput),
    [goalInput]
  );

  const topicCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of ALL_TESAT_QUESTIONS_POOL) {
      counts[q.subcategory] = (counts[q.subcategory] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filteredVocab = useMemo(() => {
    const q = vocabSearch.trim().toLowerCase();
    return SEED_VOCABULARY.filter((item) => {
      const catMatch =
        vocabCategoryFilter === "ALL" || item.category === vocabCategoryFilter;
      const textMatch =
        !q ||
        item.termKo.toLowerCase().includes(q) ||
        item.hanViet.toLowerCase().includes(q) ||
        item.termVi.toLowerCase().includes(q) ||
        item.termEn.toLowerCase().includes(q);
      return catMatch && textMatch;
    });
  }, [vocabSearch, vocabCategoryFilter]);

  const currentFlashcard =
    filteredVocab[activeCardIdx % Math.max(1, filteredVocab.length)] ??
    SEED_VOCABULARY[0];

  const selectedOptForCurrent = selectedAnswers[currentQuestion.id];
  const currentTranslation = translationCache[currentQuestion.id];
  const currentQuestionVocabList = vocabCache[currentQuestion.id];

  // =========================================================================
  // STREAK & EXERCISE COMPLETION ENGINE (Starts at 0, unlocks on exercise completion!)
  // =========================================================================
  const completeStudyExercise = useCallback(
    (
      exerciseTitle: string,
      xpReward: number,
      scoreSummary?: string,
      customFeedback?: {
        canUnlockStreak?: boolean;
        tone?: "EXCELLENT" | "GOOD" | "NEEDS_WORK" | "WARNING";
        customTitle?: string;
        customSubtitle?: string;
        badgeLabel?: string;
      }
    ) => {
      const canUnlock = customFeedback?.canUnlockStreak ?? true;
      const todayStr = new Date().toISOString().slice(0, 10);
      const isNewDayStreak = canUnlock && lastStreakDate !== todayStr;
      const nextStreak = isNewDayStreak ? currentStreak + 1 : currentStreak;
      const nextLongest = Math.max(longestStreak, nextStreak);

      if (isNewDayStreak) {
        setCurrentStreak(nextStreak);
        setLongestStreak(nextLongest);
        setLastStreakDate(todayStr);
      }

      if (canUnlock) {
        setCompletedExercisesCount((prev) => prev + 1);
      }
      if (xpReward > 0) {
        setXpPoints((prev) => prev + xpReward);
      }
      setSessionAnsweredCount(0);
      setSessionCorrectCount(0);

      setCelebrationModal({
        title:
          customFeedback?.customTitle ??
          (isNewDayStreak
            ? `Chúc mừng mở Chuỗi ${nextStreak} Ngày Học!`
            : `Hoàn thành: ${exerciseTitle}`),
        subtitle:
          customFeedback?.customSubtitle ??
          (isNewDayStreak
            ? `Bạn đã hoàn thành bài học đầu tiên trong ngày và nâng chuỗi học tập từ ${currentStreak} lên ${nextStreak} ngày liên tiếp!`
            : `Tuyệt vời! Bạn vừa hoàn thành thêm 1 bài luyện tập và tích lũy thêm +${xpReward} XP.`),
        streakUnlocked: isNewDayStreak,
        newStreakCount: nextStreak,
        xpEarned: xpReward,
        scoreSummary,
        tone: customFeedback?.tone ?? "EXCELLENT",
        badgeLabel: customFeedback?.badgeLabel,
      });
    },
    [lastStreakDate, currentStreak, longestStreak]
  );

  // =========================================================================
  // EFFECTS: TIMER, TRANSLATION & DYNAMIC PER-QUESTION VOCABULARY
  // =========================================================================
  useEffect(() => {
    if (screen !== "MOCK_EXAM_ACTIVE" || !timerRunning || examSubmitted) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, timerRunning, examSubmitted]);

  // Reset per-question AI state when question changes
  useEffect(() => {
    setRegularAiHelp(null);
    setAiDeconstruction(null);
    setRevealedHintLevel(0);
    setTwinQuestion(null);
    setTwinSelectedOption(null);
    setTwinEvaluation(null);
    setCustomTutorPrompt("");
  }, [currentQuestion.id]);

  // Clear page-turn animation class after 430ms
  useEffect(() => {
    if (!pageTurnAnim) return;
    const t = setTimeout(() => setPageTurnAnim(""), 430);
    return () => clearTimeout(t);
  }, [pageTurnAnim]);

  // When showVietnameseTranslation is ON, automatically fetch Live AI Translation for currentQuestion if not already translated
  useEffect(() => {
    if (
      !showVietnameseTranslation ||
      (screen !== "MOCK_EXAM_ACTIVE" && screen !== "TOPIC_DRILL_ACTIVE")
    ) {
      return;
    }
    if (translationCache[currentQuestion.id]) {
      setLoadingTranslation(false);
      return;
    }

    const needsLiveTranslation =
      isUntranslatedPlaceholder(currentQuestion.questionVi) ||
      currentQuestion.options.some((o) => isUntranslatedPlaceholder(o.textVi)) ||
      (Boolean(currentQuestion.passageKo) &&
        isUntranslatedPlaceholder(currentQuestion.passageVi));

    if (!needsLiveTranslation) {
      setLoadingTranslation(false);
      return;
    }

    let active = true;
    setLoadingTranslation(true);
    llmService
      .translateQuestionLive(currentQuestion)
      .then((res) => {
        if (active) {
          setTranslationCache((prev) => ({
            ...prev,
            [currentQuestion.id]: res,
          }));
        }
      })
      .finally(() => {
        if (active) setLoadingTranslation(false);
      });

    return () => {
      active = false;
    };
  }, [
    showVietnameseTranslation,
    screen,
    currentQuestion,
    translationCache,
    llmService,
  ]);

  // Extract per-question Korean vocabulary when the user opens the VOCAB tab
  useEffect(() => {
    if (screen !== "MOCK_EXAM_ACTIVE" && screen !== "TOPIC_DRILL_ACTIVE") {
      return;
    }
    if (aiSidebarTab !== "VOCAB") return;
    if (vocabCache[currentQuestion.id]) return;

    let active = true;
    setLoadingQuestionVocab(true);
    llmService
      .extractVocabForQuestionLive(currentQuestion)
      .then((items) => {
        if (active && items.length > 0) {
          setVocabCache((prev) => ({
            ...prev,
            [currentQuestion.id]: items,
          }));
        }
      })
      .finally(() => {
        if (active) setLoadingQuestionVocab(false);
      });

    return () => {
      active = false;
    };
  }, [screen, aiSidebarTab, currentQuestion, vocabCache, llmService]);

  // =========================================================================
  // HANDLERS
  // =========================================================================
  const resetQuestionAiStates = () => {
    setRegularAiHelp(null);
    setAiDeconstruction(null);
    setRevealedHintLevel(0);
    setTwinQuestion(null);
    setTwinSelectedOption(null);
    setTwinEvaluation(null);
    setCustomTutorPrompt("");
  };

  const startMockExamSet = (setId: string) => {
    setSelectedSetId(setId);
    setMockIdx(0);
    setExamSubmitted(false);
    setRemainingSeconds(OFFICIAL_TESAT_CONSTANTS.DURATION_SECONDS);
    setTimerRunning(true);
    setSelectedAnswers({});
    setEliminatedOptionsMap({});
    setSessionAnsweredCount(0);
    setSessionCorrectCount(0);
    resetQuestionAiStates();
    setShowOmrDrawer(false);
    setScreen("MOCK_EXAM_ACTIVE");
  };

  const startTopicDrill = (subcat: TesatSubcategory) => {
    setDrillSubcategory(subcat);
    setDrillPointsFilter("ALL");
    setOnlyChartQuestions(false);
    setDrillSearchQuery("");
    setDrillIdx(0);
    setSelectedAnswers({});
    setEliminatedOptionsMap({});
    setSessionAnsweredCount(0);
    setSessionCorrectCount(0);
    resetQuestionAiStates();
    setShowOmrDrawer(false);
    setScreen("TOPIC_DRILL_ACTIVE");
  };

  const startTargetedDrill = (
    subcat: TesatSubcategory,
    pointsFilter: "ALL" | 3 | 4 | 5,
    onlyCharts: boolean
  ) => {
    setDrillSubcategory(subcat);
    setDrillPointsFilter(pointsFilter);
    setOnlyChartQuestions(onlyCharts);
    setDrillSearchQuery("");
    setDrillIdx(0);
    setSelectedAnswers({});
    setEliminatedOptionsMap({});
    setSessionAnsweredCount(0);
    setSessionCorrectCount(0);
    resetQuestionAiStates();
    setShowOmrDrawer(false);
    setScreen("TOPIC_DRILL_ACTIVE");
  };

  const handleUpdateTargetTier = useCallback(
    (newTier: TargetTierType) => {
      setGoalInput((prev) => ({ ...prev, targetTier: newTier }));
      if (!currentUser) return;
      const updatedUser: UserAccount = {
        ...currentUser,
        targetTier: newTier,
      };
      setCurrentUser(updatedUser);
      saveActiveUserToStorage(updatedUser);
      const allUsers = loadUsersFromStorage();
      saveUsersToStorage(
        allUsers.map((u) => (u.id === updatedUser.id ? updatedUser : u))
      );
    },
    [currentUser]
  );

  const startVocabCategory = (catId: string) => {
    setVocabCategoryFilter(catId);
    setActiveCardIdx(0);
    setCardFlipped(false);
    setFlashcardsReviewedInSession(0);
    setScreen("VOCAB_ACTIVE");
  };

  const handleAskRegularAiHelp = useCallback(
    async (customPromptOverride?: string) => {
      setAiSidebarTab("HINTS");
      setLoadingRegularAiHelp(true);
      try {
        const promptToUse = customPromptOverride ?? customTutorPrompt;
        const helpRes = await llmService.askAiTutorHelp(
          currentQuestion,
          selectedAnswers[currentQuestion.id],
          promptToUse
        );
        setRegularAiHelp(helpRes);
      } finally {
        setLoadingRegularAiHelp(false);
      }
    },
    [currentQuestion, selectedAnswers, customTutorPrompt, llmService]
  );

  const handleRevealLiveHint = useCallback(
    async (level: 1 | 2 | 3) => {
      if (revealedHintLevel === level) {
        setRevealedHintLevel(0);
        return;
      }
      setRevealedHintLevel(level);
      if (!aiDeconstruction) {
        setLoadingDeconstruction(true);
        try {
          const res = await llmService.deconstructAndHint(
            currentQuestion,
            selectedAnswers[currentQuestion.id]
          );
          setAiDeconstruction(res);
        } finally {
          setLoadingDeconstruction(false);
        }
      }
    },
    [
      revealedHintLevel,
      aiDeconstruction,
      llmService,
      currentQuestion,
      selectedAnswers,
    ]
  );

  const handleSelectOption = useCallback(
    (optionIndex: number) => {
      if (isMockActive && examSubmitted) return;

      const wasAlreadyAnswered =
        selectedAnswers[currentQuestion.id] !== undefined;
      const isCorrect = optionIndex === currentQuestion.correctIndex;

      setSelectedAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: optionIndex,
      }));

      // Track progress toward 5-question exercise milestone in Topic Drill (with strict >= 1 correct rule & dynamic praise/critique)
      if (!wasAlreadyAnswered && isDrillActive) {
        const nextCount = sessionAnsweredCount + 1;
        const nextCorrect = sessionCorrectCount + (isCorrect ? 1 : 0);
        const topicTitle =
          TOPIC_METADATA.find((t) => t.id === drillSubcategory)?.titleVi ??
          "Chuyên đề TESAT";

        if (nextCount >= EXERCISE_MILESTONE_COUNT) {
          if (nextCorrect === 0) {
            setSessionAnsweredCount(nextCount);
            setSessionCorrectCount(0);
            setCelebrationModal({
              title: `Chưa đạt yêu cầu: 0/${nextCount} câu đúng`,
              subtitle: `Bạn đã làm ${nextCount} câu trong chuyên đề ${topicTitle} nhưng chưa trả lời đúng câu nào. Hãy làm đúng ít nhất 1 câu để được mở khóa Chuỗi ngày học và nhận XP nhé!`,
              streakUnlocked: false,
              xpEarned: 0,
              scoreSummary: `0/${nextCount} câu đúng`,
              tone: "NEEDS_WORK",
              badgeLabel: "Cần đúng ít nhất 1 câu để mở Chuỗi ngày học!",
            });
          } else {
            const xpReward = nextCorrect * 12;
            const accuracyRatio = nextCorrect / nextCount;
            const tone =
              accuracyRatio >= 0.8
                ? "EXCELLENT"
                : accuracyRatio >= 0.4
                  ? "GOOD"
                  : "NEEDS_WORK";
            completeStudyExercise(
              `Chuyên đề ${topicTitle}`,
              xpReward,
              `${nextCorrect}/${nextCount} câu đúng`,
              {
                canUnlockStreak: true,
                tone,
                badgeLabel:
                  tone === "EXCELLENT"
                    ? `Phong độ Xuất sắc · Đúng ${nextCorrect}/${nextCount} câu!`
                    : tone === "GOOD"
                      ? `Kết quả Khá tốt · Đúng ${nextCorrect}/${nextCount} câu`
                      : `Đã tính Chuỗi · Cần ôn kỹ hơn (${nextCorrect}/${nextCount} câu đúng)`,
                customTitle:
                  tone === "EXCELLENT"
                    ? `Tuyệt vời! Đúng ${nextCorrect}/${nextCount} câu ${topicTitle}`
                    : tone === "GOOD"
                      ? `Hoàn thành tốt: Đúng ${nextCorrect}/${nextCount} câu`
                      : `Đã mở Chuỗi ngày học (${nextCorrect}/${nextCount} câu đúng)`,
                customSubtitle:
                  tone === "EXCELLENT"
                    ? `Bạn nắm rất chắc lý thuyết chuyên đề ${topicTitle}! Hệ thống cộng +${xpReward} XP và ghi nhận Chuỗi ngày học.`
                    : tone === "GOOD"
                      ? `Bạn trả lời đúng ${nextCorrect}/${nextCount} câu và nhận +${xpReward} XP. Hãy xem lại giải thích AI cho các câu còn nhầm lẫn nhé!`
                      : `Bạn đã đúng ${nextCorrect}/${nextCount} câu nên đủ điều kiện tính Chuỗi ngày học (+${xpReward} XP), nhưng tỷ lệ sai còn cao — hãy ôn lại ở Sổ tay câu sai nhé!`,
              }
            );
          }
        } else {
          setSessionAnsweredCount(nextCount);
          setSessionCorrectCount(nextCorrect);
        }
      }

      setErrorLog((prev) => {
        const existing = prev[currentQuestion.id] ?? null;
        if (!isCorrect || existing) {
          const updated = scheduleIncorrectNoteReview(existing, {
            questionId: currentQuestion.id,
            questionCode: currentQuestion.code,
            selectedIndex: optionIndex,
            isCorrectOnReview: isCorrect,
          });
          return { ...prev, [currentQuestion.id]: updated };
        }
        return prev;
      });
    },
    [
      currentQuestion,
      isMockActive,
      examSubmitted,
      selectedAnswers,
      isDrillActive,
      sessionAnsweredCount,
      sessionCorrectCount,
      drillSubcategory,
      completeStudyExercise,
    ]
  );

  // Allow user to finish Topic Drill session early anytime (as long as they answered >= 1 correct question)
  const handleFinishTopicDrillSession = () => {
    const topicTitle =
      TOPIC_METADATA.find((t) => t.id === drillSubcategory)?.titleVi ??
      "Chuyên đề TESAT";

    if (sessionAnsweredCount === 0) {
      setCelebrationModal({
        title: "Bạn chưa làm câu hỏi nào trong phiên này!",
        subtitle:
          "Hãy chọn đáp án và trả lời đúng ít nhất 1 câu hỏi trong chuyên đề để được tính Chuỗi ngày học và nhận điểm kinh nghiệm XP nhé.",
        streakUnlocked: false,
        xpEarned: 0,
        scoreSummary: "0 câu đã làm",
        tone: "WARNING",
        badgeLabel: "Chưa làm bài · Cần đúng ít nhất 1 câu",
      });
      return;
    }

    if (sessionCorrectCount === 0) {
      setCelebrationModal({
        title: `Chưa đủ điều kiện mở Chuỗi (0/${sessionAnsweredCount} câu đúng)`,
        subtitle: `Bạn đã làm ${sessionAnsweredCount} câu nhưng chưa có câu nào đúng. Chỉ cần trả lời đúng ít nhất 1 câu là bạn có thể chốt phiên luyện tập và nhận Chuỗi ngay!`,
        streakUnlocked: false,
        xpEarned: 0,
        scoreSummary: `0/${sessionAnsweredCount} câu đúng`,
        tone: "NEEDS_WORK",
        badgeLabel: "Cần đúng ít nhất 1 câu để tính Chuỗi!",
      });
      return;
    }

    const xpReward = Math.max(12, sessionCorrectCount * 12);
    const accuracyRatio = sessionCorrectCount / sessionAnsweredCount;
    const tone =
      accuracyRatio >= 0.8 && sessionCorrectCount >= 2
        ? "EXCELLENT"
        : accuracyRatio >= 0.5
          ? "GOOD"
          : "NEEDS_WORK";

    completeStudyExercise(
      `Phiên luyện ${topicTitle}`,
      xpReward,
      `${sessionCorrectCount}/${sessionAnsweredCount} câu đúng`,
      {
        canUnlockStreak: true,
        tone,
        badgeLabel:
          tone === "EXCELLENT"
            ? `Hoàn thành xuất sắc · Đúng ${sessionCorrectCount}/${sessionAnsweredCount} câu`
            : tone === "GOOD"
              ? `Hoàn thành phiên luyện · Đúng ${sessionCorrectCount}/${sessionAnsweredCount} câu`
              : `Chốt phiên sớm · Đã ghi nhận Chuỗi ngày học`,
        customTitle: `Hoàn thành phiên luyện: Đúng ${sessionCorrectCount}/${sessionAnsweredCount} câu`,
        customSubtitle:
          sessionAnsweredCount < 5
            ? `Không cần phải làm hết cả bộ câu hỏi dài! Bạn đã trả lời đúng ${sessionCorrectCount}/${sessionAnsweredCount} câu nên hệ thống ghi nhận ngay Chuỗi ngày học và thưởng +${xpReward} XP.`
            : `Bạn đã trả lời đúng ${sessionCorrectCount}/${sessionAnsweredCount} câu chuyên đề ${topicTitle} và nhận +${xpReward} XP!`,
      }
    );
  };

  const handleSubmitMockExam = () => {
    const answeredCount = liveEvaluation.answeredCount;
    const achievedScore = liveEvaluation.achievedScore;
    const correctCount = currentExamSet.questions.filter(
      (q) => selectedAnswers[q.id] === q.correctIndex
    ).length;

    // 1. Chưa làm câu nào (0/80) -> Cảnh báo ngay, KHÔNG nộp bài, KHÔNG cộng XP, KHÔNG tính Chuỗi!
    if (answeredCount === 0) {
      setCelebrationModal({
        title: "Bạn chưa làm câu nào trong đề thi!",
        subtitle:
          "Bài thi hiện đang bỏ trống (0/80 câu). Bạn cần làm bài và trả lời đúng ít nhất 1 câu mới được chấm điểm, nhận XP và mở khóa Chuỗi ngày học!",
        streakUnlocked: false,
        xpEarned: 0,
        scoreSummary: "0/80 câu đã làm",
        tone: "WARNING",
        badgeLabel: "Chưa làm bài · Không tính Chuỗi & 0 XP",
      });
      return;
    }

    setTimerRunning(false);
    setExamSubmitted(true);

    // 2. Có chọn đáp án nhưng sai hết (0 câu đúng) -> Chấm 0 điểm, 0 XP, KHÔNG tính Chuỗi!
    if (correctCount === 0) {
      completeStudyExercise(
        currentExamSet.titleVi,
        0,
        `0/${answeredCount} câu đúng (0/300đ)`,
        {
          canUnlockStreak: false,
          tone: "NEEDS_WORK",
          badgeLabel: "Chưa đạt điều kiện tính Chuỗi (Cần đúng ≥ 1 câu)",
          customTitle: `Chưa có câu trả lời đúng (0/${answeredCount} câu)`,
          customSubtitle: `Bạn đã chọn ${answeredCount}/80 câu nhưng chưa đúng câu nào (0/300 điểm) nên chưa được nhận XP và Chuỗi ngày học. Hãy bấm xem Giải thích AI ở từng câu để nắm chắc quy tắc kinh tế nhé!`,
        }
      );
      return;
    }

    // 3. Đúng ít nhất 1 câu (correctCount >= 1) -> Tính Chuỗi + Cộng XP tương xứng + Khen/Chê linh động!
    const earnedXp = Math.min(
      200,
      Math.max(15, Math.round(achievedScore * 0.45) + correctCount * 2)
    );

    if (achievedScore >= 240) {
      completeStudyExercise(
        currentExamSet.titleVi,
        earnedXp,
        `${achievedScore}/300đ · ${correctCount}/${answeredCount} câu đúng (${liveEvaluation.tierInfo.tier})`,
        {
          canUnlockStreak: true,
          tone: "EXCELLENT",
          badgeLabel: `Xuất sắc · Đạt đẳng cấp ${liveEvaluation.tierInfo.tier}!`,
          customTitle: `Phong độ đỉnh cao! ${achievedScore}/300 điểm (${liveEvaluation.tierInfo.tier})`,
          customSubtitle: `Quá ấn tượng! Bạn trả lời đúng ${correctCount}/${answeredCount} câu đã làm và nhận +${earnedXp} XP. Khả năng phân tích kinh tế và đọc bảng số liệu của bạn rất xuất sắc!`,
        }
      );
    } else if (achievedScore >= 180) {
      completeStudyExercise(
        currentExamSet.titleVi,
        earnedXp,
        `${achievedScore}/300đ · ${correctCount}/${answeredCount} câu đúng (${liveEvaluation.tierInfo.tier})`,
        {
          canUnlockStreak: true,
          tone: "GOOD",
          badgeLabel: `Kết quả Khá Tốt · Đạt cấp ${liveEvaluation.tierInfo.tier}`,
          customTitle: `Làm tốt lắm! Đạt ${achievedScore}/300 điểm (${liveEvaluation.tierInfo.tier})`,
          customSubtitle: `Bạn làm đúng ${correctCount}/${answeredCount} câu (+${earnedXp} XP). Nền tảng lý thuyết rất khả quan — hãy rèn thêm các câu tình huống 4-5 điểm để bứt phá lên 1급 và S급!`,
        }
      );
    } else {
      const isEarlySubmit = answeredCount < 25;
      completeStudyExercise(
        currentExamSet.titleVi,
        earnedXp,
        `${achievedScore}/300đ · ${correctCount}/${answeredCount} câu đúng`,
        {
          canUnlockStreak: true,
          tone: "NEEDS_WORK",
          badgeLabel: isEarlySubmit
            ? `Nộp bài sớm (${answeredCount}/80 câu) · Đã mở Chuỗi`
            : `Điểm còn thấp (${achievedScore}/300đ) · Cần ôn kỹ hơn`,
          customTitle: isEarlySubmit
            ? `Đã ghi nhận Chuỗi! Đúng ${correctCount}/${answeredCount} câu (${achievedScore}đ)`
            : `Cần cố gắng hơn! Đạt ${achievedScore}/300 điểm (${correctCount}/${answeredCount} đúng)`,
          customSubtitle: isEarlySubmit
            ? `Bạn trả lời đúng ${correctCount} câu nên hệ thống đã mở khóa Chuỗi ngày học và cộng +${earnedXp} XP theo tỷ lệ câu đúng. Tuy nhiên bạn mới làm ${answeredCount}/80 câu — khi có thời gian hãy thử sức làm trọn vẹn cả đề nhé!`
            : `Bạn đúng ${correctCount}/${answeredCount} câu đã làm (+${earnedXp} XP). Kết quả hiện chưa đạt chuẩn cấp 3급 (180đ) — hãy vào Sổ tay câu sai để ôn lại các câu vừa nhầm nhé!`,
        }
      );
    }
  };

  // Spend 30 XP to eliminate 2 wrong distractor options on the current question
  const handleUse5050PowerUp = useCallback(() => {
    const qId = currentQuestion.id;
    if ((eliminatedOptionsMap[qId]?.length ?? 0) > 0) return;
    if (selectedAnswers[qId] !== undefined) return;

    if (xpPoints < 30) {
      setShowXpModal(true);
      return;
    }

    const wrongIndices = currentQuestion.options
      .map((o) => o.index)
      .filter((idx) => idx !== currentQuestion.correctIndex);

    // Deterministically or randomly pick 2 wrong options to cross out
    const shuffledWrong = [...wrongIndices].sort(
      (a, b) => ((a * 7 + qId.length) % 5) - ((b * 7 + qId.length) % 5)
    );
    const toEliminate = shuffledWrong.slice(0, 2);

    setXpPoints((prev) => Math.max(0, prev - 30));
    setEliminatedOptionsMap((prev) => ({
      ...prev,
      [qId]: toEliminate,
    }));
  }, [currentQuestion, eliminatedOptionsMap, selectedAnswers, xpPoints]);

  const handleGenerateTwin = useCallback(async () => {
    setLoadingTwin(true);
    setTwinSelectedOption(null);
    setTwinEvaluation(null);
    setAiSidebarTab("TWIN");
    try {
      const twin = await llmService.generateIsomorphicTwin(currentQuestion);
      setTwinQuestion(twin);
    } finally {
      setLoadingTwin(false);
    }
  }, [currentQuestion, llmService]);

  const handleSelectTwinOption = useCallback(
    async (optIndex: number) => {
      if (!twinQuestion || loadingTwinEval) return;
      setTwinSelectedOption(optIndex);
      setLoadingTwinEval(true);
      try {
        const evalResult = await llmService.evaluateTwinAnswer(
          twinQuestion,
          optIndex
        );
        setTwinEvaluation(evalResult);
      } finally {
        setLoadingTwinEval(false);
      }
    },
    [twinQuestion, loadingTwinEval, llmService]
  );

  const goNextQuestion = useCallback(() => {
    setPageTurnAnim("NEXT");
    if (isDrillActive) {
      setDrillIdx((prev) =>
        Math.min(activeQuestionList.length - 1, prev + 1)
      );
    } else {
      setMockIdx((prev) =>
        Math.min(activeQuestionList.length - 1, prev + 1)
      );
    }
  }, [isDrillActive, activeQuestionList.length]);

  const goPrevQuestion = useCallback(() => {
    setPageTurnAnim("PREV");
    if (isDrillActive) {
      setDrillIdx((prev) => Math.max(0, prev - 1));
    } else {
      setMockIdx((prev) => Math.max(0, prev - 1));
    }
  }, [isDrillActive]);

  // Keyboard shortcuts for active study workspace (1..5 for options ①..⑤, ←/→ for page turn, Esc for lightbox)
  useEffect(() => {
    if (
      screen !== "MOCK_EXAM_ACTIVE" &&
      screen !== "TOPIC_DRILL_ACTIVE" &&
      !zoomedFigure
    ) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && zoomedFigure) {
        setZoomedFigure(null);
        return;
      }

      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (screen === "MOCK_EXAM_ACTIVE" || screen === "TOPIC_DRILL_ACTIVE") {
        if (e.key === "ArrowRight" && activeIdx < activeQuestionList.length - 1) {
          e.preventDefault();
          goNextQuestion();
        } else if (e.key === "ArrowLeft" && activeIdx > 0) {
          e.preventDefault();
          goPrevQuestion();
        } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
          const optIdx = Number(e.key) - 1;
          handleSelectOption(optIdx);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    screen,
    zoomedFigure,
    activeIdx,
    activeQuestionList.length,
    goNextQuestion,
    goPrevQuestion,
    handleSelectOption,
  ]);

  const speakKorean = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ko-KR";
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleRateFlashcard = (quality: SM2Quality) => {
    const currentSrs = srsStates[currentFlashcard.id];
    const nextSrs = calculateSM2Review(currentSrs, quality);
    setSrsStates((prev) => ({
      ...prev,
      [currentFlashcard.id]: nextSrs,
    }));
    setCardFlipped(false);
    setPageTurnAnim("NEXT");
    setActiveCardIdx((prev) => (prev + 1) % Math.max(1, filteredVocab.length));

    const nextReviewed = flashcardsReviewedInSession + 1;
    if (nextReviewed >= 3) {
      setFlashcardsReviewedInSession(0);
      completeStudyExercise(
        "Ôn tập 3 thẻ từ vựng Hán-Hàn",
        30,
        "3/3 thẻ từ vựng",
        {
          canUnlockStreak: true,
          tone: "EXCELLENT",
          badgeLabel: "Hoàn thành phiên từ vựng · Đã tính Chuỗi & +30 XP!",
          customTitle: "Hoàn thành ôn 3 thẻ từ vựng Hán-Hàn!",
          customSubtitle:
            "Bạn đã đánh giá mức độ ghi nhớ 3 thuật ngữ kinh tế và mở khóa Chuỗi ngày học (+30 XP). Bạn có thể học tiếp hoặc chốt phiên bất cứ lúc nào!",
        }
      );
    } else {
      setFlashcardsReviewedInSession(nextReviewed);
    }
  };

  const handleFinishVocabSession = () => {
    if (flashcardsReviewedInSession === 0) {
      setCelebrationModal({
        title: "Bạn chưa đánh giá thẻ từ vựng nào!",
        subtitle:
          "Hãy lật thẻ và bấm chọn mức độ nhớ (Chưa nhớ / Tạm nhớ / Nhớ tốt / Đã thuộc) cho ít nhất 1 thẻ từ vựng để nhận Chuỗi ngày học và XP nhé!",
        streakUnlocked: false,
        xpEarned: 0,
        scoreSummary: "0 thẻ đã ôn",
        tone: "WARNING",
        badgeLabel: "Cần ôn ít nhất 1 thẻ từ vựng để tính Chuỗi!",
      });
      return;
    }

    const count = flashcardsReviewedInSession;
    const xpReward = count * 10;
    setFlashcardsReviewedInSession(0);
    completeStudyExercise(
      `Ôn tập ${count} thẻ từ vựng Hán-Hàn`,
      xpReward,
      `${count} thẻ từ đã ôn`,
      {
        canUnlockStreak: true,
        tone: "GOOD",
        badgeLabel: `Chốt phiên từ vựng (${count} thẻ) · Đã mở Chuỗi!`,
        customTitle: `Đã ghi nhận Chuỗi! Ôn xong ${count} thẻ từ vựng`,
        customSubtitle: `Không cần đợi đủ bộ! Bạn đã ôn tập ${count} thuật ngữ Hán-Hàn trong phiên này nên hệ thống đã mở khóa Chuỗi ngày học và thưởng +${xpReward} XP.`,
      }
    );
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${String(mins).padStart(2, "0")}:${String(rem).padStart(2, "0")}`;
  };

  // =========================================================================
  // IF USER IS NOT LOGGED IN -> RENDER BEAUTIFUL LANDING PAGE + AUTH
  // =========================================================================
  if (authHydrated && !currentUser) {
    return (
      <TesatLandingPage
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((prev) => !prev)}
        is3DMode={is3DMode}
        onToggle3DMode={() => setIs3DMode((prev) => !prev)}
        onAuthSuccess={(user, serverProgress) => {
          setCurrentUser(user);
          applyUserProgress(user, serverProgress);
          setServerSyncReady(true);
          setScreen("HOME_HUB");
        }}
        totalQuestionsCount={ALL_TESAT_QUESTIONS_POOL.length}
        examSetsCount={TESAT_EXAM_SETS.length}
      />
    );
  }

  // Semantic Theme Tokens (Full Website transforms when is3DMode === true!)
  const pageBg = is3DMode
    ? "dark world-3d-universe text-[#F8FAFC]"
    : darkMode
      ? "dark bg-[#0B0F17] text-[#F8FAFC]"
      : "bg-[#F6F5F1] text-[#0F172A]";
  const cardSurface = is3DMode
    ? "bg-gradient-to-br from-[#0B1325] via-[#0F172A] to-[#080D1A] border-2 border-blue-500/40 text-[#F8FAFC] shadow-[0_20px_55px_rgba(15,23,42,0.65)]"
    : darkMode
      ? "bg-[#111827] border-[#1E293B] text-[#F8FAFC]"
      : "bg-white border-[#E2E0D8] text-[#0F172A] shadow-[0_1px_3px_rgba(15,23,42,0.03)]";
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

  // Helper to get translated option text (Live AI translation or curated)
  const getOptionTranslatedText = (optIdx: number): string => {
    if (currentTranslation?.optionsVi?.[optIdx]) {
      return currentTranslation.optionsVi[optIdx];
    }
    const rawVi = currentQuestion.options[optIdx]?.textVi ?? "";
    if (isUntranslatedPlaceholder(rawVi)) {
      return loadingTranslation
        ? "⏳ Đang dịch phương án này sang tiếng Việt..."
        : "Nhấn 'Dịch câu hỏi (AI)' để dịch phương án này.";
    }
    return rawVi;
  };

  const getQuestionTranslatedText = (): string => {
    if (currentTranslation?.questionVi) {
      return currentTranslation.questionVi;
    }
    if (isUntranslatedPlaceholder(currentQuestion.questionVi)) {
      return loadingTranslation
        ? "⏳ Gemini AI đang dịch câu hỏi và 5 phương án sang tiếng Việt..."
        : "Đang tải bản dịch tiếng Việt...";
    }
    return currentQuestion.questionVi;
  };

  const getPassageTranslatedText = (): string => {
    if (currentTranslation?.passageVi) {
      return currentTranslation.passageVi;
    }
    if (isUntranslatedPlaceholder(currentQuestion.passageVi)) {
      return loadingTranslation
        ? "⏳ Đang dịch nội dung <보기> / đoạn văn sang tiếng Việt..."
        : "Đang tải bản dịch đoạn văn...";
    }
    return currentQuestion.passageVi ?? "";
  };

  return (
    <div className={`relative min-h-screen transition-colors duration-200 ${pageBg}`}>
      {/* FULL-VIEWPORT 3D HORIZON GRID FLOOR WHEN 3D MODE IS ACTIVE */}
      {is3DMode && (
        <div
          aria-hidden="true"
          className="world-3d-horizon-floor pointer-events-none fixed inset-x-0 bottom-0 z-0 h-[44vh] opacity-65"
        />
      )}

      {/* CELEBRATION POPUP MODAL */}
      <CelebrationPopupModal
        payload={celebrationModal}
        onClose={() => setCelebrationModal(null)}
        darkMode={darkMode || is3DMode}
      />

      {/* FULL-SCREEN BOOK FIGURE LIGHTBOX MODAL */}
      {zoomedFigure && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setZoomedFigure(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`animate-celebration-pop relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border p-6 shadow-2xl ${cardSurface}`}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#1D4ED8]" aria-hidden="true" />
                <div>
                  <h3 className="text-sm font-extrabold">
                    {zoomedFigure.captionKo ?? "원본 기출 도표 · 그래프 (Phóng to)"}
                  </h3>
                  {zoomedFigure.captionVi && (
                    <p className={`text-xs ${mutedText}`}>{zoomedFigure.captionVi}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setZoomedFigure(null)}
                aria-label="Đóng biểu đồ phóng to"
                className={`flex min-h-[36px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-bold ${subtleSurface}`}
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Đóng (ESC)</span>
              </button>
            </div>
            <div className="flex justify-center rounded-2xl bg-white p-4">
              <img
                src={zoomedFigure.url}
                alt={zoomedFigure.captionKo ?? "Biểu đồ gốc TESAT"}
                className="max-h-[75vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TOP NAVIGATION BAR (Transforms into 3D Floating Cockpit HUD in 3D Mode)
         ===================================================================== */}
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
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setTimerRunning(false);
                setScreen("HOME_HUB");
              }}
              className="flex min-w-0 items-center gap-2.5 text-left transition hover:opacity-90 sm:gap-3"
            >
              <TesatLogoCrest size={36} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="truncate text-sm font-extrabold tracking-tight sm:text-base">
                    {is3DMode ? "TESAT 3D World" : "TESAT Master"}
                  </span>
                  <span className="hidden rounded-md bg-blue-600/15 px-2 py-0.5 text-xs font-bold text-[#1D4ED8] sm:inline-block dark:text-blue-300">
                    한국경제
                  </span>
                </div>
              </div>
            </button>

            {screen !== "HOME_HUB" && (
              <button
                onClick={() => {
                  setTimerRunning(false);
                  setScreen("HOME_HUB");
                }}
                className={`ml-1 flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition sm:ml-2 sm:px-3.5 ${subtleSurface}`}
              >
                <Home className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="hidden xs:inline sm:inline">Chọn chế độ</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            {/* 1-CLICK 3D SPATIAL MODE TOGGLE BUTTON */}
            <button
              onClick={() => setIs3DMode((prev) => !prev)}
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
              <span>
                {is3DMode ? "Về Bản Gốc (2D)" : "Chế độ 3D ✨"}
              </span>
            </button>

            {/* Accurate Streak Badge (Starts at 0!) */}
            <div
              title={
                currentStreak === 0
                  ? "Trả lời đúng ít nhất 1 câu (hoặc ôn ít nhất 1 thẻ từ vựng) rồi bấm chốt phiên để mở chuỗi ngày 1!"
                  : `Bạn đã duy trì chuỗi học ${currentStreak} ngày liên tiếp!`
              }
              className={`hidden min-h-[38px] items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-bold transition sm:flex sm:px-3 ${
                currentStreak > 0
                  ? darkMode || is3DMode
                    ? "border-amber-500/40 bg-amber-500/15 text-amber-300"
                    : "border-amber-300 bg-amber-50 text-amber-800"
                  : subtleSurface
              }`}
            >
              <Flame
                className={`h-4 w-4 ${
                  currentStreak > 0
                    ? "animate-flame text-amber-500"
                    : "text-slate-400"
                }`}
                aria-hidden="true"
              />
              <span className="tabular-nums">Chuỗi {currentStreak} ngày</span>
              {streakFreezesCount > 0 && (
                <span className="ml-1 rounded bg-sky-500/20 px-1.5 py-0.5 text-[10px] font-extrabold text-sky-400">
                  🛡️x{streakFreezesCount}
                </span>
              )}
            </div>

            {/* Interactive XP Store & Perks Button */}
            <button
              onClick={() => setShowXpModal(true)}
              title="Nhấn để mở Trung tâm Đặc quyền & Đổi thưởng EXP (Dùng XP loại đáp án sai 50/50, mua Lá chắn bảo vệ Chuỗi, mở Cẩm nang công thức)"
              className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition hover:border-[#1D4ED8] ${subtleSurface}`}
            >
              <Zap className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
              <span className="tabular-nums">{xpPoints} XP</span>
              <span className="hidden rounded bg-blue-600/15 px-1.5 py-0.5 text-[10px] text-[#1D4ED8] md:inline dark:text-blue-300">
                Đổi quà
              </span>
            </button>

            {/* AI Key Status */}
            <button
              onClick={() => setShowApiModal(true)}
              className={`hidden min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition md:flex ${
                llmStatus.isLiveApiActive
                  ? darkMode
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-emerald-300/80 bg-emerald-50/90 text-emerald-800"
                  : subtleSurface
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" aria-hidden="true" />
              <span>AI Live</span>
            </button>

            {/* Theme Switch */}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label="Đổi giao diện Sáng hoặc Tối"
              className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${subtleSurface}`}
            >
              {darkMode ? (
                <Sun className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
              ) : (
                <Moon className="h-3.5 w-3.5 text-slate-600" aria-hidden="true" />
              )}
            </button>

            {/* User Profile & Logout */}
            {currentUser && (
              <div className="flex items-center gap-1.5">
                <span
                  className={`hidden items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold lg:flex ${subtleSurface}`}
                >
                  <User className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                  <span>{currentUser.fullName}</span>
                </span>
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    saveActiveUserToStorage(null);
                    setCurrentUser(null);
                  }}
                  title="Đăng xuất / Đổi tài khoản"
                  className={`flex min-h-[38px] items-center gap-1 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:border-rose-500/50 hover:text-rose-600 ${subtleSurface}`}
                >
                  <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          MODAL: XP PERKS & REWARD CENTER (TRUNG TÂM ĐẶC QUYỀN & ĐỔI THƯỞNG EXP)
         ===================================================================== */}
      {showXpModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="xp-modal-title"
          onClick={() => setShowXpModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border p-6 shadow-2xl ${cardSurface}`}
          >
            <div className="mb-4 flex items-center justify-between border-b border-slate-200/70 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 text-[#1D4ED8] dark:text-blue-400">
                  <Zap className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="xp-modal-title" className="text-base font-extrabold">
                    Trung tâm Đặc quyền & Đổi thưởng EXP
                  </h3>
                  <p className={`text-xs ${mutedText}`}>
                    Điểm kinh nghiệm tích lũy khi làm đúng câu hỏi & hoàn thành bài luyện
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowXpModal(false)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${subtleSurface}`}
              >
                Đóng
              </button>
            </div>

            {/* Current XP Balance & Academic Rank */}
            <div
              className={`mb-5 rounded-2xl border p-4 ${subtleSurface}`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className={`text-xs font-semibold ${mutedText}`}>
                    Số dư EXP hiện có
                  </span>
                  <div className="mt-0.5 text-2xl font-extrabold text-[#1D4ED8] dark:text-blue-400">
                    ⚡ {xpPoints} XP
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-semibold ${mutedText}`}>
                    Danh hiệu Học hàm Kinh tế
                  </span>
                  <div className="mt-0.5 text-sm font-extrabold text-amber-600 dark:text-amber-400">
                    {xpPoints >= 1000
                      ? "👑 Bậc thầy Kinh tế TESAT S급"
                      : xpPoints >= 500
                        ? "🏛️ Chiến lược gia Vĩ mô & Tài chính"
                        : xpPoints >= 200
                          ? "📊 Chuyên viên Phân tích Hankyung"
                          : "🌱 Thực tập sinh Kinh tế TESAT"}
                  </div>
                </div>
              </div>
              <p className={`mt-2 text-xs ${mutedText}`}>
                💡 Cách kiếm thêm EXP: Trả lời đúng câu hỏi trong Ôn theo chủ đề (+12 XP/câu đúng), Ôn thẻ từ vựng (+10 XP/thẻ) hoặc Nộp đề thi thử (tính theo điểm thực tế & số câu đúng).
              </p>
            </div>

            {/* 3 Ways to Spend XP */}
            <div className="space-y-3 text-xs sm:text-sm">
              <h4 className="font-extrabold">
                Dùng EXP để kích hoạt trợ quyền học tập:
              </h4>

              {/* Item 1: 50/50 Distractor Elimination */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${subtleSurface}`}
              >
                <div className="max-w-sm space-y-1">
                  <div className="font-bold text-[#1D4ED8] dark:text-blue-400">
                    🎯 Quyền trợ giúp 50/50: Loại 2 đáp án nhiễu (30 XP / lần)
                  </div>
                  <p className={`text-xs ${mutedText}`}>
                    Gạch bỏ ngay 2 phương án sai trong câu hỏi đang làm để tăng xác suất chọn đúng lên gấp đôi. Bạn cũng có thể bấm nút &ldquo;⚡ 50/50 (-30 XP)&rdquo; ngay trên đầu mỗi câu hỏi!
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (
                      screen !== "MOCK_EXAM_ACTIVE" &&
                      screen !== "TOPIC_DRILL_ACTIVE"
                    ) {
                      setShowXpModal(false);
                      setScreen("TOPIC_DRILL_LOBBY");
                      return;
                    }
                    handleUse5050PowerUp();
                    setShowXpModal(false);
                  }}
                  disabled={
                    xpPoints < 30 ||
                    ((screen === "MOCK_EXAM_ACTIVE" ||
                      screen === "TOPIC_DRILL_ACTIVE") &&
                      ((eliminatedOptionsMap[currentQuestion.id]?.length ?? 0) >
                        0 ||
                        selectedAnswers[currentQuestion.id] !== undefined))
                  }
                  className="rounded-xl bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700 disabled:opacity-45"
                >
                  {xpPoints < 30
                    ? "Cần 30 XP"
                    : screen === "MOCK_EXAM_ACTIVE" ||
                        screen === "TOPIC_DRILL_ACTIVE"
                      ? "Dùng ngay câu này (-30 XP)"
                      : "Vào câu hỏi để dùng"}
                </button>
              </div>

              {/* Item 2: Streak Freeze Shield */}
              <div
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 ${subtleSurface}`}
              >
                <div className="max-w-sm space-y-1">
                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                    🛡️ Lá chắn Bảo vệ Chuỗi ngày học (100 XP / lá chắn)
                  </div>
                  <p className={`text-xs ${mutedText}`}>
                    Giữ nguyên Chuỗi ngày học không bị mất nếu bạn bận đột xuất 1 ngày. Hiện đang có:{" "}
                    <strong>{streakFreezesCount} lá chắn</strong>.
                  </p>
                </div>
                <button
                  onClick={() => {
                    if (xpPoints < 100) return;
                    setXpPoints((prev) => prev - 100);
                    setStreakFreezesCount((prev) => prev + 1);
                  }}
                  disabled={xpPoints < 100}
                  className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-emerald-800 disabled:opacity-45"
                >
                  {xpPoints < 100 ? "Cần 100 XP" : "Đổi 1 Lá chắn (-100 XP)"}
                </button>
              </div>

              {/* Item 3: Unlock 5-Second VIP Formula Cheat Sheet */}
              <div
                className={`space-y-3 rounded-2xl border p-4 ${subtleSurface}`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="max-w-sm space-y-1">
                    <div className="font-bold text-amber-600 dark:text-amber-400">
                      👑 Cẩm nang 8 Công thức Giải nhanh TESAT 5 giây (150 XP)
                    </div>
                    <p className={`text-xs ${mutedText}`}>
                      Bảng tổng hợp các quy tắc nhẩm nhanh Vi mô, Vĩ mô, Tài chính và Tỷ giá hay ra thi nhất trong đề TESAT.
                    </p>
                  </div>
                  {!vipCheatSheetUnlocked ? (
                    <button
                      onClick={() => {
                        if (xpPoints < 150) return;
                        setXpPoints((prev) => prev - 150);
                        setVipCheatSheetUnlocked(true);
                      }}
                      disabled={xpPoints < 150}
                      className="rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-45"
                    >
                      {xpPoints < 150 ? "Cần 150 XP" : "Mở khóa ngay (-150 XP)"}
                    </button>
                  ) : (
                    <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-500">
                      ✓ Đã mở khóa vĩnh viễn
                    </span>
                  )}
                </div>

                {vipCheatSheetUnlocked && (
                  <div className="mt-2 grid grid-cols-1 gap-2 border-t border-slate-200/70 pt-3 text-xs sm:grid-cols-2 dark:border-slate-800">
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>1. Độ co giãn & Doanh thu (TR):</strong> Cầu co giãn (|Ed| &gt; 1) → Giảm giá (P↓) làm Tổng doanh thu tăng (TR↑). Cầu kém co giãn (|Ed| &lt; 1) → Tăng giá (P↑) làm TR↑.
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>2. Chính sách Tiền tệ BOK:</strong> Mua trái phiếu (국채 매입) / Giảm dự trữ bắt buộc → Cung tiền M↑ → Lãi suất r↓ → Đầu tư & AD↑.
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>3. Tỷ giá hối đoái (원/달러 환율 상승):</strong> Tỷ giá tăng = Đồng Won mất giá (원화 가치 하락) → Xuất khẩu (수출) có lợi, Nhập khẩu (수입) bất lợi, Giá hàng nhập khẩu tăng.
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>4. Giá Trái phiếu & Lãi suất:</strong> Giá trái phiếu (채권 가격) và Lãi suất thị trường / Lợi suất (금리/수익률) LUÔN biến động NGƯỢC CHIỀU nhau!
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>5. Tối đa hóa lợi nhuận:</strong> Mọi doanh nghiệp (cạnh tranh hoàn hảo hay độc quyền) đều sản xuất tại MR = MC (한계수입 = 한계비용).
                    </div>
                    <div className="rounded-xl bg-blue-500/10 p-2.5">
                      <strong>6. Ngoại tác (외부효과):</strong> Ngoại tác tiêu cực → Sản lượng thị trường LỚN hơn mức tối ưu xã hội (과다 생산) → Khắc phục bằng Thuế Pigou.
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: API KEY CONFIGURATION
         ===================================================================== */}
      {showApiModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="api-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
        >
          <div className={`w-full max-w-md rounded-2xl border p-6 shadow-xl ${cardSurface}`}>
            <div className="mb-4 flex items-center justify-between">
              <h3 id="api-modal-title" className="text-base font-bold">
                Cấu hình Kết nối AI ({llmStatus.activeModel})
              </h3>
              <button
                onClick={() => setShowApiModal(false)}
                className={`text-sm font-medium ${mutedText}`}
              >
                Đóng
              </button>
            </div>
            <div className="space-y-4 text-sm">
              <div>
                <label
                  htmlFor="provider-select"
                  className="mb-1.5 block text-xs font-semibold"
                >
                  Nhà cung cấp mô hình
                </label>
                <select
                  id="provider-select"
                  value={apiConfig.DEFAULT_LLM_PROVIDER}
                  onChange={(e) =>
                    setApiConfig((prev) => ({
                      ...prev,
                      DEFAULT_LLM_PROVIDER: e.target.value as
                        | "gemini"
                        | "openai"
                        | "anthropic",
                    }))
                  }
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm ${subtleSurface}`}
                >
                  <option value="gemini">
                    Google Gemini (gemini-flash-lite-latest / gemini-flash-latest)
                  </option>
                  <option value="openai">OpenAI (gpt-4o-mini)</option>
                  <option value="anthropic">Anthropic (claude-3-5-haiku)</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="gemini-key-input"
                  className="mb-1.5 block text-xs font-semibold"
                >
                  Khóa API Gemini (GEMINI_API_KEY)
                </label>
                <input
                  id="gemini-key-input"
                  type="password"
                  value={apiConfig.GEMINI_API_KEY}
                  onChange={(e) =>
                    setApiConfig((prev) => ({
                      ...prev,
                      GEMINI_API_KEY: e.target.value,
                    }))
                  }
                  placeholder="Dán mã khóa Gemini..."
                  className={`w-full rounded-xl border px-3 py-2.5 text-sm ${subtleSurface}`}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowApiModal(false)}
                className="min-h-[42px] rounded-xl bg-[#1D4ED8] px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Lưu thiết lập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MAIN WORKSPACE CONTAINER (Responsive Mobile + Tablet + Full Laptop)
         ===================================================================== */}
      <main className="relative z-10 mx-auto max-w-[1440px] px-4 py-6 pb-24 sm:px-8 sm:py-10">
        {/* ===================================================================
            SCREEN 1: HOME HUB (CHỌN CHẾ ĐỘ HỌC TẬP)
           =================================================================== */}
        {screen === "HOME_HUB" && (
          <div className="animate-screen-enter space-y-6 sm:space-y-8">
            {/* Personal Greeting & Streak Progress Banner (Transforms to 3D Floating Pod in 3D Mode) */}
            <Interactive3DTiltWrapper
              enabled={is3DMode}
              intensity={2.2}
              className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5 sm:p-7 ${cardSurface} ${
                is3DMode ? "card-3d-prism" : ""
              }`}
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 rounded-lg bg-blue-600/15 px-3 py-1 text-xs font-bold text-[#1D4ED8] dark:text-blue-300">
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  <span>
                    Xin chào, {currentUser?.fullName ?? "Học viên"} · Mục tiêu:{" "}
                    {currentUser?.targetTier ?? "1급"}
                  </span>
                </div>
                <h1 className="text-xl font-extrabold tracking-tight sm:text-3xl">
                  {is3DMode
                    ? "Không gian 3D TESAT Master · Chọn chế độ học tập"
                    : "Chọn chế độ học tập của bạn hôm nay"}
                </h1>
                <p className={`text-xs sm:text-sm ${mutedText}`}>
                  {currentStreak === 0
                    ? "Chuỗi ngày học của bạn đang là 0. Hãy hoàn thành 1 bài luyện tập (5 câu hỏi, 5 thẻ từ vựng hoặc 1 đề thi) để mở khóa Chuỗi ngày đầu tiên!"
                    : `Tuyệt vời! Bạn đã duy trì chuỗi ${currentStreak} ngày liên tiếp và hoàn thành ${completedExercisesCount} bài luyện tập.`}
                </p>
              </div>

              <div
                className={`flex w-full items-center justify-around gap-3 rounded-2xl border px-4 py-3 sm:w-auto sm:justify-start sm:gap-4 sm:px-5 sm:py-3.5 ${subtleSurface}`}
              >
                <div className="text-center">
                  <div className="tabular-nums text-xl font-black text-amber-500 sm:text-2xl">
                    {currentStreak}
                  </div>
                  <div className={`text-[11px] font-semibold ${mutedText}`}>
                    Chuỗi ngày
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <div className="tabular-nums text-xl font-black text-[#1D4ED8] dark:text-blue-400 sm:text-2xl">
                    {completedExercisesCount}
                  </div>
                  <div className={`text-[11px] font-semibold ${mutedText}`}>
                    Bài hoàn thành
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="text-center">
                  <div className="tabular-nums text-xl font-black text-emerald-600 dark:text-emerald-400 sm:text-2xl">
                    {xpPoints}
                  </div>
                  <div className={`text-[11px] font-semibold ${mutedText}`}>
                    Điểm XP
                  </div>
                </div>
              </div>
            </Interactive3DTiltWrapper>

            {/* 4 Mode Selection Cards (Automatically transform into 3D Prism Cards when is3DMode === true) */}
            <div
              className={`grid grid-cols-1 gap-6 md:grid-cols-2 ${
                is3DMode ? "grid-3d-stage" : ""
              }`}
            >
              {/* MODE 1: THI THỬ 80 CÂU */}
              <button
                onClick={() => setScreen("MOCK_EXAM_LOBBY")}
                className={`group flex flex-col justify-between rounded-2xl border p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:border-[#1D4ED8] hover:shadow-md ${cardSurface} ${
                  is3DMode ? "card-3d-prism" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-md">
                      <Clock className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        is3DMode || darkMode
                          ? "bg-blue-500/20 text-blue-300"
                          : "bg-blue-600/10 text-blue-700"
                      }`}
                    >
                      {TESAT_EXAM_SETS.length} bộ đề · 80 câu · 100 phút
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${mutedText}`}>
                      실전 모의고사 (300점 만점)
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Thi thử chuẩn cấu trúc 80 câu
                    </h2>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                      Chọn 1 trong {TESAT_EXAM_SETS.length} bộ đề chính thức (gồm 7 đề gốc trích xuất từ sách & 6 bộ đề luyện tập). Đồng hồ 100 phút chỉ bắt đầu chạy khi bạn nhấn nút vào thi.
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-6 flex items-center gap-2 text-sm font-semibold ${
                    is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                  }`}
                >
                  <span>Chọn bộ đề thi thử</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* MODE 2: ÔN LUYỆN THEO CHỦ ĐỀ */}
              <button
                onClick={() => setScreen("TOPIC_DRILL_LOBBY")}
                className={`group flex flex-col justify-between rounded-2xl border p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:border-emerald-600 hover:shadow-md ${cardSurface} ${
                  is3DMode ? "card-3d-prism" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-md">
                      <Target className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        is3DMode || darkMode
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-emerald-600/10 text-emerald-700"
                      }`}
                    >
                      {ALL_TESAT_QUESTIONS_POOL.length} câu hỏi · 6 chuyên đề
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${mutedText}`}>
                      주제별 집중 훈련 (미시 · 거시 · 국제 · 시사 · 금융 · 자료해석)
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Ôn luyện theo từng chủ đề
                    </h2>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                      Chọn riêng từng mảng kiến thức để luyện tập không giới hạn thời gian. Cứ hoàn thành mỗi 5 câu sẽ được tính 1 bài tập và mở chuỗi ngày học!
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-6 flex items-center gap-2 text-sm font-semibold ${
                    is3DMode || darkMode ? "text-emerald-400" : "text-emerald-700"
                  }`}
                >
                  <span>Chọn chủ đề ôn luyện</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* MODE 3: ÔN TỪ VỰNG THEO CHỦ ĐỀ */}
              <button
                onClick={() => setScreen("VOCAB_LOBBY")}
                className={`group flex flex-col justify-between rounded-2xl border p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:border-amber-600 hover:shadow-md ${cardSurface} ${
                  is3DMode ? "card-3d-prism" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-600 text-white shadow-md">
                      <BookOpen className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        is3DMode || darkMode
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-amber-600/10 text-amber-800"
                      }`}
                    >
                      Từ điển Hán-Hàn · Thẻ lật SM-2
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${mutedText}`}>
                      주제별 경제 용어 & 플래시카드
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Học từ vựng theo chủ đề
                    </h2>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                      Nắm vững thuật ngữ kinh tế Hàn Quốc qua âm Hán-Việt tương đồng, nghe phát âm chuẩn và ôn tập bằng thẻ ghi nhớ ngắt quãng.
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-6 flex items-center gap-2 text-sm font-semibold ${
                    is3DMode || darkMode ? "text-amber-400" : "text-amber-700"
                  }`}
                >
                  <span>Chọn chủ đề từ vựng</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </button>

              {/* MODE 4: SỔ TAY CÂU SAI & TIẾN ĐỘ */}
              <button
                onClick={() => setScreen("ERROR_ANALYTICS")}
                className={`group flex flex-col justify-between rounded-2xl border p-7 text-left transition duration-200 hover:-translate-y-0.5 hover:border-rose-600 hover:shadow-md ${cardSurface} ${
                  is3DMode ? "card-3d-prism" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-700 text-white shadow-md">
                      <BarChart3 className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                        is3DMode || darkMode
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-rose-600/10 text-rose-700"
                      }`}
                    >
                      {Object.keys(errorLog).length} câu cần ôn lại
                    </span>
                  </div>
                  <div>
                    <p className={`text-xs font-medium ${mutedText}`}>
                      오답노트 (1·3·7일 주기) & 등급 시뮬레이터
                    </p>
                    <h2 className="mt-1 text-xl font-bold sm:text-2xl">
                      Sổ tay câu sai & Mô phỏng điểm
                    </h2>
                    <p className={`mt-2 text-sm leading-relaxed ${mutedText}`}>
                      Ôn lại các câu đã làm sai theo chu kỳ trí nhớ 1 ngày, 3 ngày, 7 ngày và ước tính điểm mục tiêu đạt cấp S급 / 1급 / 2급.
                    </p>
                  </div>
                </div>
                <div
                  className={`mt-6 flex items-center gap-2 text-sm font-semibold ${
                    is3DMode || darkMode ? "text-rose-400" : "text-rose-700"
                  }`}
                >
                  <span>Mở sổ tay & phân tích</span>
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </button>
            </div>

            {/* PERSONALIZED TARGET GRADE ROADMAP & MISSION ENGINE */}
            <PersonalizedTargetRoadmapCard
              targetTier={(currentUser?.targetTier ?? "1급") as TargetTierType}
              onChangeTargetTier={handleUpdateTargetTier}
              allQuestions={ALL_TESAT_QUESTIONS_POOL}
              selectedAnswers={selectedAnswers}
              onStartTargetedDrill={startTargetedDrill}
              onStartTargetedMockSet={startMockExamSet}
              darkMode={darkMode}
              is3DMode={is3DMode}
            />
          </div>
        )}

        {/* ===================================================================
            SCREEN 2A: MOCK EXAM LOBBY (CHỌN BỘ ĐỀ THI 80 CÂU)
           =================================================================== */}
        {screen === "MOCK_EXAM_LOBBY" && (
          <div className="animate-screen-enter space-y-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold text-[#1D4ED8] dark:text-blue-400">
                Chế độ Thi thử thực chiến · Mục tiêu hiện tại: {currentUser?.targetTier ?? "1급"}
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Chọn bộ đề thi 80 câu (300 điểm · 100 phút)
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Mỗi bộ đề tuân thủ đúng ma trận chấm điểm của Hàn Quốc Kinh Tế. Đồng hồ đếm ngược 100 phút sẽ bắt đầu khi bạn chọn một bộ đề bên dưới.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${
                is3DMode ? "grid-3d-stage" : ""
              }`}
            >
              {TESAT_EXAM_SETS.map((examSet, idx) => {
                const isBookSet = examSet.setId.startsWith("BOOK_");
                const sec1Qs = examSet.questions.filter(
                  (q) => q.section === "THEORY"
                );
                const sec2Qs = examSet.questions.filter(
                  (q) => q.section === "CURRENT_AFFAIRS"
                );
                const sec3Qs = examSet.questions.filter(
                  (q) => q.section === "APPLIED"
                );
                const sec1Pts = sec1Qs.reduce((a, q) => a + q.points, 0);
                const sec2Pts = sec2Qs.reduce((a, q) => a + q.points, 0);
                const sec3Pts = sec3Qs.reduce((a, q) => a + q.points, 0);
                const chartCount = examSet.questions.filter(
                  (q) => q.figureImageUrl || q.visualChart || q.dataTable
                ).length;

                return (
                  <div
                    key={examSet.setId}
                    className={`flex flex-col justify-between rounded-2xl border p-6 transition hover:-translate-y-0.5 hover:border-[#1D4ED8] ${cardSurface} ${
                      is3DMode ? "card-3d-prism" : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold text-white ${
                            isBookSet ? "bg-emerald-700" : "bg-[#1D4ED8]"
                          }`}
                        >
                          {isBookSet
                            ? `Đề sách gốc #${idx + 1}`
                            : `Bộ đề mở rộng #${idx + 1}`}
                        </span>
                        <span
                          className={`tabular-nums text-xs font-medium ${mutedText}`}
                        >
                          {examSet.questionCount} câu · {examSet.totalPoints}đ ·{" "}
                          {examSet.durationMinutes} phút
                        </span>
                      </div>
                      <h2 className="text-base font-bold leading-snug sm:text-lg">
                        {examSet.titleVi}
                      </h2>
                      <p className={`text-xs ${mutedText}`}>{examSet.titleKo}</p>

                      <div
                        className={`space-y-1.5 rounded-xl border p-3.5 text-xs ${subtleSurface}`}
                      >
                        <div className="flex justify-between">
                          <span>Phần 1 · Lý thuyết kinh tế</span>
                          <span className="tabular-nums font-semibold">
                            {sec1Qs.length} câu ({sec1Pts}đ)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phần 2 · Thời sự & Quản trị</span>
                          <span className="tabular-nums font-semibold">
                            {sec2Qs.length} câu ({sec2Pts}đ)
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Phần 3 · Phân tích tình huống</span>
                          <span className="tabular-nums font-semibold">
                            {sec3Qs.length} câu ({sec3Pts}đ)
                          </span>
                        </div>
                        <div className="flex justify-between border-t border-slate-200/70 pt-1.5 font-semibold text-[#1D4ED8] dark:border-slate-800 dark:text-blue-400">
                          <span>Biểu đồ / Bảng biểu gốc trong đề</span>
                          <span className="tabular-nums">
                            {chartCount} câu có hình/bảng
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => startMockExamSet(examSet.setId)}
                      className="mt-5 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Play className="h-4 w-4" aria-hidden="true" />
                      <span>Bắt đầu tính giờ làm bài</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            SCREEN 2B: TOPIC DRILL LOBBY (CHỌN CHỦ ĐỀ ÔN LUYỆN)
           =================================================================== */}
        {screen === "TOPIC_DRILL_LOBBY" && (
          <div className="animate-screen-enter space-y-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                Chế độ Ôn luyện theo chủ đề ({ALL_TESAT_QUESTIONS_POOL.length} câu đề thật) · Mục tiêu: {currentUser?.targetTier ?? "1급"}
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Chọn chuyên đề kinh tế bạn muốn luyện tập
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Làm từng câu không giới hạn thời gian. Hoàn thành 5 câu trong chuyên đề sẽ được tính 1 bài tập hoàn chỉnh và mở khóa Chuỗi ngày học!
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${
                is3DMode ? "grid-3d-stage" : ""
              }`}
            >
              {TOPIC_METADATA.map((topic) => {
                const count = topicCounts[topic.id] ?? 0;
                return (
                  <button
                    key={topic.id}
                    onClick={() => startTopicDrill(topic.id)}
                    className={`group flex flex-col justify-between rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 ${cardSurface} ${topic.accentBorder} ${
                      is3DMode ? "card-3d-prism" : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${topic.badgeStyle}`}
                        >
                          {topic.sectionLabel}
                        </span>
                        <span className="tabular-nums text-xs font-bold">
                          {count} câu hỏi
                        </span>
                      </div>
                      <div>
                        <h2 className="text-lg font-bold sm:text-xl">
                          {topic.titleVi}
                        </h2>
                        <p className={`text-xs font-medium ${mutedText}`}>
                          {topic.titleKo}
                        </p>
                      </div>
                      <p className={`text-xs leading-relaxed sm:text-sm ${mutedText}`}>
                        {topic.descVi}
                      </p>
                    </div>

                    <div
                      className={`mt-5 flex items-center justify-between border-t border-slate-200/70 pt-3.5 text-xs font-semibold dark:border-slate-800 ${
                        is3DMode || darkMode
                          ? "text-emerald-400"
                          : "text-emerald-700"
                      }`}
                    >
                      <span>Bắt đầu luyện chuyên đề này</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            SCREEN 2C: VOCABULARY LOBBY (CHỌN CHỦ ĐỀ TỪ VỰNG)
           =================================================================== */}
        {screen === "VOCAB_LOBBY" && (
          <div className="animate-screen-enter space-y-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                Chế độ Học từ vựng Hán-Hàn & Flashcard
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Chọn chủ đề từ vựng kinh tế
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Mỗi thuật ngữ tiếng Hàn đều được phân tích gốc chữ Hán (Hanja), âm Hán-Việt tương ứng và câu ví dụ trong đề thi.
              </p>
            </div>

            <div
              className={`grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 ${
                is3DMode ? "grid-3d-stage" : ""
              }`}
            >
              {VOCAB_CATEGORIES.map((cat) => {
                const count =
                  cat.id === "ALL"
                    ? SEED_VOCABULARY.length
                    : SEED_VOCABULARY.filter((v) => v.category === cat.id)
                        .length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => startVocabCategory(cat.id)}
                    className={`group flex flex-col justify-between rounded-2xl border p-6 text-left transition hover:-translate-y-0.5 hover:border-amber-600 ${cardSurface} ${
                      is3DMode ? "card-3d-prism" : ""
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                            is3DMode || darkMode
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-amber-500/10 text-amber-800"
                          }`}
                        >
                          {cat.titleKo}
                        </span>
                        <span className="tabular-nums text-xs font-bold">
                          {count} thuật ngữ
                        </span>
                      </div>
                      <h2 className="text-lg font-bold sm:text-xl">
                        {cat.titleVi}
                      </h2>
                      <p className={`text-xs leading-relaxed sm:text-sm ${mutedText}`}>
                        {cat.descVi}
                      </p>
                    </div>
                    <div
                      className={`mt-5 flex items-center justify-between border-t border-slate-200/70 pt-3.5 text-xs font-semibold dark:border-slate-800 ${
                        is3DMode || darkMode
                          ? "text-amber-400"
                          : "text-amber-700"
                      }`}
                    >
                      <span>Mở bộ thẻ từ vựng</span>
                      <ArrowRight
                        className="h-4 w-4 transition-transform group-hover:translate-x-1"
                        aria-hidden="true"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================================================================
            SCREEN 3: ACTIVE STUDY WORKSPACE (MOCK EXAM OR TOPIC DRILL)
           =================================================================== */}
        {(screen === "MOCK_EXAM_ACTIVE" || screen === "TOPIC_DRILL_ACTIVE") && (
          <div className="animate-screen-enter space-y-5">
            {/* Workspace Control Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 ${cardSurface}`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    setTimerRunning(false);
                    setScreen(
                      isMockActive ? "MOCK_EXAM_LOBBY" : "TOPIC_DRILL_LOBBY"
                    );
                  }}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${subtleSurface}`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>{isMockActive ? "Đổi bộ đề" : "Đổi chủ đề"}</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold">
                    {isMockActive
                      ? currentExamSet.titleVi
                      : TOPIC_METADATA.find((t) => t.id === drillSubcategory)
                          ?.titleVi}
                  </span>
                  <span className="tabular-nums rounded-md bg-blue-600/10 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                    Câu {activeIdx + 1} / {activeQuestionList.length}
                  </span>
                </div>
              </div>

              {isMockActive ? (
                <div className="flex flex-wrap items-center gap-2.5">
                  <div
                    className={`flex min-h-[38px] items-center gap-2 rounded-xl border px-3.5 py-1.5 ${subtleSurface}`}
                  >
                    <Clock className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                    <span className="tabular-nums font-mono text-sm font-bold">
                      {formatTimer(remainingSeconds)}
                    </span>
                    <button
                      onClick={() => setTimerRunning((prev) => !prev)}
                      aria-label={timerRunning ? "Tạm dừng đồng hồ" : "Tiếp tục đồng hồ"}
                      className="ml-1 rounded p-1 hover:opacity-80"
                    >
                      {timerRunning ? (
                        <Pause className="h-3.5 w-3.5" aria-hidden="true" />
                      ) : (
                        <Play className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => setShowOmrDrawer((prev) => !prev)}
                    className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${subtleSurface}`}
                  >
                    <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                    <span className="tabular-nums">
                      Danh sách câu ({liveEvaluation.answeredCount}/80)
                    </span>
                  </button>

                  {!examSubmitted ? (
                    <button
                      onClick={handleSubmitMockExam}
                      className="min-h-[38px] rounded-xl bg-[#1D4ED8] px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                    >
                      Nộp bài & Chấm điểm
                    </button>
                  ) : (
                    <div className="flex min-h-[38px] items-center gap-2 rounded-xl bg-emerald-600/15 px-3.5 py-1.5 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      <span className="tabular-nums">
                        Điểm: {liveEvaluation.achievedScore}/300 ({liveEvaluation.tierInfo.tier})
                      </span>
                      <button
                        onClick={() => {
                          setExamSubmitted(false);
                          setSelectedAnswers({});
                          setRemainingSeconds(
                            OFFICIAL_TESAT_CONSTANTS.DURATION_SECONDS
                          );
                          setTimerRunning(true);
                        }}
                        className="ml-2 flex items-center gap-1 underline"
                      >
                        <RotateCcw className="h-3 w-3" aria-hidden="true" />
                        <span>Làm lại</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  {/* Exercise Milestone Progress (5 questions auto-complete OR 1-click finish anytime with >= 1 correct!) */}
                  <div
                    className={`flex min-h-[36px] items-center gap-2.5 rounded-xl border px-3 py-1 text-xs font-bold ${subtleSurface}`}
                  >
                    <Trophy className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                    <span className="tabular-nums">
                      Phiên này: Đúng {sessionCorrectCount}/{sessionAnsweredCount} câu (Mốc tự động: {EXERCISE_MILESTONE_COUNT} câu)
                    </span>
                    <div className="hidden h-2 w-14 overflow-hidden rounded-full bg-slate-200 sm:block dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-300"
                        style={{
                          width: `${Math.min(
                            100,
                            (sessionAnsweredCount / EXERCISE_MILESTONE_COUNT) * 100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* 1-Click Finish Session & Claim Streak Button (No need to finish all questions!) */}
                  <button
                    onClick={handleFinishTopicDrillSession}
                    title="Không cần đợi làm hết bộ câu hỏi! Chỉ cần trả lời đúng ít nhất 1 câu là bạn có thể chốt phiên và nhận Chuỗi ngày học ngay."
                    className={`flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-extrabold transition ${
                      sessionCorrectCount >= 1
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm hover:opacity-95"
                        : `border ${subtleSurface}`
                    }`}
                  >
                    <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      {sessionCorrectCount >= 1
                        ? `Chốt phiên & Nhận Chuỗi (${sessionCorrectCount}/${sessionAnsweredCount} đúng)`
                        : "Chốt phiên & Tính Chuỗi (Cần ≥1 câu đúng)"}
                    </span>
                  </button>

                  {(["ALL", 3, 4, 5] as const).map((pt) => {
                    const ptCount =
                      pt === "ALL"
                        ? currentSubcategoryPool.length
                        : currentSubcategoryPool.filter((q) => q.points === pt)
                            .length;
                    return (
                      <button
                        key={String(pt)}
                        onClick={() => {
                          setDrillPointsFilter(pt);
                          setDrillIdx(0);
                        }}
                        className={`tabular-nums min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                          drillPointsFilter === pt
                            ? "bg-emerald-700 text-white"
                            : `border ${subtleSurface}`
                        }`}
                      >
                        {pt === "ALL"
                          ? `Tất cả (${ptCount})`
                          : `${pt} điểm (${ptCount})`}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => {
                      const tierCfg =
                        TARGET_TIER_ROADMAPS[
                          (currentUser?.targetTier ?? "1급") as TargetTierType
                        ] ?? TARGET_TIER_ROADMAPS["1급"];
                      setDrillPointsFilter(tierCfg.recommendedPointsFilter);
                      setOnlyChartQuestions(tierCfg.recommendedOnlyCharts);
                      setDrillIdx(0);
                    }}
                    title="Lọc nhanh bộ câu hỏi trọng tâm theo đúng cấp bậc mục tiêu bạn đã chọn"
                    className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition ${
                      drillPointsFilter ===
                      (
                        TARGET_TIER_ROADMAPS[
                          (currentUser?.targetTier ?? "1급") as TargetTierType
                        ] ?? TARGET_TIER_ROADMAPS["1급"]
                      ).recommendedPointsFilter
                        ? "border-blue-500 bg-[#1D4ED8] text-white"
                        : subtleSurface
                    }`}
                  >
                    <Target className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Ưu tiên {currentUser?.targetTier ?? "1급"} (
                      {
                        (
                          TARGET_TIER_ROADMAPS[
                            (currentUser?.targetTier ?? "1급") as TargetTierType
                          ] ?? TARGET_TIER_ROADMAPS["1급"]
                        ).recommendedPointsFilter
                      }{" "}
                      điểm)
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      setOnlyChartQuestions((prev) => !prev);
                      setDrillIdx(0);
                    }}
                    className={`tabular-nums flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                      onlyChartQuestions
                        ? "bg-indigo-600 text-white shadow-xs"
                        : `border ${subtleSurface}`
                    }`}
                  >
                    <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>
                      Biểu đồ / Bảng (
                      {
                        currentSubcategoryPool.filter(
                          (q) => q.figureImageUrl || q.visualChart || q.dataTable
                        ).length
                      }
                      )
                    </span>
                  </button>

                  <button
                    onClick={() => setShowOmrDrawer((prev) => !prev)}
                    className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${subtleSurface}`}
                  >
                    <LayoutGrid className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="tabular-nums">
                      Danh sách câu ({activeListAnsweredCount}/
                      {activeQuestionList.length})
                    </span>
                  </button>

                  {activeListAnsweredCount > 0 && (
                    <button
                      onClick={() => {
                        setSelectedAnswers({});
                        setEliminatedOptionsMap({});
                        setSessionAnsweredCount(0);
                        setSessionCorrectCount(0);
                      }}
                      title="Xóa toàn bộ đáp án đã chọn trong phiên này để làm lại từ đầu"
                      className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition hover:border-rose-500/50 hover:text-rose-500 ${subtleSurface}`}
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Làm mới đáp án</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Collapsible OMR Question Matrix */}
            {showOmrDrawer && (
              <div className={`rounded-2xl border p-5 ${cardSurface}`}>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-bold">
                    Bảng chuyển nhanh câu hỏi (Đã chọn đáp án:{" "}
                    {activeListAnsweredCount}/{activeQuestionList.length})
                  </span>
                  <button
                    onClick={() => setShowOmrDrawer(false)}
                    className={`text-xs font-semibold ${mutedText}`}
                  >
                    Đóng bảng
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activeQuestionList.map((q, idx) => {
                    const ans = selectedAnswers[q.id];
                    const isCurr = idx === activeIdx;
                    let btnStyle = subtleSurface;
                    if (ans !== undefined) {
                      btnStyle =
                        ans === q.correctIndex
                          ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300 border-emerald-600/40"
                          : "bg-rose-600/15 text-rose-800 dark:text-rose-300 border-rose-600/40";
                    }
                    return (
                      <button
                        key={q.id}
                        onClick={() => {
                          setPageTurnAnim(idx > activeIdx ? "NEXT" : "PREV");
                          if (isDrillActive) setDrillIdx(idx);
                          else setMockIdx(idx);
                          setShowOmrDrawer(false);
                        }}
                        className={`tabular-nums h-9 w-10 rounded-lg border text-xs font-semibold transition ${btnStyle} ${
                          isCurr ? "ring-2 ring-[#1D4ED8]" : ""
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2-Column Study Layout (Transforms to Angled 3D Cockpit Wings in 3D Mode) */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* LEFT PANE (7 Cols): QUESTION CARD WITH 3D BOOK PAGE-TURN ANIMATION */}
              <Interactive3DTiltWrapper
                enabled={is3DMode}
                className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-7 lg:col-span-7 ${cardSurface} ${
                  is3DMode ? "cockpit-3d-left-wing" : ""
                } ${
                  pageTurnAnim === "NEXT"
                    ? is3DMode
                      ? "animate-page-next-3d"
                      : "animate-page-next"
                    : pageTurnAnim === "PREV"
                      ? is3DMode
                        ? "animate-page-prev-3d"
                        : "animate-page-prev"
                      : ""
                }`}
              >
                <div className="space-y-6">
                  {/* Question Meta Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-4 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="tabular-nums rounded-lg bg-[#1D4ED8] px-3 py-1 text-xs font-bold text-white">
                        Câu {activeIdx + 1}
                      </span>
                      <span
                        className={`tabular-nums rounded-lg px-2.5 py-1 text-xs font-semibold ${
                          currentQuestion.points === 5
                            ? is3DMode || darkMode
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-rose-600/10 text-rose-700"
                            : currentQuestion.points === 4
                              ? is3DMode || darkMode
                                ? "bg-amber-500/20 text-amber-300"
                                : "bg-amber-600/10 text-amber-800"
                              : is3DMode || darkMode
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-emerald-600/10 text-emerald-800"
                        }`}
                      >
                        {currentQuestion.points} điểm
                      </span>
                      <span
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${subtleSurface}`}
                      >
                        {
                          TOPIC_METADATA.find(
                            (t) => t.id === currentQuestion.subcategory
                          )?.titleVi
                        }
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* 50/50 XP Power-Up Button (Spend 30 XP to eliminate 2 wrong distractor options) */}
                      <button
                        onClick={handleUse5050PowerUp}
                        disabled={
                          selectedOptForCurrent !== undefined ||
                          (eliminatedOptionsMap[currentQuestion.id]?.length ?? 0) > 0
                        }
                        title="Dùng 30 XP để hệ thống loại bỏ ngay 2 phương án nhiễu sai trong câu hỏi này"
                        className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-extrabold transition disabled:opacity-50 ${
                          (eliminatedOptionsMap[currentQuestion.id]?.length ?? 0) > 0
                            ? "border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300"
                            : subtleSurface
                        }`}
                      >
                        <Zap className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                        <span>
                          {(eliminatedOptionsMap[currentQuestion.id]?.length ?? 0) > 0
                            ? "Đã loại 2 câu sai (50/50)"
                            : "50/50 (-30 XP)"}
                        </span>
                      </button>

                      {/* Prominent Direct Button to Ask AI Help */}
                      <button
                        onClick={() => handleAskRegularAiHelp()}
                        disabled={loadingRegularAiHelp}
                        className="flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {loadingRegularAiHelp ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>Nhận trợ giúp & Mẹo AI</span>
                      </button>

                      {/* Live AI Translation Button */}
                      <button
                        onClick={() =>
                          setShowVietnameseTranslation((prev) => !prev)
                        }
                        className={`flex min-h-[36px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                          showVietnameseTranslation
                            ? is3DMode || darkMode
                              ? "border-blue-400/50 bg-blue-500/20 text-blue-300"
                              : "border-blue-600/40 bg-blue-600/10 text-blue-700"
                            : subtleSurface
                        }`}
                      >
                        {loadingTranslation ? (
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin"
                            aria-hidden="true"
                          />
                        ) : showVietnameseTranslation ? (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Languages className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>
                          {showVietnameseTranslation
                            ? "Ẩn bản dịch"
                            : "Dịch câu hỏi (AI)"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Negative Syntactic Trap Warning */}
                  {currentQuestion.negativeTrapTokens.length > 0 && (
                    <div
                      className={`inline-flex items-center gap-2 rounded-xl border border-rose-500/40 px-3.5 py-2 text-xs font-semibold ${
                        is3DMode || darkMode
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-rose-600/10 text-rose-700"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>
                        Lưu ý câu hỏi phủ định:{" "}
                        {currentQuestion.negativeTrapTokens.join(", ")}
                      </span>
                    </div>
                  )}

                  {/* Korean Question Stem + Live AI Vietnamese Translation */}
                  <div className="space-y-3">
                    <h2 className="text-lg font-semibold leading-relaxed sm:text-xl lg:text-[21px]">
                      {currentQuestion.questionKo}
                    </h2>
                    {showVietnameseTranslation && (
                      <div
                        className={`rounded-xl border p-4 text-sm leading-relaxed sm:text-[15px] ${subtleSurface}`}
                      >
                        <span
                          className={`font-bold ${
                            is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                          }`}
                        >
                          Dịch nghĩa câu hỏi:{" "}
                        </span>
                        {getQuestionTranslatedText()}
                      </div>
                    )}
                  </div>

                  {/* Optional Passage Box */}
                  {currentQuestion.passageKo && (
                    <div
                      className={`rounded-xl border p-5 text-[15.5px] leading-7 sm:text-base ${subtleSurface}`}
                    >
                      <p className="whitespace-pre-line">
                        {currentQuestion.passageKo}
                      </p>
                      {showVietnameseTranslation && (
                        <p
                          className={`mt-3 whitespace-pre-line border-t border-slate-200/70 pt-3 text-sm sm:text-[15px] dark:border-slate-800 ${mutedText}`}
                        >
                          <span
                            className={`font-semibold ${
                              is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                            }`}
                          >
                            Dịch đoạn văn / &lt;보기&gt;:{" "}
                          </span>
                          {getPassageTranslatedText()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Optional Original Book Figure / Chart Image from PDF */}
                  {currentQuestion.figureImageUrl && (
                    <figure
                      className={`overflow-hidden rounded-xl border p-4 ${subtleSurface}`}
                    >
                      <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span
                          className={`flex items-center gap-1.5 font-bold ${
                            is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                          }`}
                        >
                          <BarChart3 className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {currentQuestion.figureCaptionKo ??
                              "원본 기출 도표 · 그래프"}
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setZoomedFigure({
                              url: currentQuestion.figureImageUrl!,
                              captionKo: currentQuestion.figureCaptionKo,
                              captionVi: currentQuestion.figureCaptionVi,
                            })
                          }
                          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                            is3DMode || darkMode
                              ? "bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                              : "bg-blue-600/10 text-[#1D4ED8] hover:bg-blue-600/20"
                          }`}
                        >
                          <ZoomIn className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Phóng to biểu đồ gốc</span>
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setZoomedFigure({
                            url: currentQuestion.figureImageUrl!,
                            captionKo: currentQuestion.figureCaptionKo,
                            captionVi: currentQuestion.figureCaptionVi,
                          })
                        }
                        title="Nhấn để phóng to biểu đồ gốc"
                        className="group relative flex w-full cursor-zoom-in justify-center rounded-lg bg-white p-3 transition hover:ring-2 hover:ring-[#1D4ED8]"
                      >
                        <img
                          src={currentQuestion.figureImageUrl}
                          alt={
                            currentQuestion.figureCaptionKo ??
                            `Biểu đồ câu ${currentQuestion.examNumber}`
                          }
                          className="max-h-[420px] w-auto object-contain"
                        />
                      </button>
                      {showVietnameseTranslation &&
                        currentQuestion.figureCaptionVi && (
                          <figcaption
                            className={`mt-2.5 border-t border-slate-200/70 pt-2 text-xs leading-relaxed dark:border-slate-800 ${mutedText}`}
                          >
                            <strong
                              className={
                                is3DMode || darkMode
                                  ? "text-blue-400"
                                  : "text-[#1D4ED8]"
                              }
                            >
                              Chú thích biểu đồ:{" "}
                            </strong>
                            {currentQuestion.figureCaptionVi}
                          </figcaption>
                        )}
                    </figure>
                  )}

                  {/* Optional Visual Economic Chart / Graph (<그림 / 그래프>) */}
                  {currentQuestion.visualChart && (
                    <TesatVisualChart
                      chart={currentQuestion.visualChart}
                      showVietnamese={showVietnameseTranslation}
                    />
                  )}

                  {/* Optional BOK/KOSIS Statistical Table + Unique Question-Specific Data Chart */}
                  {currentQuestion.dataTable && (
                    <div
                      className={`overflow-x-auto rounded-xl border p-4 ${subtleSurface}`}
                    >
                      <div className="mb-2.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 font-bold">
                          <Table2 className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                          <span>{currentQuestion.dataTable.titleKo}</span>
                        </span>
                        <span className={mutedText}>
                          Đơn vị: {currentQuestion.dataTable.unit}
                        </span>
                      </div>
                      <table className="w-full border-collapse text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-slate-300 dark:border-slate-700">
                            {currentQuestion.dataTable.headers.map((h, i) => (
                              <th key={i} className="px-3 py-2 font-bold">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentQuestion.dataTable.rows.map((r, rIdx) => (
                            <tr
                              key={rIdx}
                              className="border-b border-slate-200/60 dark:border-slate-800"
                            >
                              <td className="px-3 py-2 font-semibold">
                                {r.label}
                              </td>
                              {r.values.map((v, vIdx) => (
                                <td
                                  key={vIdx}
                                  className="tabular-nums px-3 py-2 font-mono"
                                >
                                  {v}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {!currentQuestion.figureImageUrl && (
                        <TesatDataTableAutoChart
                          table={currentQuestion.dataTable}
                          showVietnamese={showVietnameseTranslation}
                        />
                      )}
                    </div>
                  )}

                  {/* 5 Multiple Choice Options (Fixed 3D Contrast & Full Live AI Vietnamese translation!) */}
                  <div className="space-y-3 pt-1">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedOptForCurrent === opt.index;
                      const isCorrect =
                        opt.index === currentQuestion.correctIndex;
                      const showFeedback = selectedOptForCurrent !== undefined;
                      const isEliminatedByXp = (
                        eliminatedOptionsMap[currentQuestion.id] ?? []
                      ).includes(opt.index);

                      let optionStyle = is3DMode
                        ? "border-blue-400/45 bg-[#0D162B] text-white shadow-[0_8px_20px_rgba(2,6,23,0.45)] hover:border-amber-400 hover:bg-[#13203D]"
                        : darkMode
                          ? "border-[#1E293B] bg-[#0F172A]/80 text-slate-100 hover:border-slate-600"
                          : "border-[#E2E0D8] bg-white text-[#0F172A] hover:border-blue-500/60 hover:bg-slate-50/50";

                      if (isEliminatedByXp && !showFeedback) {
                        optionStyle = is3DMode || darkMode
                          ? "border-slate-800 bg-slate-900/40 text-slate-500 opacity-45 cursor-not-allowed"
                          : "border-slate-200 bg-slate-100/70 text-slate-400 opacity-50 cursor-not-allowed";
                      }

                      if (showFeedback) {
                        if (isCorrect) {
                          optionStyle =
                            is3DMode || darkMode
                              ? "animate-correct-pop border-emerald-400 bg-emerald-950/90 text-emerald-100"
                              : "animate-correct-pop border-emerald-600 bg-emerald-50 text-emerald-950";
                        } else if (isSelected && !isCorrect) {
                          optionStyle =
                            is3DMode || darkMode
                              ? "animate-wrong-shake border-rose-400 bg-rose-950/90 text-rose-100"
                              : "animate-wrong-shake border-rose-600 bg-rose-50 text-rose-950";
                        }
                      }

                      return (
                        <button
                          key={opt.index}
                          disabled={isEliminatedByXp && !showFeedback}
                          onClick={() => handleSelectOption(opt.index)}
                          className={`min-h-[54px] w-full rounded-xl border px-5 py-3.5 text-left transition-all ${
                            is3DMode ? "option-3d-card" : ""
                          } ${optionStyle}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-baseline gap-2.5">
                                <span
                                  className={`text-base font-bold sm:text-lg ${
                                    is3DMode
                                      ? "text-amber-400"
                                      : darkMode
                                        ? "text-blue-400"
                                        : "text-[#1D4ED8]"
                                  }`}
                                >
                                  {opt.marker}
                                </span>
                                <span
                                  className={`text-[15.5px] font-medium leading-relaxed sm:text-base ${
                                    isEliminatedByXp && !showFeedback
                                      ? "line-through"
                                      : ""
                                  }`}
                                >
                                  {opt.textKo}
                                </span>
                              </div>

                              {showVietnameseTranslation && (
                                <p
                                  className={`pl-6 text-xs font-medium sm:text-sm ${
                                    is3DMode || darkMode
                                      ? "text-sky-300"
                                      : "text-indigo-700"
                                  }`}
                                >
                                  → {getOptionTranslatedText(idx)}
                                </p>
                              )}
                            </div>

                            {isEliminatedByXp && !showFeedback && (
                              <span className="shrink-0 rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-500">
                                Đã loại (50/50)
                              </span>
                            )}

                            {showFeedback && isCorrect && (
                              <span
                                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  is3DMode || darkMode
                                    ? "bg-emerald-500/25 text-emerald-300"
                                    : "bg-emerald-600/15 text-emerald-800"
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Đúng</span>
                              </span>
                            )}
                            {showFeedback && isSelected && !isCorrect && (
                              <span
                                className={`flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold ${
                                  is3DMode || darkMode
                                    ? "bg-rose-500/25 text-rose-300"
                                    : "bg-rose-600/15 text-rose-800"
                                }`}
                              >
                                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>Sai</span>
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Action Prompt After User Selects an Answer */}
                  {selectedOptForCurrent !== undefined && (
                    <div
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-xs ${
                        selectedOptForCurrent === currentQuestion.correctIndex
                          ? "border-emerald-600/30 bg-emerald-600/10"
                          : "border-rose-600/30 bg-rose-600/10"
                      }`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-bold">
                          {selectedOptForCurrent === currentQuestion.correctIndex
                            ? `Chính xác! Đáp án đúng là ${currentQuestion.options[currentQuestion.correctIndex].marker}.`
                            : `Bạn đã chọn ${currentQuestion.options[selectedOptForCurrent]?.marker}, đáp án đúng là ${currentQuestion.options[currentQuestion.correctIndex].marker}.`}
                        </p>
                        <p className={mutedText}>
                          Nhấn nút bên cạnh để xem Mẹo giải nhanh từ AI hoặc làm câu tương tự.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() =>
                            handleAskRegularAiHelp(
                              selectedOptForCurrent === currentQuestion.correctIndex
                                ? "Hãy chỉ cho tôi mẹo nhớ nhanh câu này và giải thích ngắn gọn bằng ngôn ngữ dễ hiểu."
                                : `Tôi đã chọn phương án ${currentQuestion.options[selectedOptForCurrent]?.marker}, hãy giải thích thật dễ hiểu vì sao tôi sai và chỉ mẹo làm nhanh ra đáp án đúng ${currentQuestion.options[currentQuestion.correctIndex].marker}.`
                            )
                          }
                          disabled={loadingRegularAiHelp}
                          className="flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
                        >
                          {loadingRegularAiHelp ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <Bot className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>AI Giải thích & Chỉ mẹo</span>
                        </button>
                        <button
                          onClick={handleGenerateTwin}
                          disabled={loadingTwin}
                          className={`flex min-h-[36px] items-center gap-1.5 rounded-lg border px-3 py-1.5 font-semibold ${subtleSurface}`}
                        >
                          <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Sinh câu tương tự</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Previous / Next Navigation Bar (Triggers Book Page-Turn Animation) */}
                <div className="mt-8 flex items-center justify-between border-t border-slate-200/70 pt-5 dark:border-slate-800">
                  <button
                    onClick={goPrevQuestion}
                    disabled={activeIdx === 0}
                    className={`flex min-h-[42px] items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-semibold transition disabled:opacity-40 ${subtleSurface}`}
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Trang trước</span>
                  </button>

                  <div className="text-center">
                    <span className={`tabular-nums block text-xs font-semibold ${mutedText}`}>
                      Trang {activeIdx + 1} / {activeQuestionList.length}
                    </span>
                    <span className="hidden text-[11px] text-slate-400 sm:block">
                      Phím tắt: Chọn đáp án [1]~[5] · Lật trang [←] [→]
                    </span>
                  </div>

                  <button
                    onClick={goNextQuestion}
                    disabled={activeIdx >= activeQuestionList.length - 1}
                    className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-5 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40"
                  >
                    <span>Lật trang tiếp</span>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </Interactive3DTiltWrapper>

              {/* RIGHT PANE (5 Cols): LIVE AI TUTOR SIDEBAR */}
              <Interactive3DTiltWrapper
                enabled={is3DMode}
                intensity={3}
                className={`flex flex-col justify-between rounded-2xl border p-4 sm:p-6 lg:col-span-5 ${cardSurface} ${
                  is3DMode ? "cockpit-3d-right-wing" : ""
                }`}
              >
                <div className="space-y-5">
                  <div className="space-y-3 border-b border-slate-200/70 pb-4 dark:border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-[#1D4ED8] dark:text-blue-400">
                          <Brain className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold">
                            Gia sư AI & Từ vựng theo câu
                          </h3>
                          <p className={`text-xs ${mutedText}`}>
                            Giải thích dễ hiểu · Mẹo 5 giây · Từ vựng câu #{activeIdx + 1}
                          </p>
                        </div>
                      </div>
                      <span className="rounded-md bg-emerald-600/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Live AI
                      </span>
                    </div>

                    {/* Segmented 3-Tab Control */}
                    <div
                      className={`grid grid-cols-3 gap-1 rounded-xl border p-1 ${subtleSurface}`}
                    >
                      <button
                        onClick={() => setAiSidebarTab("HINTS")}
                        className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                          aiSidebarTab === "HINTS"
                            ? "bg-[#1D4ED8] text-white"
                            : "hover:opacity-80"
                        }`}
                      >
                        <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Mẹo & Giải thích</span>
                      </button>
                      <button
                        onClick={() => setAiSidebarTab("VOCAB")}
                        className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                          aiSidebarTab === "VOCAB"
                            ? "bg-[#1D4ED8] text-white"
                            : "hover:opacity-80"
                        }`}
                      >
                        <BookMarked className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Từ vựng câu này</span>
                      </button>
                      <button
                        onClick={() => setAiSidebarTab("TWIN")}
                        className={`flex min-h-[36px] items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold transition ${
                          aiSidebarTab === "TWIN"
                            ? "bg-[#1D4ED8] text-white"
                            : "hover:opacity-80"
                        }`}
                      >
                        <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Câu tương tự</span>
                      </button>
                    </div>
                  </div>

                  {/* =========================================================
                      TAB 1: EASY-TO-UNDERSTAND AI HELP & 5-SECOND EXAM TRICK
                     ========================================================= */}
                  {aiSidebarTab === "HINTS" && (
                    <div className="space-y-4">
                      {/* Interactive Ask-AI Box */}
                      <div className={`space-y-2.5 rounded-xl border p-3.5 ${subtleSurface}`}>
                        <label
                          htmlFor="ask-ai-input"
                          className="block text-xs font-semibold"
                        >
                          Nhờ AI giải thích hoặc chỉ mẹo làm câu #{activeIdx + 1}:
                        </label>
                        <div className="flex gap-2">
                          <input
                            id="ask-ai-input"
                            type="text"
                            value={customTutorPrompt}
                            onChange={(e) => setCustomTutorPrompt(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleAskRegularAiHelp();
                            }}
                            placeholder="Hỏi bất kỳ điều gì về câu này..."
                            className={`min-h-[38px] flex-1 rounded-lg border px-3 py-1.5 text-xs ${cardSurface}`}
                          />
                          <button
                            onClick={() => handleAskRegularAiHelp()}
                            disabled={loadingRegularAiHelp}
                            className="flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1D4ED8] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                          >
                            {loadingRegularAiHelp ? (
                              <Loader2
                                className="h-3.5 w-3.5 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Send className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span>Hỏi AI</span>
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            onClick={() =>
                              handleAskRegularAiHelp(
                                "Hãy chỉ cho tôi MẸO LÀM NHANH câu này trong 5 giây và giải thích bằng ngôn ngữ đời thường dễ hiểu nhất."
                              )
                            }
                            disabled={loadingRegularAiHelp}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition hover:border-[#1D4ED8] ${cardSurface}`}
                          >
                            Chỉ mẹo giải nhanh 5 giây
                          </button>
                          <button
                            onClick={() =>
                              handleAskRegularAiHelp(
                                "Dịch nghĩa và giải thích ngắn gọn vì sao từng phương án ①, ②, ③, ④, ⑤ đúng hoặc sai."
                              )
                            }
                            disabled={loadingRegularAiHelp}
                            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition hover:border-[#1D4ED8] ${cardSurface}`}
                          >
                            Giải thích 5 đáp án ①~⑤
                          </button>
                        </div>
                      </div>

                      {loadingRegularAiHelp && (
                        <div
                          className={`flex items-center justify-center gap-2.5 rounded-xl border p-6 text-xs font-semibold ${subtleSurface}`}
                        >
                          <Loader2
                            className="h-4 w-4 animate-spin text-[#1D4ED8]"
                            aria-hidden="true"
                          />
                          <span>
                            Gemini AI đang đọc đề câu #{activeIdx + 1} và soạn mẹo giải dễ hiểu...
                          </span>
                        </div>
                      )}

                      {/* Live AI Tutor Help Result with Highlighted Exam Trick */}
                      {regularAiHelp && !loadingRegularAiHelp && (
                        <div
                          className={`space-y-3.5 rounded-xl border p-4 text-xs leading-relaxed ${subtleSurface}`}
                        >
                          <div className="flex items-center justify-between border-b border-slate-200/70 pb-2 dark:border-slate-800">
                            <span className="flex items-center gap-1.5 font-bold text-[#1D4ED8] dark:text-blue-400">
                              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Lời giảng dễ hiểu từ Gia sư AI</span>
                            </span>
                            <span className="rounded bg-emerald-600/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                              Chuẩn đáp án {currentQuestion.options[currentQuestion.correctIndex].marker}
                            </span>
                          </div>

                          {/* HIGHLIGHTED 5-SECOND EXAM TRICK BOX */}
                          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-amber-950 dark:text-amber-200">
                            <div className="mb-1 flex items-center gap-1.5 font-extrabold text-amber-700 dark:text-amber-300">
                              <Zap className="h-4 w-4" aria-hidden="true" />
                              <span>Mẹo làm nhanh câu này:</span>
                            </div>
                            <p className="font-medium leading-relaxed">
                              {regularAiHelp.examTrickVi}
                            </p>
                          </div>

                          <p className="font-medium">{regularAiHelp.summaryHintVi}</p>

                          <div className="space-y-1.5">
                            <div className="font-bold">Các bước suy luận đơn giản:</div>
                            <ul className="list-inside list-disc space-y-1">
                              {regularAiHelp.stepByStepReasoningVi.map(
                                (step, idx) => (
                                  <li key={idx}>{step}</li>
                                )
                              )}
                            </ul>
                          </div>

                          <div className="rounded-lg border border-slate-200/80 p-3 dark:border-slate-800">
                            <div className="mb-1 font-bold text-emerald-700 dark:text-emerald-400">
                              Soi từng phương án ①~⑤:
                            </div>
                            <p className="whitespace-pre-line">
                              {regularAiHelp.optionAnalysisVi}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 rounded-lg bg-blue-600/10 px-3 py-2 font-mono text-xs font-semibold text-blue-800 dark:text-blue-300">
                            <Sigma className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <span>{regularAiHelp.economicTakeawayVi}</span>
                          </div>
                        </div>
                      )}

                      {/* 3-Level Progressive Hints */}
                      <div className="space-y-2 pt-1">
                        <p className={`text-xs font-medium ${mutedText}`}>
                          Gợi ý từng bước (từ nhẹ đến chi tiết):
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {([1, 2, 3] as const).map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => handleRevealLiveHint(lvl)}
                              className={`min-h-[40px] rounded-xl border py-2 text-xs font-semibold transition ${
                                revealedHintLevel >= lvl
                                  ? "border-[#1D4ED8] bg-[#1D4ED8] text-white"
                                  : subtleSurface
                              }`}
                            >
                              Gợi ý Cấp {lvl}
                            </button>
                          ))}
                        </div>
                      </div>

                      {loadingDeconstruction && (
                        <div
                          className={`flex items-center justify-center gap-2 rounded-xl border p-4 text-xs ${subtleSurface}`}
                        >
                          <Loader2
                            className="h-4 w-4 animate-spin text-[#1D4ED8]"
                            aria-hidden="true"
                          />
                          <span>Đang tạo gợi ý dễ hiểu từ Gemini AI...</span>
                        </div>
                      )}

                      {!loadingDeconstruction && revealedHintLevel >= 1 && (
                        <div
                          className={`rounded-xl border p-4 text-xs leading-relaxed ${subtleSurface}`}
                        >
                          <div className="mb-1 font-bold text-rose-700 dark:text-rose-400">
                            Cấp 1 · Đọc vị từ khóa & Định hướng
                          </div>
                          <p>
                            {aiDeconstruction?.progressiveHints
                              .level1SyntacticTrapVi ??
                              currentQuestion.hintLevel1Vi}
                          </p>
                        </div>
                      )}

                      {!loadingDeconstruction && revealedHintLevel >= 2 && (
                        <div
                          className={`rounded-xl border p-4 text-xs leading-relaxed ${subtleSurface}`}
                        >
                          <div className="mb-1 font-bold text-[#1D4ED8] dark:text-blue-400">
                            Cấp 2 · Quy luật kinh tế & Mẹo khoanh nhanh
                          </div>
                          <p>
                            {aiDeconstruction?.progressiveHints
                              .level2EconomicFrameworkVi ??
                              currentQuestion.hintLevel2Vi}
                          </p>
                        </div>
                      )}

                      {!loadingDeconstruction && revealedHintLevel >= 3 && (
                        <div
                          className={`space-y-1.5 rounded-xl border p-4 text-xs leading-relaxed ${subtleSurface}`}
                        >
                          <div className="mb-1 font-bold text-emerald-700 dark:text-emerald-400">
                            Cấp 3 · Giải thích 5 lựa chọn (Đáp án đúng:{" "}
                            {currentQuestion.options[currentQuestion.correctIndex].marker})
                          </div>
                          {(
                            aiDeconstruction?.progressiveHints
                              .level3EliminationStepsVi ?? [
                              currentQuestion.hintLevel3Vi,
                            ]
                          ).map((step, i) => (
                            <p key={i}>{step}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* =========================================================
                      TAB 2: DYNAMIC PER-QUESTION VOCABULARY (Từ vựng theo từng câu)
                     ========================================================= */}
                  {aiSidebarTab === "VOCAB" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className={`text-xs font-semibold ${mutedText}`}>
                          Từ vựng kinh tế bóc tách riêng từ Câu #{activeIdx + 1}:
                        </p>
                      </div>

                      {loadingQuestionVocab && (
                        <div
                          className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold ${subtleSurface}`}
                        >
                          <Loader2
                            className="h-3.5 w-3.5 animate-spin text-[#1D4ED8]"
                            aria-hidden="true"
                          />
                          <span>
                            Gemini AI đang làm giàu thêm phân tích Hán-Hàn cho câu #{activeIdx + 1}...
                          </span>
                        </div>
                      )}

                      {(currentQuestionVocabList ??
                        scanLocalVocabInQuestion(currentQuestion)).map(
                        (item, idx) => (
                            <div
                              key={`${item.termKo}-${idx}`}
                              className={`rounded-xl border p-4 text-xs transition hover:border-[#1D4ED8] ${subtleSurface}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <span className="text-sm font-extrabold text-[#1D4ED8] dark:text-blue-400">
                                    {item.termKo}
                                  </span>
                                  <span className="ml-2 rounded bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                                    {item.hanja} · Hán-Việt: {item.hanViet}
                                  </span>
                                </div>
                                <button
                                  onClick={() => speakKorean(item.termKo)}
                                  aria-label={`Nghe phát âm từ ${item.termKo}`}
                                  className="rounded-lg bg-blue-600/10 p-2 text-[#1D4ED8] hover:bg-blue-600/20 dark:text-blue-300"
                                >
                                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                              <p className="mt-1.5 text-sm font-bold text-emerald-700 dark:text-emerald-400">
                                Nghĩa: {item.termVi}
                              </p>
                              <p className={`mt-1 leading-relaxed ${mutedText}`}>
                                {item.contextVi}
                              </p>
                            </div>
                          )
                        )}
                    </div>
                  )}

                  {/* =========================================================
                      TAB 3: LIVE AI TWIN QUESTION & AUTO GRADING/COACHING
                     ========================================================= */}
                  {aiSidebarTab === "TWIN" && (
                    <div className="space-y-4">
                      <p className={`text-xs leading-relaxed ${mutedText}`}>
                        Gemini AI sẽ sáng tạo trực tiếp một câu hỏi mới tương tự ({currentQuestion.points} điểm) dựa trên câu #{activeIdx + 1}. Khi bạn chọn đáp án, AI sẽ tự động chấm điểm và chỉ mẹo sửa sai.
                      </p>

                      <button
                        onClick={handleGenerateTwin}
                        disabled={loadingTwin}
                        className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                      >
                        {loadingTwin ? (
                          <>
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Gemini đang sáng tạo câu hỏi mới...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" aria-hidden="true" />
                            <span>
                              {twinQuestion
                                ? "Sinh một câu hỏi tương tự khác (Live AI)"
                                : "Sinh câu hỏi tương tự bằng AI (Live Gemini)"}
                            </span>
                          </>
                        )}
                      </button>

                      {twinQuestion && !loadingTwin && (
                        <div
                          className={`space-y-3.5 rounded-xl border p-4 text-xs ${subtleSurface}`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#1D4ED8] dark:text-blue-400">
                              {twinQuestion.isomorphicCode} ({twinQuestion.points}{" "}
                              điểm)
                            </span>
                            <span className="rounded bg-blue-600/10 px-2 py-0.5 text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                              Sinh bởi Gemini AI
                            </span>
                          </div>

                          <p className="text-sm font-semibold leading-relaxed">
                            {twinQuestion.questionKo}
                          </p>
                          <p className={mutedText}>{twinQuestion.questionVi}</p>

                          {twinQuestion.passageKo && (
                            <div className="rounded-lg border border-slate-300/60 p-3 dark:border-slate-700">
                              <p>{twinQuestion.passageKo}</p>
                              {twinQuestion.passageVi && (
                                <p className={`mt-1 ${mutedText}`}>
                                  {twinQuestion.passageVi}
                                </p>
                              )}
                            </div>
                          )}

                          <div className="space-y-2 pt-1">
                            {twinQuestion.options.map((tOpt) => {
                              const isPicked = twinSelectedOption === tOpt.index;
                              const isRight =
                                tOpt.index === twinQuestion.correctIndex;
                              const hasAnswered = twinSelectedOption !== null;

                              let optClass =
                                "border-slate-300/70 dark:border-slate-700 hover:border-[#1D4ED8]";
                              if (hasAnswered) {
                                if (isRight) {
                                  optClass =
                                    "border-emerald-600 bg-emerald-600/15 font-semibold";
                                } else if (isPicked && !isRight) {
                                  optClass =
                                    "border-rose-600 bg-rose-600/15";
                                }
                              }

                              return (
                                <button
                                  key={tOpt.index}
                                  onClick={() =>
                                    handleSelectTwinOption(tOpt.index)
                                  }
                                  className={`min-h-[42px] w-full rounded-xl border px-3.5 py-2.5 text-left text-xs transition ${optClass}`}
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <span className="font-bold text-[#1D4ED8] dark:text-blue-400">
                                        {tOpt.marker}
                                      </span>{" "}
                                      <span>{tOpt.textKo}</span>
                                      <p className={`mt-0.5 pl-4 ${mutedText}`}>
                                        {tOpt.textVi}
                                      </p>
                                    </div>
                                    {hasAnswered && isRight && (
                                      <CheckCircle2
                                        className="h-4 w-4 shrink-0 text-emerald-600"
                                        aria-hidden="true"
                                      />
                                    )}
                                    {hasAnswered && isPicked && !isRight && (
                                      <XCircle
                                        className="h-4 w-4 shrink-0 text-rose-600"
                                        aria-hidden="true"
                                      />
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>

                          {loadingTwinEval && (
                            <div className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3.5 text-xs font-semibold">
                              <Loader2
                                className="h-4 w-4 animate-spin text-[#1D4ED8]"
                                aria-hidden="true"
                              />
                              <span>
                                AI đang tự động chấm điểm và phân tích câu trả lời của bạn...
                              </span>
                            </div>
                          )}

                          {twinEvaluation && !loadingTwinEval && (
                            <div
                              className={`space-y-2 rounded-xl border p-4 text-xs leading-relaxed ${
                                twinEvaluation.isCorrect
                                  ? "border-emerald-600/40 bg-emerald-600/10"
                                  : "border-rose-600/40 bg-rose-600/10"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span
                                  className={`font-bold ${
                                    twinEvaluation.isCorrect
                                      ? "text-emerald-800 dark:text-emerald-300"
                                      : "text-rose-800 dark:text-rose-300"
                                  }`}
                                >
                                  {twinEvaluation.headlineVi}
                                </span>
                                <span className="tabular-nums rounded bg-white/80 px-2 py-0.5 font-bold text-slate-900">
                                  +{twinEvaluation.awardedPoints}/
                                  {twinEvaluation.maxPoints} điểm
                                </span>
                              </div>

                              <p>{twinEvaluation.detailedEvaluationVi}</p>

                              <div className="rounded-lg bg-slate-900/5 p-2.5 font-medium dark:bg-white/5">
                                <span className="font-bold text-[#1D4ED8] dark:text-blue-300">
                                  {twinEvaluation.isCorrect
                                    ? "Mẹo nhớ nhanh: "
                                    : "Gợi ý sửa sai từ AI: "}
                                </span>
                                {twinEvaluation.hintIfWrongVi}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div
                  className={`mt-6 border-t border-slate-200/70 pt-4 text-xs dark:border-slate-800 ${mutedText}`}
                >
                  Nguồn trích dẫn: <strong>{currentQuestion.source}</strong>
                </div>
              </Interactive3DTiltWrapper>
            </div>
          </div>
        )}

        {/* ===================================================================
            SCREEN 4: ACTIVE VOCABULARY & SRS FLASHCARDS
           =================================================================== */}
        {screen === "VOCAB_ACTIVE" && (
          <div className="animate-screen-enter mx-auto max-w-5xl space-y-6">
            <div
              className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-3.5 ${cardSurface} ${
                is3DMode ? "card-3d-prism" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setScreen("VOCAB_LOBBY")}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ${subtleSurface}`}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Đổi chủ đề từ vựng</span>
                </button>
                <span className="text-sm font-bold">
                  {
                    VOCAB_CATEGORIES.find((c) => c.id === vocabCategoryFilter)
                      ?.titleVi
                  }{" "}
                  ({filteredVocab.length} thuật ngữ)
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-xl border px-3 py-1.5 text-xs font-bold ${subtleSurface}`}
                >
                  Tiến độ: {flashcardsReviewedInSession}/3 thẻ (Mốc tự động)
                </span>
                <button
                  onClick={handleFinishVocabSession}
                  className={`flex min-h-[38px] items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition ${
                    flashcardsReviewedInSession >= 1
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-sm hover:opacity-95"
                      : `border ${subtleSurface}`
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>
                    {flashcardsReviewedInSession >= 1
                      ? `Chốt phiên & Nhận Chuỗi (${flashcardsReviewedInSession} thẻ)`
                      : "Chốt phiên & Tính Chuỗi (Ôn ≥1 thẻ)"}
                  </span>
                </button>
                <button
                  onClick={() => setShowFullVocabTable((prev) => !prev)}
                  className={`min-h-[38px] rounded-xl border px-3.5 py-1.5 text-xs font-semibold ${subtleSurface}`}
                >
                  {showFullVocabTable
                    ? "Ẩn bảng tra cứu"
                    : "Xem danh sách tất cả từ"}
                </button>
              </div>
            </div>

            <Interactive3DTiltWrapper
              enabled={is3DMode}
              className={`rounded-2xl border p-8 text-center ${cardSurface} ${
                is3DMode ? "card-3d-prism" : ""
              } ${
                pageTurnAnim === "NEXT"
                  ? is3DMode
                    ? "animate-page-next-3d"
                    : "animate-page-next"
                  : ""
              }`}
            >
              <div className="mb-4 flex items-center justify-between text-xs">
                <span
                  className={`tabular-nums rounded-lg px-3 py-1 font-semibold ${
                    is3DMode || darkMode
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-amber-500/10 text-amber-800"
                  }`}
                >
                  Thẻ {(activeCardIdx % Math.max(1, filteredVocab.length)) + 1}{" "}
                  / {filteredVocab.length}
                </span>
                <button
                  onClick={() => speakKorean(currentFlashcard.termKo)}
                  className="flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#1D4ED8] px-3.5 py-1.5 font-semibold text-white hover:bg-blue-700"
                >
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <span>Nghe phát âm tiếng Hàn</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setCardFlipped((prev) => !prev)}
                className={`my-4 w-full cursor-pointer rounded-2xl border p-10 text-center transition hover:border-[#1D4ED8] ${subtleSurface} ${
                  is3DMode ? "option-3d-card" : ""
                }`}
              >
                <p
                  className={`text-xs font-semibold sm:text-sm ${
                    is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                  }`}
                >
                  Chữ Hán: {currentFlashcard.hanja} · Âm Hán-Việt:{" "}
                  {currentFlashcard.hanViet}
                </p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  {currentFlashcard.termKo}
                </h2>
                <p className={`mt-2 text-sm font-medium ${mutedText}`}>
                  {currentFlashcard.termEn}
                </p>

                {cardFlipped ? (
                  <div className="animate-flashcard-reveal mt-6 space-y-3 border-t border-slate-200 pt-6 text-left dark:border-slate-800">
                    <div
                      className={`text-lg font-bold ${
                        is3DMode || darkMode
                          ? "text-emerald-400"
                          : "text-emerald-700"
                      }`}
                    >
                      Nghĩa tiếng Việt: {currentFlashcard.termVi}
                    </div>
                    <p className="text-sm leading-relaxed sm:text-base">
                      {currentFlashcard.definitionVi}
                    </p>
                    <div
                      className={`rounded-xl p-3.5 text-xs font-medium sm:text-sm ${
                        is3DMode || darkMode
                          ? "bg-amber-500/20 text-amber-200"
                          : "bg-amber-500/10 text-amber-900"
                      }`}
                    >
                      Mẹo ghi nhớ Hán-Hàn: {currentFlashcard.mnemonicVi}
                    </div>
                    <p className={`text-xs sm:text-sm ${mutedText}`}>
                      Ví dụ: {currentFlashcard.exampleKo} —{" "}
                      {currentFlashcard.exampleVi}
                    </p>
                  </div>
                ) : (
                  <div
                    className={`mt-8 inline-flex items-center gap-1.5 text-xs font-semibold sm:text-sm ${
                      is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                    }`}
                  >
                    <MousePointerClick className="h-4 w-4" aria-hidden="true" />
                    <span>Nhấn vào thẻ để lật xem giải nghĩa và ví dụ</span>
                  </div>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <button
                  onClick={() => handleRateFlashcard(1)}
                  className={`min-h-[42px] rounded-xl border border-rose-500/40 py-2.5 text-xs font-semibold ${
                    is3DMode || darkMode
                      ? "bg-rose-500/20 text-rose-300"
                      : "bg-rose-600/10 text-rose-700"
                  }`}
                >
                  Chưa nhớ (Ôn sau 1 ngày)
                </button>
                <button
                  onClick={() => handleRateFlashcard(3)}
                  className={`min-h-[42px] rounded-xl border border-amber-500/40 py-2.5 text-xs font-semibold ${
                    is3DMode || darkMode
                      ? "bg-amber-500/20 text-amber-300"
                      : "bg-amber-600/10 text-amber-800"
                  }`}
                >
                  Tạm nhớ (3 ngày)
                </button>
                <button
                  onClick={() => handleRateFlashcard(4)}
                  className={`min-h-[42px] rounded-xl border border-sky-500/40 py-2.5 text-xs font-semibold ${
                    is3DMode || darkMode
                      ? "bg-sky-500/20 text-sky-300"
                      : "bg-sky-600/10 text-sky-800"
                  }`}
                >
                  Nhớ tốt (6 ngày)
                </button>
                <button
                  onClick={() => handleRateFlashcard(5)}
                  className={`min-h-[42px] rounded-xl border border-emerald-500/40 py-2.5 text-xs font-semibold ${
                    is3DMode || darkMode
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-emerald-600/10 text-emerald-800"
                  }`}
                >
                  Đã thuộc (15+ ngày)
                </button>
              </div>
            </Interactive3DTiltWrapper>

            {showFullVocabTable && (
              <div
                className={`rounded-2xl border p-6 ${cardSurface} ${
                  is3DMode ? "card-3d-prism" : ""
                }`}
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold">
                    Bảng tra cứu từ vựng trong chủ đề
                  </h3>
                  <input
                    type="text"
                    value={vocabSearch}
                    onChange={(e) => setVocabSearch(e.target.value)}
                    aria-label="Tìm kiếm từ vựng"
                    placeholder="Tìm từ tiếng Hàn hoặc Việt..."
                    className={`min-h-[36px] rounded-xl border px-3 py-1.5 text-xs ${subtleSurface}`}
                  />
                </div>
                <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {filteredVocab.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs sm:text-sm"
                    >
                      <div>
                        <span className="text-sm font-bold sm:text-base">
                          {item.termKo}
                        </span>
                        <span
                          className={`ml-2 font-semibold ${
                            is3DMode || darkMode
                              ? "text-blue-400"
                              : "text-[#1D4ED8]"
                          }`}
                        >
                          ({item.hanja} · {item.hanViet})
                        </span>
                        <span
                          className={`ml-2 font-semibold ${
                            is3DMode || darkMode
                              ? "text-emerald-400"
                              : "text-emerald-700"
                          }`}
                        >
                          — {item.termVi}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setActiveCardIdx(idx);
                          setCardFlipped(true);
                          speakKorean(item.termKo);
                        }}
                        className={`flex min-h-[34px] items-center gap-1.5 rounded-lg px-3 py-1 font-semibold ${
                          is3DMode || darkMode
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-blue-600/10 text-[#1D4ED8]"
                        }`}
                      >
                        <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Phát âm & Xem thẻ</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===================================================================
            SCREEN 5: ERROR LOG & SCORE ANALYTICS
           =================================================================== */}
        {screen === "ERROR_ANALYTICS" && (
          <div className="animate-screen-enter space-y-6">
            <div className="max-w-3xl space-y-2">
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                Chế độ Sổ tay câu sai (오답노트) & Phân tích mục tiêu
              </p>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Ôn tập câu sai & Mô phỏng cấp bậc TESAT
              </h1>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <Interactive3DTiltWrapper
                enabled={is3DMode}
                className={`rounded-2xl border p-5 sm:p-7 lg:col-span-7 ${cardSurface} ${
                  is3DMode ? "cockpit-3d-left-wing" : ""
                }`}
              >
                <h2 className="mb-4 text-base font-bold">
                  Danh sách câu sai cần ôn lại (Chu kỳ 1 · 3 · 7 ngày)
                </h2>
                {Object.values(errorLog).length === 0 ? (
                  <div
                    className={`rounded-xl border border-dashed p-8 text-center text-xs ${mutedText}`}
                  >
                    Bạn chưa có câu trả lời sai nào trong sổ tay. Khi bạn làm sai câu hỏi ở chế độ Thi thử hoặc Luyện chủ đề, câu hỏi đó sẽ tự động được lưu vào đây!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.values(errorLog).map((rec) => {
                      const q =
                        ALL_TESAT_QUESTIONS_POOL.find(
                          (item) => item.id === rec.questionId
                        ) ?? ALL_TESAT_QUESTIONS_POOL[0];
                      return (
                        <div
                          key={rec.questionId}
                          className={`rounded-xl border p-4 text-xs ${subtleSurface}`}
                        >
                          <div className="mb-2 flex items-center justify-between">
                            <span className="font-bold text-[#1D4ED8] dark:text-blue-400">
                              {q.code} · {q.points} điểm
                            </span>
                            <span
                              className={`rounded-lg px-2.5 py-0.5 font-semibold ${
                                rec.resolved
                                  ? "bg-emerald-600/15 text-emerald-800 dark:text-emerald-300"
                                  : "bg-rose-600/15 text-rose-800 dark:text-rose-300"
                              }`}
                            >
                              {rec.resolved
                                ? "Đã hoàn thành"
                                : `Chu kỳ ôn: ${rec.intervalDays} ngày`}
                            </span>
                          </div>
                          <p className="font-semibold leading-relaxed">
                            {q.questionKo}
                          </p>
                          <p className={`mt-1.5 leading-relaxed ${mutedText}`}>
                            {isUntranslatedPlaceholder(q.hintLevel2Vi)
                              ? q.hintLevel1Vi
                              : q.hintLevel2Vi}
                          </p>
                          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                              Đáp án đúng: {q.options[q.correctIndex].marker}{" "}
                              {q.options[q.correctIndex].textKo}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  const subPool =
                                    ALL_TESAT_QUESTIONS_POOL.filter(
                                      (item) =>
                                        item.subcategory === q.subcategory
                                    );
                                  const foundIdx = subPool.findIndex(
                                    (item) => item.id === q.id
                                  );
                                  setDrillSubcategory(q.subcategory);
                                  setDrillPointsFilter("ALL");
                                  setOnlyChartQuestions(false);
                                  setDrillSearchQuery("");
                                  setDrillIdx(Math.max(0, foundIdx));
                                  resetQuestionAiStates();
                                  setShowOmrDrawer(false);
                                  setScreen("TOPIC_DRILL_ACTIVE");
                                }}
                                className="flex min-h-[36px] items-center gap-1 rounded-lg bg-[#1D4ED8] px-3 py-1.5 font-semibold text-white hover:bg-blue-700"
                              >
                                <RotateCcw
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Làm lại câu này</span>
                              </button>
                              <button
                                onClick={() => {
                                  const updated = scheduleIncorrectNoteReview(
                                    rec,
                                    {
                                      questionId: q.id,
                                      questionCode: q.code,
                                      selectedIndex: q.correctIndex,
                                      isCorrectOnReview: true,
                                    }
                                  );
                                  setErrorLog((prev) => ({
                                    ...prev,
                                    [q.id]: updated,
                                  }));
                                }}
                                className="flex min-h-[36px] items-center gap-1 rounded-lg bg-emerald-700 px-3 py-1.5 font-semibold text-white hover:bg-emerald-600"
                              >
                                <Check
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                />
                                <span>Đánh dấu đã ôn</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Interactive3DTiltWrapper>

              <Interactive3DTiltWrapper
                enabled={is3DMode}
                intensity={3}
                className={`rounded-2xl border p-5 sm:p-7 lg:col-span-5 ${cardSurface} ${
                  is3DMode ? "cockpit-3d-right-wing" : ""
                }`}
              >
                <h2 className="mb-4 text-base font-bold">
                  Mô phỏng điểm mục tiêu (Thang 300 điểm)
                </h2>
                <div className="space-y-4 text-xs sm:text-sm">
                  <div>
                    <span className="mb-1.5 block font-semibold">
                      Chọn cấp bậc mục tiêu của bạn:
                    </span>
                    <div className="grid grid-cols-4 gap-2">
                      {(["S급", "1급", "2급", "3급"] as const).map((tier) => (
                        <button
                          key={tier}
                          onClick={() =>
                            setGoalInput((prev) => ({
                              ...prev,
                              targetTier: tier,
                            }))
                          }
                          className={`min-h-[36px] rounded-lg border font-bold transition ${
                            goalInput.targetTier === tier
                              ? "border-[#1D4ED8] bg-[#1D4ED8] text-white"
                              : subtleSurface
                          }`}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="sim-theory"
                      className="mb-1 flex justify-between font-semibold"
                    >
                      <span>Phần 1 · Lý thuyết kinh tế (Tối đa 100đ)</span>
                      <span className="tabular-nums">
                        {goalInput.predictedTheoryScore} điểm
                      </span>
                    </label>
                    <input
                      id="sim-theory"
                      type="range"
                      min={0}
                      max={100}
                      value={goalInput.predictedTheoryScore}
                      onChange={(e) =>
                        setGoalInput((prev) => ({
                          ...prev,
                          predictedTheoryScore: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sim-affairs"
                      className="mb-1 flex justify-between font-semibold"
                    >
                      <span>Phần 2 · Thời sự & Quản trị (Tối đa 100đ)</span>
                      <span className="tabular-nums">
                        {goalInput.predictedAffairsScore} điểm
                      </span>
                    </label>
                    <input
                      id="sim-affairs"
                      type="range"
                      min={0}
                      max={100}
                      value={goalInput.predictedAffairsScore}
                      onChange={(e) =>
                        setGoalInput((prev) => ({
                          ...prev,
                          predictedAffairsScore: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#1D4ED8]"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="sim-applied"
                      className="mb-1 flex justify-between font-semibold"
                    >
                      <span>Phần 3 · Ứng dụng 5 điểm (Tối đa 100đ)</span>
                      <span className="tabular-nums">
                        {goalInput.predictedAppliedScore} điểm
                      </span>
                    </label>
                    <input
                      id="sim-applied"
                      type="range"
                      min={0}
                      max={100}
                      value={goalInput.predictedAppliedScore}
                      onChange={(e) =>
                        setGoalInput((prev) => ({
                          ...prev,
                          predictedAppliedScore: Number(e.target.value),
                        }))
                      }
                      className="w-full accent-[#1D4ED8]"
                    />
                  </div>

                  <div className={`rounded-xl border p-4 ${subtleSurface}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Tổng điểm dự kiến:</span>
                      <span
                        className={`tabular-nums text-xl font-bold ${
                          is3DMode || darkMode ? "text-blue-400" : "text-[#1D4ED8]"
                        }`}
                      >
                        {tesatGoalPlan.totalPredictedScore} / 300 điểm
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold">Cấp bậc đạt được:</span>
                      <span
                        className={`rounded-lg px-2.5 py-1 font-bold ${
                          is3DMode || darkMode
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-emerald-600/15 text-emerald-800"
                        }`}
                      >
                        {tesatGoalPlan.achievedTier} (Mục tiêu:{" "}
                        {goalInput.targetTier} · {tesatGoalPlan.targetMinScore}đ)
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="font-semibold">
                        Tín chỉ đại học Hàn Quốc (학점은행제):
                      </span>
                      <span className="tabular-nums font-bold">
                        {tesatGoalPlan.academicCreditsEarned} tín chỉ
                      </span>
                    </div>
                    <p className={`mt-3 leading-relaxed ${mutedText}`}>
                      {tesatGoalPlan.studyStrategyVi}
                    </p>
                  </div>
                </div>
              </Interactive3DTiltWrapper>
            </div>
          </div>
        )}
      </main>

      {/* =====================================================================
          RESPONSIVE MOBILE BOTTOM DOCK (Thumb-Friendly Navigation for Smartphones)
         ===================================================================== */}
      <nav
        aria-label="Thanh điều hướng nhanh trên điện thoại"
        className={`fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t px-1.5 py-1.5 sm:hidden ${
          is3DMode
            ? "border-blue-500/40 bg-[#050914]/95 text-white shadow-[0_-10px_30px_rgba(29,78,216,0.35)]"
            : darkMode
              ? "border-[#1E293B] bg-[#0B0F17]/95 text-white"
              : "border-[#E2E0D8] bg-white/95 text-[#0F172A] shadow-lg"
        }`}
      >
        <button
          type="button"
          onClick={() => {
            setTimerRunning(false);
            setScreen("HOME_HUB");
          }}
          className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition ${
            screen === "HOME_HUB"
              ? "bg-blue-600/15 text-[#1D4ED8] dark:text-blue-300"
              : mutedText
          }`}
        >
          <Home className="h-4 w-4" aria-hidden="true" />
          <span>Trang chủ</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimerRunning(false);
            setScreen("MOCK_EXAM_LOBBY");
          }}
          className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition ${
            screen === "MOCK_EXAM_LOBBY" || screen === "MOCK_EXAM_ACTIVE"
              ? "bg-blue-600/15 text-[#1D4ED8] dark:text-blue-300"
              : mutedText
          }`}
        >
          <Clock className="h-4 w-4" aria-hidden="true" />
          <span>Thi 80 câu</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimerRunning(false);
            setScreen("TOPIC_DRILL_LOBBY");
          }}
          className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition ${
            screen === "TOPIC_DRILL_LOBBY" || screen === "TOPIC_DRILL_ACTIVE"
              ? "bg-emerald-600/15 text-emerald-600 dark:text-emerald-300"
              : mutedText
          }`}
        >
          <Target className="h-4 w-4" aria-hidden="true" />
          <span>Chuyên đề</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setTimerRunning(false);
            setScreen("VOCAB_LOBBY");
          }}
          className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition ${
            screen === "VOCAB_LOBBY" || screen === "VOCAB_ACTIVE"
              ? "bg-amber-500/15 text-amber-600 dark:text-amber-300"
              : mutedText
          }`}
        >
          <BookOpen className="h-4 w-4" aria-hidden="true" />
          <span>Từ vựng</span>
        </button>

        <button
          type="button"
          onClick={() => setIs3DMode((prev) => !prev)}
          className={`flex min-h-[46px] flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-extrabold transition ${
            is3DMode
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "bg-blue-600/15 text-[#1D4ED8] dark:text-blue-300"
          }`}
        >
          <Orbit
            className={`h-4 w-4 ${is3DMode ? "animate-spin" : ""}`}
            aria-hidden="true"
          />
          <span>{is3DMode ? "Về 2D" : "Bật 3D ✨"}</span>
        </button>
      </nav>
    </div>
  );
}
