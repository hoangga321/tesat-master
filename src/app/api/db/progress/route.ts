import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId");
    const email = req.nextUrl.searchParams.get("email");
    if (!userId && !email) {
      return NextResponse.json(
        { error: "Missing userId or email" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: email ? { email: email.trim().toLowerCase() } : { id: userId! },
      include: { streak: true },
    });

    if (!user) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      user: {
        id: user.id,
        fullName: user.name,
        username: user.email,
        email: user.email,
        targetTier: user.targetGrade,
        createdAt: user.createdAt.toISOString(),
      },
      progress: {
        userId: user.id,
        currentStreak: user.streak?.currentStreak ?? 0,
        longestStreak: user.streak?.longestStreak ?? 0,
        lastStreakDate: user.streak?.lastStreakDate ?? null,
        completedExercisesCount: user.streak?.completedExercisesCount ?? 0,
        xpPoints: user.streak?.xpPoints ?? 0,
        questionsAnsweredInCurrentSession:
          user.streak?.dailyFiveCompletedToday ?? 0,
        selectedAnswers: safeParseJson(user.streak?.selectedAnswersJson, {}),
        errorLog: safeParseJson(user.streak?.errorLogJson, {}),
        srsStates: safeParseJson(user.streak?.srsStatesJson, {}),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      passwordHash,
      fullName,
      targetTier,
      currentStreak,
      longestStreak,
      lastStreakDate,
      completedExercisesCount,
      xpPoints,
      questionsAnsweredInCurrentSession,
      selectedAnswers,
      errorLog,
      srsStates,
    } = body;

    if (!email) {
      return NextResponse.json({ error: "Email required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        name: fullName || undefined,
        targetGrade: targetTier || undefined,
        passwordHash:
          !existingUser?.passwordHash && passwordHash
            ? String(passwordHash)
            : undefined,
      },
      create: {
        email: normalizedEmail,
        passwordHash: passwordHash ? String(passwordHash) : "",
        name: fullName || "Học viên TESAT",
        targetGrade: targetTier || "1급",
      },
    });

    const streak = await prisma.streak.upsert({
      where: { userId: user.id },
      update: {
        currentStreak: Number(currentStreak ?? 0),
        longestStreak: Number(longestStreak ?? 0),
        lastStreakDate: lastStreakDate ?? null,
        completedExercisesCount: Number(completedExercisesCount ?? 0),
        xpPoints: Number(xpPoints ?? 0),
        dailyFiveCompletedToday: Number(questionsAnsweredInCurrentSession ?? 0),
        selectedAnswersJson: JSON.stringify(selectedAnswers ?? {}),
        errorLogJson: JSON.stringify(errorLog ?? {}),
        srsStatesJson: JSON.stringify(srsStates ?? {}),
        lastActivityAt: new Date(),
      },
      create: {
        userId: user.id,
        currentStreak: Number(currentStreak ?? 0),
        longestStreak: Number(longestStreak ?? 0),
        lastStreakDate: lastStreakDate ?? null,
        completedExercisesCount: Number(completedExercisesCount ?? 0),
        xpPoints: Number(xpPoints ?? 0),
        dailyFiveCompletedToday: Number(questionsAnsweredInCurrentSession ?? 0),
        selectedAnswersJson: JSON.stringify(selectedAnswers ?? {}),
        errorLogJson: JSON.stringify(errorLog ?? {}),
        srsStatesJson: JSON.stringify(srsStates ?? {}),
      },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      streakId: streak.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
