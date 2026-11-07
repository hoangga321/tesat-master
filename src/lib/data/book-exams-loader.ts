import {
  TesatQuestion,
  TesatSection,
  TesatSubcategory,
  TesatPoints,
  TesatDataTable,
} from "@/lib/schemas/tesat-schema";
import exam86Raw from "@/lib/data/book-exams/exam-86.json";
import exam85Raw from "@/lib/data/book-exams/exam-85.json";
import exam79Raw from "@/lib/data/book-exams/exam-79.json";
import exam78Raw from "@/lib/data/book-exams/exam-78.json";
import exam77Raw from "@/lib/data/book-exams/exam-77.json";
import exam74_1Raw from "@/lib/data/book-exams/exam-74-1.json";
import exam74Raw from "@/lib/data/book-exams/exam-74.json";

export interface RawBookQuestionItem {
  examNumber: number;
  section?: TesatSection;
  subcategory?: TesatSubcategory;
  points?: TesatPoints;
  questionKo: string;
  questionVi: string;
  passageKo?: string;
  passageVi?: string;
  figureImageUrl?: string;
  figureCaptionKo?: string;
  figureCaptionVi?: string;
  dataTable?: TesatDataTable;
  optionsKo: string[];
  optionsVi: string[];
  correctIndex: number;
  explanationVi: string;
  coreFormula?: string;
  keyTerms?: string[];
}

export interface RawBookExamFile {
  examFolder: string;
  examTitleKo: string;
  examTitleVi: string;
  questions: RawBookQuestionItem[];
}

const MARKERS = ["①", "②", "③", "④", "⑤"] as const;

function stripLeadingOptionMarker(text: string): string {
  return (text || "")
    .replace(/^\s*(?:[①②③④⑤]|\([1-5]\)|[1-5]\.)\s*/, "")
    .trim();
}

function stripLeadingQuestionNumber(text: string): string {
  return (text || "").replace(/^\s*\d{1,2}\s*\.\s*/, "").trim();
}

function detectNegativeTraps(questionKo: string): string[] {
  const traps = [
    "옳지 않은 것은",
    "틀린 것은",
    "거리가 먼 것은",
    "적절하지 않은 것은",
    "아닌 것은",
    "잘못 설명한 것은",
    "잘못 짝지어진 것은",
    "볼 수 없는 것은",
    "동의할 수 없는",
    "어려운 것은",
    "적은 것은",
  ];
  return traps.filter((t) => questionKo.includes(t));
}

export function classifyBookQuestionSubcategory(
  questionKo: string,
  passageKo: string | undefined,
  optionsKo: string[],
  examNumber: number
): TesatSubcategory {
  const primary = `${questionKo} ${optionsKo.join(" ")}`;
  const secondary = passageKo ?? "";

  if (examNumber >= 61) {
    return "DATA_EDITORIAL";
  }

  const score = (regex: RegExp): number => {
    const p = (primary.match(regex) || []).length;
    const s = (secondary.match(regex) || []).length;
    return p * 3 + s;
  };

  const scores: Record<TesatSubcategory, number> = {
    INTL: score(
      /환율|경상수지|비교우위|절대우위|관세|무역|수출|수입|외환|원화|달러|국제수지|FTA|WTO|구매력평가|이자율평가|교역조건|자유무역|보호무역|기축통화|SDR|패리티/g
    ),
    FINANCE_STRATEGY: score(
      /주식|채권|배당|재무|회계|자기자본|부채비율|유동비율|ROE|PER|PBR|옵션|선물|파생상품|전환사채|신주인수권|회사채|유상증자|무상증자|포트폴리오|분산투자|순현재가치|NPV|IRR|마케팅|경영|기업가|M&A|인수합병|적대적|포이즌필|황금낙하산|예금자보호|신용등급|가산금리|담보|신용대출|가계부채|코스피|예금|적금/g
    ),
    CURRENT_ISSUES: score(
      /고령화|저출산|국민연금|최저임금|탄소|기후|ESG|그린워싱|리쇼어링|공유지의 비극|지대추구|규제|특허|노동조합|실업급여|사회보험|공공선택|투표|중위투표자|관료제|지니계수|로렌츠|절대빈곤|상대빈곤|빅테크|플랫폼|디지털|인공지능|구독경제|리디노미네이션|베블런|스놉|밴드왜건|디드로|풍년의 역설|그레셤/g
    ),
    MACRO: score(
      /GDP|국내총생산|GNI|국민총소득|물가|인플레이션|디플레이션|스태그플레이션|실업률|고용률|경제활동|기준금리|통화량|중앙은행|한국은행|국채|재정정책|통화정책|지급준비율|재할인율|공개시장|유동성 함정|구축효과|승수효과|필립스|총수요|총공급|경기변동|선행지수|동행지수|고통지수|잠재GDP|솔로우|테일러 준칙|케인스|통화주의|생애주기|항상소득|한계소비성향|부가가치세|조세|세율|래퍼곡선/g
    ),
    MICRO: score(
      /수요|공급|탄력성|기회비용|매몰비용|한계효용|무차별곡선|예산선|소비자잉여|생산자잉여|사회적 총잉여|자중손실|최고가격|최저가격|가격상한|가격하한|외부효과|외부경제|외부불경제|피구세|코즈 정리|공공재|경합성|배제성|역선택|도덕적 해이|신호발송|선별|주인-대리인|완전경쟁|독점|과점|독점적 경쟁|가격차별|내시균형|우월전략|용의자의 딜레마|한계비용|한계수입|생산가능곡선|대체재|보완재|정상재|열등재|기펜재/g
    ),
    DATA_EDITORIAL: 0,
  };

  let bestSub: TesatSubcategory = examNumber <= 30 ? "MICRO" : "CURRENT_ISSUES";
  let bestScore = 0;

  for (const cand of [
    "INTL",
    "FINANCE_STRATEGY",
    "CURRENT_ISSUES",
    "MACRO",
    "MICRO",
  ] as TesatSubcategory[]) {
    if (scores[cand] > bestScore) {
      bestScore = scores[cand];
      bestSub = cand;
    }
  }

  return bestSub;
}

