import { MessageCircle, Repeat2, Send, ThumbsUp } from "lucide-react";

/**
 * A LinkedIn feed card, rendered as LinkedIn renders it.
 *
 * This is deliberately *light* — the admin panel is dark, LinkedIn is not, and a
 * dark preview would be a picture of this app rather than a picture of the post.
 * The aim is that an admin can look at this and know what the post will look
 * like on the feed, down to where the text is clamped and how the image sits.
 *
 * It is presentational only: every value comes in as a prop, so it can be used
 * from the server page and from the client editor without diverging.
 */

export interface LinkedInPreviewProps {
  authorName: string;
  authorHeadline: string;
  avatarUrl: string | null;
  message: string;
  imageUrl: string | null;
  /** e.g. `2h` — the only time information LinkedIn shows on a post. */
  ageLabel?: string;
  /** Characters beyond which LinkedIn clamps the body behind "see more". */
  clampAt?: number;
}

/** LinkedIn clamps long posts; the preview mirrors the visible behaviour. */
const DEFAULT_CLAMP = 210;

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function LinkedInPreview({
  authorName,
  authorHeadline,
  avatarUrl,
  message,
  imageUrl,
  ageLabel = "1h",
  clampAt = DEFAULT_CLAMP,
}: LinkedInPreviewProps) {
  const clamped = message.length > clampAt;
  const body = clamped ? `${message.slice(0, clampAt).trimEnd()}…` : message;

  return (
    <div className="w-full max-w-[555px] overflow-hidden rounded-lg border border-[#e0e0e0] bg-white text-[#000000e6] shadow-sm">
      <div className="flex items-start gap-2 px-4 pt-3">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            alt=""
            className="size-12 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#0a66c2] text-sm font-semibold text-white">
            {initials(authorName)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm leading-5 font-semibold text-[#000000e6]">{authorName}</p>
          <p className="line-clamp-1 text-xs leading-4 text-[#00000099]">{authorHeadline}</p>
          <p className="mt-0.5 text-xs leading-4 text-[#00000099]">
            {ageLabel} · <span aria-hidden="true">🌐</span>
            <span className="sr-only">visible to anyone</span>
          </p>
        </div>
      </div>

      <div className="px-4 pt-2 pb-3">
        <p className="text-sm leading-5 whitespace-pre-wrap text-[#000000e6]">
          {body}
          {clamped ? (
            <span className="ml-1 text-[#00000099]">see more</span>
          ) : null}
        </p>
      </div>

      {imageUrl ? (
        <div className="border-y border-[#e0e0e0] bg-[#f8fafc]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" className="block h-auto w-full object-cover" />
        </div>
      ) : (
        <div className="mx-4 mb-3 rounded border border-dashed border-[#d0d7de] bg-[#f8fafc] px-3 py-6 text-center text-xs text-[#666]">
          No card rendered yet — the post would go out as text with a link.
        </div>
      )}

      <div className="flex items-center justify-between px-4 py-2 text-xs text-[#00000099]">
        <span className="inline-flex items-center gap-1">
          <span className="grid size-4 place-items-center rounded-full bg-[#0a66c2] text-[9px] text-white">
            👍
          </span>
          <span className="grid size-4 -translate-x-1 place-items-center rounded-full bg-[#df704d] text-[9px] text-white">
            ❤
          </span>
          <span className="ml-0.5">You and 12 others</span>
        </span>
        <span>2 comments · 1 repost</span>
      </div>

      <div className="mx-4 border-t border-[#e0e0e0]" />

      <div className="flex items-center justify-around px-2 py-1 text-xs font-semibold text-[#00000099]">
        <span className="inline-flex items-center gap-2 px-3 py-2.5">
          <ThumbsUp className="size-4" aria-hidden="true" />
          Like
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2.5">
          <MessageCircle className="size-4" aria-hidden="true" />
          Comment
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2.5">
          <Repeat2 className="size-4" aria-hidden="true" />
          Repost
        </span>
        <span className="inline-flex items-center gap-2 px-3 py-2.5">
          <Send className="size-4" aria-hidden="true" />
          Send
        </span>
      </div>
    </div>
  );
}
