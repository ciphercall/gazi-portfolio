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
    <div className="flex flex-wrap items-stretch gap-3">
      {channels.map((channel, index) => (
        <Reveal
          key={channel.key}
          delay={index * 0.04}
          className="h-full min-w-[240px] flex-1 sm:min-w-[260px]"
        >
          <a
            href={channel.href}
            {...(channel.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="glass hairline bento-lift group flex h-full flex-col gap-2 rounded-card p-3.5"
          >
            <div className="flex items-start justify-between gap-2">
              <IconBadge size="sm">
                <ChannelIcon channel={channel} />
              </IconBadge>
              {channel.external ? (
                <ExternalLink className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
              ) : null}
            </div>

            <div className="min-w-0">
              <p className="font-display text-[13.5px] font-semibold text-ink">{channel.label}</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] leading-relaxed text-muted">
                {channel.hint}
              </p>
              <p className="mt-2 truncate text-[11px] text-faint">{channel.display}</p>
            </div>

            <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-[12.5px] font-medium text-teal transition group-hover:text-cyan">
              {actionIcon(channel)}
              <span>{actionLabel(channel)}</span>
            </span>
          </a>
        </Reveal>
      ))}
    </div>
  );
}
