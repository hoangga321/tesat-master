import {
  TesatQuestion,
  TesatSection,
  TesatSubcategory,
  TesatPoints,
} from "@/lib/schemas/tesat-schema";
import { SECTION_1_QUESTIONS } from "@/lib/data/questions-section1-theory";
import { SECTION_2_QUESTIONS } from "@/lib/data/questions-section2-affairs";
import { SECTION_3_QUESTIONS } from "@/lib/data/questions-section3-applied";
import { VISUAL_CHARTS_CATALOG } from "@/lib/data/visual-charts-catalog";
import { TesatVisualChart } from "@/lib/schemas/tesat-schema";
import {
  BOOK_EXAM_SETS,
  ALL_BOOK_QUESTIONS,
} from "@/lib/data/book-exams-loader";
import crawledRawData from "@/lib/data/crawled-sgsg-raw.json";

export interface RawSgsgCrawledItem {
  articleUrl: string;
  articleTitle: string;
  questionKo: string;
  optionsKo: string[];
  correctIndex: number;
  explanationKo: string;
}

export interface TesatExamSetMetadata {
  setId: string;
  titleKo: string;
  titleVi: string;
  sourceSummary: string;
  questionCount: number;
  totalPoints: number;
  durationMinutes: number;
  questions: TesatQuestion[];
}

const MARKERS = ["①", "②", "③", "④", "⑤"] as const;

/**
 * Classifies a real Korean TESAT question into its natural Subcategory based on economic keywords.
 */
/**
 * Classifies a real Korean TESAT question into its natural Subcategory using weighted keyword scoring:
 * - Primary text (questionKo + optionsKo) carries weight x3
 * - Secondary context (articleTitle + explanationKo) carries weight x1
 */
function classifyKoreanQuestionSubcategory(
  questionKo: string,
  explanationKo: string,
  title: string,
  optionsKo: string[] = []
): TesatSubcategory {
  // 1. Multi-statement <보기> (ㄱ, ㄴ, ㄷ, ㄹ) or explicit table/chart/case analysis -> DATA_EDITORIAL
  if (/ㄱ\s*\.|ㄴ\s*\.|ㄷ\s*\.|<보기>|표는|그래프|보수행렬/.test(questionKo)) {
    return "DATA_EDITORIAL";
  }

  const primary = `${questionKo} ${optionsKo.join(" ")}`;
  const secondary = `${title} ${explanationKo}`;

  const scoreMatches = (regex: RegExp): number => {
    const pMatches = (primary.match(regex) || []).length;
    const sMatches = (secondary.match(regex) || []).length;
    return pMatches * 3 + sMatches;
  };

  const scores: Record<TesatSubcategory, number> = {
    MICRO: scoreMatches(
      /수요|공급|탄력성|기회비용|매몰비용|한계효용|무차별|예산선|독점|과점|완전경쟁|외부효과|공공재|역선택|도덕적\s*해이|가격상한|가격하한|최고가격|최저가격|최저임금|소비자잉여|생산자잉여|총잉여|코즈|담합|리니언시|대체재|보완재|정상재|열등재|기펜재|생산가능곡선|한계비용|한계수입|규모의\s*경제|가격차별/g
    ),
    MACRO: scoreMatches(
      /국내총생산|GDP|디플레이터|소비자물가|물가상승|인플레이션|디플레이션|스태그플레이션|실업률|고용률|경제활동인구|기준금리|중앙은행|한국은행|통화정책|재정정책|본원통화|통화승수|지급준비율|공개시장|필립스|총수요|총공급|경기순환|구축효과|유동성\s*함정|경제성장|조세|세율|래퍼곡선|지니계수|로렌츠|승수효과|한계소비성향/g
    ),
    INTL: scoreMatches(
      /환율|원\/달러|평가절하|평가절상|경상수지|상품수지|서비스수지|본원소득수지|이전소득수지|국제수지|비교우위|절대우위|자유무역|보호무역|관세|수입쿼터|수출|수입|외환보유|구매력평가|빅맥지수|FTA|무역수지|마샬-러너|J커브/g
    ),
    FINANCE_STRATEGY: scoreMatches(
      /주식|채권|듀레이션|회계|재무제표|손익계산서|대차대조표|자기자본|부채비율|유동비율|이자보상배율|배당|펀드|예금|대출|M&A|적대적|포이즌필|황금낙하산|파생상품|선물|옵션|콜옵션|풋옵션|스톡옵션|회사채|국채|PER|PBR|ROE|ROA|EPS|하이\s*리스크|분산투자|포트폴리오|불완전판매|예금자보호|신용등급|유상증자|무상증자|전환사채|교환사채|신주인수권/g
    ),
    CURRENT_ISSUES: scoreMatches(
      /다크패턴|캥거루족|슈링크플레이션|스킴플레이션|그린워싱|탄소국경|RE100|ESG|고령화|디지털세|플랫폼|크라우드|폰지|뱅크런|스테이블코인|CBDC|가상자산|비트코인|블루오션|레드오션|화이트칼라|블랙컨슈머|넛지|베블런|밴드왜건|스놉|피터의\s*원칙|파킨슨|리쇼어링|프렌드쇼어링|디커플링|칩4|공급망/g
    ),
    DATA_EDITORIAL: 0,
  };

  let bestSub: TesatSubcategory = "CURRENT_ISSUES";
  let bestScore = 0;

  for (const sub of [
    "FINANCE_STRATEGY",
    "INTL",
    "MICRO",
    "MACRO",
    "CURRENT_ISSUES",
  ] as TesatSubcategory[]) {
    if (scores[sub] > bestScore) {
      bestScore = scores[sub];
      bestSub = sub;
    }
  }

  return bestSub;
}

