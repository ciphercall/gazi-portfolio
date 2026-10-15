# syntax=docker/dockerfile:1
#
# Gazi Portfolio — application image.
#
# One image serves the public site, the admin panel, the versioned API and the
# CV PDF renderer. Chromium is baked in because the "beautiful colorized" CV is
# printed from the site's own markup by a real browser — that is what makes it
# pixel-identical to the design rather than an approximation.
#
# The runtime stage ships the whole app rather than Next's `standalone` output.
# `standalone` traces only the modules the server itself imports, which leaves
# `prisma` and `tsx` out — and without them `-Action migrate` and `-Action seed`
# cannot run inside the container. Reliability beats the few hundred megabytes.
#
# Build context is the repository root (see deploy/docker-compose.yml).

# ------------------------------------------------------------------ deps ---
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
RUN npm ci

# ----------------------------------------------------------------- build ---
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG GIT_SHA="unknown"
ARG NEXT_PUBLIC_GIT_SHA="unknown"
ENV GIT_SHA=$GIT_SHA
# NEXT_PUBLIC_* is inlined into the client bundle at build time. That is what
# makes it possible to grep a *running* container and prove which revision it
# actually carries, instead of trusting that the build did what was asked.
ENV NEXT_PUBLIC_GIT_SHA=$NEXT_PUBLIC_GIT_SHA
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# `next build` must complete without a reachable database. Everything backed by
# Postgres renders at request time, so no query runs during the build. These
# values only satisfy modules that read process.env at import; they are never
# used to connect.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
ENV AUTH_SECRET="build-time-placeholder-value-not-used-at-runtime-000"

RUN npx prisma generate
RUN npm run build

# --------------------------------------------------------------- runtime ---
FROM node:22-alpine AS runtime
WORKDIR /app

# Chromium plus the font and rendering libraries headless printing needs.
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ttf-freefont \
      font-noto \
      openssl \
      libc6-compat \
      wget

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# playwright-core drives the system Chromium instead of downloading its own.
ENV PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# The built app, its dependencies, the Prisma schema/migrations and the seed
# dataset — everything the running container and its deploy actions need.
COPY --from=build /app ./

# Media volume: uploads and generated CVs written here are served directly by
# the nginx `web` container, which mounts the same volume read-only.
RUN mkdir -p /srv/media

EXPOSE 3000

CMD ["npx", "next", "start"]
