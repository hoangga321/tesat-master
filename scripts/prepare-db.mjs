import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const dbUrl = process.env.DATABASE_URL || "file:./dev.db";

if (fs.existsSync(schemaPath)) {
  let schemaContent = fs.readFileSync(schemaPath, "utf8");

  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) {
    console.log("[prepare-db] Detected Cloud PostgreSQL DATABASE_URL -> configuring Prisma for postgresql...");
    schemaContent = schemaContent.replace(
      /provider\s*=\s*"sqlite"/,
      'provider = "postgresql"'
    );
    fs.writeFileSync(schemaPath, schemaContent, "utf8");
    execSync("npx prisma generate", { stdio: "inherit" });
    execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });
  } else {
    console.log("[prepare-db] Using local SQLite DATABASE_URL -> generating Prisma client...");
    execSync("npx prisma generate", { stdio: "inherit" });
  }
}
