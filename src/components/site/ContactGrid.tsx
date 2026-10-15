import { ExternalLink, Mail, MessageCircle, Phone } from "lucide-react";
import type { ReactNode } from "react";

import { IconBadge } from "@/components/ui/IconBadge";
import { ChannelIcon, type ContactChannel } from "@/components/site/contact-channels";
import { Reveal } from "@/components/site/Reveal";

/**
 * The contact cards.
 *
 * Each card is one anchor carrying icon, channel name, what it is for and the
 * handle itself — no icon-only controls and no hidden actions. External links
 * open in a new tab with `rel="noopener noreferrer"`.
 */

function actionIcon(channel: ContactChannel): ReactNode {
  if (channel.key === "email") return <Mail className="h-4 w-4" aria-hidden="true" />;
  if (channel.key === "phone") return <Phone className="h-4 w-4" aria-hidden="true" />;
  return <MessageCircle className="h-4 w-4" aria-hidden="true" />;
}

function actionLabel(channel: ContactChannel): string {
  switch (channel.key) {
    case "whatsapp":
      return "Open WhatsApp";
    case "messenger":
      return "Open Messenger";
    case "email":
      return "Write an email";
    case "phone":
      return "Call now";
    case "linkedin":
      return "Open LinkedIn";
    case "github":
      return "Open GitHub";
    case "facebook":
      return "Open Facebook";
    default:
      return "Visit link";
  }
}

export function ContactGrid({ channels }: { channels: ContactChannel[] }) {
  if (channels.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {channels.map((channel, index) => (
        <Reveal key={channel.key} delay={index * 0.04} className="h-full">
          <a
            href={channel.href}
            {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="glass hairline card-lift group flex h-full flex-col gap-4 p-5 sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <IconBadge size="lg">
                <ChannelIcon channel={channel} />
              </IconBadge>
              {channel.external ? (
                <ExternalLink className="h-4 w-4 text-faint" aria-hidden="true" />
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-ink">{channel.label}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{channel.hint}</p>
              <p className="mt-3 truncate text-xs text-faint">{channel.display}</p>
            </div>

            <span className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-teal transition group-hover:text-cyan">
              {actionIcon(channel)}
              <span>{actionLabel(channel)}</span>
            </span>
          </a>
        </Reveal>
      ))}
    </div>
  );
}
