-- The app-link rows are seeded non-destructively, so a published Android build
-- URL only reaches an existing database through a migration.
UPDATE "app_links"
SET "href" = 'https://github.com/ciphercall/rocket-launcher/releases/download/v1.1.0-build101/app-arm64-v8a-release.apk'
WHERE "slug" = 'studio-android';

UPDATE "app_links"
SET "href" = 'https://github.com/ciphercall/rocket-launcher/releases/download/v0.3.0-build103/app-arm64-v8a-release.apk'
WHERE "slug" = 'portfolio-android';
