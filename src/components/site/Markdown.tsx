import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Markdown body renderer for project write-ups.
 *
 * `remark-gfm` is enabled so the tables, task lists and autolinks an author
 * writes in the admin panel actually render. Links that leave the site open in
 * a new tab with a safe `rel`; everything else is styled by `.prose-aurora`,
 * which owns the typography inside this block.
 */

const components: Components = {
  a({ href, children }) {
    const external = typeof href === "string" && /^https?:\/\//i.test(href);
    return (
      <a
        href={href ?? undefined}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  },
  h2({ children }) {
    return <h2 className="font-display text-xl font-semibold text-ink">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="font-display font-semibold text-ink">{children}</h3>;
  },
  h4({ children }) {
    return <h4 className="font-display font-semibold text-ink">{children}</h4>;
  },
  code({ children }) {
    return (
      <code className="rounded-[6px] border border-line bg-panel px-1.5 py-0.5 font-mono text-[0.85em] text-teal">
        {children}
      </code>
    );
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-2 border-line-strong pl-4 text-faint italic">
        {children}
      </blockquote>
    );
  },
  hr() {
    return <hr className="border-line" />;
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-aurora text-muted">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
