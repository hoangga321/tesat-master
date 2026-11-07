import { TesatQuestion, TesatQuestionSchema, TesatSection, TesatSubcategory } from "@/lib/schemas/tesat-schema";

export type TesatTier = "S급" | "1급" | "2급" | "3급" | "4급" | "5급" | "불합격";

export interface MatrixValidationReport {
  isValid: boolean;
  totalQuestions: number;
  totalPoints: number;
  durationMinutes: number;
  sections: {
    THEORY: {
      count: number;
      points: number;
      point3Count: number;
      point4Count: number;
      microCount: number;
      macroCount: number;
      intlCount: number;
    };
    CURRENT_AFFAIRS: {
      count: number;
      points: number;
      point3Count: number;
      point4Count: number;
      currentIssuesCount: number;
      financeStrategyCount: number;
    };
    APPLIED: {
      count: number;
      points: number;
      point5Count: number;
      dataEditorialCount: number;
    };
  };
  errors: string[];
}

export const OFFICIAL_TESAT_CONSTANTS = {
  TOTAL_QUESTIONS: 80,
  MAX_POINTS: 300,
  DURATION_MINUTES: 100,
  DURATION_SECONDS: 6000,
  OPTIONS_PER_QUESTION: 5,
} as const;

/**
 * Validates that an array of 80 TESAT questions strictly conforms to the official Hankyung TESAT Matrix:
 * - Total: 80 Qs, 300 pts, 5 options each
 * - Section 1 (THEORY): 30 Qs (100 pts) -> 20 @ 3pt + 10 @ 4pt | Micro (14-15), Macro (12-13), Intl (2-3)
 * - Section 2 (CURRENT_AFFAIRS): 30 Qs (100 pts) -> 20 @ 3pt + 10 @ 4pt | Current Issues (15), Finance/Strategy (15)
 * - Section 3 (APPLIED): 20 Qs (100 pts) -> 20 @ 5pt | Data/Editorial/Scenario (20)
 */
export function validateOfficialTesatMatrix(questions: TesatQuestion[]): MatrixValidationReport {
  const errors: string[] = [];

  for (const q of questions) {
    const parsed = TesatQuestionSchema.safeParse(q);
    if (!parsed.success) {
      errors.push(`Question ${q.code} failed Zod validation: ${parsed.error.issues[0]?.message}`);
    }
  }

  const theoryQs = questions.filter((q) => q.section === "THEORY");
  const affairsQs = questions.filter((q) => q.section === "CURRENT_AFFAIRS");
  const appliedQs = questions.filter((q) => q.section === "APPLIED");

  const sumPoints = (arr: TesatQuestion[]) => arr.reduce((acc, q) => acc + q.points, 0);

  const report: MatrixValidationReport = {
    isValid: true,
    totalQuestions: questions.length,
    totalPoints: sumPoints(questions),
    durationMinutes: OFFICIAL_TESAT_CONSTANTS.DURATION_MINUTES,
    sections: {
      THEORY: {
        count: theoryQs.length,
        points: sumPoints(theoryQs),
        point3Count: theoryQs.filter((q) => q.points === 3).length,
        point4Count: theoryQs.filter((q) => q.points === 4).length,
        microCount: theoryQs.filter((q) => q.subcategory === "MICRO").length,
        macroCount: theoryQs.filter((q) => q.subcategory === "MACRO").length,
        intlCount: theoryQs.filter((q) => q.subcategory === "INTL").length,
      },
      CURRENT_AFFAIRS: {
        count: affairsQs.length,
        points: sumPoints(affairsQs),
        point3Count: affairsQs.filter((q) => q.points === 3).length,
        point4Count: affairsQs.filter((q) => q.points === 4).length,
        currentIssuesCount: affairsQs.filter((q) => q.subcategory === "CURRENT_ISSUES").length,
        financeStrategyCount: affairsQs.filter((q) => q.subcategory === "FINANCE_STRATEGY").length,
      },
      APPLIED: {
        count: appliedQs.length,
        points: sumPoints(appliedQs),
        point5Count: appliedQs.filter((q) => q.points === 5).length,
        dataEditorialCount: appliedQs.filter((q) => q.subcategory === "DATA_EDITORIAL").length,
      },
    },
    errors,
  };

  if (report.totalQuestions !== 80) {
    errors.push(`Expected 80 total questions, got ${report.totalQuestions}`);
  }
  if (report.totalPoints !== 300) {
    errors.push(`Expected 300 total points, got ${report.totalPoints}`);
  }

  // Section 1 checks
  const s1 = report.sections.THEORY;
  if (s1.count !== 30) errors.push(`Section 1 (THEORY) must have 30 questions, got ${s1.count}`);
  if (s1.points !== 100) errors.push(`Section 1 (THEORY) must total 100 points, got ${s1.points}`);
  if (s1.point3Count !== 20 || s1.point4Count !== 10) {
    errors.push(`Section 1 must have 20x3pt and 10x4pt questions, got ${s1.point3Count}x3pt and ${s1.point4Count}x4pt`);
  }
  if (s1.microCount + s1.macroCount + s1.intlCount !== 30) {
    errors.push(
      `Section 1 must have 30 MICRO/MACRO/INTL questions total, got ${
        s1.microCount + s1.macroCount + s1.intlCount
      }`
    );
  }
  if (s1.microCount < 5 || s1.macroCount < 5 || s1.intlCount < 1) {
    errors.push(
      `Section 1 must include MICRO (${s1.microCount}), MACRO (${s1.macroCount}), and INTL (${s1.intlCount}) questions`
    );
  }

  // Section 2 checks
  const s2 = report.sections.CURRENT_AFFAIRS;
  if (s2.count !== 30) errors.push(`Section 2 (CURRENT_AFFAIRS) must have 30 questions, got ${s2.count}`);
  if (s2.points !== 100) errors.push(`Section 2 (CURRENT_AFFAIRS) must total 100 points, got ${s2.points}`);
  if (s2.point3Count !== 20 || s2.point4Count !== 10) {
    errors.push(`Section 2 must have 20x3pt and 10x4pt questions, got ${s2.point3Count}x3pt and ${s2.point4Count}x4pt`);
  }
  if (s2.currentIssuesCount + s2.financeStrategyCount !== 30) {
    errors.push(
      `Section 2 must have 30 CURRENT_ISSUES and FINANCE_STRATEGY questions total, got ${s2.currentIssuesCount} and ${s2.financeStrategyCount}`
    );
  }
  if (s2.currentIssuesCount < 5 || s2.financeStrategyCount < 5) {
    errors.push(
      `Section 2 must include both CURRENT_ISSUES (${s2.currentIssuesCount}) and FINANCE_STRATEGY (${s2.financeStrategyCount})`
    );
  }

  // Section 3 checks
  const s3 = report.sections.APPLIED;
  if (s3.count !== 20) errors.push(`Section 3 (APPLIED) must have 20 questions, got ${s3.count}`);
  if (s3.points !== 100) errors.push(`Section 3 (APPLIED) must total 100 points, got ${s3.points}`);
  if (s3.point5Count !== 20) errors.push(`Section 3 must have 20x5pt questions, got ${s3.point5Count}`);

  report.isValid = errors.length === 0;
  return report;
}

