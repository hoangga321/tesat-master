import { PrismaClient } from "@prisma/client";
import { ALL_TESAT_QUESTIONS_POOL } from "../src/lib/data/questions-seed";
import { SEED_VOCABULARY } from "../src/lib/data/vocabulary-seed";

const prisma = new PrismaClient();

async function main() {
  console.log(`Seeding ${ALL_TESAT_QUESTIONS_POOL.length} TESAT questions (including visual charts) into SQLite DB...`);

  await prisma.$transaction(
    ALL_TESAT_QUESTIONS_POOL.map((q) =>
      prisma.question.upsert({
        where: { id: q.id },
        update: {
          code: q.code,
          section: q.section,
          subcategory: q.subcategory,
          points: q.points,
          source: q.source,
          questionKo: q.questionKo,
          questionVi: q.questionVi,
          passageKo: q.passageKo ?? null,
          passageVi: q.passageVi ?? null,
          figureImageUrl: q.figureImageUrl ?? null,
          figureCaptionKo: q.figureCaptionKo ?? null,
          figureCaptionVi: q.figureCaptionVi ?? null,
          dataTableJson: q.dataTable ? JSON.stringify(q.dataTable) : null,
          visualChartJson: q.visualChart ? JSON.stringify(q.visualChart) : null,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          negativeTrapTokens: JSON.stringify(q.negativeTrapTokens),
          hintLevel1Vi: q.hintLevel1Vi,
          hintLevel2Vi: q.hintLevel2Vi,
          hintLevel3Vi: q.hintLevel3Vi,
          coreFormula: q.coreFormula,
          keyTermsJson: JSON.stringify(q.keyTerms),
          tagsJson: JSON.stringify(q.tags),
        },
        create: {
          id: q.id,
          code: q.code,
          section: q.section,
          subcategory: q.subcategory,
          points: q.points,
          source: q.source,
          questionKo: q.questionKo,
          questionVi: q.questionVi,
          passageKo: q.passageKo ?? null,
          passageVi: q.passageVi ?? null,
          figureImageUrl: q.figureImageUrl ?? null,
          figureCaptionKo: q.figureCaptionKo ?? null,
          figureCaptionVi: q.figureCaptionVi ?? null,
          dataTableJson: q.dataTable ? JSON.stringify(q.dataTable) : null,
          visualChartJson: q.visualChart ? JSON.stringify(q.visualChart) : null,
          optionsJson: JSON.stringify(q.options),
          correctIndex: q.correctIndex,
          negativeTrapTokens: JSON.stringify(q.negativeTrapTokens),
          hintLevel1Vi: q.hintLevel1Vi,
          hintLevel2Vi: q.hintLevel2Vi,
          hintLevel3Vi: q.hintLevel3Vi,
          coreFormula: q.coreFormula,
          keyTermsJson: JSON.stringify(q.keyTerms),
          tagsJson: JSON.stringify(q.tags),
        },
      })
    )
  );

  await prisma.$transaction(
    SEED_VOCABULARY.map((v) =>
      prisma.flashcard.upsert({
        where: { id: v.id },
        update: {
          termKo: v.termKo,
          hanja: v.hanja,
          hanViet: v.hanViet,
          termVi: v.termVi,
          termEn: v.termEn,
          category: v.category,
          definitionKo: v.definitionKo,
          definitionVi: v.definitionVi,
          mnemonicVi: v.mnemonicVi,
          exampleKo: v.exampleKo,
          exampleVi: v.exampleVi,
          frequencyRank: v.frequencyRank,
        },
        create: {
          id: v.id,
          termKo: v.termKo,
          hanja: v.hanja,
          hanViet: v.hanViet,
          termVi: v.termVi,
          termEn: v.termEn,
          category: v.category,
          definitionKo: v.definitionKo,
          definitionVi: v.definitionVi,
          mnemonicVi: v.mnemonicVi,
          exampleKo: v.exampleKo,
          exampleVi: v.exampleVi,
          frequencyRank: v.frequencyRank,
        },
      })
    )
  );

  // Remove any stale duplicate questions that were replaced by official book questions
  const validIds = ALL_TESAT_QUESTIONS_POOL.map((q) => q.id);
  await prisma.question.deleteMany({
    where: { id: { notIn: validIds } },
  });

  const qCount = await prisma.question.count();
  const chartCount = await prisma.question.count({
    where: {
      OR: [
        { figureImageUrl: { not: null } },
        { visualChartJson: { not: null } },
        { dataTableJson: { not: null } },
      ],
    },
  });
  const fCount = await prisma.flashcard.count();
  console.log(`✅ Seeded SQLite DB: ${qCount} questions (${chartCount} with visual figures/charts/tables), ${fCount} flashcards.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
