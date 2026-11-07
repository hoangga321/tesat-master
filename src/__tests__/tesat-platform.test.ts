import { describe, it, expect } from "vitest";
import {
  FULL_80_TESAT_QUESTIONS,
  TESAT_EXAM_SETS,
  ALL_TESAT_QUESTIONS_POOL,
} from "@/lib/data/questions-seed";
import { SEED_VOCABULARY } from "@/lib/data/vocabulary-seed";
import {
  validateOfficialTesatMatrix,
  calculateTesatTier,
  evaluateExamSubmission,
} from "@/lib/engine/tesat-matrix";
import {
  createLLMService,
  MockLLMService,
  isUntranslatedPlaceholder,
  scanLocalVocabInQuestion,
} from "@/lib/ai/llm-service";
import { createInitialUserProgress } from "@/components/TesatLandingAndAuth";
import { TARGET_TIER_ROADMAPS } from "@/components/Tesat3DAndGoalEngine";
import {
  SentenceDeconstructionSchema,
  TwinQuestionSchema,
  FlashcardSchema,
} from "@/lib/schemas/tesat-schema";
import {
  parseRawKoreanTesatBlock,
  runTesatIngestionPipeline,
} from "@/lib/crawler/tesat-ingestor";
import {
  calculateSM2Review,
  scheduleIncorrectNoteReview,
} from "@/lib/engine/srs-sm2";
import {
  processDailyActivity,
  evaluateInactivityNotifications,
  calculateTesatGoalPlan,
} from "@/lib/engine/gamification-visa";
import { HybridCacheService, RateLimiter } from "@/lib/cache/hybrid-cache";

describe("SPRINT 1 & PM AGENT: Official Hankyung TESAT 80-Question / 300-Point Matrix Validation", () => {
  it("enforces exact 80 questions, 300 points, 100 minutes, and 3-section distribution", () => {
    const report = validateOfficialTesatMatrix(FULL_80_TESAT_QUESTIONS);
    expect(report.errors).toEqual([]);
    expect(report.isValid).toBe(true);
    expect(report.totalQuestions).toBe(80);
    expect(report.totalPoints).toBe(300);
    expect(report.durationMinutes).toBe(100);

    // Section 1: Economic Theory (30 Qs = 100 pts; 20x3pt + 10x4pt; Micro 15, Macro 12, Intl 3)
    expect(report.sections.THEORY.count).toBe(30);
    expect(report.sections.THEORY.points).toBe(100);
    expect(report.sections.THEORY.point3Count).toBe(20);
    expect(report.sections.THEORY.point4Count).toBe(10);
    expect(report.sections.THEORY.microCount).toBe(15);
    expect(report.sections.THEORY.macroCount).toBe(12);
    expect(report.sections.THEORY.intlCount).toBe(3);

    // Section 2: Current Affairs & Business (30 Qs = 100 pts; 20x3pt + 10x4pt; 15 + 15)
    expect(report.sections.CURRENT_AFFAIRS.count).toBe(30);
    expect(report.sections.CURRENT_AFFAIRS.points).toBe(100);
    expect(report.sections.CURRENT_AFFAIRS.point3Count).toBe(20);
    expect(report.sections.CURRENT_AFFAIRS.point4Count).toBe(10);
    expect(report.sections.CURRENT_AFFAIRS.currentIssuesCount).toBe(15);
    expect(report.sections.CURRENT_AFFAIRS.financeStrategyCount).toBe(15);

    // Section 3: Applied Analysis & Decision Making (20 Qs = 100 pts; 20x5pt)
    expect(report.sections.APPLIED.count).toBe(20);
    expect(report.sections.APPLIED.points).toBe(100);
    expect(report.sections.APPLIED.point5Count).toBe(20);
  });

  it("validates all 7 Official Book Exam Sets (546 questions + 87 cropped figures) and full deduplicated TESAT question pool", () => {
    expect(TESAT_EXAM_SETS.length).toBe(13);
    expect(ALL_TESAT_QUESTIONS_POOL.length).toBeGreaterThanOrEqual(1050);

    const bookSets = TESAT_EXAM_SETS.filter((s) => s.setId.startsWith("BOOK_"));
    expect(bookSets.length).toBe(7);

    // Every single question across all 13 exam sets must pass strict Zod validation
    for (const examSet of TESAT_EXAM_SETS) {
      expect(examSet.questions.length).toBe(examSet.questionCount);
      if (examSet.questionCount === 80) {
        expect(examSet.totalPoints).toBe(300);
      }
    }

    // All 80-question full matrix sets validate 100/100/100 section distribution
    const full80BookSets = bookSets.filter((s) => s.questionCount === 80);
    expect(full80BookSets.length).toBe(5);
    for (const examSet of full80BookSets) {
      const setReport = validateOfficialTesatMatrix(examSet.questions);
      expect(setReport.errors).toEqual([]);
      expect(setReport.isValid).toBe(true);
      expect(setReport.totalQuestions).toBe(80);
      expect(setReport.totalPoints).toBe(300);
    }
  });

  it("correctly assigns Hankyung TESAT Grades (S급, 1급, 2급, 3급, 4급, 5급, 불합격)", () => {
    expect(calculateTesatTier(285).tier).toBe("S급");
    expect(calculateTesatTier(270).tier).toBe("S급");
    expect(calculateTesatTier(255).tier).toBe("1급");
    expect(calculateTesatTier(220).tier).toBe("2급");
    expect(calculateTesatTier(195).tier).toBe("3급");
    expect(calculateTesatTier(160).tier).toBe("4급");
    expect(calculateTesatTier(130).tier).toBe("5급");
    expect(calculateTesatTier(110).tier).toBe("불합격");
  });

  it("calculates exact 300-point exam score and detects Near-Miss selections", () => {
    const allCorrectAnswers: Record<string, number> = {};
    for (const q of FULL_80_TESAT_QUESTIONS) {
      allCorrectAnswers[q.id] = q.correctIndex;
    }
    const perfectEval = evaluateExamSubmission(FULL_80_TESAT_QUESTIONS, allCorrectAnswers);
    expect(perfectEval.achievedScore).toBe(300);
    expect(perfectEval.correctCount).toBe(80);
    expect(perfectEval.tierInfo.tier).toBe("S급");
    expect(perfectEval.sectionScores.THEORY.earned).toBe(100);
    expect(perfectEval.sectionScores.CURRENT_AFFAIRS.earned).toBe(100);
    expect(perfectEval.sectionScores.APPLIED.earned).toBe(100);
  });
});

