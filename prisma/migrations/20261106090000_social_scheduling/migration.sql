-- Scheduling + admin-editable settings for LinkedIn publishing.

-- CreateTable
CREATE TABLE "app_settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "isSecret" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("key")
);

-- AlterTable
ALTER TABLE "social_dispatches"
    ADD COLUMN "scheduledFor" TIMESTAMP(3),
    ADD COLUMN "scheduledDay" DATE,
    ADD COLUMN "imagePath" TEXT,
    ADD COLUMN "imageHash" TEXT,
    ADD COLUMN "manualEdit" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
-- Nulls are distinct in Postgres, so rows without a schedule are unaffected;
-- any two scheduled rows for one provider must fall on different local days.
CREATE UNIQUE INDEX "social_dispatches_provider_scheduledDay_key" ON "social_dispatches"("provider", "scheduledDay");

-- CreateIndex
CREATE INDEX "social_dispatches_status_scheduledFor_idx" ON "social_dispatches"("status", "scheduledFor");
