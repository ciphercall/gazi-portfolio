import { z } from "zod";

import { EMPLOYMENT_TYPES, type ActionFail, type ReorderModel } from "@/lib/admin/types";

/**
 * Validation for every admin mutation.
 *
 * Zod v4. Schemas live here rather than next to the actions because a file with
 * `"use server"` may only export async functions — a shared `zodFail()` helper
 * cannot live in one. Actions import from this module and stay thin.
 */

/* ------------------------------------------------------------- helpers --- */

/**
 * Field errors in the shape the forms render: `errors.fieldName[0]`.
 *
 * Iterates `error.issues` directly rather than using `z.flattenError()`: the
 * schemas here always parse an untyped client payload, and the generic helper
 * collapses `fieldErrors` to `{}` when the input type is unknown.
 */
export function zodFail(error: z.ZodError, message = "Please fix the highlighted fields."): ActionFail {
  const errors: Record<string, string[]> = {};
  const formErrors: string[] = [];

  for (const issue of error.issues) {
    if (issue.path.length === 0) {
      formErrors.push(issue.message);
      continue;
    }
    const key = issue.path.map((segment) => String(segment)).join(".");
    (errors[key] ??= []).push(issue.message);
  }

  if (formErrors.length > 0) errors.form = formErrors;

  return { ok: false, message, errors };
}

export function fail(message: string, errors?: Record<string, string[]>): ActionFail {
  return errors ? { ok: false, message, errors } : { ok: false, message };
}

export function fieldError(message: string, field: string): ActionFail {
  return { ok: false, message, errors: { [field]: [message] } };
}

/* -------------------------------------------------------------- scalars --- */

const requiredText = (max: number, label: string) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(max, `${label} must be ${max} characters or fewer.`);

/** "" and null are the same thing to the database: absent. */
const optionalText = (max: number) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .refine((value) => (value ?? "").trim().length <= max, `Must be ${max} characters or fewer.`)
    .transform((value) => {
      const trimmed = (value ?? "").trim();
      return trimmed.length > 0 ? trimmed : null;
    });

