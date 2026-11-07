import { NextRequest, NextResponse } from "next/server";
import {
  parseRawKoreanTesatBlock,
  runTesatIngestionPipeline,
} from "@/lib/crawler/tesat-ingestor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    if (body?.rawHtml) {
      const parsed = parseRawKoreanTesatBlock(body.rawHtml, {
        examNumber: body.examNumber ?? 1,
        section: body.section ?? "THEORY",
        subcategory: body.subcategory ?? "MACRO",
        points: body.points ?? 3,
        source: body.source ?? "한경 오늘의 테샛 (Live Crawl)",
      });
      return NextResponse.json({
        ok: true,
        mode: "SINGLE_HTML_PARSE",
        question: parsed,
      });
    }

    const report = await runTesatIngestionPipeline({
      liveFetch: Boolean(body?.liveFetch),
    });

    return NextResponse.json({
      ok: true,
      mode: "FULL_PIPELINE_INGEST",
      report: {
        source: report.source,
        crawledCount: report.crawledCount,
        parsedValidCount: report.parsedValidCount,
        rejectedCount: report.rejectedCount,
        errors: report.errors,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    );
  }
}
