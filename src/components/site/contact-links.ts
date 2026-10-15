/**
 * The single source of truth for every outbound contact link.
 *
 * WhatsApp/Messenger/tel links are deceptively easy to get wrong: `+880 1710…`
 * with a leading `+` or a space is not a valid `wa.me` path, and `tel:` accepts
 * a `+` but not a slash. Encoding those rules once — and handing the resolved
 * URLs to the mobile client as a precomputed `links` object — means the Flutter
 * app and the website can never drift apart.
 *
 * This module is deliberately dependency-free and runs on both the server and
 * the client, so it is safe to import from a route handler, an RSC and a client
 * component alike.
 */

/** Everything needed to build a contact link, structurally. */
export interface ContactHandles {
  email: string;
  phone: string;
  whatsapp: string;
  linkedinUrl: string;
  githubUrl: string;
  facebookUrl: string;
  messengerUsername: string;
  websiteUrl?: string;
}

/** Resolved URLs. `null` means "this handle is not configured" — hide it. */
export interface ContactLinks {
  whatsapp: string | null;
  messenger: string | null;
  linkedin: string | null;
  email: string | null;
  phone: string | null;
  github: string | null;
  facebook: string | null;
  website: string | null;
}

/** Opens the conversation with something more useful than a bare "hi". */
export const WHATSAPP_PRESET =
  "Hi Gazi! I found your portfolio and would like to talk about a project.";

/** Where the "Download CV" call to action points. */
export const CV_PATH = "/cv";

/** Used when no profile row exists yet — every link resolves to `null`. */
export const EMPTY_HANDLES: ContactHandles = {
  email: "",
  phone: "",
  whatsapp: "",
  linkedinUrl: "",
  githubUrl: "",
  facebookUrl: "",
  messengerUsername: "",
  websiteUrl: "",
};

/** Strips everything that is not a digit — `+8801710272659` → `8801710272659`. */
export function digitsOnly(value: string | null | undefined): string {
  return (value ?? "").replace(/\D+/g, "");
}

/** Digits, keeping a single leading `+` for `tel:` — `+880-1710…` → `+8801710…`. */
export function digitsAndPlus(value: string | null | undefined): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  const digits = digitsOnly(trimmed);
  if (!digits) return "";
  return `${trimmed.startsWith("+") ? "+" : ""}${digits}`;
}

export function whatsappLink(
  whatsapp: string | null | undefined,
  message: string = WHATSAPP_PRESET,
): string | null {
  const digits = digitsOnly(whatsapp);
  if (!digits) return null;
  const text = message.trim();
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function messengerLink(username: string | null | undefined): string | null {
  const handle = (username ?? "").trim().replace(/^@+/, "");
  if (!handle) return null;
  return `https://m.me/${handle}`;
}

export function mailtoLink(email: string | null | undefined): string | null {
  const address = (email ?? "").trim();
  if (!address) return null;
  return `mailto:${address}`;
}

export function telLink(phone: string | null | undefined): string | null {
  const number = digitsAndPlus(phone);
  return number ? `tel:${number}` : null;
}

/** Normalises a stored profile URL; returns null when the field is empty. */
export function profileLink(url: string | null | undefined): string | null {
  const value = (url ?? "").trim();
  if (!value) return null;
  return value;
}

/** The complete link set for a profile, resolved once. */
export function contactLinks(handles: ContactHandles): ContactLinks {
  return {
    whatsapp: whatsappLink(handles.whatsapp),
    messenger: messengerLink(handles.messengerUsername),
    linkedin: profileLink(handles.linkedinUrl),
    email: mailtoLink(handles.email),
    phone: telLink(handles.phone),
    github: profileLink(handles.githubUrl),
    facebook: profileLink(handles.facebookUrl),
    website: profileLink(handles.websiteUrl),
  };
}

/** Link to the downloadable CV surface. */
export function cvPageLink(): string {
  return CV_PATH;
}

/** True for links that leave the site — used to pick `target`/`rel`. */
export function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}