export function getOfficialSlotSpec(examNumber: number): {
  section: TesatSection;
  points: TesatPoints;
} {
  if (examNumber <= 20) return { section: "THEORY", points: 3 };
  if (examNumber <= 30) return { section: "THEORY", points: 4 };
  if (examNumber <= 50) return { section: "CURRENT_AFFAIRS", points: 3 };
  if (examNumber <= 60) return { section: "CURRENT_AFFAIRS", points: 4 };
  return { section: "APPLIED", points: 5 };
}

function buildTesatQuestionFromBook(
  examFolder: string,
  examTitleKo: string,
  raw: RawBookQuestionItem
): TesatQuestion {
  const slot = getOfficialSlotSpec(raw.examNumber);
  const section: TesatSection = slot.section;
  const points: TesatPoints = slot.points;
  const naturalClassified = classifyBookQuestionSubcategory(
    raw.questionKo,
    raw.passageKo,
    raw.optionsKo,
    raw.examNumber
  );

  let subcategory: TesatSubcategory;
  if (raw.examNumber >= 61) {
    subcategory = "DATA_EDITORIAL";
  } else if (raw.examNumber >= 31) {
    subcategory =
      raw.subcategory === "FINANCE_STRATEGY" ||
      naturalClassified === "FINANCE_STRATEGY"
        ? "FINANCE_STRATEGY"
        : "CURRENT_ISSUES";
  } else {
    subcategory =
      raw.subcategory === "MICRO" ||
      raw.subcategory === "MACRO" ||
      raw.subcategory === "INTL"
        ? raw.subcategory
        : naturalClassified === "MICRO" ||
          naturalClassified === "MACRO" ||
          naturalClassified === "INTL"
        ? naturalClassified
        : "MICRO";
  }

  const cleanStemKo = stripLeadingQuestionNumber(raw.questionKo);
  const cleanStemVi = stripLeadingQuestionNumber(raw.questionVi);
  const negTokens = detectNegativeTraps(cleanStemKo);
  const correctIdx =
    raw.correctIndex >= 0 && raw.correctIndex <= 4 ? raw.correctIndex : 0;

  const options = raw.optionsKo.slice(0, 5).map((optKo, idx) => {
    const cleanKo = stripLeadingOptionMarker(optKo);
    const cleanVi = stripLeadingOptionMarker(raw.optionsVi[idx] ?? optKo);
    const marker = MARKERS[idx];
    const isCorrect = idx === correctIdx;

    return {
      index: idx,
      marker,
      textKo: cleanKo,
      textVi: cleanVi,
      eliminationLogicVi: isCorrect
        ? `✅ Đáp án chính xác (${marker}): ${cleanVi}. ${raw.explanationVi}`
        : `❌ Phương án loại trừ (${marker}): ${cleanVi}. Đối chiếu giải thích: ${raw.explanationVi}`,
      isNearMiss: !isCorrect && idx === (correctIdx + 1) % 5,
      nearMissReasonVi:
        !isCorrect && idx === (correctIdx + 1) % 5
          ? "Phương án bẫy dễ gây nhầm lẫn nếu đọc lướt điều kiện câu hỏi hoặc nhầm chiều dịch chuyển kinh tế."
          : undefined,
      socraticQuestionVi:
        !isCorrect && idx === (correctIdx + 1) % 5
          ? "Hãy kiểm tra lại biến số nguyên nhân và kết quả trong câu hỏi: chiều biến động là tăng hay giảm?"
          : undefined,
    };
  });

  const keyTerms =
    raw.keyTerms && raw.keyTerms.length > 0
      ? raw.keyTerms
      : ["TESAT 기출", examTitleKo];
  const coreFormula =
    raw.coreFormula && raw.coreFormula.trim().length > 1
      ? raw.coreFormula.trim()
      : `${examTitleKo} · Câu ${raw.examNumber} (${points}점)`;

  const folderSlug = examFolder.replace(/[^a-zA-Z0-9]/g, "_");
  const numStr = String(raw.examNumber).padStart(2, "0");

  return {
    id: `book-${folderSlug}-q-${numStr}`,
    code: `TESAT-${examFolder.toUpperCase()}-Q${numStr}`,
    examNumber: raw.examNumber,
    section,
    subcategory,
    points,
    source: `${examTitleKo} (Đề gốc trong sách · Câu ${raw.examNumber})`,
    questionKo: cleanStemKo,
    questionVi: cleanStemVi,
    passageKo: raw.passageKo?.trim() || undefined,
    passageVi: raw.passageVi?.trim() || undefined,
    figureImageUrl: raw.figureImageUrl || undefined,
    figureCaptionKo: raw.figureCaptionKo || undefined,
    figureCaptionVi: raw.figureCaptionVi || undefined,
    dataTable: raw.dataTable || undefined,
    options,
    correctIndex: correctIdx,
    negativeTrapTokens: negTokens,
    hintLevel1Vi: `[Gợi ý 1 · Trọng tâm câu hỏi] Nguyên lý / Công thức: ${coreFormula}. Từ khóa kinh tế: ${keyTerms.join(
      ", "
    )}.${
      negTokens.length > 0
        ? ` Lưu ý: Câu hỏi có cụm phủ định (${negTokens.join(
            ", "
          )}) — hãy chọn phát biểu SAI!`
        : ""
    }`,
    hintLevel2Vi: raw.explanationVi,
    hintLevel3Vi: `[Kết luận đáp án chuẩn] Chọn ${MARKERS[correctIdx]} ${options[correctIdx]?.textKo} (${options[correctIdx]?.textVi}). ${raw.explanationVi}`,
    coreFormula,
    keyTerms,
    tags: ["BOOK_OFFICIAL", `EXAM_${examFolder}`, subcategory, section],
  };
}

