-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "slug" TEXT,
ADD COLUMN "estimated_minutes" INTEGER,
ADD COLUMN "source_title" TEXT,
ADD COLUMN "source_author" TEXT,
ADD COLUMN "source_url" TEXT,
ADD COLUMN "source_license" TEXT,
ADD COLUMN "attribution_text" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "lessons_slug_key" ON "lessons"("slug");
