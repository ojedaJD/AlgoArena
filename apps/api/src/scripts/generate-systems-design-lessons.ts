/**
 * Generates Systems Design curriculum markdown files from open-licensed sources.
 *
 * - Writes to: content/curriculum/systems-design/sections/*
 * - Ensures required lesson template headings exist (for lint-curriculum).
 * - Avoids broken upstream images by removing image markdown and inserting Mermaid placeholders.
 *
 * Usage:
 *   tsx src/scripts/generate-systems-design-lessons.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import https from 'node:https';
import http from 'node:http';
import { URL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const CONTENT_ROOT = path.join(ROOT, 'content/curriculum/systems-design/sections');

type SectionName = 'foundations' | 'building-blocks' | 'case-studies';

const SourceLessonSchema = z.object({
  section: z.custom<SectionName>(),
  filename: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  orderIndex: z.number().int().min(0),
  estimatedMinutes: z.number().int().min(1).optional(),
  sourceTitle: z.string().min(1),
  sourceAuthor: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceLicense: z.string().min(1),
  attributionText: z.string().min(1),
  // For Primer topics, we want to extract a subsection from the README instead of fetching raw README per-lesson.
  mode: z.enum(['fetchRaw', 'extractFromPrimerReadme']),
  primerAnchor: z.string().optional(), // e.g. "performance-vs-scalability"
});
type SourceLesson = z.infer<typeof SourceLessonSchema>;

const LICENSE_CC_BY_4 = 'CC BY 4.0';

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.get(
      url,
      {
        headers: {
          'User-Agent': 'dsa-platform-curriculum-generator',
          Accept: 'text/plain, text/markdown;q=0.9, */*;q=0.8',
        },
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status < 200 || status >= 300) {
          reject(new Error(`Fetch failed ${status} for ${url}`));
          res.resume();
          return;
        }
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      },
    );
    req.on('error', reject);
  });
}

function stripImageMarkdown(md: string): string {
  // Remove markdown images: ![alt](url)
  return md
    .split('\n')
    .filter((line) => !line.trimStart().startsWith('!['))
    .join('\n');
}

function normalizeMd(md: string): string {
  return stripImageMarkdown(md).trimEnd() + '\n';
}

function mermaidPlaceholder(title: string): string {
  return [
    '```mermaid',
    'flowchart TD',
    `  A["${title}"] --> B["Key_components"]`,
    '  B --> C["Tradeoffs"]',
    '```',
    '',
  ].join('\n');
}

function buildLessonMarkdown(meta: SourceLesson, upstreamBody: string): string {
  const fm = [
    '---',
    `slug: ${meta.slug}`,
    `title: "${meta.title.replaceAll('"', '\\"')}"`,
    `orderIndex: ${meta.orderIndex}`,
    ...(meta.estimatedMinutes ? [`estimatedMinutes: ${meta.estimatedMinutes}`] : []),
    `sourceTitle: "${meta.sourceTitle.replaceAll('"', '\\"')}"`,
    `sourceAuthor: "${meta.sourceAuthor.replaceAll('"', '\\"')}"`,
    `sourceUrl: "${meta.sourceUrl}"`,
    `sourceLicense: "${meta.sourceLicense}"`,
    `attributionText: "${meta.attributionText.replaceAll('"', '\\"')}"`,
    '---',
    '',
  ].join('\n');

  const body = [
    '## Goal',
    '',
    `Learn ${meta.title.toLowerCase()} using a vetted, open-licensed reference and apply it in interview-style design discussions.`,
    '',
    '## Core concepts',
    '',
    mermaidPlaceholder(meta.title).trimEnd(),
    '',
    normalizeMd(upstreamBody),
    '',
    '## Trade-offs',
    '',
    '- Latency: Identify where you add hops (cache, LB, queues) and how it shifts p95/p99.',
    '- Cost: Call out which components scale linearly vs super-linearly with traffic.',
    '- Consistency: State which data must be strongly consistent vs can be eventual.',
    '- Complexity: Note operational overhead (deployments, oncall, observability).',
    '',
    '## Failure modes',
    '',
    '- Single points of failure and missing failover paths.',
    '- Retry storms, overload collapse, and cache stampedes.',
    '- Hot partitions / uneven traffic distribution and its impact on SLOs.',
    '',
    '## Interview prompts',
    '',
    '1. What are the top 2 constraints that drive this design choice?',
    '2. What breaks first at 10× traffic, and how do you know?',
    '3. What would you simplify for v1 and why?',
    '',
    '## Mini design drill (10-15 min)',
    '',
    '- Pick a product you use daily and identify where this concept appears in its architecture.',
    '- Write 3 concrete SLOs and name the metrics you would monitor.',
    '',
    '## Checkpoint quiz',
    '',
    '1. What problem does this concept solve?',
    '2. What is the main trade-off it introduces?',
    '3. Name one common failure mode and one mitigation.',
    '4. Where would you apply it in a URL shortener or chat system?',
    '5. What metric would tell you it is working?',
    '',
  ].join('\n');

  return fm + body;
}

