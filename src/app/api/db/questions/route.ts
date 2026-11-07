import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { ALL_TESAT_QUESTIONS_POOL } from "@/lib/data/questions-seed";

export async function GET() {
  try {
    const dbQuestionCount = await prisma.question.count();
    const dbUserCount = await prisma.user.count();
    const chartQuestionsCount = ALL_TESAT_QUESTIONS_POOL.filter(
      (q) => Boolean(q.figureImageUrl || q.visualChart || q.dataTable)
    ).length;

    return NextResponse.json({
      ok: true,
      databaseEngine: "SQLite + Prisma ORM (prisma/dev.db)",
      dbQuestionCount,
      dbUserCount,
      totalPoolCount: ALL_TESAT_QUESTIONS_POOL.length,
      chartQuestionsCount,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { questionId, aiTranslation, aiVocab } = body;
    if (!questionId) {
      return NextResponse.json({ error: "Missing questionId" }, { status: 400 });
    }

    const existing = await prisma.question.findUnique({
      where: { id: questionId },
    });

    if (existing) {
      await prisma.question.update({
        where: { id: questionId },
        data: {
          aiTranslationJson: aiTranslation
            ? JSON.stringify(aiTranslation)
            : existing.aiTranslationJson,
          aiVocabJson: aiVocab ? JSON.stringify(aiVocab) : existing.aiVocabJson,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
