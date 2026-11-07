import {
  SentenceDeconstruction,
  SentenceDeconstructionSchema,
  TesatQuestion,
  TwinQuestion,
  TwinQuestionSchema,
} from "@/lib/schemas/tesat-schema";
import { SEED_VOCABULARY } from "@/lib/data/vocabulary-seed";

export type LLMProviderName = "gemini" | "openai" | "anthropic" | "mock";

export const DEFAULT_CONFIGURED_GEMINI_KEY =
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? "";

export const DEFAULT_GEMINI_MODEL = "gemini-flash-lite-latest";

export interface LLMRuntimeStatus {
  activeProvider: LLMProviderName;
  configuredProvider: string;
  activeModel: string;
  isLiveApiActive: boolean;
  fallbackReason?: string;
}

export interface TwinAnswerEvaluation {
  isCorrect: boolean;
  awardedPoints: number;
  maxPoints: number;
  selectedMarker: string;
  correctMarker: string;
  headlineVi: string;
  detailedEvaluationVi: string;
  hintIfWrongVi: string;
  generatedByLiveAi: boolean;
}

export interface RegularQuestionAiHelp {
  summaryHintVi: string;
  examTrickVi: string;
  stepByStepReasoningVi: string[];
  optionAnalysisVi: string;
  economicTakeawayVi: string;
  generatedByLiveAi: boolean;
  modelUsed: string;
}

export interface QuestionTranslationResult {
  questionVi: string;
  passageVi?: string;
  optionsVi: [string, string, string, string, string];
  generatedByLiveAi: boolean;
}

export interface ExtractedQuestionVocabItem {
  termKo: string;
  hanja: string;
  hanViet: string;
  termVi: string;
  contextVi: string;
}

/**
 * Common Interface for all LLM Providers (Gemini, OpenAI, Anthropic, and Mock Fallback).
 */
export interface LLMService {
  getStatus(): LLMRuntimeStatus;

  deconstructAndHint(
    question: TesatQuestion,
    selectedOptionIndex?: number
  ): Promise<SentenceDeconstruction>;

  generateIsomorphicTwin(question: TesatQuestion): Promise<TwinQuestion>;

  evaluateTwinAnswer(
    twin: TwinQuestion,
    selectedOptionIndex: number
  ): Promise<TwinAnswerEvaluation>;

  askAiTutorHelp(
    question: TesatQuestion,
    selectedOptionIndex?: number,
    userPrompt?: string
  ): Promise<RegularQuestionAiHelp>;

  translateQuestionLive(
    question: TesatQuestion
  ): Promise<QuestionTranslationResult>;

  extractVocabForQuestionLive(
    question: TesatQuestion
  ): Promise<ExtractedQuestionVocabItem[]>;
}

const NEGATIVE_TRAP_DICTIONARY: Array<{ pattern: string; warningVi: string }> = [
  {
    pattern: "옳지 않은 것은",
    warningVi:
      "CẢNH BÁO BẪY PHỦ ĐỊNH: Đề yêu cầu tìm phát biểu SAI ('옳지 않은 것은'). 4 câu đúng sẽ bị loại!",
  },
  {
    pattern: "아닌 것은",
    warningVi:
      "CẢNH BÁO BẪY PHỦ ĐỊNH: Đề hỏi trường hợp KHÔNG PHẢI ('아닌 것은'). Đừng chọn ngay phương án đúng đầu tiên!",
  },
  {
    pattern: "틀린 것은",
    warningVi: "CẢNH BÁO BẪY PHỦ ĐỊNH: Đề yêu cầu chọn câu SAI ('틀린 것은').",
  },
  {
    pattern: "거리가 먼 것은",
    warningVi:
      "CẢNH BÁO BẪY PHỦ ĐỊNH: Đề hỏi phương án ÍT LIÊN QUAN / SAI KHÁC NHẤT ('거리가 먼 것은').",
  },
  {
    pattern: "모두 고른 것은",
    warningVi:
      "CẢNH BÁO TỔ HỢP (ㄱ, ㄴ, ㄷ, ㄹ): Kiểm tra từng mệnh đề độc lập và loại trừ đáp án ngay khi xác định được 1 mệnh đề sai.",
  },
];

/**
 * Checks whether a Vietnamese field is actually untranslated Korean or a placeholder string.
 * Allows Vietnamese translations that include parenthetical Korean economic terms, e.g. "Chi phí cơ hội (기회비용)".
 */
export function isUntranslatedPlaceholder(text?: string): boolean {
  if (!text || text.trim().length === 0) return true;
  if (
    text.includes("[Cần dịch AI]") ||
    text.includes("[Đề thi thật") ||
    text.includes("[Câu hỏi") ||
    text.includes("[Phương án") ||
    text.includes("[Bản dịch") ||
    text.includes("Xem giải thích gốc")
  ) {
    return true;
  }

  const hasVietnameseDiacritics =
    /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(
      text
    );

  // Strip parenthetical or bracketed Korean annotations such as "(기회비용)" or "[예금자보호제도]"
  const textWithoutParentheses = text
    .replace(/\([^)]*\)/g, " ")
    .replace(/\[[^\]]*\]/g, " ");

  const remainingHangulMatches = textWithoutParentheses.match(/[가-힣]/g) ?? [];
  const totalNonSpaceLength = Math.max(
    1,
    textWithoutParentheses.replace(/\s+/g, "").length
  );
  const hangulRatio = remainingHangulMatches.length / totalNonSpaceLength;

  if (hasVietnameseDiacritics) {
    // If predominantly Vietnamese with only brief Korean term references, it is already translated
    return hangulRatio > 0.35 || /[가-힣]{8,}/.test(textWithoutParentheses);
  }

  // If no Vietnamese diacritics and contains Korean Hangul syllables, it needs translation
  if (/[가-힣]{2,}/.test(text)) {
    return true;
  }
  return false;
}

const BUILTIN_ECON_GLOSSARY: Record<
  string,
  { hanja: string; hanViet: string; termVi: string; noteVi: string }
