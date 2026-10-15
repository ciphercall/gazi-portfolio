import type { ReactElement, SVGProps } from "react";

/**
 * Monoline brand marks.
 *
 * lucide-react dropped brand icons, and mismatched official logos would fight
 * the Midnight Aurora palette. These are drawn in the site's own stroke
 * language instead, always next to a visible text label — they are decoration on
 * top of a word, never a label on their own.
 */

export type BrandName = "whatsapp" | "linkedin" | "messenger" | "github" | "facebook";

type IconProps = SVGProps<SVGSVGElement>;

function Svg({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

function Whatsapp(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.3L3.6 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.7Z" />
      <path d="M9.4 8.6l.9-.3c.3-.1.6 0 .8.3l.7 1.1c.2.3.1.6-.1.8l-.6.5c.5 1 1.4 1.9 2.4 2.4l.5-.6c.2-.2.5-.3.8-.1l1.1.7c.3.2.4.5.3.8l-.3.9c-.2.5-.7.8-1.2.8-3.2 0-5.8-2.5-5.8-5.7 0-.6.3-1.1.8-1.4Z" />
    </Svg>
  );
}

function Linkedin(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <path d="M8 10.6v5.9" />
      <circle cx="8" cy="7.9" r="0.85" fill="currentColor" stroke="none" />
      <path d="M11.6 16.5v-5.9" />
      <path d="M11.6 13.1c0-1.4 1.1-2.5 2.5-2.5s2.4 1 2.4 2.5v3.4" />
    </Svg>
  );
}

function Messenger(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.6c-4.7 0-8.4 3.5-8.4 7.9 0 2.5 1.1 4.6 2.9 6v3.1l2.8-1.6c.9.2 1.8.3 2.7.3 4.7 0 8.4-3.5 8.4-7.9s-3.7-7.8-8.4-7.8Z" />
      <path d="m8.2 13.8 3-3.5 2.2 1.8 2.4-2.7-2.8 3.5-2.2-1.8-2.6 2.7Z" />
    </Svg>
  );
}

function Github(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9.3 20.3c-3.3.9-3.3-1.7-4.6-2.1" />
      <path d="M14.5 21.4v-2.8c0-.9.1-1.5-.4-2.1 2.2-.3 4.1-1.2 4.1-4.6a3.5 3.5 0 0 0-1-2.4 3.3 3.3 0 0 0-.1-2.5s-.8-.2-2.5 1a8.6 8.6 0 0 0-4.4 0c-1.8-1.2-2.5-1-2.5-1a3.3 3.3 0 0 0-.1 2.5 3.5 3.5 0 0 0-1 2.5c0 3.3 1.9 4.3 4.1 4.6-.5.5-.5 1-.4 1.9v2.9" />
      <path d="M14.5 18.6c-2.3.9-4.2.4-5.2-1.4" />
    </Svg>
  );
}

function Facebook(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M14.8 8.4h-.9a2.2 2.2 0 0 0-2.2 2.2v1.7" />
      <path d="M9.8 12.3h4.4" />
      <path d="M11.7 12.3v6" />
    </Svg>
  );
}

const ICONS: Record<BrandName, (props: IconProps) => ReactElement> = {
  whatsapp: Whatsapp,
  linkedin: Linkedin,
  messenger: Messenger,
  github: Github,
  facebook: Facebook,
};

export function BrandIcon({
  name,
  className = "h-5 w-5",
  ...props
}: IconProps & { name: BrandName }) {
  const Glyph = ICONS[name];
  return <Glyph className={className} {...props} />;
}