function detectNegativeTraps(questionKo: string): string[] {
  const traps: string[] = [];
  for (const token of [
    "옳지 않은 것은",
    "아닌 것은",
    "틀린 것은",
    "거리가 먼 것은",
    "보기 어려운 것은",
    "잘못된 것은",
    "적절하지 않은 것은",
  ]) {
    if (questionKo.includes(token)) traps.push(token);
  }
  return traps;
}

function extractKeyTermsFromKo(text: string): string[] {
  const terms: string[] = [];
  const candidates = [
    { match: /기회비용/, term: "기회비용" },
    { match: /매몰비용/, term: "매몰비용" },
    { match: /탄력성/, term: "수요의 가격탄력성" },
    { match: /한계효용/, term: "한계효용" },
    { match: /외부효과/, term: "외부효과" },
    { match: /역선택|레몬/, term: "역선택" },
    { match: /도덕적 해이|대리인/, term: "도덕적 해이" },
    { match: /구축효과/, term: "구축효과" },
    { match: /유동성/, term: "유동성 함정" },
    { match: /스태그플레이션/, term: "스태그플레이션" },
    { match: /금리|통화/, term: "기준금리" },
    { match: /본원통화|통화승수/, term: "본원통화" },
    { match: /비교우위|무역/, term: "비교우위" },
    { match: /환율|경상수지/, term: "경상수지" },
    { match: /ROE|자기자본|재무|주식/, term: "자기자본이익률 (ROE)" },
    { match: /채권|듀레이션/, term: "듀레이션" },
    { match: /필립스/, term: "필립스 곡선" },
    { match: /코즈/, term: "코즈 정리" },
  ];

  for (const c of candidates) {
    if (c.match.test(text) && !terms.includes(c.term)) {
      terms.push(c.term);
    }
  }
  if (terms.length === 0) terms.push("기준금리", "기회비용");
  return terms.slice(0, 3);
}

/**
 * Separates inline Korean <보기> items (ㄱ. ㄴ. ㄷ. ㄹ.) from the main question stem
 * so they display cleanly in a structured <보기> passage box.
 */
