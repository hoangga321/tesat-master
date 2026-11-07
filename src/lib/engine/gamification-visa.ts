import { TesatTier, calculateTesatTier } from "@/lib/engine/tesat-matrix";

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  dailyFiveCompletedToday: number;
  dailyFiveGoal: number;
  freezeCount: number;
  recoveryChallengeActive: boolean;
  recoveryQuestionTarget: number;
  recoveryCompletedCount: number;
  lastActivityAt: string;
  leagueTier: string;
  leaguePoints: number;
}

/**
 * Updates user's Daily 5 mission & Streak state, handling Streak Freeze and 24-hour Recovery Challenge.
 */
export function processDailyActivity(
  state: StreakState,
  questionsCompletedDelta: number,
  hoursSinceLastActivity = 12,
  now: Date = new Date()
): {
  updated: StreakState;
  eventBannerVi: string;
} {
  const next = { ...state };
  let eventBannerVi = "";

  if (hoursSinceLastActivity >= 48) {
    if (next.freezeCount > 0) {
      next.freezeCount -= 1;
      eventBannerVi = "❄️ Đã tự động kích hoạt 1 Streak Freeze để bảo vệ chuỗi ngày học của bạn!";
    } else {
      next.recoveryChallengeActive = true;
      next.recoveryQuestionTarget = 10;
      next.recoveryCompletedCount = 0;
      eventBannerVi =
        "⚡ Chuỗi Streak đang gặp nguy! Hoàn thành Thử thách Phục hồi 24h (10 câu) để khôi phục chuỗi ngày học!";
    }
  }

  next.dailyFiveCompletedToday = Math.min(
    next.dailyFiveGoal,
    next.dailyFiveCompletedToday + questionsCompletedDelta
  );
  next.leaguePoints += questionsCompletedDelta * 15;
  next.lastActivityAt = now.toISOString();

  if (next.recoveryChallengeActive) {
    next.recoveryCompletedCount += questionsCompletedDelta;
    if (next.recoveryCompletedCount >= next.recoveryQuestionTarget) {
      next.recoveryChallengeActive = false;
      next.currentStreak += 1;
      next.longestStreak = Math.max(next.longestStreak, next.currentStreak);
      eventBannerVi = "🔥 Đã vượt qua Thử thách Phục hồi 24h! Chuỗi Streak đã được khôi phục thành công!";
    }
  } else if (
    state.dailyFiveCompletedToday < state.dailyFiveGoal &&
    next.dailyFiveCompletedToday >= next.dailyFiveGoal
  ) {
    next.currentStreak += 1;
    next.longestStreak = Math.max(next.longestStreak, next.currentStreak);
    eventBannerVi = `🎯 Hoàn thành nhiệm vụ Daily 5! Chuỗi Streak tăng lên ${next.currentStreak} ngày liên tiếp!`;
  }

  return { updated: next, eventBannerVi };
}

export interface SmartNotificationAlert {
  id: string;
  triggerInterval: "24H" | "3D" | "7D";
  channels: Array<"WEB_PUSH" | "EMAIL" | "IN_APP">;
  urgency: "INFO" | "WARNING" | "CRITICAL";
  titleVi: string;
  bodyVi: string;
  ctaLabelVi: string;
}

/**
 * Evaluates inactivity duration and generates 24h, 3d (72h), and 7d (168h) retention notifications.
 */
export function evaluateInactivityNotifications(
  hoursInactive: number,
  dueErrorNotesCount: number,
  dueFlashcardsCount: number,
  currentStreak: number
): SmartNotificationAlert[] {
  const alerts: SmartNotificationAlert[] = [];

  if (hoursInactive >= 24) {
    alerts.push({
      id: "notif-24h",
      triggerInterval: "24H",
      channels: ["WEB_PUSH", "IN_APP"],
      urgency: "INFO",
      titleVi: `⏰ Nhắc nhở 24h: Bảo vệ chuỗi ${currentStreak} ngày Streak TESAT!`,
      bodyVi: `Bạn có ${dueErrorNotesCount} câu trong Sổ tay câu sai (오답노트 1일 주기) và ${dueFlashcardsCount} thẻ từ vựng Hán-Hàn đến hạn ôn tập hôm nay. Chỉ mất 5 phút để hoàn thành Daily 5!`,
      ctaLabelVi: "Làm Daily 5 ngay",
    });
  }

  if (hoursInactive >= 72) {
    alerts.push({
      id: "notif-3d",
      triggerInterval: "3D",
      channels: ["WEB_PUSH", "EMAIL", "IN_APP"],
      urgency: "WARNING",
      titleVi: "❄️ Cảnh báo 3 ngày (72h): Streak Freeze đã được kích hoạt!",
      bodyVi:
        "Theo đường cong lãng quên Ebbinghaus, 45% từ vựng Vĩ mô & Tài chính sẽ rơi rụng sau 72h. Hãy vào làm 1 bài Drill hoặc thử thách khôi phục Streak ngay!",
      ctaLabelVi: "Mở Ôn tập Chu kỳ 3 Ngày",
    });
  }

  if (hoursInactive >= 168) {
    alerts.push({
      id: "notif-7d",
      triggerInterval: "7D",
      channels: ["WEB_PUSH", "EMAIL", "IN_APP"],
      urgency: "CRITICAL",
      titleVi: "🚨 Báo động 7 ngày (7d): Đừng để gián đoạn mục tiêu chinh phục hạng TESAT!",
      bodyVi:
        "Kỳ thi Hankyung TESAT định kỳ đang tới gần. Hệ thống AI đã chuẩn bị gói '24h Streak Recovery Challenge' với 5 câu hỏi Sinh đôi (Twin Questions) trọng tâm nhất cho bạn.",
      ctaLabelVi: "Kích hoạt Khôi phục 7 Ngày",
    });
  }

  return alerts;
}