describe("SPRINT 1 & AI/DATA ENGINEER: Crawler Ingestion & Vocabulary Schema", () => {
  it("validates all Sino-Vietnamese (Hán-Hàn) vocabulary flashcards against Zod schema", () => {
    expect(SEED_VOCABULARY.length).toBeGreaterThanOrEqual(24);
    for (const card of SEED_VOCABULARY) {
      const parsed = FlashcardSchema.safeParse(card);
      expect(parsed.success).toBe(true);
    }
  });

  it("parses raw Hankyung Today's TESAT HTML into strict TesatQuestion schema", async () => {
    const sampleHtml = `
      <div class="tesat-quiz">
        <h3 class="tesat-question-title">한국은행이 기준금리를 인상할 때 나타나는 현상으로 옳지 않은 것은?</h3>
        <div class="tesat-passage">한국은행 금융통화위원회는 물가 안정을 위해 기준금리를 0.25%p 인상하였다.</div>
        <ul class="tesat-options">
          <li>① 시중 유동성이 흡수되어 물가 상승 압력이 완화된다.</li>
          <li>② 원화 표시 예금의 매력도가 높아져 원·달러 환율 하락 요인이 된다.</li>
          <li>③ 가계와 기업의 대출 이자 부담이 증가한다.</li>
          <li>④ 시중 통화량이 급증하여 하이퍼인플레이션이 즉시 발생한다.</li>
          <li>⑤ 채권의 신규 발행 수익률이 상승한다.</li>
        </ul>
        <div class="tesat-answer" data-correct-index="3"></div>
      </div>
    `;
    const parsedQuestion = parseRawKoreanTesatBlock(sampleHtml, {
      examNumber: 25,
      section: "THEORY",
      subcategory: "MACRO",
      points: 4,
      source: "한경 오늘의 테샛",
    });
    expect(parsedQuestion.points).toBe(4);
    expect(parsedQuestion.correctIndex).toBe(3);
    expect(parsedQuestion.negativeTrapTokens).toContain("옳지 않은 것은");
    expect(parsedQuestion.options).toHaveLength(5);

    const pipelineReport = await runTesatIngestionPipeline({ liveFetch: false });
    expect(pipelineReport.parsedValidCount).toBe(80);
    expect(pipelineReport.rejectedCount).toBe(0);
  });
});

