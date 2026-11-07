export interface SM2CardState {
  repetition: number;
  intervalDays: number;
  easinessFactor: number;
  nextReviewAt: string; // ISO string
  lastQuality: number;
}

export type SM2Quality = 0 | 1 | 2 | 3 | 4 | 5;

/**
 * SuperMemo-2 (SM-2) Spaced Repetition Algorithm for TESAT Korean-Vietnamese Terminology.
 * - Quality < 3: Reset repetition to 0 and interval to 1 day.
 * - Quality >= 3:
 *   - repetition 0 -> interval 1 day
 *   - repetition 1 -> interval 6 days
 *   - repetition >= 2 -> round(interval * EF)
 * - EF' = max(1.3, EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
 */
export function calculateSM2Review(
  current: SM2CardState,
  quality: SM2Quality,
  now: Date = new Date()
): SM2CardState {
  let repetition = current.repetition;
  let intervalDays = current.intervalDays;
  let ef = current.easinessFactor;

  if (quality >= 3) {
    if (repetition === 0) {
      intervalDays = 1;
    } else if (repetition === 1) {
      intervalDays = 6;
    } else {
      intervalDays = Math.round(intervalDays * ef);
    }
    repetition += 1;
  } else {
    repetition = 0;
    intervalDays = 1;
  }

  const deltaEf = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  ef = Number(Math.max(1.3, ef + deltaEf).toFixed(2));

  const nextDate = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000);

  return {
    repetition,
    intervalDays,
    easinessFactor: ef,
    nextReviewAt: nextDate.toISOString(),
    lastQuality: quality,
  };
}

export interface IncorrectNoteRecord {
  questionId: string;
  questionCode: string;
  selectedIndex: number;
  mistakeCount: number;
  reviewStage: 1 | 2 | 3 | 4; // 1: +1d, 2: +3d, 3: +7d, 4: Mastered
  intervalDays: 1 | 3 | 7 | 0;
  nextReviewDueAt: string;
  resolved: boolean;
  lastReviewedAt: string;
  userReflectionVi?: string;
}

export const ERROR_LOG_INTERVAL_DAYS: Record<1 | 2 | 3, 1 | 3 | 7> = {
  1: 1,
  2: 3,
  3: 7,
};

/**
 * Smart Error Log (오답노트) Review Scheduler with strict 1-day, 3-day, and 7-day cycles:
 * - Initial mistake or failed review -> Stage 1 (Due in +1 day)
 * - 1st successful review -> Stage 2 (Due in +3 days)
 * - 2nd successful review -> Stage 3 (Due in +7 days)
 * - 3rd successful review -> Stage 4 (Resolved / Mastered)
 */
export function scheduleIncorrectNoteReview(
  existing: IncorrectNoteRecord | null,
  params: {
    questionId: string;
    questionCode: string;
    selectedIndex: number;
    isCorrectOnReview: boolean;
    now?: Date;
  }
): IncorrectNoteRecord {
  const now = params.now ?? new Date();
  const addDays = (days: number) =>
    new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  if (!existing) {
    return {
      questionId: params.questionId,
      questionCode: params.questionCode,
      selectedIndex: params.selectedIndex,
      mistakeCount: 1,
      reviewStage: 1,
      intervalDays: 1,
      nextReviewDueAt: addDays(1),
      resolved: false,
      lastReviewedAt: now.toISOString(),
    };
  }

  if (!params.isCorrectOnReview) {
    return {
      ...existing,
      selectedIndex: params.selectedIndex,
      mistakeCount: existing.mistakeCount + 1,
      reviewStage: 1,
      intervalDays: 1,
      nextReviewDueAt: addDays(1),
      resolved: false,
      lastReviewedAt: now.toISOString(),
    };
  }

  if (existing.reviewStage === 1) {
    return {
      ...existing,
      reviewStage: 2,
      intervalDays: 3,
      nextReviewDueAt: addDays(3),
      resolved: false,
      lastReviewedAt: now.toISOString(),
    };
  }

  if (existing.reviewStage === 2) {
    return {
      ...existing,
      reviewStage: 3,
      intervalDays: 7,
      nextReviewDueAt: addDays(7),
      resolved: false,
      lastReviewedAt: now.toISOString(),
    };
  }

  return {
    ...existing,
    reviewStage: 4,
    intervalDays: 0,
    nextReviewDueAt: now.toISOString(),
    resolved: true,
    lastReviewedAt: now.toISOString(),
  };
}