const RAW_BOOK_EXAMS: RawBookExamFile[] = [
  exam85Raw as unknown as RawBookExamFile,
  exam79Raw as unknown as RawBookExamFile,
  exam78Raw as unknown as RawBookExamFile,
  exam77Raw as unknown as RawBookExamFile,
  exam74_1Raw as unknown as RawBookExamFile,
  exam86Raw as unknown as RawBookExamFile,
  exam74Raw as unknown as RawBookExamFile,
];

export interface LoadedBookExamSet {
  setId: string;
  examFolder: string;
  titleKo: string;
  titleVi: string;
  sourceSummary: string;
  questionCount: number;
  totalPoints: number;
  durationMinutes: number;
  questions: TesatQuestion[];
}

export const BOOK_EXAM_SETS: LoadedBookExamSet[] = RAW_BOOK_EXAMS.map((exam) => {
  const sortedRaw = [...exam.questions].sort(
    (a, b) => a.examNumber - b.examNumber
  );
  const questions = sortedRaw.map((q) =>
    buildTesatQuestionFromBook(exam.examFolder, exam.examTitleKo, q)
  );
  const totalPoints = questions.reduce((acc, q) => acc + q.points, 0);
  const chartCount = questions.filter(
    (q) => q.figureImageUrl || q.dataTable || q.visualChart
  ).length;

  return {
    setId: `BOOK_${exam.examFolder.replace("-", "_")}`,
    examFolder: exam.examFolder,
    titleKo: `${exam.examTitleKo} (원본 수록 ${questions.length}문항 · 도표 ${chartCount}개)`,
    titleVi: `${exam.examTitleVi} (${questions.length} câu · ${chartCount} biểu đồ/bảng gốc)`,
    sourceSummary: `${exam.examTitleKo} 원본 교재 수록 기출`,
    questionCount: questions.length,
    totalPoints,
    durationMinutes: 100,
    questions,
  };
});

/**
 * All 546 questions from the 7 photographed book exams, with natural topic classification
 * for Topic Drills (so even Section 3 questions #61..#80 can be studied both in DATA_EDITORIAL
 * and with their true difficulty points 3, 4, 5).
 */
export const ALL_BOOK_QUESTIONS: TesatQuestion[] = BOOK_EXAM_SETS.flatMap(
  (set) => set.questions
);