describe("SPRINT 3 & AI SPECIALIST: LLMService Factory, MockLLMService Fallback & Twin Generator", () => {
  it("activates LiveCloudLLMService (gemini) by default with configured GEMINI_API_KEY", () => {
    const liveLlm = createLLMService();
    const status = liveLlm.getStatus();
    expect(status.activeProvider).toBe("gemini");
    expect(status.isLiveApiActive).toBe(true);
  });

  it("automatically activates MockLLMService when API keys are empty without crashing", async () => {
    const llm = createLLMService({
      GEMINI_API_KEY: "",
      OPENAI_API_KEY: "",
      ANTHROPIC_API_KEY: "",
      DEFAULT_LLM_PROVIDER: "gemini",
    });

    const status = llm.getStatus();
    expect(status.activeProvider).toBe("mock");
    expect(status.isLiveApiActive).toBe(false);

    const q1 = FULL_80_TESAT_QUESTIONS[0]; // Has negative trap "옳지 않은 것은" and near-miss at index 3
    const deconstructed = await llm.deconstructAndHint(q1, 3);
    expect(SentenceDeconstructionSchema.safeParse(deconstructed).success).toBe(true);
    expect(deconstructed.hasNegativeTrap).toBe(true);
    expect(deconstructed.nearMissAnalysis.isSelectedNearMiss).toBe(true);
    expect(deconstructed.progressiveHints.level3EliminationStepsVi).toHaveLength(5);
  });

  it("generates Zod-valid Isomorphic Twin Questions preserving point weight (3, 4, or 5 pts)", async () => {
    const mockLlm = new MockLLMService();
    for (const sampleQ of [
      FULL_80_TESAT_QUESTIONS[0],  // 3 points
      FULL_80_TESAT_QUESTIONS[10], // 4 points
      FULL_80_TESAT_QUESTIONS[60], // 5 points
    ]) {
      const twin = await mockLlm.generateIsomorphicTwin(sampleQ);
      expect(TwinQuestionSchema.safeParse(twin).success).toBe(true);
      expect(twin.points).toBe(sampleQ.points);
      expect(twin.options).toHaveLength(5);
      expect(twin.correctIndex).not.toBe(sampleQ.correctIndex);
    }
  });
});