/**
 * Official Hankyung TESAT Grade Tier Assignment (out of 300 points)
 */
export function calculateTesatTier(score: number): {
  tier: TesatTier;
  labelVi: string;
  minScore: number;
  nextTier: TesatTier | null;
  pointsToNextTier: number;
  qualificationBenefitVi: string;
} {
  const clamped = Math.max(0, Math.min(300, Math.round(score)));

  if (clamped >= 270) {
    return {
      tier: "S급",
      labelVi: "Hạng S (270~300점 · Xuất sắc đỉnh cao - Top 1%)",
      minScore: 270,
      nextTier: null,
      pointsToNextTier: 0,
      qualificationBenefitVi: "Chứng chỉ Quốc gia (국가공인) bậc cao nhất · Công nhận 20 tín chỉ 학점은행제 & Ưu tiên tuyển dụng Tập đoàn/Ngân hàng Hàn Quốc",
    };
  }
  if (clamped >= 240) {
    return {
      tier: "1급",
      labelVi: "Hạng 1 (240~269점 · Chuyên gia Kinh tế - Tài chính)",
      minScore: 240,
      nextTier: "S급",
      pointsToNextTier: 270 - clamped,
      qualificationBenefitVi: "Chứng chỉ Quốc gia (국가공인) · Công nhận 20 tín chỉ 학점은행제 & Chuẩn năng lực khối Tài chính - Ngân hàng",
    };
  }
  if (clamped >= 210) {
    return {
      tier: "2급",
      labelVi: "Hạng 2 (210~239점 · Năng lực Kinh tế Vững vàng)",
      minScore: 210,
      nextTier: "1급",
      pointsToNextTier: 240 - clamped,
      qualificationBenefitVi: "Chứng chỉ Quốc gia (국가공인) · Công nhận 18 tín chỉ 학점은행제 & Điểm cộng tuyển dụng Doanh nghiệp Hàn Quốc",
    };
  }
  if (clamped >= 180) {
    return {
      tier: "3급",
      labelVi: "Hạng 3 (180~209점 · Đạt chuẩn Chứng chỉ Quốc gia - 국가공인)",
      minScore: 180,
      nextTier: "2급",
      pointsToNextTier: 210 - clamped,
      qualificationBenefitVi: "Ngưỡng tối thiểu đạt Chứng chỉ Quốc gia Hàn Quốc (국가공인 자격증 · Công nhận 16 tín chỉ 학점은행제)",
    };
  }
  if (clamped >= 150) {
    return {
      tier: "4급",
      labelVi: "Hạng 4 (150~179점 · Sơ cấp Kinh tế - 민간자격)",
      minScore: 150,
      nextTier: "3급",
      pointsToNextTier: 180 - clamped,
      qualificationBenefitVi: "Chứng chỉ cấp độ 4 (Cần đạt tối thiểu 180 điểm - 3급 để được công nhận 국가공인)",
    };
  }
  if (clamped >= 120) {
    return {
      tier: "5급",
      labelVi: "Hạng 5 (120~149점 · Nhập môn Kinh tế)",
      minScore: 120,
      nextTier: "4급",
      pointsToNextTier: 150 - clamped,
      qualificationBenefitVi: "Cần củng cố từ vựng Hán-Hàn và lý thuyết Vi mô/Vĩ mô cơ bản",
    };
  }
  return {
    tier: "불합격",
    labelVi: "Chưa xếp hạng (< 120 điểm)",
    minScore: 0,
    nextTier: "5급",
    pointsToNextTier: 120 - clamped,
    qualificationBenefitVi: "Chưa đủ điểm xếp hạng TESAT (Dưới 120/300 điểm)",
  };
}

