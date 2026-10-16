-- Add indexes supporting "has this been posted?" lookups by content row and provider.

CREATE INDEX IF NOT EXISTS "social_dispatches_experienceId_idx"
  ON "social_dispatches" ("experienceId");

CREATE INDEX IF NOT EXISTS "social_dispatches_projectId_idx"
  ON "social_dispatches" ("projectId");

CREATE INDEX IF NOT EXISTS "social_dispatches_experienceId_provider_idx"
  ON "social_dispatches" ("experienceId", "provider");

CREATE INDEX IF NOT EXISTS "social_dispatches_projectId_provider_idx"
  ON "social_dispatches" ("projectId", "provider");