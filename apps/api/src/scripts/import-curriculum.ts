/**
 * Deterministic curriculum importer CLI.
 *
 * Reads Markdown lesson files from content/curriculum/ and syncs them into
 * Postgres via Prisma upserts.  Running the script multiple times produces
 * the same DB state (idempotent).
 *
 * Usage:  tsx src/scripts/import-curriculum.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Prisma client (standalone, no app server needed)
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({
  log: ['warn', 'error'],
});

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const CONTENT_ROOT = path.resolve(
  import.meta.dirname ?? path.dirname(new URL(import.meta.url).pathname),
  '../../../../content/curriculum',
);

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------
const TrackMetaSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  orderIndex: z.number().int(),
  isPublished: z.boolean().optional().default(false),
  sections: z.array(
    z.object({
      slug: z.string(),
      title: z.string(),
      description: z.string().optional().default(''),
      orderIndex: z.number().int(),
    }),
  ),
});

const LessonFrontmatterSchema = z.object({
  slug: z.string(),
  title: z.string(),
  orderIndex: z.number().int(),
  estimatedMinutes: z.number().int().optional(),
  sourceTitle: z.string().optional(),
  sourceAuthor: z.string().optional(),
  sourceUrl: z.string().optional(),
  sourceLicense: z.string().optional(),
  attributionText: z.string().optional(),
}).superRefine((data, ctx) => {
  const hasAnyAttribution =
    !!data.sourceTitle ||
    !!data.sourceAuthor ||
    !!data.sourceUrl ||
    !!data.sourceLicense ||
    !!data.attributionText;

  if (!hasAnyAttribution) return;

  if (!data.sourceTitle) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceTitle'], message: 'Required when attribution is present' });
  if (!data.sourceAuthor) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceAuthor'], message: 'Required when attribution is present' });
  if (!data.sourceUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceUrl'], message: 'Required when attribution is present' });
  if (!data.sourceLicense) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sourceLicense'], message: 'Required when attribution is present' });
  if (!data.attributionText) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['attributionText'], message: 'Required when attribution is present' });
});

type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;

// ---------------------------------------------------------------------------
// Simple YAML frontmatter parser (regex-based, no external dep)
// ---------------------------------------------------------------------------
function parseFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error('No YAML frontmatter found (expected --- delimiters)');
  }

  const yamlBlock = match[1];
  const content = match[2];

  const data: Record<string, unknown> = {};
  for (const line of yamlBlock.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    let value: unknown = trimmed.slice(colonIdx + 1).trim();

    // Strip surrounding quotes
    if (
      typeof value === 'string' &&
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = (value as string).slice(1, -1);
    }

    // Coerce numbers
    if (typeof value === 'string' && /^-?\d+$/.test(value)) {
      value = parseInt(value, 10);
    }

    data[key] = value;
  }

  return { data, content };
}

function normalizeRelativeLinks(contentMd: string, fm: LessonFrontmatter): string {
  if (!fm.sourceUrl) return contentMd;

  let out = contentMd;

  // Normalize Donne Martin System Design Primer relative links
  if (fm.sourceUrl.includes('raw.githubusercontent.com/donnemartin/system-design-primer/')) {
    // README content sometimes uses relative links like solutions/... or ../scaling_aws/...
    out = out.replace(/\]\(solutions\//g, '](https://github.com/donnemartin/system-design-primer/blob/master/solutions/');
    out = out.replace(/\]\(\.\.\//g, '](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/');
  }

  // Normalize LinkedIn School of SRE relative links
  if (fm.sourceUrl.includes('raw.githubusercontent.com/linkedin/school-of-sre/')) {
    // Convert links like (courses/...) or (level101/...) to GitHub blob links if they appear.
    out = out.replace(
      /\]\((courses\/[^\)]+)\)/g,
      '](https://github.com/linkedin/school-of-sre/blob/main/$1)',
    );
  }

  return out;
}

function stripHtmlArtifacts(contentMd: string): string {
  let out = contentMd;

  // Convert simple HTML anchors to Markdown links.
  // Handles: <a href=http://x>Text</a> and <a href="http://x">Text</a>
  out = out.replace(
    /<a\s+href=(?:"([^"]+)"|'([^']+)'|([^\s>]+))\s*>([\s\S]*?)<\/a>/gi,
    (_m, h1, h2, h3, text) => {
      const href = (h1 ?? h2 ?? h3 ?? '').trim();
      const label = String(text).replace(/<[^>]+>/g, '').trim() || href;
      return href ? `[${label}](${href})` : label;
    },
  );

  // Remove common inline HTML tags that are showing up verbatim in ReactMarkdown.
  out = out.replace(/<\/?p[^>]*>/gi, '');
  out = out.replace(/<br\s*\/?>/gi, '');
  out = out.replace(/<\/?i>/gi, '');
  out = out.replace(/<\/?center>/gi, '');
  out = out.replace(/<\/?div[^>]*>/gi, '');

  // Remove HTML images entirely.
  out = out.replace(/<img[^>]*>/gi, '');

  // Clean up excessive blank lines introduced by stripping.
  out = out.replace(/\n{3,}/g, '\n\n');

  return out.trimEnd() + '\n';
}

function normalizeLessonContent(contentMd: string, fm: LessonFrontmatter): string {
  return stripHtmlArtifacts(normalizeRelativeLinks(contentMd, fm));
}

// ---------------------------------------------------------------------------
// Counters for summary logging
// ---------------------------------------------------------------------------
const stats = {
  tracksUpserted: 0,
  sectionsUpserted: 0,
  lessonsUpserted: 0,
  itemsUpserted: 0,
  lessonsDeleted: 0,
  itemsDeleted: 0,
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\nCurriculum importer`);
  console.log(`Content root: ${CONTENT_ROOT}\n`);

  if (!fs.existsSync(CONTENT_ROOT)) {
    console.error(`ERROR: Content directory not found at ${CONTENT_ROOT}`);
    process.exit(1);
  }

  // ---- Ensure a fallback Topic exists for lessons ----
  const topic = await prisma.topic.upsert({
    where: { slug: 'systems-design' },
    update: {},
    create: {
      slug: 'systems-design',
      title: 'Systems Design',
      orderIndex: 0,
    },
  });

  // Collect all lesson slugs we process (for orphan cleanup)
  const allLessonSlugs: string[] = [];
  // Collect all CurriculumItem ids we process
  const allItemIds: string[] = [];

  // ---- Discover tracks ----
  const trackDirs = fs.readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const trackSlug of trackDirs) {
    const trackJsonPath = path.join(CONTENT_ROOT, trackSlug, 'track.json');
    if (!fs.existsSync(trackJsonPath)) {
      console.warn(`  SKIP ${trackSlug}/ (no track.json)`);
      continue;
    }

    const trackRaw = JSON.parse(fs.readFileSync(trackJsonPath, 'utf-8'));
    const trackMeta = TrackMetaSchema.parse(trackRaw);

    // Upsert track
    const track = await prisma.curriculumTrack.upsert({
      where: { slug: trackMeta.slug },
      update: {
        title: trackMeta.title,
        description: trackMeta.description,
        orderIndex: trackMeta.orderIndex,
        isPublished: trackMeta.isPublished,
      },
      create: {
        slug: trackMeta.slug,
        title: trackMeta.title,
        description: trackMeta.description,
        orderIndex: trackMeta.orderIndex,
        isPublished: trackMeta.isPublished,
      },
    });
    stats.tracksUpserted++;
    console.log(`  Track: ${track.slug}`);

    // ---- Process sections defined in track.json ----
    for (const sectionMeta of trackMeta.sections) {
      const section = await prisma.curriculumSection.upsert({
        where: {
          trackId_slug: { trackId: track.id, slug: sectionMeta.slug },
        },
        update: {
          title: sectionMeta.title,
          description: sectionMeta.description,
          orderIndex: sectionMeta.orderIndex,
        },
        create: {
          trackId: track.id,
          slug: sectionMeta.slug,
          title: sectionMeta.title,
          description: sectionMeta.description,
          orderIndex: sectionMeta.orderIndex,
        },
      });
      stats.sectionsUpserted++;
      console.log(`    Section: ${section.slug}`);

      // ---- Read .md lesson files for this section ----
      const sectionDir = path.join(
        CONTENT_ROOT,
        trackSlug,
        'sections',
        sectionMeta.slug,
      );

      if (!fs.existsSync(sectionDir)) {
        console.warn(`      SKIP section dir missing: ${sectionDir}`);
        continue;
      }

      const mdFiles = fs.readdirSync(sectionDir)
        .filter((f) => f.endsWith('.md'))
        .sort(); // deterministic ordering by filename

      for (const mdFile of mdFiles) {
        const raw = fs.readFileSync(path.join(sectionDir, mdFile), 'utf-8');

        let parsed: { data: Record<string, unknown>; content: string };
        try {
          parsed = parseFrontmatter(raw);
        } catch (err) {
          console.error(`      ERROR parsing ${mdFile}: ${(err as Error).message}`);
          continue;
        }

        let fm: LessonFrontmatter;
        try {
          fm = LessonFrontmatterSchema.parse(parsed.data);
        } catch (err) {
          console.error(`      ERROR validating frontmatter in ${mdFile}:`);
          if (err instanceof z.ZodError) {
            for (const issue of err.issues) {
              console.error(`        - ${issue.path.join('.')}: ${issue.message}`);
            }
          }
          continue;
        }

        allLessonSlugs.push(fm.slug);

        // Upsert Lesson
        const normalizedContent = normalizeLessonContent(parsed.content, fm);
        const lesson = await prisma.lesson.upsert({
          where: { slug: fm.slug },
          update: {
            title: fm.title,
            contentMd: normalizedContent,
            orderIndex: fm.orderIndex,
            estimatedMinutes: fm.estimatedMinutes ?? null,
            sourceTitle: fm.sourceTitle ?? null,
            sourceAuthor: fm.sourceAuthor ?? null,
            sourceUrl: fm.sourceUrl ?? null,
            sourceLicense: fm.sourceLicense ?? null,
            attributionText: fm.attributionText ?? null,
            topicId: topic.id,
          },
          create: {
            slug: fm.slug,
            title: fm.title,
            contentMd: normalizedContent,
            orderIndex: fm.orderIndex,
            estimatedMinutes: fm.estimatedMinutes ?? null,
            sourceTitle: fm.sourceTitle ?? null,
            sourceAuthor: fm.sourceAuthor ?? null,
            sourceUrl: fm.sourceUrl ?? null,
            sourceLicense: fm.sourceLicense ?? null,
            attributionText: fm.attributionText ?? null,
            topicId: topic.id,
          },
        });
        stats.lessonsUpserted++;

        // Upsert CurriculumItem linking lesson -> section
        // Use a deterministic lookup: find existing item for this section+lesson
        const existingItem = await prisma.curriculumItem.findFirst({
          where: {
            sectionId: section.id,
            lessonId: lesson.id,
            kind: 'LESSON',
          },
        });

        let item;
        if (existingItem) {
          item = await prisma.curriculumItem.update({
            where: { id: existingItem.id },
            data: { orderIndex: fm.orderIndex },
          });
        } else {
          item = await prisma.curriculumItem.create({
            data: {
              sectionId: section.id,
              lessonId: lesson.id,
              kind: 'LESSON',
              orderIndex: fm.orderIndex,
            },
          });
        }
        allItemIds.push(item.id);
        stats.itemsUpserted++;

        console.log(`      Lesson: ${fm.slug} (${mdFile})`);
      }
    }
  }

  // ---- Delete orphaned CurriculumItems (LESSON kind) that no longer map to repo files ----
  if (allItemIds.length > 0) {
    const deletedItems = await prisma.curriculumItem.deleteMany({
      where: {
        kind: 'LESSON',
        id: { notIn: allItemIds },
      },
    });
    stats.itemsDeleted = deletedItems.count;
  }

  // ---- Delete orphaned Lessons (with slugs) that no longer exist in repo ----
  if (allLessonSlugs.length > 0) {
    const deletedLessons = await prisma.lesson.deleteMany({
      where: {
        slug: { not: null, notIn: allLessonSlugs },
      },
    });
    stats.lessonsDeleted = deletedLessons.count;
  }

  // ---- Summary ----
  console.log(`\nDone.`);
  console.log(`  Tracks upserted:   ${stats.tracksUpserted}`);
  console.log(`  Sections upserted: ${stats.sectionsUpserted}`);
  console.log(`  Lessons upserted:  ${stats.lessonsUpserted}`);
  console.log(`  Items upserted:    ${stats.itemsUpserted}`);
  console.log(`  Lessons deleted:   ${stats.lessonsDeleted}`);
  console.log(`  Items deleted:     ${stats.itemsDeleted}`);
}

main()
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