function splitKoreanQuestionAndBogi(rawQuestionKo: string): {
  stemKo: string;
  passageKo?: string;
} {
  const bogiIdx = rawQuestionKo.search(/ㄱ\s*\./);
  if (bogiIdx > 10) {
    const stemKo = rawQuestionKo.slice(0, bogiIdx).trim();
    const bogiRaw = rawQuestionKo
      .slice(bogiIdx)
      .replace(/\s*(?=[ㄴㄷㄹㅁ]\s*\.)/g, "\n")
      .trim();
    return {
      stemKo,
      passageKo: `<보기>\n${bogiRaw}`,
    };
  }
  return { stemKo: rawQuestionKo.trim() };
}

/**
 * Converts a raw crawled Hankyung SGSG question into a strict TesatQuestion object
 * assigned to a specific slot (examNumber 1..80, section, subcategory, points) when building an 80-question matrix,
 * or into its natural classification for the Topic Drill pool.
 * Pure text questions from sgsg.hankyung.com NEVER receive shared/fake charts.
 */
function buildTesatQuestionFromCrawled(
  raw: RawSgsgCrawledItem,
  slot: {
    id: string;
    code: string;
    examNumber: number;
    section: TesatSection;
    subcategory: TesatSubcategory;
    points: TesatPoints;
  }
): TesatQuestion {
  const { stemKo, passageKo } = splitKoreanQuestionAndBogi(raw.questionKo);
  const traps = detectNegativeTraps(raw.questionKo);
  const keyTerms = extractKeyTermsFromKo(
    `${raw.questionKo} ${raw.optionsKo.join(" ")}`
  );
  const cleanExpl =
    raw.explanationKo && raw.explanationKo.length >= 10
      ? raw.explanationKo
      : "한국경제 생글생글 공식 테샛 기출 해설에 근거하여 핵심 경제 원리를 적용합니다.";

  return {
    id: slot.id,
    code: slot.code,
    examNumber: slot.examNumber,
    section: slot.section,
    subcategory: slot.subcategory,
    points: slot.points,
    source: `한경 생글생글 실제기출 (${raw.articleTitle || "테샛 공부합시다"})`,
    questionKo: stemKo,
    questionVi: `[Cần dịch AI] ${stemKo}`,
    passageKo,
    passageVi: passageKo ? `[Cần dịch AI] ${passageKo}` : undefined,
    options: [0, 1, 2, 3, 4].map((idx) => {
      const optKo = (raw.optionsKo[idx] || `선택지 ${idx + 1}`).trim();
      const isAns = idx === raw.correctIndex;
      return {
        index: idx,
        marker: MARKERS[idx],
        textKo: optKo,
        textVi: `[Phương án ${MARKERS[idx]}] ${optKo}`,
        eliminationLogicVi: isAns
          ? `✅ ĐÁP ÁN ĐÚNG (${MARKERS[idx]}): [해설 gốc 한경] ${cleanExpl}`
          : `❌ Loại ${MARKERS[idx]}: Không phù hợp với nguyên lý trong giải thích chính thức của Hankyung TESAT (Đáp án đúng là ${MARKERS[raw.correctIndex]}).`,
        isNearMiss: idx === (raw.correctIndex + 1) % 5,
        nearMissReasonVi:
          idx === (raw.correctIndex + 1) % 5
            ? "Phương án nhiễu sát đáp án đúng (Near-Miss): Hãy đối chiếu kỹ với phần [해설] chính thức của 한국경제."
            : undefined,
        socraticQuestionVi:
          idx === (raw.correctIndex + 1) % 5
            ? `Theo giải thích của Hankyung TESAT: "${cleanExpl.slice(0, 140)}..." — Vì sao phương án ${MARKERS[raw.correctIndex]} mới là đáp án chính xác?`
            : undefined,
      };
    }),
    correctIndex: raw.correctIndex,
    negativeTrapTokens: traps,
    hintLevel1Vi:
      traps.length > 0
        ? `⚠️ Cảnh báo bẫy phủ định: Đề bài chứa cụm từ '${traps.join(", ")}' (Chọn phát biểu SAI / KHÔNG thuộc).`
        : "Đọc kỹ câu hỏi gốc tiếng Hàn và xác định từ khóa kinh tế trọng tâm.",
    hintLevel2Vi: `📘 Giải thích gốc từ 한국경제 생글생글: ${cleanExpl}`,
    hintLevel3Vi: `Đáp án chính thức của Hankyung TESAT là ${MARKERS[raw.correctIndex]} (${raw.optionsKo[raw.correctIndex]}).`,
    coreFormula: `한경 TESAT 기출 원리 · ${slot.subcategory} (${slot.points}점)`,
    keyTerms,
    tags: ["한경실제기출", slot.subcategory, `${slot.points}점`],
  };
}

