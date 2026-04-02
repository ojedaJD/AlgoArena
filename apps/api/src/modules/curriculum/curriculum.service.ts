import { prisma } from '../../config/prisma.js';
import { NotFoundError, ConflictError } from '../../lib/errors.js';
import type {
  CreateTopicInput,
  UpdateTopicInput,
  CreateLessonInput,
  UpdateLessonInput,
} from './curriculum.schema.js';

export class CurriculumService {
  // ─── Topics ───────────────────────────────────────────────────────────────────

  /**
   * Return all topics ordered by orderIndex with nested children,
   * lesson count, and linked problem count.
   */
  static async listTopics() {
    const topics = await prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { lessons: true, problems: true },
            },
          },
        },
        _count: {
          select: { lessons: true, problems: true },
        },
      },
    });

    // Return only root-level topics (parentTopicId == null);
    // children are nested within each root via the `children` relation.
    return topics.filter((t) => t.parentTopicId === null);
  }

  /**
   * Fetch a single topic by slug with all its lessons (ordered) and
   * the published problems linked to it.
   */
  static async getTopicBySlug(slug: string) {
    const topic = await prisma.topic.findUnique({
      where: { slug },
      include: {
        children: { orderBy: { orderIndex: 'asc' } },
        lessons: {
          orderBy: { orderIndex: 'asc' },
          select: {
            id: true,
            title: true,
            orderIndex: true,
            // Omit contentMd for the listing — fetch via getLessonById
          },
        },
        problems: {
          include: {
            problem: {
              where: { isPublished: true },
              select: {
                id: true,
                slug: true,
                title: true,
                difficulty: true,
              },
            },
          },
        },
      },
    });

    if (!topic) throw new NotFoundError(`Topic '${slug}' not found`);

    // Filter out junction rows where the problem is not published (null after where clause)
    const problems = topic.problems
      .map((pt) => pt.problem)
      .filter((p): p is NonNullable<typeof p> => p !== null);

    return { ...topic, problems };
  }

  static async createTopic(data: CreateTopicInput) {
    const existing = await prisma.topic.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError(`A topic with slug '${data.slug}' already exists`);

    if (data.parentTopicId) {
      const parent = await prisma.topic.findUnique({ where: { id: data.parentTopicId } });
      if (!parent) throw new NotFoundError('Parent topic not found');
    }

    return prisma.topic.create({
      data: {
        slug: data.slug,
        title: data.title,
        orderIndex: data.orderIndex,
        parentTopicId: data.parentTopicId ?? null,
      },
    });
  }

  static async updateTopic(id: string, data: UpdateTopicInput) {
    await CurriculumService._requireTopicExists(id);

    if (data.slug) {
      const conflict = await prisma.topic.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictError(`Slug '${data.slug}' is already in use`);
    }

    if (data.parentTopicId) {
      const parent = await prisma.topic.findUnique({ where: { id: data.parentTopicId } });
      if (!parent) throw new NotFoundError('Parent topic not found');
    }

    return prisma.topic.update({ where: { id }, data });
  }

  static async deleteTopic(id: string) {
    await CurriculumService._requireTopicExists(id);
    await prisma.topic.delete({ where: { id } });
  }

  // ─── Lessons ──────────────────────────────────────────────────────────────────

  static async getLessonById(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        topic: { select: { id: true, slug: true, title: true } },
      },
    });
    if (!lesson) throw new NotFoundError('Lesson not found');
    return lesson;
  }

  static async createLesson(topicId: string, data: CreateLessonInput) {
    const topic = await prisma.topic.findUnique({ where: { id: topicId } });
    if (!topic) throw new NotFoundError('Topic not found');

    return prisma.lesson.create({
      data: {
        topicId,
        title: data.title,
        contentMd: data.contentMd,
        orderIndex: data.orderIndex,
      },
    });
  }

  static async updateLesson(id: string, data: UpdateLessonInput) {
    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Lesson not found');

    return prisma.lesson.update({ where: { id }, data });
  }

  static async deleteLesson(id: string) {
    const existing = await prisma.lesson.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Lesson not found');

    await prisma.lesson.delete({ where: { id } });
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────────

  private static async _requireTopicExists(id: string) {
    const t = await prisma.topic.findUnique({ where: { id }, select: { id: true } });
    if (!t) throw new NotFoundError('Topic not found');
    return t;
  }
}
