import { normaliseHandle, normalisePhone } from "@/lib/admin/format";

/**
 * Turns the contact handles stored on the Profile row into the URLs the public
 * site's "message me" buttons point at.
 *
 * Shown read-only in Settings: the owner edits the *handle* (a WhatsApp number,
 * a Messenger username) and this is what the site will actually link to, so he
 * can see immediately whether the number he typed resolves to something sane.
 */

export interface ResolvedDmLink {
  key: "whatsapp" | "messenger" | "linkedin" | "facebook" | "email" | "phone" | "website" | "github";
  label: string;
  /** Resolved href, or null when the underlying handle is empty. */
  href: string | null;
  /** The stored value the link was derived from. */
  source: string;
}

export interface ContactHandles {
  whatsapp: string;
  messengerUsername: string;
  linkedinUrl: string;
  facebookUrl: string;
  email: string;
  phone: string;
  websiteUrl: string;
  githubUrl: string;
}

function nonEmpty(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function withScheme(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function resolveDmLinks(handles: ContactHandles): ResolvedDmLink[] {
  const whatsappDigits = normalisePhone(handles.whatsapp);
  const messengerHandle = normaliseHandle(handles.messengerUsername);
  const phoneDigits = normalisePhone(handles.phone);

  return [
    {
      key: "whatsapp",
      label: "WhatsApp",
      href: whatsappDigits ? `https://wa.me/${whatsappDigits}` : null,
      source: handles.whatsapp,
    },
    {
      key: "messenger",
      label: "Messenger",
      href: messengerHandle ? `https://m.me/${messengerHandle}` : null,
      source: handles.messengerUsername,
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: withScheme(handles.linkedinUrl),
      source: handles.linkedinUrl,
    },
    {
      key: "facebook",
      label: "Facebook",
      href: withScheme(handles.facebookUrl),
      source: handles.facebookUrl,
    },
    {
      key: "email",
      label: "Email",
      href: nonEmpty(handles.email) ? `mailto:${handles.email.trim().toLowerCase()}` : null,
      source: handles.email,
    },
    {
      key: "phone",
      label: "Phone",
      href: phoneDigits ? `tel:+${phoneDigits}` : null,
      source: handles.phone,
    },
    {
      key: "website",
      label: "Website",
      href: withScheme(handles.websiteUrl),
      source: handles.websiteUrl,
    },
    {
      key: "github",
      label: "GitHub",
      href: withScheme(handles.githubUrl),
      source: handles.githubUrl,
    },
  ];
}
