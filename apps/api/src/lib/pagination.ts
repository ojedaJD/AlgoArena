export interface PaginationParams {
  cursor?: string | null;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Build cursor-based pagination arguments for Prisma `findMany`.
 * Returns the Prisma query fragment (take, skip, cursor) and a
 * helper to wrap the raw results into a PaginatedResult.
 */
export function paginate<T extends { id: string }>(
  params: PaginationParams,
): {
  prismaArgs: {
    take: number;
    skip: number;
    cursor: { id: string } | undefined;
  };
  wrap: (rows: T[]) => PaginatedResult<T>;
} {
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const prismaArgs = {
    take: limit + 1, // fetch one extra to detect hasMore
    skip: params.cursor ? 1 : 0, // skip the cursor row itself
    cursor: params.cursor ? { id: params.cursor } : undefined,
  };

  function wrap(rows: T[]): PaginatedResult<T> {
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore ? data[data.length - 1]!.id : null;

    return { data, nextCursor, hasMore };
  }

  return { prismaArgs, wrap };
}
