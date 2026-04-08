/**
 * import-leetcode.ts
 *
 * Downloads the Alishohadaee/leetcode-problems-dataset from HuggingFace and
 * upserts all free (non-paid) problems into the database.
 *
 * Can be called directly:  npx tsx prisma/import-leetcode.ts
 * Or imported by seed.ts for automatic first-run population.
 *
 * Idempotent — safe to re-run; problems are upserted on slug.
 */

import { PrismaClient, Difficulty } from '@prisma/client';
import TurndownService from 'turndown';

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });

const DATASET_URL =
  'https://huggingface.co/datasets/Alishohadaee/leetcode-problems-dataset/resolve/main/raw_data/leetcode_problems.json';

const TOPIC_SLUG_MAP: Record<string, string> = {
  'Array':               'arrays',
  'String':              'strings',
  'Binary Tree':         'trees',
  'Tree':                'trees',
  'Binary Search Tree':  'trees',
  'Graph':               'graphs',
  'Topological Sort':    'graphs',
  'Shortest Path':       'graphs',
  'Dynamic Programming': 'dynamic-programming',
};

interface RawProblem {
  title: string;
  titleSlug: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  paidOnly: boolean;
  topics: string[];
}

function mapDifficulty(raw: string): Difficulty {
  if (raw === 'Easy') return Difficulty.EASY;
  if (raw === 'Hard') return Difficulty.HARD;
  return Difficulty.MEDIUM;
}

export async function importLeetcode(prisma: PrismaClient): Promise<void> {
  console.log('Fetching dataset from HuggingFace…');
  const res = await fetch(DATASET_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  const raw: RawProblem[] = await res.json();

  const free = raw.filter((p) => !p.paidOnly);
  console.log(`${free.length} free problems to import.`);

  const existingTopics = await prisma.topic.findMany({ select: { id: true, slug: true } });
  const topicIdBySlug = Object.fromEntries(existingTopics.map((t) => [t.slug, t.id]));

  let imported = 0;
  let skipped = 0;

  for (const p of free) {
    if (!p.titleSlug) { skipped++; continue; }

    const topics = Array.isArray(p.topics) ? p.topics : [];

    try {
      const problem = await prisma.problem.upsert({
        where:  { slug: p.titleSlug },
        update: { title: p.title, difficulty: mapDifficulty(p.difficulty), statementMd: turndown.turndown(p.description || '').trim(), isPublished: true },
        create: { slug: p.titleSlug, title: p.title, difficulty: mapDifficulty(p.difficulty), statementMd: turndown.turndown(p.description || '').trim(), isPublished: true },
      });

      for (const label of topics) {
        const topicId = topicIdBySlug[TOPIC_SLUG_MAP[label] ?? ''];
        if (!topicId) continue;
        await prisma.problemTopic.upsert({
          where: { problemId_topicId: { problemId: problem.id, topicId } },
          update: {},
          create: { problemId: problem.id, topicId },
        });
      }

      await prisma.problemTag.deleteMany({ where: { problemId: problem.id } });
      if (topics.length > 0) {
        await prisma.problemTag.createMany({
          data: topics.map((tag) => ({ problemId: problem.id, tag })),
          skipDuplicates: true,
        });
      }

      imported++;
      if (imported % 100 === 0) process.stdout.write(`  …${imported} / ${free.length}\r`);
    } catch {
      skipped++;
    }
  }

  console.log(`\nImported: ${imported}, Skipped: ${skipped}`);
}

// Allow running directly: npx tsx prisma/import-leetcode.ts
const prisma = new PrismaClient();
importLeetcode(prisma)
  .catch((err) => { console.error('Import failed:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
