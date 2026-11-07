const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

async function main() {
  const [, , srcImg, yminStr, xminStr, ymaxStr, xmaxStr, outRelPath] = process.argv;
  if (!srcImg || !outRelPath) {
    console.error(
      "Usage: node scripts/crop-book-figure.js <srcImg> <ymin> <xmin> <ymax> <xmax> <outRelPath>"
    );
    process.exit(1);
  }
  const ymin = Number(yminStr);
  const xmin = Number(xminStr);
  const ymax = Number(ymaxStr);
  const xmax = Number(xmaxStr);

  const meta = await sharp(srcImg).metadata();
  const left = Math.max(0, Math.round((xmin / 1000) * meta.width));
  const top = Math.max(0, Math.round((ymin / 1000) * meta.height));
  const width = Math.min(
    meta.width - left,
    Math.round(((xmax - xmin) / 1000) * meta.width)
  );
  const height = Math.min(
    meta.height - top,
    Math.round(((ymax - ymin) / 1000) * meta.height)
  );

  const fullOut = path.resolve(process.cwd(), "public", outRelPath.replace(/^\/+/, ""));
  fs.mkdirSync(path.dirname(fullOut), { recursive: true });
  await sharp(srcImg)
    .extract({ left, top, width, height })
    .jpeg({ quality: 92 })
    .toFile(fullOut);
  console.log(`Saved cropped figure to ${fullOut} (${width}x${height})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
