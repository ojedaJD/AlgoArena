import { z } from "zod";
import * as fs from "node:fs";
import * as path from "node:path";

// ── Schemas ──────────────────────────────────────────────────────────

const FrontmatterSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  orderIndex: z.number().int(),
});

const TrackJsonSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  sections: z.array(z.any()).min(1),
});

// ── Constants ────────────────────────────────────────────────────────

const CONTENT_DIR = path.resolve(
  import.meta.dirname,
  "../../../../content/curriculum",
);

const REQUIRED_SECTIONS = [
  "## Goal",
  "## Core concepts",
  "## Trade-offs",
  "## Failure modes",
  "## Interview prompts",
  "## Mini design drill",
  "## Checkpoint quiz",
];

const PLACEHOLDER_PATTERNS = [
  /^\s*\[placeholder\]\s*$/i,
  /^\s*-\s*\[Concept\s+\d+\]\s*$/i,
  /^\s*-\s*\[Topic\s+\d+\]\s*$/i,
  /^\s*-\s*\[Item\s+\d+\]\s*$/i,
  /^\s*-\s*\[Question\s+\d+\]\s*$/i,
  /^\s*-\s*\[Prompt\s+\d+\]\s*$/i,
  /^\s*-\s*\[Drill\s+\d+\]\s*$/i,
  /^\s*-\s*\[Mode\s+\d+\]\s*$/i,
  /^\s*-\s*\[Trade-off\s+\d+\]\s*$/i,
  /^\s*TBD\s*$/i,
  /^\s*TODO\s*$/i,
];

// ── Types ────────────────────────────────────────────────────────────

type Severity = "error" | "warning";

interface Diagnostic {
  file: string;
  severity: Severity;
  message: string;
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseFrontmatter(
  raw: string,
): { data: Record<string, unknown>; body: string } | null {
  const parts = raw.split("---");
  if (parts.length < 3 || parts[0].trim() !== "") return null;

  const yamlBlock = parts[1];
  const body = parts.slice(2).join("---");

  // Simple YAML key: value parser (no nested structures needed)
  const data: Record<string, unknown> = {};
  for (const line of yamlBlock.split("\n")) {
    const match = line.match(/^(\w[\w-]*):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Try parsing as number
      const num = Number(value);
      if (!Number.isNaN(num) && value.trim() !== "") {
        data[key] = num;
      } else {
        // Strip surrounding quotes
        data[key] = value.replace(/^["']|["']$/g, "").trim();
      }
    }
  }

  return { data, body };
}

function isPlaceholderContent(sectionBody: string): boolean {
  const lines = sectionBody
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) return true;

  return lines.every((line) =>
    PLACEHOLDER_PATTERNS.some((pat) => pat.test(line)),
  );
}

function extractSectionBodies(
  body: string,
): Map<string, string> {
  const result = new Map<string, string>();
  const headingRegex = /^## .+$/gm;
  const matches = [...body.matchAll(headingRegex)];

  for (let i = 0; i < matches.length; i++) {
    const heading = matches[i][0];
    const start = matches[i].index! + heading.length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : body.length;
    result.set(heading, body.slice(start, end));
  }

  return result;
}

// ── Lint functions ───────────────────────────────────────────────────

function lintMarkdownFile(filePath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const rel = path.relative(CONTENT_DIR, filePath);
  const raw = fs.readFileSync(filePath, "utf-8");

  // 1. Frontmatter
  const parsed = parseFrontmatter(raw);
  if (!parsed) {
    diagnostics.push({
      file: rel,
      severity: "error",
      message: "Missing or malformed YAML frontmatter (expected --- delimiters)",
    });
    return diagnostics; // can't continue without body
  }

  const fm = FrontmatterSchema.safeParse(parsed.data);
  if (!fm.success) {
    for (const issue of fm.error.issues) {
      diagnostics.push({
        file: rel,
        severity: "error",
        message: `Frontmatter: ${issue.path.join(".")} — ${issue.message}`,
      });
    }
  }

  // 2. Required sections
  const body = parsed.body;
  const missingSections: string[] = [];
  for (const section of REQUIRED_SECTIONS) {
    if (!body.includes(section)) {
      missingSections.push(section);
    }
  }
  if (missingSections.length > 0) {
    diagnostics.push({
      file: rel,
      severity: "error",
      message: `Missing required sections: ${missingSections.join(", ")}`,
    });
  }

  // 3. Placeholder content
  const sectionBodies = extractSectionBodies(body);
  let placeholderCount = 0;
  let checkedCount = 0;

  for (const section of REQUIRED_SECTIONS) {
    const sectionBody = sectionBodies.get(section);
    if (sectionBody !== undefined) {
      checkedCount++;
      if (isPlaceholderContent(sectionBody)) {
        placeholderCount++;
      }
    }
  }

  if (checkedCount > 0 && placeholderCount === checkedCount) {
    diagnostics.push({
      file: rel,
      severity: "warning",
      message: "All sections contain only placeholder content",
    });
  } else if (placeholderCount > 0) {
    diagnostics.push({
      file: rel,
      severity: "warning",
      message: `${placeholderCount}/${checkedCount} sections contain placeholder content`,
    });
  }

  return diagnostics;
}

function lintTrackDir(trackPath: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const rel = path.relative(CONTENT_DIR, trackPath);
  const trackJsonPath = path.join(trackPath, "track.json");

  if (!fs.existsSync(trackJsonPath)) {
    diagnostics.push({
      file: rel,
      severity: "error",
      message: "Missing track.json",
    });
    return diagnostics;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(trackJsonPath, "utf-8"));
  } catch {
    diagnostics.push({
      file: path.relative(CONTENT_DIR, trackJsonPath),
      severity: "error",
      message: "track.json is not valid JSON",
    });
    return diagnostics;
  }

  const result = TrackJsonSchema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      diagnostics.push({
        file: path.relative(CONTENT_DIR, trackJsonPath),
        severity: "error",
        message: `track.json: ${issue.path.join(".")} — ${issue.message}`,
      });
    }
  }

  return diagnostics;
}

