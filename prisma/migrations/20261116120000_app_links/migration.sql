-- CreateEnum
CREATE TYPE "AppPlatform" AS ENUM ('WEB', 'ANDROID');

-- CreateTable
CREATE TABLE "app_links" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL DEFAULT '',
    "href" TEXT NOT NULL,
    "platform" "AppPlatform" NOT NULL DEFAULT 'WEB',
    "order" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_links_slug_key" ON "app_links"("slug");

-- CreateIndex
CREATE INDEX "app_links_isPublished_order_idx" ON "app_links"("isPublished", "order");