> = {
  기회비용: {
    hanja: "機會費用",
    hanViet: "Cơ hội phí dụng",
    termVi: "Chi phí cơ hội",
    noteVi: "Giá trị lớn nhất của phương án bị bỏ qua (Chi phí hiện + Chi phí ẩn).",
  },
  매몰비용: {
    hanja: "埋沒費用",
    hanViet: "Mai một phí dụng",
    termVi: "Chi phí chìm",
    noteVi: "Chi phí đã chi ra trong quá khứ không thể thu hồi — phải bỏ qua khi ra quyết định.",
  },
  기준금리: {
    hanja: "基準金利",
    hanViet: "Tiêu chuẩn kim lợi",
    termVi: "Lãi suất cơ bản (BOK)",
    noteVi: "Lãi suất điều hành do Ngân hàng Trung ương Hàn Quốc (한국은행) công bố.",
  },
  환율: {
    hanja: "換率",
    hanViet: "Hoán suất",
    termVi: "Tỷ giá hối đoái",
    noteVi: "Tỷ giá tăng (환율 상승) = đồng Won mất giá -> Xuất khẩu có lợi, Nhập khẩu bất lợi.",
  },
  경상수지: {
    hanja: "經常收支",
    hanViet: "Kinh thường thu chi",
    termVi: "Cán cân vãng lai",
    noteVi: "Gồm cán cân hàng hóa, dịch vụ, thu nhập sơ cấp và thu nhập thứ cấp.",
  },
  소비자잉여: {
    hanja: "消費者剩餘",
    hanViet: "Tiêu phí giả thặng dư",
    termVi: "Thặng dư tiêu dùng",
    noteVi: "Chênh lệch giữa mức giá tối đa sẵn lòng trả và giá thị trường thực tế.",
  },
  생산자잉여: {
    hanja: "生産者剩餘",
    hanViet: "Sản xuất giả thặng dư",
    termVi: "Thặng dư sản xuất",
    noteVi: "Chênh lệch giữa giá bán thị trường và chi phí biên tối thiểu của doanh nghiệp.",
  },
  외부효과: {
    hanja: "外部效果",
    hanViet: "Ngoại bộ hiệu quả",
    termVi: "Ngoại tác (Tích cực / Tiêu cực)",
    noteVi: "Tác động ra bên ngoài thị trường không qua giá cả (ô nhiễm, tiêm chủng...).",
  },
  역선택: {
    hanja: "逆選擇",
    hanViet: "Nghịch lựa chọn",
    termVi: "Lựa chọn bất lợi (Adverse Selection)",
    noteVi: "Xảy ra TRƯỚC giao dịch do thông tin bất cân xứng.",
  },
  도덕적해이: {
    hanja: "道德的解弛",
    hanViet: "Đạo đức giải đãi",
    termVi: "Rủi ro đạo đức (Moral Hazard)",
    noteVi: "Xảy ra SAU khi ký hợp đồng do ỷ lại vào bảo hiểm/bảo lãnh.",
  },
  공공재: {
    hanja: "公共財",
    hanViet: "Công cộng tài",
    termVi: "Hàng hóa công cộng",
    noteVi: "Có tính không cạnh tranh (비경합성) và không loại trừ (비배제성).",
  },
  탄력성: {
    hanja: "彈力性",
    hanViet: "Đàn lực tính",
    termVi: "Độ co giãn (Elasticity)",
    noteVi: "Đo mức độ phản ứng của lượng cầu/cung khi giá hoặc thu nhập thay đổi 1%.",
  },
  국내총생산: {
    hanja: "國內總生産",
    hanViet: "Quốc nội tổng sản xuất",
    termVi: "Tổng sản phẩm quốc nội (GDP)",
    noteVi: "Tổng giá trị thị trường của hàng hóa/dịch vụ cuối cùng sản xuất trong phạm vi lãnh thổ.",
  },
  물가: {
    hanja: "物價",
    hanViet: "Vật giá",
    termVi: "Mức giá chung / Lạm phát",
    noteVi: "Đo lường qua CPI (Chỉ số giá tiêu dùng) hoặc GDP Deflator.",
  },
  실업률: {
    hanja: "失業率",
    hanViet: "Thất nghiệp suất",
    termVi: "Tỷ lệ thất nghiệp",
    noteVi: "Số người thất nghiệp / Lực lượng lao động (경제활동인구) × 100.",
  },
};

/**
 * High-availability Korean -> Vietnamese neural translation fallback if Gemini Free Tier hits 429 rate-limit.
 */
