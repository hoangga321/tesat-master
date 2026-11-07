import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";

export interface ExtractedSgsgQuestion {
  articleUrl: string;
  articleTitle: string;
  questionKo: string;
  optionsKo: [string, string, string, string, string];
  correctIndex: number;
  explanationKo: string;
}

async function harvestAllSgsgTesatQuestions() {
  const articleUrls = new Set<string>();

  // Crawl pages 1 to 45 of sgsg.hankyung.com/tesat/study in batches
  for (let startPage = 1; startPage <= 45; startPage += 15) {
    const pagePromises = [];
    for (let p = startPage; p < startPage + 15 && p <= 45; p++) {
      pagePromises.push(
        fetch(`https://sgsg.hankyung.com/tesat/study?page=${p}`)
          .then((r) => r.text())
          .then((html) => {
            const $ = cheerio.load(html);
            $("a").each((_, el) => {
              const href = $(el).attr("href") || "";
              if (href.includes("/article/")) {
                const full = href.startsWith("http")
                  ? href
                  : `https://sgsg.hankyung.com${href}`;
                articleUrls.add(full);
              }
            });
          })
          .catch(() => {})
      );
    }
    await Promise.all(pagePromises);
  }

  const allUrls = Array.from(articleUrls);
  console.log(`Discovered ${allUrls.length} unique TESAT study articles on sgsg.hankyung.com.`);

  const seenQuestions = new Set<string>();
  const extractedQuestions: ExtractedSgsgQuestion[] = [];
  const examAnalysisArticles: Array<{ url: string; title: string; text: string }> = [];

  // Fetch in batches of 20
  for (let i = 0; i < allUrls.length; i += 20) {
    const batch = allUrls.slice(i, i + 20);
    await Promise.all(
      batch.map(async (url) => {
        try {
          const res = await fetch(url);
          const html = await res.text();
          const $ = cheerio.load(html);
          const title = $("h1, .article-title, title")
            .first()
            .text()
            .replace("| 생글생글", "")
            .trim();
          const body = $(".article-body, #articletxt, article")
            .text()
            .replace(/\s+/g, " ")
            .trim();

          if (!body) return;

          if (title.includes("회 테샛") || title.includes("기출") || body.includes("정답률")) {
            examAnalysisArticles.push({ url, title, text: body.slice(0, 1500) });
          }

          // Parse [문제1], [문제2], [문제3] blocks containing ① ② ③ ④ ⑤ and [해설]
          const problemBlocks = body.split(/\[문제\s*\d*\]/);
          for (let b = 1; b < problemBlocks.length; b++) {
            const block = problemBlocks[b];
            if (
              block.includes("①") &&
              block.includes("②") &&
              block.includes("③") &&
              block.includes("④") &&
              block.includes("⑤")
            ) {
              const parts = block.split(/\[해설\]/);
              const qAndOpts = parts[0] || "";
              const expl = (parts[1] || "").replace(/정답\s*[①②③④⑤12345].*$/, "").trim();

              const idx1 = qAndOpts.indexOf("①");
              const idx2 = qAndOpts.indexOf("②");
              const idx3 = qAndOpts.indexOf("③");
              const idx4 = qAndOpts.indexOf("④");
              const idx5 = qAndOpts.indexOf("⑤");

              if (idx1 > 0 && idx2 > idx1 && idx3 > idx2 && idx4 > idx3 && idx5 > idx4) {
                const questionKo = qAndOpts.slice(0, idx1).trim();
                const opt1 = qAndOpts.slice(idx1 + 1, idx2).trim();
                const opt2 = qAndOpts.slice(idx2 + 1, idx3).trim();
                const opt3 = qAndOpts.slice(idx3 + 1, idx4).trim();
                const opt4 = qAndOpts.slice(idx4 + 1, idx5).trim();
                const opt5 = qAndOpts.slice(idx5 + 1).replace(/\[해설\].*$/, "").trim();

                let correctIndex = 0;
                const fullBlockText = parts[1] || qAndOpts;
                const ansMatch = fullBlockText.match(/정답[은:\s]*([①②③④⑤12345])/);
                if (ansMatch) {
                  const tok = ansMatch[1];
                  const map: Record<string, number> = {
                    "①": 0,
                    "1": 0,
                    "②": 1,
                    "2": 1,
                    "③": 2,
                    "3": 2,
                    "④": 3,
                    "4": 3,
                    "⑤": 4,
                    "5": 4,
                  };
                  if (map[tok] !== undefined) correctIndex = map[tok];
                }

                const normKey = questionKo.slice(0, 50);
                if (
                  questionKo.length >= 10 &&
                  opt1 &&
                  opt2 &&
                  opt3 &&
                  opt4 &&
                  opt5 &&
                  !seenQuestions.has(normKey)
                ) {
                  seenQuestions.add(normKey);
                  extractedQuestions.push({
                    articleUrl: url,
                    articleTitle: title,
                    questionKo,
                    optionsKo: [opt1, opt2, opt3, opt4, opt5],
                    correctIndex,
                    explanationKo: (parts[1] || "한국경제 생글생글 공식 테샛 기출 해설").trim(),
                  });
                }
              }
            }
          }
        } catch {
          // ignore single article error
        }
      })
    );
  }

  console.log(
    `Successfully extracted ${extractedQuestions.length} unique real 5-option TESAT questions from sgsg.hankyung.com!`
  );

  const outPath = path.join(process.cwd(), "src/lib/data/crawled-sgsg-raw.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        crawledAt: new Date().toISOString(),
        source: "https://sgsg.hankyung.com/tesat/study",
        totalExtractedQuestions: extractedQuestions.length,
        totalAnalysisArticles: examAnalysisArticles.length,
        questions: extractedQuestions,
        analysisArticles: examAnalysisArticles.slice(0, 25),
      },
      null,
      2
    ),
    "utf-8"
  );
  console.log(`Saved to ${outPath}`);
}

harvestAllSgsgTesatQuestions().catch(console.error);
