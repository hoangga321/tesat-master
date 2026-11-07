import { NextRequest, NextResponse } from "next/server";
import {
  TESAT_EXAM_SETS,
  ALL_TESAT_QUESTIONS_POOL,
  getExamSetById,
  getQuestionsBySection,
  getQuestionsBySubcategory,
} from "@/lib/data/questions-seed";
import {
  validateOfficialTesatMatrix,
  evaluateExamSubmission,
} from "@/lib/engine/tesat-matrix";
import { TesatSectionEnum, TesatSubcategoryEnum } from "@/lib/schemas/tesat-schema";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const setIdParam = searchParams.get("setId");
  const sectionParam = searchParams.get("section");
  const subParam = searchParams.get("subcategory");

  if (sectionParam) {
    const parsedSec = TesatSectionEnum.safeParse(sectionParam);
    if (parsedSec.success) {
      const qs = getQuestionsBySection(parsedSec.data);
      return NextResponse.json({
        mode: "SECTION_DRILL",
        count: qs.length,
        questions: qs,
      });
    }
  }

  if (subParam) {
    const parsedSub = TesatSubcategoryEnum.safeParse(subParam);
    if (parsedSub.success) {
      const qs = getQuestionsBySubcategory(parsedSub.data);
      return NextResponse.json({
        mode: "TOPIC_DRILL",
        count: qs.length,
        questions: qs,
      });
    }
  }

  const activeSet = getExamSetById(setIdParam ?? "SET_1");
  const matrixReport = validateOfficialTesatMatrix(activeSet.questions);

  return NextResponse.json({
    mode: "FULL_MOCK_80",
    activeSetId: activeSet.setId,
    availableSets: TESAT_EXAM_SETS.map((s) => ({
      setId: s.setId,
      titleKo: s.titleKo,
      titleVi: s.titleVi,
      questionCount: s.questionCount,
      totalPoints: s.totalPoints,
    })),
    totalQuestionsInPool: ALL_TESAT_QUESTIONS_POOL.length,
    matrixReport,
    questions: activeSet.questions,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const setId: string = body?.setId ?? "SET_1";
    const selectedAnswers: Record<string, number | undefined> = body?.selectedAnswers ?? {};
    const activeSet = getExamSetById(setId);
    const evaluation = evaluateExamSubmission(activeSet.questions, selectedAnswers);

    return NextResponse.json({
      ok: true,
      setId: activeSet.setId,
      evaluation,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    );
  }
}