export interface TesatGoalSimulatorInput {
  targetTier: "S급" | "1급" | "2급" | "3급";
  predictedTheoryScore: number;   // 0..100
  predictedAffairsScore: number;  // 0..100
  predictedAppliedScore: number;  // 0..100
}

export interface TesatGoalAssessment {
  totalPredictedScore: number;
  achievedTier: TesatTier;
  targetMinScore: number;
  scoreGapToTarget: number;
  isTargetReached: boolean;
  academicCreditsEarned: number; // 학점은행제 (0, 16, 18, 20 credits)
  weakestSectionVi: string;
  studyStrategyVi: string;
}

/**
 * Pure Hankyung TESAT Target Grade & Study Roadmap Simulator (No Visa calculations).
 */
export function calculateTesatGoalPlan(input: TesatGoalSimulatorInput): TesatGoalAssessment {
  const totalPredictedScore = Math.max(
    0,
    Math.min(
      300,
      Math.round(input.predictedTheoryScore + input.predictedAffairsScore + input.predictedAppliedScore)
    )
  );
  const tierInfo = calculateTesatTier(totalPredictedScore);

  const targetMinScoreMap: Record<TesatGoalSimulatorInput["targetTier"], number> = {
    "S급": 270,
    "1급": 240,
    "2급": 210,
    "3급": 180,
  };
  const targetMinScore = targetMinScoreMap[input.targetTier];
  const scoreGapToTarget = Math.max(0, targetMinScore - totalPredictedScore);
  const isTargetReached = totalPredictedScore >= targetMinScore;

  let academicCreditsEarned = 0;
  if (tierInfo.tier === "S급" || tierInfo.tier === "1급") academicCreditsEarned = 20;
  else if (tierInfo.tier === "2급") academicCreditsEarned = 18;
  else if (tierInfo.tier === "3급") academicCreditsEarned = 16;

  // Identify weakest section
  const sections = [
    { name: "1교시 경제이론 (Lý thuyết Kinh tế - 100점)", score: input.predictedTheoryScore },
    { name: "2교시 시사경제·경영 (Thời sự & Quản trị - 100점)", score: input.predictedAffairsScore },
    { name: "3교시 응용복합·상황판단 (Phân tích Ứng dụng 5점 - 100점)", score: input.predictedAppliedScore },
  ].sort((a, b) => a.score - b.score);

  const weakestSectionVi = sections[0].name;

  const studyStrategyVi = isTargetReached
    ? `Chúc mừng! Tổng điểm dự kiến ${totalPredictedScore}/300점 đã đạt chuẩn ${tierInfo.tier} (Vượt mục tiêu ${input.targetTier} - ${targetMinScore}점). Hãy duy trì luyện tập các câu 5 điểm ở 3교시 응용복합 để giữ vững phong độ!`
    : `Bạn đang đạt ${totalPredictedScore}/300점 (${tierInfo.tier}), còn thiếu ${scoreGapToTarget} điểm để chạm mốc ${input.targetTier} (${targetMinScore}점). Hãy ưu tiên cải thiện phần [${weakestSectionVi}] (chỉ cần đúng thêm ${Math.ceil(scoreGapToTarget / 4)}~${Math.ceil(scoreGapToTarget / 3)} câu hỏi nữa).`;

  return {
    totalPredictedScore,
    achievedTier: tierInfo.tier,
    targetMinScore,
    scoreGapToTarget,
    isTargetReached,
    academicCreditsEarned,
    weakestSectionVi,
    studyStrategyVi,
  };
}
