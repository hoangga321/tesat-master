import { z } from "zod";

export const TesatSectionEnum = z.enum(["THEORY", "CURRENT_AFFAIRS", "APPLIED"]);
export type TesatSection = z.infer<typeof TesatSectionEnum>;

export const TesatSubcategoryEnum = z.enum([
  "MICRO",
  "MACRO",
  "INTL",
  "CURRENT_ISSUES",
  "FINANCE_STRATEGY",
  "DATA_EDITORIAL",
]);
export type TesatSubcategory = z.infer<typeof TesatSubcategoryEnum>;

export const TesatPointsEnum = z.union([z.literal(3), z.literal(4), z.literal(5)]);
export type TesatPoints = z.infer<typeof TesatPointsEnum>;

export const DataTableRowSchema = z.object({
  label: z.string(),
  values: z.array(z.union([z.string(), z.number()])),
});

export const DataTableSchema = z.object({
  titleKo: z.string(),
  titleVi: z.string(),
  source: z.string(), // e.g., "한국은행 경제통계시스템(ECOS)" or "통계청(KOSIS)"
  unit: z.string(),
  headers: z.array(z.string()),
  rows: z.array(DataTableRowSchema),
});
export type TesatDataTable = z.infer<typeof DataTableSchema>;

export const VisualChartTypeEnum = z.enum([
  "SUPPLY_DEMAND_SHIFT",
  "PRICE_CONTROL_CEILING_FLOOR",
  "TAX_SUBSIDY_DWL",
  "EXTERNALITY_PIGOU",
  "PPF_OPPORTUNITY_COST",
  "ELASTICITY_REVENUE",
  "INDIFFERENCE_BUDGET",
  "AD_AS_MACRO",
  "PHILLIPS_CURVE",
  "LORENZ_GINI",
  "BOK_RATE_INFLATION_TREND",
  "EXCHANGE_RATE_BOP_CHART",
  "CORP_FINANCE_BAR_LINE",
  "GAME_THEORY_MATRIX",
]);
export type TesatVisualChartType = z.infer<typeof VisualChartTypeEnum>;

export const VisualChartSeriesPointSchema = z.object({
  label: z.string(),
  value1: z.number(),
  value2: z.number().optional(),
});

export const VisualChartSchema = z.object({
  chartType: VisualChartTypeEnum,
  figureCode: z.string(), // e.g., "<그림 1>", "<그래프 2>"
  titleKo: z.string(),
  titleVi: z.string(),
  source: z.string(),
  xAxisLabelKo: z.string(),
  xAxisLabelVi: z.string(),
  yAxisLabelKo: z.string(),
  yAxisLabelVi: z.string(),
  annotationsKo: z.array(z.string()),
  annotationsVi: z.array(z.string()),
  seriesLabel1Ko: z.string().optional(),
  seriesLabel2Ko: z.string().optional(),
  seriesData: z.array(VisualChartSeriesPointSchema).optional(),
  readingTipVi: z.string(),
});
export type TesatVisualChart = z.infer<typeof VisualChartSchema>;

export const TesatOptionSchema = z.object({
  index: z.number().int().min(0).max(4),
  marker: z.enum(["①", "②", "③", "④", "⑤"]),
  textKo: z.string().min(1),
  textVi: z.string().min(1),
  eliminationLogicVi: z.string().min(5),
  isNearMiss: z.boolean().default(false),
  nearMissReasonVi: z.string().optional(),
  socraticQuestionVi: z.string().optional(),
});
export type TesatOption = z.infer<typeof TesatOptionSchema>;

export const TesatQuestionSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  examNumber: z.number().int().min(1).max(80),
  section: TesatSectionEnum,
  subcategory: TesatSubcategoryEnum,
  points: TesatPointsEnum,
  source: z.string().min(1),
  questionKo: z.string().min(5),
  questionVi: z.string().min(5),
  passageKo: z.string().optional(),
  passageVi: z.string().optional(),
  figureImageUrl: z.string().optional(),
  figureCaptionKo: z.string().optional(),
  figureCaptionVi: z.string().optional(),
  dataTable: DataTableSchema.optional(),
  visualChart: VisualChartSchema.optional(),
  options: z.array(TesatOptionSchema).length(5),
  correctIndex: z.number().int().min(0).max(4),
  negativeTrapTokens: z.array(z.string()),
  hintLevel1Vi: z.string().min(5),
  hintLevel2Vi: z.string().min(5),
  hintLevel3Vi: z.string().min(5),
  coreFormula: z.string().min(2),
  keyTerms: z.array(z.string()),
  tags: z.array(z.string()),
});
export type TesatQuestion = z.infer<typeof TesatQuestionSchema>;

export const FlashcardSchema = z.object({
  id: z.string().min(1),
  termKo: z.string().min(1),
  hanja: z.string().min(1),
  hanViet: z.string().min(1),
  termVi: z.string().min(1),
  termEn: z.string().min(1),
  category: z.enum(["MICRO", "MACRO", "INTL", "FINANCE", "CURRENT_AFFAIRS"]),
  definitionKo: z.string().min(5),
  definitionVi: z.string().min(5),
  mnemonicVi: z.string().min(5),
  exampleKo: z.string().min(5),
  exampleVi: z.string().min(5),
  frequencyRank: z.number().int().min(1),
});
export type TesatFlashcard = z.infer<typeof FlashcardSchema>;

export const SentenceDeconstructionSchema = z.object({
  originalKo: z.string(),
  translatedVi: z.string(),
  hasNegativeTrap: z.boolean(),
  detectedTrapTokens: z.array(
    z.object({
      tokenKo: z.string(),
      warningVi: z.string(),
    })
  ),
  extractedVariables: z.array(
    z.object({
      termKo: z.string(),
      hanViet: z.string(),
      termVi: z.string(),
      roleInQuestion: z.string(),
    })
  ),
  progressiveHints: z.object({
    level1SyntacticTrapVi: z.string(),
    level2EconomicFrameworkVi: z.string(),
    level3EliminationStepsVi: z.array(z.string()).length(5),
  }),
  nearMissAnalysis: z.object({
    isSelectedNearMiss: z.boolean(),
    diagnosticVi: z.string(),
    socraticPromptVi: z.string(),
  }),
});
export type SentenceDeconstruction = z.infer<typeof SentenceDeconstructionSchema>;

export const TwinQuestionSchema = z.object({
  parentQuestionCode: z.string(),
  isomorphicCode: z.string(),
  section: TesatSectionEnum,
  subcategory: TesatSubcategoryEnum,
  points: TesatPointsEnum,
  questionKo: z.string().min(10),
  questionVi: z.string().min(10),
  passageKo: z.string().optional(),
  passageVi: z.string().optional(),
  options: z
    .array(
      z.object({
        index: z.number().int().min(0).max(4),
        marker: z.enum(["①", "②", "③", "④", "⑤"]),
        textKo: z.string(),
        textVi: z.string(),
        eliminationLogicVi: z.string(),
      })
    )
    .length(5),
  correctIndex: z.number().int().min(0).max(4),
  coreFormula: z.string(),
  isomorphicRationaleVi: z.string(),
});
export type TwinQuestion = z.infer<typeof TwinQuestionSchema>;