function extractPrimerSection(primerReadme: string, anchor: string): string {
  // We extract from the GitHub-flavored markdown by finding the heading that matches the anchor.
  // The README uses headings like "## Latency vs throughput". We'll locate by the explicit anchor label in links:
  // We fall back to searching for a heading that contains the anchor words.
  const normalizedAnchor = anchor.toLowerCase();

  const lines = primerReadme.split('\n');
  const headingIdx = lines.findIndex((l) => {
    const t = l.trim().toLowerCase();
    return t.startsWith('## ') && t.includes(normalizedAnchor.replaceAll('-', ' '));
  });

  if (headingIdx === -1) {
    // As a simpler reliable fallback, return a slice around the anchor link references.
    const linkIdx = lines.findIndex((l) => l.toLowerCase().includes(`#${normalizedAnchor}`));
    const start = Math.max(0, linkIdx - 10);
    const end = Math.min(lines.length, linkIdx + 80);
    return lines.slice(start, end).join('\n');
  }

  const start = headingIdx;
  let end = lines.length;
  for (let i = headingIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (t.startsWith('## ')) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

const LESSONS: SourceLesson[] = [
  // --- Foundations (LinkedIn School of SRE) ---
  {
    section: 'foundations',
    filename: '07-sre101-systems-design-intro.md',
    slug: 'sre101-intro',
    title: 'Systems Design (Intro)',
    orderIndex: 6,
    estimatedMinutes: 20,
    sourceTitle: 'School of SRE - Systems Design (Level 101)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level101/systems_design/intro.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '08-sre101-scalability.md',
    slug: 'sre101-scalability',
    title: 'Scalability',
    orderIndex: 7,
    estimatedMinutes: 35,
    sourceTitle: 'School of SRE - Systems Design: Scalability (Level 101)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level101/systems_design/scalability.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '09-sre101-availability.md',
    slug: 'sre101-availability',
    title: 'High Availability',
    orderIndex: 8,
    estimatedMinutes: 25,
    sourceTitle: 'School of SRE - Systems Design: Availability (Level 101)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level101/systems_design/availability.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '10-sre101-fault-tolerance.md',
    slug: 'sre101-fault-tolerance',
    title: 'Fault Tolerance',
    orderIndex: 9,
    estimatedMinutes: 25,
    sourceTitle: 'School of SRE - Systems Design: Fault Tolerance (Level 101)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level101/systems_design/fault-tolerance.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '11-sre102-intro.md',
    slug: 'sre102-intro',
    title: 'System Design (Phase 2 Intro)',
    orderIndex: 10,
    estimatedMinutes: 15,
    sourceTitle: 'School of SRE - System Design (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/intro.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '12-sre102-large-system-design.md',
    slug: 'sre102-large-system-design',
    title: 'Large System Design (Non-Abstract)',
    orderIndex: 11,
    estimatedMinutes: 40,
    sourceTitle: 'School of SRE - Large System Design (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/large-system-design.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '13-sre102-scaling.md',
    slug: 'sre102-scaling',
    title: 'Scaling',
    orderIndex: 12,
    estimatedMinutes: 35,
    sourceTitle: 'School of SRE - Scaling (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/scaling.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '14-sre102-scaling-beyond-datacenter.md',
    slug: 'sre102-scaling-beyond-datacenter',
    title: 'Scaling Beyond the Datacenter',
    orderIndex: 13,
    estimatedMinutes: 25,
    sourceTitle: 'School of SRE - Scaling Beyond the Datacenter (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/scaling-beyond-the-datacenter.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '15-sre102-resiliency.md',
    slug: 'sre102-resiliency',
    title: 'Design Patterns for Resiliency',
    orderIndex: 14,
    estimatedMinutes: 25,
    sourceTitle: 'School of SRE - Resiliency (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/resiliency.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'foundations',
    filename: '16-sre102-conclusion.md',
    slug: 'sre102-conclusion',
    title: 'Conclusion',
    orderIndex: 15,
    estimatedMinutes: 10,
    sourceTitle: 'School of SRE - System Design Conclusion (Level 102)',
    sourceAuthor: 'LinkedIn School of SRE',
    sourceUrl: 'https://raw.githubusercontent.com/linkedin/school-of-sre/main/courses/level102/system_design/conclusion.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from LinkedIn School of SRE (CC BY 4.0).',
    mode: 'fetchRaw',
  },

  // --- Building blocks (System Design Primer) ---
  {
    section: 'building-blocks',
    filename: '07-primer-performance-vs-scalability.md',
    slug: 'primer-performance-vs-scalability',
    title: 'Performance vs Scalability',
    orderIndex: 6,
    estimatedMinutes: 15,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#performance-vs-scalability',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'performance-vs-scalability',
  },
  {
    section: 'building-blocks',
    filename: '08-primer-latency-vs-throughput.md',
    slug: 'primer-latency-vs-throughput',
    title: 'Latency vs Throughput',
    orderIndex: 7,
    estimatedMinutes: 15,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#latency-vs-throughput',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'latency-vs-throughput',
  },
  {
    section: 'building-blocks',
    filename: '09-primer-availability-vs-consistency.md',
    slug: 'primer-availability-vs-consistency',
    title: 'Availability vs Consistency',
    orderIndex: 8,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#availability-vs-consistency',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'availability-vs-consistency',
  },
  {
    section: 'building-blocks',
    filename: '10-primer-cap-theorem.md',
    slug: 'primer-cap-theorem',
    title: 'CAP Theorem',
    orderIndex: 9,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#cap-theorem',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'cap-theorem',
  },
  {
    section: 'building-blocks',
    filename: '11-primer-consistency-patterns.md',
    slug: 'primer-consistency-patterns',
    title: 'Consistency Patterns',
    orderIndex: 10,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#consistency-patterns',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'consistency-patterns',
  },
  {
    section: 'building-blocks',
    filename: '12-primer-availability-patterns.md',
    slug: 'primer-availability-patterns',
    title: 'Availability Patterns',
    orderIndex: 11,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#availability-patterns',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'availability-patterns',
  },
  {
    section: 'building-blocks',
    filename: '13-primer-domain-name-system.md',
    slug: 'primer-domain-name-system',
    title: 'Domain Name System (DNS)',
    orderIndex: 12,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#domain-name-system',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'domain-name-system',
  },
  {
    section: 'building-blocks',
    filename: '14-primer-content-delivery-network.md',
    slug: 'primer-content-delivery-network',
    title: 'Content Delivery Network (CDN)',
    orderIndex: 13,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#content-delivery-network',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'content-delivery-network',
  },
  {
    section: 'building-blocks',
    filename: '15-primer-load-balancer.md',
    slug: 'primer-load-balancer',
    title: 'Load Balancer',
    orderIndex: 14,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#load-balancer',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'load-balancer',
  },
  {
    section: 'building-blocks',
    filename: '16-primer-reverse-proxy.md',
    slug: 'primer-reverse-proxy',
    title: 'Reverse Proxy / Web Server',
    orderIndex: 15,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#reverse-proxy-web-server',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'reverse-proxy-web-server',
  },
  {
    section: 'building-blocks',
    filename: '17-primer-application-layer.md',
    slug: 'primer-application-layer',
    title: 'Application Layer',
    orderIndex: 16,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#application-layer',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'application-layer',
  },
  {
    section: 'building-blocks',
    filename: '18-primer-database.md',
    slug: 'primer-database',
    title: 'Database',
    orderIndex: 17,
    estimatedMinutes: 25,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#database',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'database',
  },
  {
    section: 'building-blocks',
    filename: '19-primer-sql-vs-nosql.md',
    slug: 'primer-sql-vs-nosql',
    title: 'SQL vs NoSQL',
    orderIndex: 18,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#sql-or-nosql',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'sql-or-nosql',
  },
  {
    section: 'building-blocks',
    filename: '20-primer-cache.md',
    slug: 'primer-cache',
    title: 'Cache',
    orderIndex: 19,
    estimatedMinutes: 25,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#cache',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'cache',
  },
  {
    section: 'building-blocks',
    filename: '21-primer-replication.md',
    slug: 'primer-replication',
    title: 'Replication',
    orderIndex: 20,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#replication',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'replication',
  },
  {
    section: 'building-blocks',
    filename: '22-primer-sharding.md',
    slug: 'primer-sharding',
    title: 'Sharding',
    orderIndex: 21,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#sharding',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'sharding',
  },
  {
    section: 'building-blocks',
    filename: '23-primer-message-queues.md',
    slug: 'primer-queues',
    title: 'Message Queues',
    orderIndex: 22,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#message-queues',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'message-queues',
  },
  {
    section: 'building-blocks',
    filename: '24-primer-publish-subscribe.md',
    slug: 'primer-pub-sub',
    title: 'Publish-Subscribe',
    orderIndex: 23,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#publish-subscribe',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'publish-subscribe',
  },
  {
    section: 'building-blocks',
    filename: '25-primer-rate-limiting.md',
    slug: 'primer-rate-limiting',
    title: 'Rate Limiting',
    orderIndex: 24,
    estimatedMinutes: 20,
    sourceTitle: 'System Design Primer',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://github.com/donnemartin/system-design-primer#rate-limiting',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'extractFromPrimerReadme',
    primerAnchor: 'rate-limiting',
  },

  // --- Case studies (System Design Primer solutions) ---
  {
    section: 'case-studies',
    filename: '04-primer-pastebin.md',
    slug: 'primer-case-pastebin',
    title: 'Case Study: Pastebin / Bit.ly',
    orderIndex: 3,
    estimatedMinutes: 45,
    sourceTitle: 'System Design Primer - Design Pastebin.com (or Bit.ly)',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/pastebin/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '05-primer-twitter-timeline-search.md',
    slug: 'primer-case-twitter-timeline-search',
    title: 'Case Study: Twitter Timeline + Search',
    orderIndex: 4,
    estimatedMinutes: 60,
    sourceTitle: 'System Design Primer - Design the Twitter timeline and search',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/twitter/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '06-primer-web-crawler.md',
    slug: 'primer-case-web-crawler',
    title: 'Case Study: Web Crawler',
    orderIndex: 5,
    estimatedMinutes: 60,
    sourceTitle: 'System Design Primer - Design a web crawler',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/web_crawler/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '07-primer-mint.md',
    slug: 'primer-case-mint',
    title: 'Case Study: Mint.com',
    orderIndex: 6,
    estimatedMinutes: 60,
    sourceTitle: 'System Design Primer - Design Mint.com',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/mint/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '08-primer-social-graph.md',
    slug: 'primer-case-social-graph',
    title: 'Case Study: Social Graph (Data Structures)',
    orderIndex: 7,
    estimatedMinutes: 45,
    sourceTitle: 'System Design Primer - Design the data structures for a social network',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/social_graph/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '09-primer-query-cache.md',
    slug: 'primer-case-query-cache',
    title: 'Case Study: Query Cache (Key-Value Cache)',
    orderIndex: 8,
    estimatedMinutes: 45,
    sourceTitle: 'System Design Primer - Design a key-value cache for query results',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/query_cache/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '10-primer-sales-rank.md',
    slug: 'primer-case-sales-rank',
    title: "Case Study: Amazon Sales Rank",
    orderIndex: 9,
    estimatedMinutes: 45,
    sourceTitle: "System Design Primer - Design Amazon's sales rank by category",
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/sales_rank/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
  {
    section: 'case-studies',
    filename: '11-primer-scaling-aws.md',
    slug: 'primer-case-scaling-aws',
    title: 'Case Study: Scaling to Millions (AWS)',
    orderIndex: 10,
    estimatedMinutes: 60,
    sourceTitle: 'System Design Primer - Design a system that scales to millions of users on AWS',
    sourceAuthor: 'Donne Martin',
    sourceUrl: 'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/solutions/system_design/scaling_aws/README.md',
    sourceLicense: LICENSE_CC_BY_4,
    attributionText: 'Content adapted from Donne Martin, System Design Primer (CC BY 4.0).',
    mode: 'fetchRaw',
  },
].map((l) => SourceLessonSchema.parse(l));

async function main() {
  if (!fs.existsSync(CONTENT_ROOT)) {
    throw new Error(`Content root not found: ${CONTENT_ROOT}`);
  }

  const primerReadme = await fetchText(
    'https://raw.githubusercontent.com/donnemartin/system-design-primer/master/README.md',
  );

  for (const lesson of LESSONS) {
    const outDir = path.join(CONTENT_ROOT, lesson.section);
    const outPath = path.join(outDir, lesson.filename);

    if (fs.existsSync(outPath)) {
      // Do not overwrite existing user-authored lessons (idempotent).
      continue;
    }

    let upstream = '';
    if (lesson.mode === 'fetchRaw') {
      upstream = await fetchText(lesson.sourceUrl);
    } else {
      upstream = extractPrimerSection(primerReadme, lesson.primerAnchor ?? lesson.slug);
    }

    const md = buildLessonMarkdown(lesson, upstream);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, md, 'utf8');
  }

  console.log(`Generated lessons into ${CONTENT_ROOT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

