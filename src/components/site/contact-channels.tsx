import { Globe, Mail, Phone } from "lucide-react";

import { BrandIcon, type BrandName } from "@/components/ui/BrandIcon";
import type { ContactHandles, ContactLinks } from "@/components/site/contact-links";

/**
 * Contact channels, resolved once for every surface that lists them.
 *
 * Each channel is icon + label + value. The href comes from the shared
 * contact-links rules, so the footer, the contact page and the v1 API can never
 * disagree about what a phone number or a WhatsApp handle looks like.
 */

export interface ContactChannel {
  key: string;
  /** Channel name — always visible next to the icon. */
  label: string;
  /** One short line about what happens when it is used. */
  hint: string;
  href: string;
  /** The raw handle, shown in the compact list. */
  display: string;
  external: boolean;
  brand?: BrandName;
}

/** Trims a leading "@" so a stored handle renders the same everywhere. */
function handle(value: string): string {
  return value.trim().replace(/^@+/, "");
}

export function contactChannels(
  links: ContactLinks,
  handles: ContactHandles,
): ContactChannel[] {
  const channels: (ContactChannel | null)[] = [];

  if (links.whatsapp) {
    channels.push({
      key: "whatsapp",
      label: "WhatsApp",
      hint: "Fastest reply — a message is pre-written for you.",
      href: links.whatsapp,
      display: handles.whatsapp,
      external: true,
      brand: "whatsapp",
    });
  }

  if (links.messenger) {
    channels.push({
      key: "messenger",
      label: "Messenger",
      hint: "Chat on Facebook Messenger.",
      href: links.messenger,
      display: `@${handle(handles.messengerUsername)}`,
      external: true,
      brand: "messenger",
    });
  }

  if (links.email) {
    channels.push({
      key: "email",
      label: "Email",
      hint: "Best for briefs, specs and documents.",
      href: links.email,
      display: handles.email,
      external: false,
    });
  }

  if (links.phone) {
    channels.push({
      key: "phone",
      label: "Phone",
      hint: "Call or text during Bangladesh business hours.",
      href: links.phone,
      display: handles.phone,
      external: false,
    });
  }

  if (links.linkedin) {
    channels.push({
      key: "linkedin",
      label: "LinkedIn",
      hint: "Professional profile and recommendations.",
      href: links.linkedin,
      display: "in/gazi-apu",
      external: true,
      brand: "linkedin",
    });
  }

  if (links.github) {
    channels.push({
      key: "github",
      label: "GitHub",
      hint: "Code, experiments and open work.",
      href: links.github,
      display: "github.com/ciphercall",
      external: true,
      brand: "github",
    });
  }

  if (links.facebook) {
    channels.push({
      key: "facebook",
      label: "Facebook",
      hint: "Personal page and updates.",
      href: links.facebook,
      display: "facebook.com/apufirestl",
      external: true,
      brand: "facebook",
    });
  }

  if (links.website) {
    channels.push({
      key: "website",
      label: "Website",
      hint: "Everything in one place.",
      href: links.website,
      display: handles.websiteUrl ?? "",
      external: true,
    });
  }

  return channels.filter(
    (channel): channel is ContactChannel => typeof channel === "object" && channel !== null,
  );
}

/** The glyph for a channel — a hand-drawn brand mark or a lucide counterpart. */
export function ChannelIcon({
  channel,
  className = "h-5 w-5",
}: {
  channel: ContactChannel;
  className?: string;
}) {
  if (channel.brand) return <BrandIcon name={channel.brand} className={className} />;
  if (channel.key === "phone") return <Phone className={className} aria-hidden="true" />;
  if (channel.key === "website") return <Globe className={className} aria-hidden="true" />;
  return <Mail className={className} aria-hidden="true" />;
}
