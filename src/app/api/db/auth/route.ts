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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, fullName, targetTier } = body as {
      action: "REGISTER" | "LOGIN";
      email: string;
      password?: string;
      fullName?: string;
      targetTier?: string;
    };

    const normalizedEmail = (email || "").trim().toLowerCase();
    const cleanPassword = (password || "").trim();

    if (!normalizedEmail) {
      return NextResponse.json(
        { error: "Vui lòng nhập Tên đăng nhập hợp lệ." },
        { status: 400 }
      );
    }

    if (action === "REGISTER") {
      const existing = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: { streak: true },
      });

      if (existing && existing.passwordHash) {
        return NextResponse.json(
          {
            error:
              "Tên đăng nhập này đã tồn tại trên hệ thống. Vui lòng chọn tên khác hoặc chuyển sang Đăng nhập.",
          },
          { status: 409 }
        );
      }

      const tierToSave = targetTier || "1급";
      const scoreToSave =
        tierToSave === "S급"
          ? 270
          : tierToSave === "1급"
            ? 240
            : tierToSave === "2급"
              ? 210
              : 180;

      const created = existing
        ? await prisma.user.update({
            where: { id: existing.id },
            data: {
              passwordHash: cleanPassword,
              name: (fullName || existing.name || "Học viên TESAT").trim(),
              targetGrade: tierToSave,
              targetScore: scoreToSave,
            },
            include: { streak: true },
          })
        : await prisma.user.create({
            data: {
              email: normalizedEmail,
              passwordHash: cleanPassword,
              name: (fullName || "Học viên TESAT").trim(),
              targetGrade: tierToSave,
              targetScore: scoreToSave,
              streak: {
                create: {
                  currentStreak: 0,
                  longestStreak: 0,
                  xpPoints: 0,
                  completedExercisesCount: 0,
                  dailyFiveCompletedToday: 0,
                  lastStreakDate: null,
                },
              },
            },
            include: { streak: true },
          });

      return NextResponse.json({
        user: {
          id: created.id,
          fullName: created.name,
          username: created.email,
          email: created.email,
          passwordHash: cleanPassword,
          targetTier: created.targetGrade,
          createdAt: created.createdAt.toISOString(),
        },
        progress: {
          userId: created.id,
          currentStreak: created.streak?.currentStreak ?? 0,
          longestStreak: created.streak?.longestStreak ?? 0,
          lastStreakDate: created.streak?.lastStreakDate ?? null,
          completedExercisesCount:
            created.streak?.completedExercisesCount ?? 0,
          xpPoints: created.streak?.xpPoints ?? 0,
          questionsAnsweredInCurrentSession:
            created.streak?.dailyFiveCompletedToday ?? 0,
          selectedAnswers: safeParseJson(
            created.streak?.selectedAnswersJson,
            {}
          ),
          errorLog: safeParseJson(created.streak?.errorLogJson, {}),
          srsStates: safeParseJson(created.streak?.srsStatesJson, {}),
        },
      });
    }

    // LOGIN
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { streak: true },
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Không tìm thấy tài khoản này trên hệ thống. Vui lòng kiểm tra lại Tên đăng nhập hoặc chuyển sang Đăng ký mới!",
        },
        { status: 404 }
      );
    }

    if (user.passwordHash && cleanPassword && user.passwordHash !== cleanPassword) {
      return NextResponse.json(
        { error: "Mật khẩu chưa chính xác. Vui lòng kiểm tra lại." },
        { status: 401 }
      );
    }

    // If user existed from progress sync without a passwordHash yet, lock in their password now
    if (!user.passwordHash && cleanPassword) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: cleanPassword },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        fullName: user.name,
        username: user.email,
        email: user.email,
        passwordHash: cleanPassword || user.passwordHash,
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
      { error: (err as Error).message || "Database Auth Error" },
      { status: 500 }
    );
  }
}
