/**
 * import-leetcode.ts
 *
 * Downloads the Alishohadaee/leetcode-problems-dataset from HuggingFace and
 * upserts all free (non-paid) problems into the database.
 *
 * Run:  npx tsx prisma/import-leetcode.ts
 *
 * Idempotent — safe to re-run; problems are upserted on slug.
 * Test cases are NOT included in the dataset, so problems land with
 * isPublished: true but no TestCase rows.
 */

import { PrismaClient, Difficulty } from '@prisma/client';
import TurndownService from 'turndown';

const prisma = new PrismaClient();
const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

// ─── Dataset URL ──────────────────────────────────────────────────────────────

const DATASET_URL =
  'https://huggingface.co/datasets/Alishohadaee/leetcode-problems-dataset/resolve/main/raw_data/leetcode_problems.json';

// ─── Topic slug mapping ───────────────────────────────────────────────────────
// Maps LeetCode topic labels to the slugs that already exist in the DB.
// Topics not listed here are stored only as ProblemTag rows.

const TOPIC_SLUG_MAP: Record<string, string> = {
  'Array':                 'arrays',
  'String':                'strings',
  'Binary Tree':           'trees',
  'Tree':                  'trees',
  'Binary Search Tree':    'trees',
  'Graph':                 'graphs',
  'Topological Sort':      'graphs',
  'Shortest Path':         'graphs',
  'Dynamic Programming':   'dynamic-programming',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface RawProblem {
  frontendQuestionId: string | number;
  title: string;
  titleSlug: string;
  description: string;       // HTML
  difficulty: 'Easy' | 'Medium' | 'Hard';
  paidOnly: boolean;
  topics: string[];          // e.g. ["Array", "Hash Table"]
  hints?: string[];
  acceptance_rate?: number;
  likes?: number;
  dislikes?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapDifficulty(raw: string): Difficulty {
  switch (raw) {
    case 'Easy':   return Difficulty.EASY;
    case 'Medium': return Difficulty.MEDIUM;
    case 'Hard':   return Difficulty.HARD;
    default:       return Difficulty.MEDIUM;
  }
}

function htmlToMarkdown(html: string): string {
  if (!html) return '';
  return turndown.turndown(html).trim();
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Fetching dataset from HuggingFace…');
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const raw: RawProblem[] = await res.json();
  console.log(`Downloaded ${raw.length} total problems.`);

  const free = raw.filter((p) => !p.paidOnly);
  console.log(`${free.length} free problems to import.`);

  // Pre-load existing topic slugs so we can do O(1) lookups
  const existingTopics = await prisma.topic.findMany({ select: { id: true, slug: true } });
  const topicIdBySlug = Object.fromEntries(existingTopics.map((t) => [t.slug, t.id]));

  let imported = 0;
  let skipped = 0;

  for (const raw of free) {
    // Skip problems with no slug (shouldn't happen, but be safe)
    if (!raw.titleSlug) { skipped++; continue; }

    const statementMd = htmlToMarkdown(raw.description);
    const difficulty  = mapDifficulty(raw.difficulty);
    const topics      = Array.isArray(raw.topics) ? raw.topics : [];

    try {
      const problem = await prisma.problem.upsert({
        where:  { slug: raw.titleSlug },
        update: {
          title:       raw.title,
          difficulty,
          statementMd,
          isPublished: true,
        },
        create: {
          slug:        raw.titleSlug,
          title:       raw.title,
          difficulty,
          statementMd,
          isPublished: true,
        },
      });

      // ── ProblemTopic: link to existing DB topics ───────────────────────────
      for (const label of topics) {
        const dbSlug = TOPIC_SLUG_MAP[label];
        if (!dbSlug) continue;
        const topicId = topicIdBySlug[dbSlug];
        if (!topicId) continue;

        await prisma.problemTopic.upsert({
          where: {
            problemId_topicId: { problemId: problem.id, topicId },
          },
          update: {},
          create: { problemId: problem.id, topicId },
        });
      }

      // ── ProblemTag: store every topic label as a tag ───────────────────────
      // Delete stale tags first so a re-run doesn't duplicate them
      await prisma.problemTag.deleteMany({ where: { problemId: problem.id } });
      if (topics.length > 0) {
        await prisma.problemTag.createMany({
          data: topics.map((tag) => ({ problemId: problem.id, tag })),
          skipDuplicates: true,
        });
      }

      imported++;
      if (imported % 100 === 0) {
        process.stdout.write(`  …${imported} / ${free.length}\r`);
      }
    } catch (err) {
      console.error(`Failed on ${raw.titleSlug}:`, err);
      skipped++;
    }
  }

  console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}`);
}

main()
  .catch((err) => {
    console.error('Import failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