// ── Main ─────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`Content directory not found: ${CONTENT_DIR}`);
    process.exit(1);
  }

  const allDiagnostics: Diagnostic[] = [];
  let fileCount = 0;
  const passedFiles = new Set<string>();
  const warnFiles = new Set<string>();
  const errorFiles = new Set<string>();

  // Discover track directories and .md files
  const entries = fs.readdirSync(CONTENT_DIR, { withFileTypes: true });

  // Top-level .md files
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const fullPath = path.join(CONTENT_DIR, entry.name);
      fileCount++;
      const diags = lintMarkdownFile(fullPath);
      allDiagnostics.push(...diags);
    }
  }

  // Track directories
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const trackPath = path.join(CONTENT_DIR, entry.name);

    // Validate track.json
    const trackDiags = lintTrackDir(trackPath);
    allDiagnostics.push(...trackDiags);

    // Validate .md files inside the track's sections subdirectories
    const sectionsDir = path.join(trackPath, "sections");
    if (fs.existsSync(sectionsDir)) {
      const sectionDirs = fs.readdirSync(sectionsDir, { withFileTypes: true });
      for (const sd of sectionDirs) {
        if (!sd.isDirectory()) continue;
        const sectionPath = path.join(sectionsDir, sd.name);
        const sectionFiles = fs.readdirSync(sectionPath, { withFileTypes: true });
        for (const sf of sectionFiles) {
          if (sf.isFile() && sf.name.endsWith(".md")) {
            const fullPath = path.join(sectionPath, sf.name);
            fileCount++;
            const diags = lintMarkdownFile(fullPath);
            allDiagnostics.push(...diags);
          }
        }
      }
    }
  }

  // Classify files
  for (const d of allDiagnostics) {
    if (d.severity === "error") {
      errorFiles.add(d.file);
    } else {
      warnFiles.add(d.file);
    }
  }

  // Collect all checked files
  const allFiles = new Set<string>();
  for (const d of allDiagnostics) allFiles.add(d.file);

  // Find files with no diagnostics
  const checkedMdFiles = new Set<string>();
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      checkedMdFiles.add(entry.name);
    }
    if (entry.isDirectory()) {
      const trackPath = path.join(CONTENT_DIR, entry.name);
      const sectionsDir = path.join(trackPath, "sections");
      if (fs.existsSync(sectionsDir)) {
        const sectionDirs = fs.readdirSync(sectionsDir, { withFileTypes: true });
        for (const sd of sectionDirs) {
          if (!sd.isDirectory()) continue;
          const sectionPath = path.join(sectionsDir, sd.name);
          const sectionFiles = fs.readdirSync(sectionPath, { withFileTypes: true });
          for (const sf of sectionFiles) {
            if (sf.isFile() && sf.name.endsWith(".md")) {
              checkedMdFiles.add(path.relative(CONTENT_DIR, path.join(sectionPath, sf.name)));
            }
          }
        }
      }
      allFiles.add(entry.name);
    }
  }

  for (const f of checkedMdFiles) {
    if (!errorFiles.has(f) && !warnFiles.has(f)) {
      passedFiles.add(f);
    }
  }

  // Print per-file results
  console.log("\n=== Curriculum Lint Results ===\n");

  if (fileCount === 0 && entries.filter((e) => e.isDirectory()).length === 0) {
    console.log("No curriculum files found in", CONTENT_DIR);
    console.log("\n--- Summary ---");
    console.log("0 passed, 0 warnings, 0 errors");
    process.exit(0);
  }

  for (const f of passedFiles) {
    console.log(`  PASS  ${f}`);
  }

  for (const d of allDiagnostics) {
    const tag = d.severity === "error" ? "ERROR" : " WARN";
    console.log(`  ${tag}  ${d.file}: ${d.message}`);
  }

  // Summary
  const errorCount = errorFiles.size;
  const pureWarnCount = [...warnFiles].filter((f) => !errorFiles.has(f)).length;
  const passCount = passedFiles.size;

  console.log("\n--- Summary ---");
  console.log(
    `${passCount} passed, ${pureWarnCount} warnings, ${errorCount} errors`,
  );

  if (errorCount > 0) {
    process.exit(1);
  }
  process.exit(0);
}

main();