/** A URL that tolerates a missing scheme — "facebook.com/x" becomes "https://facebook.com/x". */
const optionalUrl = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => {
    const trimmed = (value ?? "").trim();
    if (!trimmed) return null;
    if (/^(https?:\/\/|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (/^[\w-]+(\.[\w-]+)+([/?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
    return trimmed;
  })
  .refine(
    (value) => value === null || /^(https?:\/\/|mailto:|tel:)[^\s]+$/i.test(value),
    "Start the link with http:// or https:// (or mailto:/tel:).",
  );

const optionalEmail = z
  .union([z.string(), z.null()])
  .optional()
  .transform((value) => (value ?? "").trim())
  .refine(
    (value) => value.length === 0 || z.email().safeParse(value).success,
    "Enter a valid email address.",
  )
  .transform((value) => value.toLowerCase());

/** yyyy-mm-dd, or null when the field is genuinely optional. */
const dateOnly = (label: string, required: boolean) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => {
      const trimmed = (value ?? "").trim().slice(0, 10);
      return trimmed.length > 0 ? trimmed : null;
    })
    .refine(
      (value) => (required ? value !== null : true),
      `${label} is required (YYYY-MM-DD).`,
    )
    .refine(
      (value) => value === null || /^\d{4}-\d{2}-\d{2}$/.test(value),
      `${label} must look like YYYY-MM-DD.`,
    )
    .refine(
      (value) =>
        value === null ||
        !Number.isNaN(new Date(`${value}T00:00:00.000Z`).getTime()),
      `${label} is not a real date.`,
    );

const orderNumber = z
  .number({ error: "Order must be a number." })
  .int("Order must be a whole number.")
  .min(0, "Order cannot be negative.")
  .max(9999, "Order is unrealistically large.");

const optionalInt = (min: number, max: number, label: string) =>
  z
    .union([z.number(), z.null()])
    .optional()
    .transform((value) => (typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null))
    .refine((value) => value === null || (value >= min && value <= max), `${label} must be between ${min} and ${max}.`);

const stringList = (max: number) =>
  z
    .array(z.string())
    .max(max, `At most ${max} entries.`)
    .transform((values) => values.map((value) => value.trim()).filter((value) => value.length > 0));

/* ----------------------------------------------------------- experience --- */

export const experienceSchema = z.object({
  id: z.union([z.string().trim(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null)),
  title: requiredText(200, "Title"),
  slug: z.string().trim().max(120, "Slug must be 120 characters or fewer.").default(""),
  company: requiredText(200, "Company"),
  companyUrl: optionalUrl,
  employmentType: z.enum(EMPLOYMENT_TYPES, { error: "Pick an employment type." }),
  location: optionalText(200),
  startDate: dateOnly("Start date", true).transform((value) => value ?? ""),
  endDate: dateOnly("End date", false),
  isCurrent: z.boolean().default(false),
  summary: z.string().trim().max(4000, "Keep the summary under 4000 characters.").default(""),
  bullets: stringList(40),
  tags: stringList(30),
  shareText: z.string().trim().max(4000, "Keep the share text under 4000 characters.").default(""),
  order: orderNumber.default(0),
  isPublished: z.boolean().default(true),
});

export type ParsedExperience = z.infer<typeof experienceSchema>;

/* -------------------------------------------------------------- project --- */

export const projectImageSchema = z.object({
  path: requiredText(500, "Image path"),
  alt: z.string().trim().max(300, "Alt text must be 300 characters or fewer.").default(""),
  caption: optionalText(500),
  width: z.number().int().min(0).max(20000).default(0),
  height: z.number().int().min(0).max(20000).default(0),
});

export const projectSchema = z.object({
  id: z.union([z.string().trim(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null)),
  title: requiredText(200, "Title"),
  slug: z.string().trim().max(120, "Slug must be 120 characters or fewer.").default(""),
  summary: requiredText(3000, "Summary"),
  body: z.string().max(40000, "Body must be 40000 characters or fewer.").default(""),
  role: optionalText(200),
  client: optionalText(200),
  year: optionalInt(1900, 2200, "Year"),
  liveUrl: optionalUrl,
  repoUrl: optionalUrl,
  techStack: stringList(40),
  coverPath: optionalText(500),
  featured: z.boolean().default(false),
  order: orderNumber.default(0),
  isPublished: z.boolean().default(true),
  shareText: z.string().trim().max(4000, "Keep the share text under 4000 characters.").default(""),
  images: z.array(projectImageSchema).max(60, "At most 60 gallery images.").default([]),
});

export type ParsedProject = z.infer<typeof projectSchema>;
export type ParsedProjectImage = z.infer<typeof projectImageSchema>;

/* -------------------------------------------------------------- profile --- */

export const profileSchema = z.object({
  fullName: requiredText(200, "Full name"),
  headline: requiredText(240, "Headline"),
  subheadline: z.string().trim().max(300, "Subheadline must be 300 characters or fewer.").default(""),
  summary: requiredText(6000, "Summary"),
  location: z.string().trim().max(200, "Location must be 200 characters or fewer.").default(""),
  email: optionalEmail,
  phone: z.string().trim().max(60, "Phone must be 60 characters or fewer.").default(""),
  whatsapp: z.string().trim().max(60, "WhatsApp number must be 60 characters or fewer.").default(""),
  linkedinUrl: optionalUrl,
  githubUrl: optionalUrl,
  facebookUrl: optionalUrl,
  messengerUsername: z.string().trim().max(120, "Messenger handle must be 120 characters or fewer.").default(""),
  twitterUrl: optionalUrl,
  websiteUrl: optionalUrl,
  avatarPath: optionalText(500),
  seoTitle: z.string().trim().max(200, "SEO title must be 200 characters or fewer.").default(""),
  seoDescription: z.string().trim().max(400, "SEO description must be 400 characters or fewer.").default(""),
});

export type ParsedProfile = z.infer<typeof profileSchema>;

/* ------------------------------------------------------------ list items --- */

export const educationSchema = z
  .object({
    id: z.union([z.string().trim(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null)),
    school: requiredText(200, "School"),
    degree: requiredText(200, "Degree"),
    field: optionalText(200),
    startYear: z.number({ error: "Start year must be a number." }).int().min(1900, "Start year looks too early.").max(2200, "Start year looks too far ahead."),
    endYear: z.number({ error: "End year must be a number." }).int().min(1900, "End year looks too early.").max(2200, "End year looks too far ahead."),
    details: optionalText(2000),
    order: orderNumber.default(0),
  })
  .refine((value) => value.endYear >= value.startYear, {
    message: "End year cannot be before the start year.",
    path: ["endYear"],
  });

export type ParsedEducation = z.infer<typeof educationSchema>;

export const skillSchema = z.object({
  id: z.union([z.string().trim(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null)),
  name: requiredText(120, "Skill name"),
  category: z.string().trim().max(120, "Category must be 120 characters or fewer.").default("General"),
  level: optionalInt(1, 100, "Level"),
  order: orderNumber.default(0),
});

export type ParsedSkill = z.infer<typeof skillSchema>;

export const certificationSchema = z.object({
  id: z.union([z.string().trim(), z.null()]).optional().transform((v) => (v && v.length > 0 ? v : null)),
  name: requiredText(200, "Certification name"),
  issuer: z.string().trim().max(200, "Issuer must be 200 characters or fewer.").default(""),
  issuedOn: dateOnly("Issue date", false),
  url: optionalUrl,
  order: orderNumber.default(0),
});

export type ParsedCertification = z.infer<typeof certificationSchema>;

/* -------------------------------------------------------------- reorder --- */

export const REORDER_MODEL_VALUES = [
  "experience",
  "project",
  "education",
  "skill",
  "certification",
] as const satisfies readonly ReorderModel[];

export const reorderSchema = z.object({
  model: z.enum(REORDER_MODEL_VALUES, { error: "Unknown model." }),
  ids: z
    .array(z.string().trim().min(1, "Empty id in the reorder list."))
    .min(1, "The reorder list is empty.")
    .max(500, "Too many rows in one reorder."),
});

export type ParsedReorder = z.infer<typeof reorderSchema>;

/* --------------------------------------------------------- small things --- */

export const idSchema = z.string().trim().min(1, "Missing id.");

export const publishSchema = z.object({
  id: idSchema,
  isPublished: z.boolean(),
});

export const featuredSchema = z.object({
  id: idSchema,
  featured: z.boolean(),
});

/** Settings edits only the SEO pair; the rest of the profile has its own action. */
export const seoSchema = z.object({
  seoTitle: z.string().trim().max(200, "SEO title must be 200 characters or fewer.").default(""),
  seoDescription: z
    .string()
    .trim()
    .max(400, "SEO description must be 400 characters or fewer.")
    .default(""),
});

export const stringIdArraySchema = z
  .array(z.string().trim().min(1))
  .min(1, "Nothing to reorder.")
  .max(500);