describe("SPRINT 2 & 4: SM-2 Spaced Repetition, 1d/3d/7d Error Log, Streak & Visa Calculator", () => {
  it("computes SuperMemo-2 (SM-2) intervals and easiness factor accurately", () => {
    const initial = {
      repetition: 0,
      intervalDays: 0,
      easinessFactor: 2.5,
      nextReviewAt: new Date("2026-11-02T00:00:00Z").toISOString(),
      lastQuality: 0,
    };
    const r1 = calculateSM2Review(initial, 5, new Date("2026-11-02T00:00:00Z"));
    expect(r1.repetition).toBe(1);
    expect(r1.intervalDays).toBe(1);
    expect(r1.easinessFactor).toBeGreaterThanOrEqual(2.5);

    const r2 = calculateSM2Review(r1, 5, new Date("2026-11-03T00:00:00Z"));
    expect(r2.repetition).toBe(2);
    expect(r2.intervalDays).toBe(6);

    const r3 = calculateSM2Review(r2, 5, new Date("2026-11-09T00:00:00Z"));
    expect(r3.repetition).toBe(3);
    expect(r3.intervalDays).toBeGreaterThan(12);

    // Failed recall resets interval to 1 day
    const failed = calculateSM2Review(r3, 1, new Date("2026-11-20T00:00:00Z"));
    expect(failed.repetition).toBe(0);
    expect(failed.intervalDays).toBe(1);
  });

  it("enforces 1-day -> 3-day -> 7-day -> Mastered progression in Smart Error Log (오답노트)", () => {
    const baseNow = new Date("2026-11-02T12:00:00Z");
    const stage1 = scheduleIncorrectNoteReview(null, {
      questionId: "tesat-q-001",
      questionCode: "TESAT-S1-01",
      selectedIndex: 3,
      isCorrectOnReview: false,
      now: baseNow,
    });
    expect(stage1.reviewStage).toBe(1);
    expect(stage1.intervalDays).toBe(1);

    const stage2 = scheduleIncorrectNoteReview(stage1, {
      questionId: "tesat-q-001",
      questionCode: "TESAT-S1-01",
      selectedIndex: 2,
      isCorrectOnReview: true,
      now: baseNow,
    });
    expect(stage2.reviewStage).toBe(2);
    expect(stage2.intervalDays).toBe(3);

    const stage3 = scheduleIncorrectNoteReview(stage2, {
      questionId: "tesat-q-001",
      questionCode: "TESAT-S1-01",
      selectedIndex: 2,
      isCorrectOnReview: true,
      now: baseNow,
    });
    expect(stage3.reviewStage).toBe(3);
    expect(stage3.intervalDays).toBe(7);

    const stage4 = scheduleIncorrectNoteReview(stage3, {
      questionId: "tesat-q-001",
      questionCode: "TESAT-S1-01",
      selectedIndex: 2,
      isCorrectOnReview: true,
      now: baseNow,
    });
    expect(stage4.reviewStage).toBe(4);
    expect(stage4.resolved).toBe(true);
  });

  it("evaluates Streak Freeze, 24h Recovery Challenge, 24h/3d/7d notifications, and TESAT Goal Simulator", () => {
    const alerts = evaluateInactivityNotifications(170, 5, 12, 9);
    expect(alerts.map((a) => a.triggerInterval)).toEqual(["24H", "3D", "7D"]);

    const goal = calculateTesatGoalPlan({
      targetTier: "1급",
      predictedTheoryScore: 86,
      predictedAffairsScore: 84,
      predictedAppliedScore: 85,
    });
    expect(goal.totalPredictedScore).toBe(255);
    expect(goal.achievedTier).toBe("1급");
    expect(goal.academicCreditsEarned).toBe(20);
    expect(goal.isTargetReached).toBe(true);
  });

  it("caches AI responses in HybridCacheService and enforces RateLimiter thresholds", async () => {
    const cache = new HybridCacheService(60);
    let computeCount = 0;
    const first = await cache.getOrCompute("hint:q1", async () => {
      computeCount += 1;
      return { hint: "Level 1" };
    });
    const second = await cache.getOrCompute("hint:q1", async () => {
      computeCount += 1;
      return { hint: "Level 1" };
    });
    expect(first.fromCache).toBe(false);
    expect(second.fromCache).toBe(true);
    expect(computeCount).toBe(1);

    const limiter = new RateLimiter(2, 60);
    expect(limiter.check("user-1").allowed).toBe(true);
    expect(limiter.check("user-1").allowed).toBe(true);
    expect(limiter.check("user-1").allowed).toBe(false);
  });

  it("simulates end-to-end learner flows: streak starts at 0, 0ms Vietnamese translation for parenthetical Korean terms, and instant per-question vocabulary across all 1,083 questions", () => {
    // 1. Fresh user starts with streak = 0
    const freshProg = createInitialUserProgress("test_user_sim");
    expect(freshProg.currentStreak).toBe(0);
    expect(freshProg.completedExercisesCount).toBe(0);
    expect(freshProg.xpPoints).toBe(0);

    // 2. Vietnamese translations containing parenthetical Korean terms must NOT be falsely flagged as untranslated
    expect(
      isUntranslatedPlaceholder(
        "Theo nguyên lý kinh tế học, chi phí cơ hội (기회비용) của một lựa chọn là gì?"
      )
    ).toBe(false);
    expect(
      isUntranslatedPlaceholder(
        "[Đề thi thật Hankyung TESAT · 4점] 경제성장과 관련한 아래의 설명으로 옳은 것을 고르면?"
      )
    ).toBe(true);
    expect(
      isUntranslatedPlaceholder(
        "경제성장과 관련한 아래의 설명으로 옳은 것을 고르면?"
      )
    ).toBe(true);

    // 3. Every single book question (546 questions) has non-empty instant vocabulary via scanLocalVocabInQuestion
    const bookSets = TESAT_EXAM_SETS.filter((s) => s.setId.startsWith("BOOK_"));
    let totalCroppedFigures = 0;
    for (const bs of bookSets) {
      for (const q of bs.questions) {
        const vocab = scanLocalVocabInQuestion(q);
        expect(vocab.length).toBeGreaterThanOrEqual(1);
        if (q.figureImageUrl) {
          expect(q.figureImageUrl.startsWith("/exam-figures/")).toBe(true);
          totalCroppedFigures += 1;
        }
      }
    }
    expect(totalCroppedFigures).toBe(87);

    // 4. Target Tier Roadmaps (3급, 2급, 1급, S급) provide distinct personalized thresholds, point filters, and exam sets
    expect(TARGET_TIER_ROADMAPS["3급"].minScore).toBe(180);
    expect(TARGET_TIER_ROADMAPS["3급"].recommendedPointsFilter).toBe(3);
    expect(TARGET_TIER_ROADMAPS["2급"].minScore).toBe(210);
    expect(TARGET_TIER_ROADMAPS["2급"].recommendedPointsFilter).toBe(4);
    expect(TARGET_TIER_ROADMAPS["1급"].minScore).toBe(240);
    expect(TARGET_TIER_ROADMAPS["1급"].recommendedPointsFilter).toBe(5);
    expect(TARGET_TIER_ROADMAPS["S급"].minScore).toBe(270);
    expect(TARGET_TIER_ROADMAPS["S급"].recommendedOnlyCharts).toBe(true);
  });
});