/**
 * Exact 80-Question Matrix Blueprint for any official Hankyung TESAT exam set:
 * - #1..#15: THEORY / MICRO (10 x 3pt, 5 x 4pt)
 * - #16..#27: THEORY / MACRO (8 x 3pt, 4 x 4pt)
 * - #28..#30: THEORY / INTL (2 x 3pt, 1 x 4pt)
 * - #31..#45: CURRENT_AFFAIRS / CURRENT_ISSUES (10 x 3pt, 5 x 4pt)
 * - #46..#60: CURRENT_AFFAIRS / FINANCE_STRATEGY (10 x 3pt, 5 x 4pt)
 * - #61..#80: APPLIED / DATA_EDITORIAL (20 x 5pt)
 */
function getMatrixSlotSpec(examNumber: number): {
  section: TesatSection;
  subcategory: TesatSubcategory;
  points: TesatPoints;
} {
  if (examNumber <= 15) {
    return {
      section: "THEORY",
      subcategory: "MICRO",
      points: examNumber <= 10 ? 3 : 4,
    };
  }
  if (examNumber <= 27) {
    return {
      section: "THEORY",
      subcategory: "MACRO",
      points: examNumber <= 23 ? 3 : 4,
    };
  }
  if (examNumber <= 30) {
    return {
      section: "THEORY",
      subcategory: "INTL",
      points: examNumber <= 29 ? 3 : 4,
    };
  }
  if (examNumber <= 45) {
    return {
      section: "CURRENT_AFFAIRS",
      subcategory: "CURRENT_ISSUES",
      points: examNumber <= 40 ? 3 : 4,
    };
  }
  if (examNumber <= 60) {
    return {
      section: "CURRENT_AFFAIRS",
      subcategory: "FINANCE_STRATEGY",
      points: examNumber <= 55 ? 3 : 4,
    };
  }
  return {
    section: "APPLIED",
    subcategory: "DATA_EDITORIAL",
    points: 5,
  };
}

/**
 * Official Hankyung TESAT chart distribution for Set 1:
 * Only ~15-20% of questions in a real 80-question exam contain diagrams/tables.
 * Questions #1-#3, #5, #7-#9, #11, #13-#14, #16-#18, #20, #22-#43, #45-#60 are pure text questions.
 * Each diagram below is mapped 1-to-1 to the specific question testing that exact model.
 */
const SET1_UNIQUE_CHARTS_BY_EXAM_NUMBER: Record<number, TesatVisualChart> = {
  2: VISUAL_CHARTS_CATALOG.ELASTICITY_REVENUE,
  3: VISUAL_CHARTS_CATALOG.INDIFFERENCE_BUDGET,
  4: VISUAL_CHARTS_CATALOG.PRICE_CONTROL_CEILING_FLOOR,
  6: VISUAL_CHARTS_CATALOG.EXTERNALITY_PIGOU,
  10: VISUAL_CHARTS_CATALOG.TAX_SUBSIDY_DWL,
  12: VISUAL_CHARTS_CATALOG.GAME_THEORY_MATRIX,
  15: VISUAL_CHARTS_CATALOG.SUPPLY_DEMAND_SHIFT,
  19: VISUAL_CHARTS_CATALOG.AD_AS_MACRO,
  21: VISUAL_CHARTS_CATALOG.PHILLIPS_CURVE,
  26: VISUAL_CHARTS_CATALOG.BOK_RATE_INFLATION_TREND,
  28: VISUAL_CHARTS_CATALOG.EXCHANGE_RATE_BOP_CHART,
  29: VISUAL_CHARTS_CATALOG.PPF_OPPORTUNITY_COST,
  44: VISUAL_CHARTS_CATALOG.LORENZ_GINI,
  60: VISUAL_CHARTS_CATALOG.CORP_FINANCE_BAR_LINE,
};

