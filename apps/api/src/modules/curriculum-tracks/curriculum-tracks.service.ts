import { prisma } from '../../config/prisma.js';
import { NotFoundError, ConflictError, ValidationError } from '../../lib/errors.js';
import type {
  CreateTrackInput,
  UpdateTrackInput,
  CreateSectionInput,
  UpdateSectionInput,
  CreateItemInput,
  UpdateItemInput,
  UpdateProgressInput,
} from './curriculum-tracks.schema.js';

export class CurriculumTracksService {
  // ─── Tracks ──────────────────────────────────────────────────────────────────

  /** List all published tracks ordered by orderIndex. */
  static async listTracks() {
    return prisma.curriculumTrack.findMany({
      where: { isPublished: true },
      orderBy: { orderIndex: 'asc' },
    });
  }

  /** Fetch a single track by slug with nested sections and items. */
  static async getTrackBySlug(slug: string) {
    const track = await prisma.curriculumTrack.findUnique({
      where: { slug },
      include: {
        sections: {
          orderBy: { orderIndex: 'asc' },
          include: {
            items: {
              orderBy: { orderIndex: 'asc' },
              include: {
                lesson: { select: { id: true, title: true } },
                topic: { select: { id: true, slug: true, title: true } },
              },
            },
          },
        },
      },
    });

    if (!track) throw new NotFoundError(`Track '${slug}' not found`);
    return track;
  }

  static async createTrack(data: CreateTrackInput) {
    const existing = await prisma.curriculumTrack.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError(`A track with slug '${data.slug}' already exists`);

    return prisma.curriculumTrack.create({ data });
  }

  static async updateTrack(id: string, data: UpdateTrackInput) {
    await CurriculumTracksService._requireTrackExists(id);

    if (data.slug) {
      const conflict = await prisma.curriculumTrack.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictError(`Slug '${data.slug}' is already in use`);
    }

    return prisma.curriculumTrack.update({ where: { id }, data });
  }

  static async deleteTrack(id: string) {
    await CurriculumTracksService._requireTrackExists(id);
    await prisma.curriculumTrack.delete({ where: { id } });
  }

  // ─── Sections ────────────────────────────────────────────────────────────────

  static async createSection(data: CreateSectionInput) {
    const track = await prisma.curriculumTrack.findUnique({ where: { id: data.trackId } });
    if (!track) throw new NotFoundError('Track not found');

    return prisma.curriculumSection.create({ data });
  }

  static async updateSection(id: string, data: UpdateSectionInput) {
    const existing = await prisma.curriculumSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Section not found');

    return prisma.curriculumSection.update({ where: { id }, data });
  }

  static async deleteSection(id: string) {
    const existing = await prisma.curriculumSection.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Section not found');

    await prisma.curriculumSection.delete({ where: { id } });
  }

  // ─── Items ───────────────────────────────────────────────────────────────────

  static async createItem(data: CreateItemInput) {
    const section = await prisma.curriculumSection.findUnique({ where: { id: data.sectionId } });
    if (!section) throw new NotFoundError('Section not found');

    CurriculumTracksService._enforceKindConstraints(data.kind, data);

    return prisma.curriculumItem.create({
      data: {
        sectionId: data.sectionId,
        orderIndex: data.orderIndex,
        kind: data.kind,
        lessonId: data.kind === 'LESSON' ? data.lessonId : null,
        topicId: data.kind === 'TOPIC' ? data.topicId : null,
        problemSlug: data.kind === 'PROBLEM' ? data.problemSlug : null,
      },
    });
  }

  static async updateItem(id: string, data: UpdateItemInput) {
    const existing = await prisma.curriculumItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Item not found');

    const kind = data.kind ?? existing.kind;

    // If kind changed, validate the new kind's required field is present
    if (data.kind) {
      const merged = {
        lessonId: data.lessonId !== undefined ? data.lessonId : existing.lessonId,
        topicId: data.topicId !== undefined ? data.topicId : existing.topicId,
        problemSlug: data.problemSlug !== undefined ? data.problemSlug : existing.problemSlug,
      };
      CurriculumTracksService._enforceKindConstraints(kind, merged);
    }

    return prisma.curriculumItem.update({ where: { id }, data });
  }

  static async deleteItem(id: string) {
    const existing = await prisma.curriculumItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Item not found');

    await prisma.curriculumItem.delete({ where: { id } });
  }

  // ─── User Progress ──────────────────────────────────────────────────────────

  /** Return all lesson progress for the user as a Record<lessonId, progress>. */
  static async getUserProgress(userId: string) {
    const rows = await prisma.userLessonProgress.findMany({
      where: { userId },
    });

    const record: Record<string, { status: string; startedAt: Date | null; completedAt: Date | null }> = {};
    for (const row of rows) {
      record[row.lessonId] = {
        status: row.status,
        startedAt: row.startedAt,
        completedAt: row.completedAt,
      };
    }
    return record;
  }

  /** Upsert lesson progress for a user. */
  static async updateLessonProgress(userId: string, lessonId: string, data: UpdateProgressInput) {
    // Verify the lesson exists
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw new NotFoundError('Lesson not found');

    const now = new Date();

    if (data.status === 'IN_PROGRESS') {
      return prisma.userLessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        create: {
          userId,
          lessonId,
          status: 'IN_PROGRESS',
          startedAt: now,
        },
        update: {
          status: 'IN_PROGRESS',
          // Only set startedAt if it wasn't set before
          startedAt: undefined, // keep existing
        },
      });
    }

    // COMPLETED
    return prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: 'COMPLETED',
        startedAt: now,
        completedAt: now,
      },
      update: {
        status: 'COMPLETED',
        completedAt: now,
      },
    });
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────────

  private static async _requireTrackExists(id: string) {
    const t = await prisma.curriculumTrack.findUnique({ where: { id }, select: { id: true } });
    if (!t) throw new NotFoundError('Track not found');
    return t;
  }

  private static _enforceKindConstraints(
    kind: string,
    data: { lessonId?: string | null; topicId?: string | null; problemSlug?: string | null },
  ) {
    if (kind === 'LESSON' && !data.lessonId) {
      throw new ValidationError('LESSON items require lessonId');
    }
    if (kind === 'TOPIC' && !data.topicId) {
      throw new ValidationError('TOPIC items require topicId');
    }
    if (kind === 'PROBLEM' && !data.problemSlug) {
      throw new ValidationError('PROBLEM items require problemSlug');
    }
  }
}
