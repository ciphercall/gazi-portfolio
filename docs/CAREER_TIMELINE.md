# Career timeline — canonical data

The eight roles below are the **source of truth** for the public experience page, the career
graph, both CV PDFs, the API and the LinkedIn share text. They live in `EXPERIENCES` in
[`src/data/cv-seed.ts`](../src/data/cv-seed.ts); array order becomes `order` 0–7 in
`seedExperiences()`.

| # | Slug | Title | Company | Type | Location | Start | End | Current |
|---|------|-------|---------|------|----------|-------|-----|---------|
| 0 | `peoples-poultry-hatchery-project-manager` | Project Manager | People's Poultry & Hatchery Limited | Full time | Bangladesh | 2024-10-15 | — | Yes |
| 1 | `peoples-poultry-hatchery-senior-software-developer-part-time` | Senior Software Developer | People's Poultry & Hatchery Limited | Part time | Bangladesh | 2024-04-01 | 2024-10-14 | No |
| 2 | `medpro-techtham-senior-developer-team-lead` | Senior Developer & Team Lead | MedPro Techtham | Part time | Bahrain | 2024-04-01 | 2024-11-30 | No |
| 3 | `bayshore-communications-senior-developer-team-lead` | Senior Developer Team-Lead | Bayshore Communications Ltd | Full time | Dhaka, Bangladesh | 2023-12-15 | 2024-10-14 | No |
| 4 | `syscon-engineering-senior-software-plc-developer` | Senior Software & PLC Developer | Syscon Engineering Limited | Full time | Chattogram, Bangladesh | 2022-04-07 | 2023-12-01 | No |
| 5 | `chittagong-soft-project-manager` | Project Manager | Chittagong Soft Limited | Part time | Chattogram, Bangladesh | 2021-07-01 | 2024-09-07 | No |
| 6 | `anazbd-full-stack-laravel-developer` | Full-Stack Laravel Developer | Anazbd Corporation | Full time | Chattogram, Bangladesh | 2020-10-01 | 2022-02-26 | No |
| 7 | `alchemy-software-junior-software-developer` | Junior Software Developer | Alchemy Software Limited | Full time | Chattogram, Bangladesh | 2017-04-01 | 2020-09-30 | No |

Exactly one row is `isCurrent`: the PPHL Project Manager role. Every other row carries a real end
date, so the timeline shows no open-ended "present" markers that are not true.

## Rules the data must keep

- **PPHL part-time never overlaps PPHL full-time.** The part-time role ends `2024-10-14` and the
  full-time Project Manager role starts `2024-10-15` — one day apart, never concurrent. The handover
  is the point: the same platforms, first delivered part-time, then led full-time.
- **The MedPro overlap is deliberate.** MedPro Techtham (`2024-04-01 → 2024-11-30`) ran in parallel
  with the Bayshore full-time role for its whole length, with the PPHL part-time role for its first
  six months, and continued about six weeks into the PPHL full-time role. It is a part-time
  engagement, which is why the admin panel's overlap indicator will show it — the overlap is
  expected, not a data error.
- **Chittagong Soft is also an overlap.** It is the long-running part-time client engagement
  (`2021-07-01 → 2024-09-07`) held alongside full-time roles, and it closes just before the PPHL
  part-time role begins.
- **The renamed PPHL slug must stay in `RETIRED_EXPERIENCE_SLUGS`.** The original full-time row was
  `peoples-poultry-hatchery-senior-software-developer`; it is now
  `peoples-poultry-hatchery-project-manager`. `seedExperiences()` deletes the retired slug before
  upserting, otherwise the old row would survive a re-seed as a duplicate full-time role.

## How "9.5 years" is computed

The tenure figure is derived, never typed:

1. `earliest` is the earliest `startDate` across published roles → `2017-04-01` (Alchemy Software).
2. `halfYearsSince()` in [`src/components/site/format.ts`](../src/components/site/format.ts) counts
   elapsed days from that date to now, divides by `365.25`, and floors to the nearest half
   (`Math.floor(years * 2) / 2`).
3. `formatTenure()` renders the result without a trailing `.0`, so a whole tenure prints `10` and a
   half tenure prints `9.5`.

The landing-page stat and the experience-page stat therefore read **`9.5+`** — as of 16 November 2026
the elapsed tenure is 9.63 years, floored to 9.5 — and switch to **`10+`** on 1 April 2027, the
365.25-day 10-year mark from 2017-04-01. Nothing in the copy needs editing when that happens: only
the prose in `PROFILE` is written by hand, and it currently says "9.5 years" in the subheadline,
summary and SEO description.

`wholeYearsSince()` still exists for anything that wants a whole number, but it no longer drives the
tenure statistic.

## Seeding behaviour

`prisma/seed.ts` is run on **every deploy** (`portfolio-deploy.ps1 -Action seed`, and by the VPS
deploy script). For experiences that means:

- rows are matched on `slug` and **overwritten** with the values above (`update: data`), and `order`
  is re-applied from array position — an admin edit to a seeded role is lost on the next seed;
- the retired full-time slug is deleted first, so a renamed role never leaves a duplicate behind;
- rows the seed does not mention are left alone (a role created entirely in the admin panel
  survives).

App links (`src/data/app-links-seed.ts` → `app_links`) are seeded **non-destructively**: they are
upserted on `slug` with `update: {}`, so the three seeded links appear on a fresh database while
name, tagline, href, platform, order and publish state stay exactly as the owner left them in
`/admin/app-links`.