async function translateTextKoToViBackup(koText: string): Promise<string> {
  if (!koText || !/[가-힣]/.test(koText)) return koText;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ko&tl=vi&dt=t&q=${encodeURIComponent(
      koText
    )}`;
    const res = await fetch(url);
    if (!res.ok) return koText;
    const data = await res.json();
    if (Array.isArray(data?.[0])) {
      return data[0].map((seg: unknown[]) => String(seg?.[0] ?? "")).join("");
    }
  } catch {
    // ignore
  }
  return koText;
}

function stripAnswerSpoilersFromVocabText(text: string): string {
  if (!text) return "";
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(
      (sentence) =>
        !/đáp án|phương án đúng|lựa chọn đúng|chọn\s*[①②③④⑤1-5]|[①②③④⑤]\s*là\s*đúng|vì\s*vậy\s*chọn/i.test(
          sentence
        )
    )
    .join(" ")
    .trim();
}

export function scanLocalVocabInQuestion(
  question: TesatQuestion
): ExtractedQuestionVocabItem[] {
  const fullKoText = `${question.questionKo} ${question.passageKo ?? ""} ${question.options
    .map((o) => o.textKo)
    .join(" ")}`;

  const matched: ExtractedQuestionVocabItem[] = [];
  const seen = new Set<string>();

  // 1. Match curated SEED_VOCABULARY flashcards appearing directly in the question/options text
  for (const v of SEED_VOCABULARY) {
    const baseTerm = v.termKo.split("(")[0].trim();
    if (baseTerm.length >= 2 && fullKoText.includes(baseTerm)) {
      if (!seen.has(v.termKo)) {
        seen.add(v.termKo);
        matched.push({
          termKo: v.termKo,
          hanja: v.hanja,
          hanViet: v.hanViet,
          termVi: v.termVi,
          contextVi: stripAnswerSpoilersFromVocabText(
            `${v.definitionVi} (Gốc từ Hán-Hàn: ${v.mnemonicVi})`
          ),
        });
      }
    }
  }

  // 2. Match built-in Korean Economic Glossary terms appearing in the question
  for (const [koKey, entry] of Object.entries(BUILTIN_ECON_GLOSSARY)) {
    if (fullKoText.includes(koKey) && !seen.has(koKey)) {
      seen.add(koKey);
      matched.push({
        termKo: koKey,
        hanja: entry.hanja,
        hanViet: entry.hanViet,
        termVi: entry.termVi,
        contextVi: stripAnswerSpoilersFromVocabText(entry.noteVi),
      });
    }
  }

  // 3. Include neutral keyTerms that appear in the question stem/options (NEVER include coreFormula or hints that could spoil the answer!)
  for (const rawKeyTerm of question.keyTerms) {
    const cleanKey = rawKeyTerm.trim();
    if (
      !cleanKey ||
      seen.has(cleanKey) ||
      cleanKey.includes("TESAT") ||
      cleanKey.includes("기출")
    ) {
      continue;
    }
    const compactKey = cleanKey.replace(/\s+/g, "");
    const glossaryHit = BUILTIN_ECON_GLOSSARY[compactKey];
    seen.add(cleanKey);
    matched.push({
      termKo: cleanKey,
      hanja: glossaryHit?.hanja ?? "韓經 어휘",
      hanViet: glossaryHit?.hanViet ?? "Thuật ngữ trong đề",
      termVi: glossaryHit?.termVi ?? `Thuật ngữ tiếng Hàn: ${cleanKey}`,
      contextVi:
        glossaryHit?.noteVi ??
        "Từ khóa xuất hiện trong nội dung câu hỏi. Chỉ hiển thị nghĩa từ vựng trung lập (không tiết lộ đáp án đúng để bạn tự suy luận).",
    });
  }

  if (matched.length === 0) {
    // Extract 2-5 syllable Korean words from the question stem as neutral vocabulary
    const koWords = Array.from(
      new Set(question.questionKo.match(/[가-힣]{2,6}/g) ?? [])
    ).slice(0, 4);
    for (const w of koWords) {
      matched.push({
        termKo: w,
        hanja: "韓經 어휘",
        hanViet: "Từ vựng trong đề",
        termVi: `Từ khóa trong câu hỏi (${w})`,
        contextVi:
          "Đang tải giải nghĩa từ điển trung lập từ AI (không tiết lộ đáp án của câu hỏi).",
      });
    }
  }

  return matched.slice(0, 6);
}

/**
 * Deterministic, Zod-validated Mock LLM Service (used only when API_KEY is explicitly empty).
 */
export class MockLLMService implements LLMService {
  private configuredProvider: string;
  private fallbackReason: string;

  constructor(
    configuredProvider = "gemini",
    fallbackReason = "API_KEY is empty — running in Zod-validated MockLLMService mode"
  ) {
    this.configuredProvider = configuredProvider;
    this.fallbackReason = fallbackReason;
  }

  getStatus(): LLMRuntimeStatus {
    return {
      activeProvider: "mock",
      configuredProvider: this.configuredProvider,
      activeModel: "mock-deterministic",
      isLiveApiActive: false,
      fallbackReason: this.fallbackReason,
    };
  }

  async deconstructAndHint(
    question: TesatQuestion,
    selectedOptionIndex?: number
  ): Promise<SentenceDeconstruction> {
    const detectedTrapTokens: SentenceDeconstruction["detectedTrapTokens"] = [];

    for (const trap of NEGATIVE_TRAP_DICTIONARY) {
      if (
        question.questionKo.includes(trap.pattern) ||
        question.negativeTrapTokens.includes(trap.pattern)
      ) {
        detectedTrapTokens.push({
          tokenKo: trap.pattern,
          warningVi: trap.warningVi,
        });
      }
    }

    const extractedVariables = question.keyTerms.map((termKo) => {
      const matchedVocab = SEED_VOCABULARY.find(
        (v) =>
          v.termKo === termKo ||
          v.termKo.includes(termKo) ||
          termKo.includes(v.termKo)
      );
      return {
        termKo,
        hanViet: matchedVocab?.hanViet ?? "Thuật ngữ Kinh tế Hàn Quốc",
        termVi: matchedVocab?.termVi ?? termKo,
        roleInQuestion:
          matchedVocab?.mnemonicVi ??
          `Biến số trọng tâm trong công thức: ${question.coreFormula}`,
      };
    });

    const selectedOpt =
      selectedOptionIndex !== undefined &&
      selectedOptionIndex >= 0 &&
      selectedOptionIndex < 5
        ? question.options[selectedOptionIndex]
        : undefined;

    const isSelectedNearMiss = Boolean(
      selectedOpt &&
        selectedOptionIndex !== question.correctIndex &&
        selectedOpt.isNearMiss
    );

    const nearMissAnalysis: SentenceDeconstruction["nearMissAnalysis"] =
      isSelectedNearMiss && selectedOpt
        ? {
            isSelectedNearMiss: true,
            diagnosticVi:
              selectedOpt.nearMissReasonVi ??
              `Bạn đã chọn phương án ${selectedOpt.marker} — đây là bẫy Near-Miss điển hình của Hankyung TESAT (đúng khái niệm nhưng ngược chiều tác động hoặc nhầm mẫu số).`,
            socraticPromptVi:
              selectedOpt.socraticQuestionVi ??
              `Hãy kiểm tra lại công thức ${question.coreFormula}: nếu biến số đầu vào dịch chuyển theo đề bài, chiều biến động của kết quả sẽ tăng hay giảm?`,
          }
        : {
            isSelectedNearMiss: false,
            diagnosticVi:
              selectedOptionIndex === question.correctIndex
                ? "Chính xác! Bạn đã nắm vững bản chất kinh tế và vượt qua các phương án nhiễu."
                : "Hãy sử dụng Gợi ý phân tầng (Level 1 → Level 3) để loại trừ các phương án nhiễu theo chuẩn TESAT.",
            socraticPromptVi: `Câu hỏi tư duy Socratic: Trong mô hình [${question.coreFormula}], yếu tố nào quyết định sự khác biệt giữa đáp án đúng ${question.options[question.correctIndex].marker} và các phương án còn lại?`,
          };

    const payload: SentenceDeconstruction = {
      originalKo: question.questionKo,
      translatedVi: question.questionVi,
      hasNegativeTrap: detectedTrapTokens.length > 0,
      detectedTrapTokens,
      extractedVariables,
      progressiveHints: {
        level1SyntacticTrapVi: question.hintLevel1Vi,
        level2EconomicFrameworkVi: `${question.hintLevel2Vi} | Mô hình/Công thức: ${question.coreFormula}`,
        level3EliminationStepsVi: [
          `① ${question.options[0].eliminationLogicVi}`,
          `② ${question.options[1].eliminationLogicVi}`,
          `③ ${question.options[2].eliminationLogicVi}`,
          `④ ${question.options[3].eliminationLogicVi}`,
          `⑤ ${question.options[4].eliminationLogicVi}`,
        ],
      },
      nearMissAnalysis,
    };

    return SentenceDeconstructionSchema.parse(payload);
  }

  async generateIsomorphicTwin(question: TesatQuestion): Promise<TwinQuestion> {
    const rotatedCorrectIndex = (question.correctIndex + 2) % 5;
    const markers = ["①", "②", "③", "④", "⑤"] as const;

    const originalOptions = [...question.options];
    const correctOption = originalOptions[question.correctIndex];
    const distractors = originalOptions.filter(
      (_, idx) => idx !== question.correctIndex
    );

    const newOptionsList: TwinQuestion["options"] = [];
    let dIdx = 0;
    for (let i = 0; i < 5; i++) {
      if (i === rotatedCorrectIndex) {
        newOptionsList.push({
          index: i,
          marker: markers[i],
          textKo: `[쌍둥이 변형] ${correctOption.textKo}`,
          textVi: `[Biến thể tương đương] ${correctOption.textVi}`,
          eliminationLogicVi: `ĐÁP ÁN ĐÚNG (Twin): ${correctOption.eliminationLogicVi}`,
        });
      } else {
        const d = distractors[dIdx++];
        newOptionsList.push({
          index: i,
          marker: markers[i],
          textKo: d.textKo,
          textVi: d.textVi,
          eliminationLogicVi: d.eliminationLogicVi,
        });
      }
    }

    const twinPayload: TwinQuestion = {
      parentQuestionCode: question.code,
      isomorphicCode: `${question.code}-TWIN`,
      section: question.section,
      subcategory: question.subcategory,
      points: question.points,
      questionKo: `[한경 TESAT 적응형 쌍둥이 문제 · ${question.points}점] ${question.questionKo.replace(
        "10%",
        "20%"
      )} (핵심 원리 재검증)`,
      questionVi: `[Câu hỏi Sinh đôi Đẳng cấu · ${question.points} điểm] ${question.questionVi.replace(
        "10%",
        "20%"
      )} (Kiểm tra lại nguyên lý cốt lõi)`,
      passageKo: question.passageKo
        ? `[변형 지문 · 한국은행/한경 시나리오] ${question.passageKo}`
        : undefined,
      passageVi: question.passageVi
        ? `[Tình huống biến thể đẳng cấu] ${question.passageVi}`
        : undefined,
      options: newOptionsList,
      correctIndex: rotatedCorrectIndex,
      coreFormula: question.coreFormula,
      isomorphicRationaleVi: `Câu hỏi Isomorphic Twin giữ nguyên độ khó ${question.points} điểm và cấu trúc suy luận [${question.coreFormula}] của câu gốc ${question.code}, nhưng đảo vị trí đáp án đúng sang ${markers[rotatedCorrectIndex]} và điều chỉnh tham số để chống học vẹt.`,
    };

    return TwinQuestionSchema.parse(twinPayload);
  }

  async evaluateTwinAnswer(
    twin: TwinQuestion,
    selectedOptionIndex: number
  ): Promise<TwinAnswerEvaluation> {
    const isCorrect = selectedOptionIndex === twin.correctIndex;
    const selectedOpt = twin.options[selectedOptionIndex] ?? twin.options[0];
    const correctOpt = twin.options[twin.correctIndex];
    return {
      isCorrect,
      awardedPoints: isCorrect ? twin.points : 0,
      maxPoints: twin.points,
      selectedMarker: selectedOpt.marker,
      correctMarker: correctOpt.marker,
      headlineVi: isCorrect
        ? `Chính xác! Bạn đạt +${twin.points}/${twin.points} điểm ở câu hỏi tương tự.`
        : `Chưa chính xác (0/${twin.points} điểm) — Bạn đã chọn ${selectedOpt.marker}, nhưng đáp án đúng là ${correctOpt.marker}.`,
      detailedEvaluationVi: isCorrect
        ? `Bạn đã nắm vững nguyên lý [${twin.coreFormula}]. Lý do phương án ${correctOpt.marker} đúng: ${correctOpt.eliminationLogicVi}`
        : `Phương án bạn chọn (${selectedOpt.marker} ${selectedOpt.textKo}) chưa đúng vì: ${selectedOpt.eliminationLogicVi}.`,
      hintIfWrongVi: isCorrect
        ? "Bạn đã làm chủ hoàn toàn dạng bài này!"
        : `Gợi ý sửa sai: Hãy áp dụng nguyên lý [${twin.coreFormula}]. Đáp án đúng là ${correctOpt.marker} (${correctOpt.textKo}) — ${correctOpt.eliminationLogicVi}`,
      generatedByLiveAi: false,
    };
  }

  async askAiTutorHelp(
    question: TesatQuestion,
    selectedOptionIndex?: number
  ): Promise<RegularQuestionAiHelp> {
    const selectedOpt =
      selectedOptionIndex !== undefined
        ? question.options[selectedOptionIndex]
        : undefined;
    return {
      summaryHintVi: question.hintLevel1Vi,
      examTrickVi: `Mẹo làm nhanh: Xác định từ khóa trọng tâm trong đề và áp dụng nguyên lý [${question.coreFormula}] để chọn ngay đáp án ${question.options[question.correctIndex].marker}.`,
      stepByStepReasoningVi: [
        question.hintLevel1Vi,
        question.hintLevel2Vi,
        question.hintLevel3Vi,
      ],
      optionAnalysisVi: selectedOpt
        ? `Bạn đang chọn ${selectedOpt.marker}: ${selectedOpt.eliminationLogicVi}`
        : `Đáp án đúng là ${question.options[question.correctIndex].marker}: ${question.options[question.correctIndex].eliminationLogicVi}`,
      economicTakeawayVi: question.coreFormula,
      generatedByLiveAi: false,
      modelUsed: "mock-deterministic",
    };
  }

  async translateQuestionLive(
    question: TesatQuestion
  ): Promise<QuestionTranslationResult> {
    if (!isUntranslatedPlaceholder(question.questionVi)) {
      return {
        questionVi: question.questionVi,
        passageVi: question.passageVi,
        optionsVi: [
          question.options[0].textVi,
          question.options[1].textVi,
          question.options[2].textVi,
          question.options[3].textVi,
          question.options[4].textVi,
        ],
        generatedByLiveAi: false,
      };
    }

    const [qVi, pVi, o0, o1, o2, o3, o4] = await Promise.all([
      translateTextKoToViBackup(question.questionKo),
      question.passageKo
        ? translateTextKoToViBackup(question.passageKo)
        : Promise.resolve(undefined),
      translateTextKoToViBackup(question.options[0].textKo),
      translateTextKoToViBackup(question.options[1].textKo),
      translateTextKoToViBackup(question.options[2].textKo),
      translateTextKoToViBackup(question.options[3].textKo),
      translateTextKoToViBackup(question.options[4].textKo),
    ]);

    return {
      questionVi: qVi,
      passageVi: pVi,
      optionsVi: [o0, o1, o2, o3, o4],
      generatedByLiveAi: true,
    };
  }

  async extractVocabForQuestionLive(
    question: TesatQuestion
  ): Promise<ExtractedQuestionVocabItem[]> {
    const scanned = scanLocalVocabInQuestion(question);
    if (scanned.length > 0) return scanned;
    return SEED_VOCABULARY.slice(0, 4).map((v) => ({
      termKo: v.termKo,
      hanja: v.hanja,
      hanViet: v.hanViet,
      termVi: v.termVi,
      contextVi: `${v.definitionVi} (${v.mnemonicVi})`,
    }));
  }
}

/**
 * Live Cloud LLM Service calling Google Gemini (gemini-flash-lite-latest / gemini-flash-latest)
 * directly with the user's API key.
 */
export class LiveCloudLLMService implements LLMService {
  private provider: Exclude<LLMProviderName, "mock">;
  private apiKey: string;
  private modelName: string;
  private mockFallback: MockLLMService;

  constructor(
    provider: Exclude<LLMProviderName, "mock">,
    apiKey: string,
    modelName?: string
  ) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.modelName =
      modelName ??
      (provider === "gemini"
        ? DEFAULT_GEMINI_MODEL
        : provider === "openai"
          ? "gpt-4o-mini"
          : "claude-3-5-haiku-latest");
    this.mockFallback = new MockLLMService(provider, "Live API fallback");
  }

  getStatus(): LLMRuntimeStatus {
    return {
      activeProvider: this.provider,
      configuredProvider: this.provider,
      activeModel: this.modelName,
      isLiveApiActive: true,
    };
  }

  async translateQuestionLive(
    question: TesatQuestion
  ): Promise<QuestionTranslationResult> {
    // Only skip live AI if the question already has a clean Vietnamese translation (zero Korean / placeholder tokens)
    const needsTranslation =
      isUntranslatedPlaceholder(question.questionVi) ||
      isUntranslatedPlaceholder(question.options[0]?.textVi) ||
      (Boolean(question.passageKo) &&
        isUntranslatedPlaceholder(question.passageVi));

    if (!needsTranslation) {
      return {
        questionVi: question.questionVi,
        passageVi: question.passageVi,
        optionsVi: [
          question.options[0].textVi,
          question.options[1].textVi,
          question.options[2].textVi,
          question.options[3].textVi,
          question.options[4].textVi,
        ],
        generatedByLiveAi: false,
      };
    }

    try {
      const prompt = `Bạn là dịch giả chuyên ngành Kinh tế Hàn - Việt (chuyên dịch đề thi Hankyung TESAT).
Hãy dịch chính xác, tự nhiên, dễ hiểu toàn bộ câu hỏi, đoạn văn <보기> (nếu có) và 5 phương án lựa chọn dưới đây từ tiếng Hàn sang tiếng Việt. Tuyệt đối KHÔNG để sót câu tiếng Hàn chưa dịch:

[Câu hỏi tiếng Hàn]: ${question.questionKo}
${question.passageKo ? `[Đoạn văn / <보기> tiếng Hàn]: ${question.passageKo}\n` : ""}[5 Phương án tiếng Hàn]:
① ${question.options[0].textKo}
② ${question.options[1].textKo}
③ ${question.options[2].textKo}
④ ${question.options[3].textKo}
⑤ ${question.options[4].textKo}

Trả về đúng định dạng JSON chuẩn như sau (không thêm markdown):
{
  "questionVi": "Bản dịch tiếng Việt rõ ràng, dễ hiểu của câu hỏi",
  "passageVi": "Bản dịch tiếng Việt đầy đủ của đoạn văn / <보기> ㄱ, ㄴ, ㄷ, ㄹ (nếu không có đoạn văn thì để chuỗi rỗng)",
  "optionsVi": [
    "Bản dịch tiếng Việt của phương án ①",
    "Bản dịch tiếng Việt của phương án ②",
    "Bản dịch tiếng Việt của phương án ③",
    "Bản dịch tiếng Việt của phương án ④",
    "Bản dịch tiếng Việt của phương án ⑤"
  ]
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (
        rawJson &&
        typeof rawJson.questionVi === "string" &&
        !isUntranslatedPlaceholder(rawJson.questionVi) &&
        Array.isArray(rawJson.optionsVi) &&
        rawJson.optionsVi.length === 5
      ) {
        const opts = rawJson.optionsVi.map((o) => String(o)) as [
          string,
          string,
          string,
          string,
          string,
        ];
        return {
          questionVi: rawJson.questionVi,
          passageVi:
            typeof rawJson.passageVi === "string" &&
            rawJson.passageVi.trim().length > 0
              ? rawJson.passageVi
              : undefined,
          optionsVi: opts,
          generatedByLiveAi: true,
        };
      }
    } catch {
      // Fallback to neural translation backup
    }

    return this.mockFallback.translateQuestionLive(question);
  }

  async extractVocabForQuestionLive(
    question: TesatQuestion
  ): Promise<ExtractedQuestionVocabItem[]> {
    try {
      const optionsText = question.options
        .map((o) => `${o.marker} ${o.textKo}`)
        .join("\n");

      const prompt = `Bạn là giáo viên dạy từ vựng Kinh tế Hàn Quốc (Hankyung TESAT) cho người Việt.
Hãy trích xuất đúng 5 thuật ngữ / từ vựng kinh tế tiếng Hàn QUAN TRỌNG NHẤT xuất hiện trực tiếp trong câu hỏi dưới đây:

[Đề bài]: ${question.questionKo}
${question.passageKo ? `[Đoạn văn]: ${question.passageKo}\n` : ""}[Các lựa chọn]:
${optionsText}

QUY TẮC BẮT BUỘC (KHÔNG TIẾT LỘ ĐÁP ÁN):
- Với mỗi từ, chỉ cung cấp chữ Hán (nếu từ thuần Hàn/ngoại lai thì ghi "Thuần Hàn / Ngoại lai"), âm Hán-Việt, nghĩa tiếng Việt chuẩn và định nghĩa lý thuyết khách quan của từ đó.
- TUYỆT ĐỐI KHÔNG tiết lộ đáp án đúng là câu nào (①, ②, ③, ④, ⑤), KHÔNG giải thích phương án nào đúng/sai, và KHÔNG gợi ý lộ kết quả câu hỏi trong phần contextVi!

Trả về đúng định dạng JSON chuẩn:
{
  "terms": [
    {
      "termKo": "Từ tiếng Hàn xuất hiện trong câu hỏi",
      "hanja": "Chữ Hán tương ứng (hoặc Ngoại lai)",
      "hanViet": "Âm Hán-Việt dễ nhớ",
      "termVi": "Nghĩa tiếng Việt ngắn gọn, chính xác",
      "contextVi": "Định nghĩa học thuật ngắn gọn, dễ hiểu của từ vựng này (tuyệt đối không tiết lộ đáp án câu hỏi)"
    }
  ]
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (rawJson && Array.isArray(rawJson.terms) && rawJson.terms.length > 0) {
        return (rawJson.terms as Array<Record<string, unknown>>)
          .slice(0, 6)
          .map((item) => ({
            termKo: String(item.termKo || ""),
            hanja: String(item.hanja || "한자어"),
            hanViet: String(item.hanViet || "Thuật ngữ kinh tế"),
            termVi: String(item.termVi || ""),
            contextVi: stripAnswerSpoilersFromVocabText(String(item.contextVi || "")),
          }))
          .filter((item) => item.termKo.length > 0);
      }
    } catch {
      // Fallback
    }

    return this.mockFallback.extractVocabForQuestionLive(question);
  }

  async deconstructAndHint(
    question: TesatQuestion,
    selectedOptionIndex?: number
  ): Promise<SentenceDeconstruction> {
    try {
      const selectedOptText =
        selectedOptionIndex !== undefined && question.options[selectedOptionIndex]
          ? `Học viên đã chọn phương án ${question.options[selectedOptionIndex].marker}: "${question.options[selectedOptionIndex].textKo}" (${selectedOptionIndex === question.correctIndex ? "ĐÚNG" : "SAI"}).`
          : "Học viên chưa chọn đáp án.";

      const optionsBlock = question.options
        .map((o) => `${o.marker} ${o.textKo}`)
        .join("\n");

      const prompt = `Bạn là Gia sư luyện thi Hankyung TESAT rất giỏi truyền đạt cho sinh viên Việt Nam.
Hãy đọc kỹ toàn bộ thông tin câu hỏi dưới đây và đưa ra Gợi ý 3 cấp độ bằng NGÔN NGỮ BÌNH DÂN, DỄ HIỂU NHẤT kèm MẸO LÀM BÀI NHANH:

[Đề bài tiếng Hàn]: ${question.questionKo}
${question.passageKo ? `[Đoạn văn / Dữ liệu trong đề]: ${question.passageKo}\n` : ""}[5 Phương án lựa chọn]:
${optionsBlock}
[Đáp án đúng chính thức]: ${question.options[question.correctIndex].marker} (${question.options[question.correctIndex].textKo})
[Lời giải gốc của Hàn Quốc Kinh Tế]: ${question.hintLevel2Vi}
[Trạng thái của học viên]: ${selectedOptText}

Hãy trả về JSON chuẩn (không thêm markdown) theo đúng cấu trúc:
{
  "translatedVi": "Bản dịch tiếng Việt mượt mà, dễ hiểu của câu hỏi",
  "level1SyntacticTrapVi": "Gợi ý Cấp 1 (Định hướng dễ hiểu & Mẹo nhìn từ khóa): Chỉ cho học viên biết câu này thực chất đang hỏi cái gì bằng ngôn ngữ đời thường, từ khóa tiếng Hàn nào là 'chìa khóa' trong đề (chưa tiết lộ ngay đáp án số mấy)",
  "level2EconomicFrameworkVi": "Gợi ý Cấp 2 (Bản chất & Mẹo giải nhanh 5 giây): Giải thích quy luật kinh tế của câu này thật dễ hiểu (ví dụ: cái gì tăng thì cái gì giảm) + MẸO KHOANH NHANH trong phòng thi",
  "level3EliminationStepsVi": [
    "① Dịch nghĩa phương án ① + Giải thích ngắn gọn, dễ hiểu vì sao đúng hoặc sai",
    "② Dịch nghĩa phương án ② + Giải thích ngắn gọn, dễ hiểu vì sao đúng hoặc sai",
    "③ Dịch nghĩa phương án ③ + Giải thích ngắn gọn, dễ hiểu vì sao đúng hoặc sai",
    "④ Dịch nghĩa phương án ④ + Giải thích ngắn gọn, dễ hiểu vì sao đúng hoặc sai",
    "⑤ Dịch nghĩa phương án ⑤ + Giải thích ngắn gọn, dễ hiểu vì sao đúng hoặc sai"
  ],
  "diagnosticVi": "Nhận xét thân thiện, dễ hiểu dành cho học viên dựa trên đáp án họ chọn",
  "socraticPromptVi": "Mẹo ghi nhớ 1 dòng cực ngắn để gặp lại câu tương tự là làm đúng ngay"
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (rawJson && typeof rawJson === "object") {
        const base = await this.mockFallback.deconstructAndHint(
          question,
          selectedOptionIndex
        );
        const steps = Array.isArray(rawJson.level3EliminationStepsVi)
          ? (rawJson.level3EliminationStepsVi as string[]).slice(0, 5)
          : base.progressiveHints.level3EliminationStepsVi;
        while (steps.length < 5) {
          steps.push(
            base.progressiveHints.level3EliminationStepsVi[steps.length]
          );
        }

        const merged: SentenceDeconstruction = {
          ...base,
          translatedVi:
            typeof rawJson.translatedVi === "string" &&
            rawJson.translatedVi.length > 5
              ? rawJson.translatedVi
              : base.translatedVi,
          progressiveHints: {
            level1SyntacticTrapVi:
              typeof rawJson.level1SyntacticTrapVi === "string" &&
              rawJson.level1SyntacticTrapVi.length > 5
                ? rawJson.level1SyntacticTrapVi
                : base.progressiveHints.level1SyntacticTrapVi,
            level2EconomicFrameworkVi:
              typeof rawJson.level2EconomicFrameworkVi === "string" &&
              rawJson.level2EconomicFrameworkVi.length > 5
                ? rawJson.level2EconomicFrameworkVi
                : base.progressiveHints.level2EconomicFrameworkVi,
            level3EliminationStepsVi: steps,
          },
          nearMissAnalysis: {
            isSelectedNearMiss:
              selectedOptionIndex !== undefined &&
              selectedOptionIndex !== question.correctIndex,
            diagnosticVi:
              typeof rawJson.diagnosticVi === "string" &&
              rawJson.diagnosticVi.length > 5
                ? rawJson.diagnosticVi
                : base.nearMissAnalysis.diagnosticVi,
            socraticPromptVi:
              typeof rawJson.socraticPromptVi === "string" &&
              rawJson.socraticPromptVi.length > 5
                ? rawJson.socraticPromptVi
                : base.nearMissAnalysis.socraticPromptVi,
          },
        };
        const parsed = SentenceDeconstructionSchema.safeParse(merged);
        if (parsed.success) return parsed.data;
      }
    } catch {
      // Fallback
    }
    return this.mockFallback.deconstructAndHint(question, selectedOptionIndex);
  }

  async generateIsomorphicTwin(question: TesatQuestion): Promise<TwinQuestion> {
    try {
      const optionsBlock = question.options
        .map((o) => `${o.marker} ${o.textKo}`)
        .join("\n");

      const prompt = `Bạn là chuyên gia ra đề thi kinh tế quốc gia Hàn Quốc Hankyung TESAT (한국경제 TESAT 출제위원).
Dựa trên câu hỏi gốc dưới đây, hãy SÁNG TẠO MỘT CÂU HỎI MỚI TƯƠNG TỰ (Isomorphic Twin Question) hoàn toàn mới bằng tiếng Hàn kèm bản dịch tiếng Việt:
- Giữ nguyên chủ đề kinh tế và độ khó (${question.points} điểm).
- Thay đổi tình huống/bối cảnh doanh nghiệp, thay đổi số liệu hoặc đảo chiều biến động kinh tế để học viên phải tư duy thật sự chứ không thể học vẹt.
- Đảo vị trí đáp án đúng sang một vị trí khác (0, 1, 2, 3 hoặc 4) so với đáp án gốc (${question.correctIndex}).

[Câu hỏi gốc]: ${question.questionKo}
${question.passageKo ? `[Đoạn văn gốc]: ${question.passageKo}\n` : ""}[5 lựa chọn gốc]:
${optionsBlock}
[Đáp án đúng câu gốc]: Phương án số ${question.correctIndex + 1} (${question.options[question.correctIndex].marker})
[Giải thích gốc]: ${question.hintLevel2Vi}

Hãy trả về JSON chuẩn theo đúng cấu trúc sau:
{
  "questionKo": "Nội dung câu hỏi mới bằng tiếng Hàn chuẩn văn phong đề thi TESAT",
  "questionVi": "Bản dịch câu hỏi mới sang tiếng Việt rõ ràng",
  "passageKo": "Đoạn văn / tình huống / dữ liệu mới bằng tiếng Hàn (nếu câu gốc có đoạn văn, nếu không thì để chuỗi rỗng)",
  "passageVi": "Bản dịch đoạn văn mới sang tiếng Việt (nếu có, nếu không thì để chuỗi rỗng)",
  "correctIndex": 2,
  "coreFormula": "Mẹo / Quy tắc kinh tế cốt lõi áp dụng trong câu hỏi mới",
  "isomorphicRationaleVi": "Giải thích ngắn gọn câu hỏi mới này đã biến đổi tình huống như thế nào so với câu gốc",
  "options": [
    {
      "textKo": "Nội dung lựa chọn ① bằng tiếng Hàn",
      "textVi": "Dịch nghĩa lựa chọn ① sang tiếng Việt",
      "eliminationLogicVi": "Giải thích dễ hiểu vì sao lựa chọn ① đúng hoặc sai"
    },
    {
      "textKo": "Nội dung lựa chọn ② bằng tiếng Hàn",
      "textVi": "Dịch nghĩa lựa chọn ② sang tiếng Việt",
      "eliminationLogicVi": "Giải thích dễ hiểu vì sao lựa chọn ② đúng hoặc sai"
    },
    {
      "textKo": "Nội dung lựa chọn ③ bằng tiếng Hàn",
      "textVi": "Dịch nghĩa lựa chọn ③ sang tiếng Việt",
      "eliminationLogicVi": "Giải thích dễ hiểu vì sao lựa chọn ③ đúng hoặc sai"
    },
    {
      "textKo": "Nội dung lựa chọn ④ bằng tiếng Hàn",
      "textVi": "Dịch nghĩa lựa chọn ④ sang tiếng Việt",
      "eliminationLogicVi": "Giải thích dễ hiểu vì sao lựa chọn ④ đúng hoặc sai"
    },
    {
      "textKo": "Nội dung lựa chọn ⑤ bằng tiếng Hàn",
      "textVi": "Dịch nghĩa lựa chọn ⑤ sang tiếng Việt",
      "eliminationLogicVi": "Giải thích dễ hiểu vì sao lựa chọn ⑤ đúng hoặc sai"
    }
  ]
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (
        rawJson &&
        typeof rawJson === "object" &&
        Array.isArray(rawJson.options) &&
        rawJson.options.length === 5
      ) {
        const markers = ["①", "②", "③", "④", "⑤"] as const;
        const rawOpts = rawJson.options as Array<Record<string, unknown>>;
        const formattedOptions: TwinQuestion["options"] = rawOpts.map(
          (item, idx) => ({
            index: idx,
            marker: markers[idx],
            textKo: String(item.textKo || `선택지 ${idx + 1}`),
            textVi: String(item.textVi || `Phương án ${idx + 1}`),
            eliminationLogicVi: String(
              item.eliminationLogicVi || "Phân tích theo nguyên lý kinh tế."
            ),
          })
        );

        const cIdxRaw = Number(rawJson.correctIndex);
        const validCorrectIdx =
          Number.isInteger(cIdxRaw) && cIdxRaw >= 0 && cIdxRaw <= 4
            ? cIdxRaw
            : (question.correctIndex + 2) % 5;

        const candidateTwin: TwinQuestion = {
          parentQuestionCode: question.code,
          isomorphicCode: `${question.code}-AI-TWIN`,
          section: question.section,
          subcategory: question.subcategory,
          points: question.points,
          questionKo: String(rawJson.questionKo || question.questionKo),
          questionVi: String(rawJson.questionVi || question.questionVi),
          passageKo:
            typeof rawJson.passageKo === "string" &&
            rawJson.passageKo.trim().length > 0
              ? rawJson.passageKo
              : undefined,
          passageVi:
            typeof rawJson.passageVi === "string" &&
            rawJson.passageVi.trim().length > 0
              ? rawJson.passageVi
              : undefined,
          options: formattedOptions,
          correctIndex: validCorrectIdx,
          coreFormula: String(rawJson.coreFormula || question.coreFormula),
          isomorphicRationaleVi: String(
            rawJson.isomorphicRationaleVi ||
              `Câu hỏi tương tự được Gemini AI sáng tạo mới dựa trên nguyên lý ${question.coreFormula}.`
          ),
        };

        const parsed = TwinQuestionSchema.safeParse(candidateTwin);
        if (parsed.success) return parsed.data;
      }
    } catch {
      // Graceful fallback
    }
    return this.mockFallback.generateIsomorphicTwin(question);
  }

  async evaluateTwinAnswer(
    twin: TwinQuestion,
    selectedOptionIndex: number
  ): Promise<TwinAnswerEvaluation> {
    const isCorrect = selectedOptionIndex === twin.correctIndex;
    const selectedOpt = twin.options[selectedOptionIndex] ?? twin.options[0];
    const correctOpt = twin.options[twin.correctIndex];

    try {
      const optionsText = twin.options
        .map((o) => `${o.marker} ${o.textKo} (${o.textVi})`)
        .join("\n");

      const prompt = `Bạn là Gia sư AI chấm bài thi kinh tế Hàn Quốc Hankyung TESAT.
Học viên vừa trả lời câu hỏi tương tự (Twin Question) do AI sinh ra:
[Câu hỏi]: ${twin.questionKo} (${twin.questionVi})
[Các lựa chọn]:
${optionsText}
[Đáp án đúng]: ${correctOpt.marker} ${correctOpt.textKo} (${correctOpt.textVi})
[Lựa chọn của học viên]: ${selectedOpt.marker} ${selectedOpt.textKo} -> Kết quả: ${isCorrect ? "ĐÚNG" : "SAI"}.

Hãy chấm điểm và giải thích bằng NGÔN NGỮ BÌNH DÂN, DỄ HIỂU kèm MẸO SỬA SAI theo JSON:
{
  "headlineVi": "${isCorrect ? `Chính xác! (+${twin.points}/${twin.points} điểm)` : `Chưa chính xác (0/${twin.points} điểm) — Bạn chọn ${selectedOpt.marker}, đáp án đúng là ${correctOpt.marker}`}",
  "detailedEvaluationVi": "Giải thích thật dễ hiểu vì sao lựa chọn của học viên (${selectedOpt.marker}) lại ${isCorrect ? "đúng" : "sai (chỉ rõ học viên bị nhầm ở điểm nào)"}",
  "hintIfWrongVi": "${isCorrect ? "Mẹo nhớ nhanh dạng bài này chỉ trong 5 giây" : "Gợi ý dễ hiểu & Mẹo làm bài giúp học viên hiểu ngay vì sao đáp án đúng là " + correctOpt.marker}"
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (rawJson && typeof rawJson === "object") {
        return {
          isCorrect,
          awardedPoints: isCorrect ? twin.points : 0,
          maxPoints: twin.points,
          selectedMarker: selectedOpt.marker,
          correctMarker: correctOpt.marker,
          headlineVi: String(
            rawJson.headlineVi ||
              (isCorrect
                ? `Chính xác! Bạn đạt +${twin.points}/${twin.points} điểm.`
                : `Chưa chính xác (0/${twin.points} điểm) — Đáp án đúng là ${correctOpt.marker}.`)
          ),
          detailedEvaluationVi: String(
            rawJson.detailedEvaluationVi || selectedOpt.eliminationLogicVi
          ),
          hintIfWrongVi: String(
            rawJson.hintIfWrongVi || correctOpt.eliminationLogicVi
          ),
          generatedByLiveAi: true,
        };
      }
    } catch {
      // Fallback
    }
    return this.mockFallback.evaluateTwinAnswer(twin, selectedOptionIndex);
  }

  async askAiTutorHelp(
    question: TesatQuestion,
    selectedOptionIndex?: number,
    userPrompt?: string
  ): Promise<RegularQuestionAiHelp> {
    try {
      const selectedOpt =
        selectedOptionIndex !== undefined
          ? question.options[selectedOptionIndex]
          : undefined;

      const optionsText = question.options
        .map((o) => `${o.marker} ${o.textKo}`)
        .join("\n");

      const learnerStatus = selectedOpt
        ? `Học viên đã chọn phương án ${selectedOpt.marker} (${selectedOpt.textKo}) — Kết quả: ${selectedOptionIndex === question.correctIndex ? "ĐÚNG" : "SAI"}.`
        : "Học viên chưa chọn đáp án và đang xin gợi ý cách làm.";

      const customReq = userPrompt?.trim()
        ? `Yêu cầu cụ thể của học viên: "${userPrompt.trim()}"`
        : "Hãy giải thích câu hỏi này bằng ngôn ngữ đời thường siêu dễ hiểu, chỉ ra MẸO LÀM NHANH câu này và giải thích rõ vì sao đáp án đúng là chính xác.";

      const prompt = `Bạn là Gia sư luyện thi Hankyung TESAT (Kinh tế Hàn Quốc) cực kỳ tâm huyết của học viên Việt Nam.
Dưới đây là toàn bộ thông tin câu hỏi mà học viên đang làm:

[Câu hỏi tiếng Hàn]: ${question.questionKo}
${question.passageKo ? `[Đoạn văn / Bảng dữ liệu trong đề]: ${question.passageKo}\n` : ""}[5 Phương án lựa chọn]:
${optionsText}
[Đáp án đúng chính thức]: Phương án ${question.options[question.correctIndex].marker} (${question.options[question.correctIndex].textKo})
[Giải thích chính thức của báo Hàn Quốc Kinh Tế]: ${question.hintLevel2Vi}
[Trạng thái làm bài của học viên]: ${learnerStatus}
[Yêu cầu]: ${customReq}

YÊU CẦU QUAN TRỌNG:
1. Dùng ngôn ngữ tiếng Việt tự nhiên, bình dân, ví dụ thực tế dễ hiểu (tránh dịch máy khô khan).
2. Phải chỉ rõ "MẸO LÀM BÀI NHANH" (nhìn từ khóa tiếng Hàn nào trong đề là suy ra ngay đáp án đúng ${question.options[question.correctIndex].marker}).
3. Nhận diện đúng thông tin câu hỏi trên và giải thích chuẩn xác 100% theo đáp án đúng ${question.options[question.correctIndex].marker}.

Hãy trả về JSON chuẩn theo cấu trúc sau:
{
  "summaryHintVi": "Giải thích tổng quan câu hỏi bằng ngôn ngữ đời thường, siêu dễ hiểu (trả lời thẳng vào thắc mắc hoặc lỗi sai của học viên)",
  "examTrickVi": "MẸO GIẢI NHANH TRONG 5 GIÂY: Chỉ rõ nhìn vào cụm từ tiếng Hàn nào trong đề là bắt được ngay đáp án đúng ${question.options[question.correctIndex].marker} hoặc loại ngay phương án bẫy",
  "stepByStepReasoningVi": [
    "Bước 1 (Đọc vị câu hỏi): Dịch ngắn gọn yêu cầu của đề và từ khóa cốt lõi",
    "Bước 2 (Hiểu bản chất): Giải thích quy luật kinh tế áp dụng trong câu bằng ví dụ dễ hiểu",
    "Bước 3 (Chốt đáp án): Vì sao phương án ${question.options[question.correctIndex].marker} là đáp án đúng duy nhất"
  ],
  "optionAnalysisVi": "Giải thích ngắn gọn, rõ ràng từng phương án từ ① đến ⑤ (dịch nghĩa + chỉ ra chỗ đúng/sai của từng câu)",
  "economicTakeawayVi": "Công thức / Quy tắc bỏ túi 1 dòng để nhớ mãi không quên"
}`;

      const rawJson = (await this.callProviderJson(prompt)) as Record<
        string,
        unknown
      > | null;

      if (rawJson && typeof rawJson === "object") {
        const steps = Array.isArray(rawJson.stepByStepReasoningVi)
          ? (rawJson.stepByStepReasoningVi as unknown[]).map((s) => String(s))
          : [question.hintLevel1Vi, question.hintLevel2Vi];

        return {
          summaryHintVi: String(rawJson.summaryHintVi || question.hintLevel1Vi),
          examTrickVi: String(
            rawJson.examTrickVi ||
              `Nhìn từ khóa trọng tâm trong đề để chọn ngay đáp án ${question.options[question.correctIndex].marker}.`
          ),
          stepByStepReasoningVi: steps,
          optionAnalysisVi: String(
            rawJson.optionAnalysisVi || question.hintLevel3Vi
          ),
          economicTakeawayVi: String(
            rawJson.economicTakeawayVi || question.coreFormula
          ),
          generatedByLiveAi: true,
          modelUsed: this.modelName,
        };
      }
    } catch {
      // Fallback
    }
    return this.mockFallback.askAiTutorHelp(question, selectedOptionIndex);
  }

  private async callProviderJson(prompt: string): Promise<unknown | null> {
    if (this.provider === "gemini") {
      const isOAuthBearer = this.apiKey.startsWith("ya29.");
      const modelsToTry = [
        this.modelName,
        "gemini-flash-lite-latest",
        "gemini-flash-latest",
      ];
      const uniqueModels = Array.from(new Set(modelsToTry));

      for (const model of uniqueModels) {
        try {
          const url = isOAuthBearer
            ? `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
            : `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (isOAuthBearer) {
            headers["Authorization"] = `Bearer ${this.apiKey}`;
          }

          const res = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.35,
              },
            }),
          });

          if (!res.ok) continue;
          const data = await res.json();
          const parts: Array<{ text?: string; thought?: boolean }> =
            data?.candidates?.[0]?.content?.parts ?? [];
          const textPart =
            [...parts]
              .reverse()
              .find((p) => typeof p.text === "string" && !p.thought) ?? parts[0];
          const rawText = textPart?.text;
          if (!rawText) continue;

          const cleaned = rawText
            .replace(/^```json\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
          const firstBrace = cleaned.indexOf("{");
          const lastBrace = cleaned.lastIndexOf("}");
          const jsonCandidate =
            firstBrace >= 0 && lastBrace > firstBrace
              ? cleaned.slice(firstBrace, lastBrace + 1)
              : cleaned;
          return JSON.parse(jsonCandidate);
        } catch {
          continue;
        }
      }
      return null;
    }

    if (this.provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      return text ? JSON.parse(text) : null;
    }

    if (this.provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-3-5-haiku-latest",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const text = data?.content?.[0]?.text;
      return text ? JSON.parse(text) : null;
    }

    return null;
  }
}

/**
 * Factory Pattern for creating the active LLMService.
 */
export function createLLMService(
  envOverride?: Partial<Record<string, string>>
): LLMService {
  const env = {
    DEFAULT_LLM_PROVIDER: process.env.DEFAULT_LLM_PROVIDER ?? "gemini",
    GEMINI_API_KEY:
      process.env.GEMINI_API_KEY ??
      process.env.NEXT_PUBLIC_GEMINI_API_KEY ??
      DEFAULT_CONFIGURED_GEMINI_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? "",
    ...envOverride,
  };

  const preferred = (env.DEFAULT_LLM_PROVIDER || "gemini").toLowerCase();

  if (preferred === "gemini" && env.GEMINI_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("gemini", env.GEMINI_API_KEY.trim());
  }
  if (preferred === "openai" && env.OPENAI_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("openai", env.OPENAI_API_KEY.trim());
  }
  if (preferred === "anthropic" && env.ANTHROPIC_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("anthropic", env.ANTHROPIC_API_KEY.trim());
  }

  if (env.GEMINI_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("gemini", env.GEMINI_API_KEY.trim());
  }
  if (env.OPENAI_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("openai", env.OPENAI_API_KEY.trim());
  }
  if (env.ANTHROPIC_API_KEY.trim().length > 0) {
    return new LiveCloudLLMService("anthropic", env.ANTHROPIC_API_KEY.trim());
  }

  return new MockLLMService(
    preferred,
    `No API key found for ${preferred.toUpperCase()} — using deterministic Zod-validated MockLLMService`
  );
}
