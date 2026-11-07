import { NextRequest, NextResponse } from "next/server";
import { getQuestionByIdOrCode, FULL_80_TESAT_QUESTIONS } from "@/lib/data/questions-seed";
import { createLLMService } from "@/lib/ai/llm-service";
import { globalTesatCache, aiEndpointRateLimiter } from "@/lib/cache/hybrid-cache";

export async function POST(req: NextRequest) {
  const clientIp = req.headers.get("x-forwarded-for") ?? "local-learner";
  const rateCheck = aiEndpointRateLimiter.check(`twin:${clientIp}`);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: `Rate limit exceeded. Try again in ${rateCheck.resetInSeconds}s.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const questionId: string = body?.questionId ?? "tesat-q-001";
    const providerOverride: Record<string, string> | undefined = body?.providerOverride;

    const question =
      getQuestionByIdOrCode(questionId) ?? FULL_80_TESAT_QUESTIONS[0];
    const llmService = createLLMService(providerOverride);
    const cacheKey = `twin:${question.id}:prov:${llmService.getStatus().activeProvider}`;

    const { data, fromCache } = await globalTesatCache.getOrCompute(
      cacheKey,
      () => llmService.generateIsomorphicTwin(question),
      3600
    );

    return NextResponse.json({
      ok: true,
      llmStatus: llmService.getStatus(),
      fromCache,
      twinQuestion: data,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message },
      { status: 400 }
    );
  }
}