// 1. Set 1: Curated Full Bilingual 80-Question Exam Set (1-to-1 unique charts + 20 unique dataTables in #61..#80)
export const FULL_80_TESAT_QUESTIONS: TesatQuestion[] = [
  ...SECTION_1_QUESTIONS,
  ...SECTION_2_QUESTIONS,
  ...SECTION_3_QUESTIONS,
].map((q) => ({
  ...q,
  visualChart: q.visualChart ?? SET1_UNIQUE_CHARTS_BY_EXAM_NUMBER[q.examNumber],
}));

// 2. Load all 473 real crawled Hankyung SGSG questions & deduplicate against the 546 official book questions
const rawCrawledItemsAll: RawSgsgCrawledItem[] =
  (crawledRawData as { questions?: RawSgsgCrawledItem[] })?.questions ?? [];

function normalizeKoForDedup(s?: string): string {
  return (s || "").replace(/[^가-힣a-zA-Z0-9]/g, "").toLowerCase();
}

const bookFingerprints = ALL_BOOK_QUESTIONS.map((bq) => ({
  normStem: normalizeKoForDedup(bq.questionKo),
  normPassage: normalizeKoForDedup(bq.passageKo),
  normOpts: normalizeKoForDedup(bq.options.map((o) => o.textKo).join("")),
}));

function isDuplicateOfBookQuestion(
  questionKo: string,
  optionsKo: string[],
  passageKo?: string
): boolean {
  const nStem = normalizeKoForDedup(questionKo);
  const nPass = normalizeKoForDedup(passageKo);
  const nOpts = normalizeKoForDedup(optionsKo.join(""));

  return bookFingerprints.some(
    (bf) =>
      (nStem.length >= 16 && bf.normStem === nStem) ||
      (nOpts.length >= 20 && bf.normOpts === nOpts) ||
      (nPass.length >= 28 && bf.normPassage === nPass) ||
      (bf.normPassage.length >= 28 && nStem.includes(bf.normPassage.slice(0, 28)))
  );
}

const rawCrawledItems: RawSgsgCrawledItem[] = rawCrawledItemsAll.filter(
  (item) => !isDuplicateOfBookQuestion(item.questionKo, item.optionsKo)
);

const deduplicatedSet1Questions: TesatQuestion[] = FULL_80_TESAT_QUESTIONS.filter(
  (q) =>
    !isDuplicateOfBookQuestion(
      q.questionKo,
      q.options.map((o) => o.textKo),
      q.passageKo
    )
);