export interface ExamEvaluationSummary {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  nearMissCount: number;
  achievedScore: number;
  maxScore: number;
  tierInfo: ReturnType<typeof calculateTesatTier>;
  sectionScores: Record<
    TesatSection,
    { earned: number; max: number; correct: number; total: number; accuracyPct: number }
  >;
  subcategoryCompetency: Record<
    TesatSubcategory,
    { earned: number; max: number; correct: number; total: number; scorePct: number }
  >;
}

/**
 * Evaluates a user's selected answers (questionId -> selectedIndex) against the question set.
 */
export function evaluateExamSubmission(
  questions: TesatQuestion[],
  selectedAnswers: Record<string, number | undefined>
): ExamEvaluationSummary {
  const sectionScores: ExamEvaluationSummary["sectionScores"] = {
    THEORY: { earned: 0, max: 0, correct: 0, total: 0, accuracyPct: 0 },
    CURRENT_AFFAIRS: { earned: 0, max: 0, correct: 0, total: 0, accuracyPct: 0 },
    APPLIED: { earned: 0, max: 0, correct: 0, total: 0, accuracyPct: 0 },
  };

  const subcategoryCompetency: ExamEvaluationSummary["subcategoryCompetency"] = {
    MICRO: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
    MACRO: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
    INTL: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
    CURRENT_ISSUES: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
    FINANCE_STRATEGY: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
    DATA_EDITORIAL: { earned: 0, max: 0, correct: 0, total: 0, scorePct: 0 },
  };

  let answeredCount = 0;
  let correctCount = 0;
  let nearMissCount = 0;
  let achievedScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.points;
    sectionScores[q.section].max += q.points;
    sectionScores[q.section].total += 1;
    subcategoryCompetency[q.subcategory].max += q.points;
    subcategoryCompetency[q.subcategory].total += 1;

    const chosen = selectedAnswers[q.id];
    if (chosen !== undefined && chosen >= 0 && chosen <= 4) {
      answeredCount += 1;
      if (chosen === q.correctIndex) {
        correctCount += 1;
        achievedScore += q.points;
        sectionScores[q.section].earned += q.points;
        sectionScores[q.section].correct += 1;
        subcategoryCompetency[q.subcategory].earned += q.points;
        subcategoryCompetency[q.subcategory].correct += 1;
      } else {
        const chosenOpt = q.options[chosen];
        if (chosenOpt?.isNearMiss) {
          nearMissCount += 1;
        }
      }
    }
  }

  for (const sec of Object.keys(sectionScores) as TesatSection[]) {
    const s = sectionScores[sec];
    s.accuracyPct = s.max > 0 ? Math.round((s.earned / s.max) * 100) : 0;
  }

  for (const sub of Object.keys(subcategoryCompetency) as TesatSubcategory[]) {
    const sc = subcategoryCompetency[sub];
    sc.scorePct = sc.max > 0 ? Math.round((sc.earned / sc.max) * 100) : 0;
  }

  return {
    totalQuestions: questions.length,
    answeredCount,
    correctCount,
    nearMissCount,
    achievedScore,
    maxScore,
    tierInfo: calculateTesatTier(achievedScore),
    sectionScores,
    subcategoryCompetency,
  };
}