function buildCrawledExamSets(): {
  examSets: TesatExamSetMetadata[];
  allQuestionsPool: TesatQuestion[];
} {
  // Put the 7 Official Photographed Book Exam Sets FIRST, followed by Set 1 & Archive Sets
  const examSets: TesatExamSetMetadata[] = [
    ...BOOK_EXAM_SETS.map((bs) => ({
      setId: bs.setId,
      titleKo: bs.titleKo,
      titleVi: bs.titleVi,
      sourceSummary: bs.sourceSummary,
      questionCount: bs.questionCount,
      totalPoints: bs.totalPoints,
      durationMinutes: bs.durationMinutes,
      questions: bs.questions,
    })),
    {
      setId: "SET_1",
      titleKo: "제1회 한경 TESAT 마스터 표준 모의고사 (한-베 완벽 번역본)",
      titleVi: "Bộ đề Chuẩn Ma trận: Hankyung TESAT Master (80 câu · Song ngữ Hàn-Việt chi tiết)",
      sourceSummary: "한경 오늘의 테샛 · 기출복원 · BOK ECOS / KOSIS",
      questionCount: FULL_80_TESAT_QUESTIONS.length,
      totalPoints: 300,
      durationMinutes: 100,
      questions: FULL_80_TESAT_QUESTIONS,
    },
  ];

  // Start ALL_TESAT_QUESTIONS_POOL with all 546 Book Questions (prioritized over any duplicate!)
  const allQuestionsPool: TesatQuestion[] = [
    ...ALL_BOOK_QUESTIONS,
    ...deduplicatedSet1Questions,
  ];

  // Bucket all 473 crawled questions by their natural Subcategory and sort each bucket from shorter (3pt) to longer/complex (4-5pt)
  const buckets: Record<TesatSubcategory, RawSgsgCrawledItem[]> = {
    MICRO: [],
    MACRO: [],
    INTL: [],
    CURRENT_ISSUES: [],
    FINANCE_STRATEGY: [],
    DATA_EDITORIAL: [],
  };

  for (const item of rawCrawledItems) {
    const sub = classifyKoreanQuestionSubcategory(
      item.questionKo,
      item.explanationKo,
      item.articleTitle,
      item.optionsKo
    );
    buckets[sub].push(item);
  }

  for (const key of Object.keys(buckets) as TesatSubcategory[]) {
    buckets[key].sort((a, b) => a.questionKo.length - b.questionKo.length);
  }

  const getNaturalSpec = (raw: RawSgsgCrawledItem): {
    section: TesatSection;
    subcategory: TesatSubcategory;
    points: TesatPoints;
  } => {
    const naturalSub = classifyKoreanQuestionSubcategory(
      raw.questionKo,
      raw.explanationKo,
      raw.articleTitle,
      raw.optionsKo
    );
    const naturalSec: TesatSection =
      naturalSub === "MICRO" || naturalSub === "MACRO" || naturalSub === "INTL"
        ? "THEORY"
        : naturalSub === "DATA_EDITORIAL"
        ? "APPLIED"
        : "CURRENT_AFFAIRS";
    const totalLen =
      raw.questionKo.length +
      raw.optionsKo.reduce((acc, o) => acc + o.length, 0);
    const naturalPts: TesatPoints =
      naturalSub === "DATA_EDITORIAL"
        ? totalLen > 230
          ? 5
          : totalLen > 165
          ? 4
          : 3
        : totalLen > 195
        ? 5
        : totalLen > 135
        ? 4
        : 3;
    return { section: naturalSec, subcategory: naturalSub, points: naturalPts };
  };

  const takeFromBucket = (preferredSub: TesatSubcategory, preferComplex: boolean): RawSgsgCrawledItem => {
    const primary = buckets[preferredSub];
    if (primary.length > 0) {
      return preferComplex ? primary.pop()! : primary.shift()!;
    }
    const fallbackOrder: TesatSubcategory[] =
      preferredSub === "DATA_EDITORIAL"
        ? ["MACRO", "MICRO", "FINANCE_STRATEGY", "CURRENT_ISSUES", "INTL"]
        : preferredSub === "CURRENT_ISSUES" || preferredSub === "FINANCE_STRATEGY"
        ? ["FINANCE_STRATEGY", "CURRENT_ISSUES", "MACRO", "MICRO", "INTL", "DATA_EDITORIAL"]
        : ["MICRO", "MACRO", "INTL", "CURRENT_ISSUES", "FINANCE_STRATEGY", "DATA_EDITORIAL"];

    for (const fb of fallbackOrder) {
      if (buckets[fb].length > 0) {
        return preferComplex ? buckets[fb].pop()! : buckets[fb].shift()!;
      }
    }
    return rawCrawledItems[0];
  };

  const totalExtraSets = Math.floor(rawCrawledItems.length / 80); // 473 / 80 = 5 full sets (Sets 2..6)
  for (let s = 0; s < totalExtraSets; s++) {
    const setNumber = s + 2;
    const setQuestions: TesatQuestion[] = [];

    for (let examNumber = 1; examNumber <= 80; examNumber++) {
      const spec = getMatrixSlotSpec(examNumber);
      const preferComplex = spec.points >= 4;
      const raw = takeFromBucket(spec.subcategory, preferComplex);
      const naturalSpec = getNaturalSpec(raw);
      const qId = `tesat-s${setNumber}-q-${String(examNumber).padStart(3, "0")}`;
      const qCode = `HK-SET${setNumber}-${String(examNumber).padStart(2, "0")}`;

      // 1) In the 80-question Mock Exam Set, slot follows the official 80-Q matrix
      setQuestions.push(
        buildTesatQuestionFromCrawled(raw, {
          id: qId,
          code: qCode,
          examNumber,
          section: spec.section,
          subcategory: spec.subcategory,
          points: spec.points,
        })
      );

      // 2) In ALL_TESAT_QUESTIONS_POOL (Topic Drills), preserve 100% true natural topic & difficulty!
      allQuestionsPool.push(
        buildTesatQuestionFromCrawled(raw, {
          id: qId,
          code: qCode,
          examNumber,
          section: naturalSpec.section,
          subcategory: naturalSpec.subcategory,
          points: naturalSpec.points,
        })
      );
    }

    examSets.push({
      setId: `SET_${setNumber}`,
      titleKo: `제${setNumber}회 한국경제 생글생글 실제 기출 모의고사 (80문항·300점)`,
      titleVi: `Bộ đề số ${setNumber}: Đề thi thật Hankyung TESAT - 생글생글 Archive (80 câu · 300 điểm)`,
      sourceSummary: "sgsg.hankyung.com/tesat/study 실제 기출 아카이브",
      questionCount: 80,
      totalPoints: 300,
      durationMinutes: 100,
      questions: setQuestions,
    });
  }

  // Remaining crawled questions in buckets added to Topic Drill Pool using their natural topic classification
  const remainingItems: RawSgsgCrawledItem[] = [
    ...buckets.MICRO,
    ...buckets.MACRO,
    ...buckets.INTL,
    ...buckets.CURRENT_ISSUES,
    ...buckets.FINANCE_STRATEGY,
    ...buckets.DATA_EDITORIAL,
  ];

  remainingItems.forEach((raw, idx) => {
    const naturalSpec = getNaturalSpec(raw);

    allQuestionsPool.push(
      buildTesatQuestionFromCrawled(raw, {
        id: `tesat-extra-q-${String(idx + 1).padStart(3, "0")}`,
        code: `HK-ARCHIVE-${String(totalExtraSets * 80 + idx + 1).padStart(3, "0")}`,
        examNumber: (idx % 80) + 1,
        section: naturalSpec.section,
        subcategory: naturalSpec.subcategory,
        points: naturalSpec.points,
      })
    );
  });

  // Sort Topic Drill Pool: Official Book Questions (book-*) come FIRST, then sorted by points (3pt -> 4pt -> 5pt)
  allQuestionsPool.sort((a, b) => {
    const aIsBook = a.id.startsWith("book-") ? 0 : 1;
    const bIsBook = b.id.startsWith("book-") ? 0 : 1;
    if (aIsBook !== bIsBook) return aIsBook - bIsBook;
    return a.points - b.points;
  });

  return { examSets, allQuestionsPool };
}

const builtBank = buildCrawledExamSets();

export const TESAT_EXAM_SETS: TesatExamSetMetadata[] = builtBank.examSets;
export const ALL_TESAT_QUESTIONS_POOL: TesatQuestion[] = builtBank.allQuestionsPool;

export function getExamSetById(setId: string): TesatExamSetMetadata {
  return TESAT_EXAM_SETS.find((s) => s.setId === setId) ?? TESAT_EXAM_SETS[0];
}

export function getQuestionsBySection(section: TesatSection): TesatQuestion[] {
  return ALL_TESAT_QUESTIONS_POOL.filter((q) => q.section === section);
}

export function getQuestionsBySubcategory(subcategory: TesatSubcategory): TesatQuestion[] {
  return ALL_TESAT_QUESTIONS_POOL.filter((q) => q.subcategory === subcategory);
}

export function getQuestionByIdOrCode(idOrCode: string): TesatQuestion | undefined {
  return ALL_TESAT_QUESTIONS_POOL.find((q) => q.id === idOrCode || q.code === idOrCode);
}
