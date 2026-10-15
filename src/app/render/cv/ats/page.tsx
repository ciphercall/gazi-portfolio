import { notFound } from "next/navigation";

import { verifyRenderToken } from "@/lib/crypto";
import { buildAtsDocument } from "@/lib/pdf/content";
import { getCvSource } from "@/lib/queries";

/**
 * Debug surface for the ATS variant.
 *
 * The ATS PDF is built with `@react-pdf/renderer`, not with Chromium, so nothing
 * loads this route in production — but it is the fastest way to see *exactly*
 * what the ATS text model emits before it becomes a PDF, which is the part a
 * parser will read. Same token gate as the designed surface, same reason.
 */

export const dynamic = "force-dynamic";

function lineClass(kind: string): string {
  if (kind === "title") return "font-semibold";
  if (kind === "bullet") return "pl-4 text-muted";
  if (kind === "meta") return "text-muted";
  return "";
}

export default async function AtsCvRenderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : null;

  if (!verifyRenderToken(token)) notFound();

  const doc = buildAtsDocument(await getCvSource());

  return (
    <main className="mx-auto max-w-3xl px-6 py-12 font-mono text-sm leading-relaxed text-ink">
      <p className="label-mono mb-6">
        Internal debug view · the ATS PDF is rendered from this model, not from this page
      </p>

      <article>
        <h1 className="text-title font-semibold">{doc.name}</h1>
        <p className="mt-1 text-muted">{doc.headline}</p>
        {doc.contacts.map((contact) => (
          <p key={contact} className="text-muted">
            {contact}
          </p>
        ))}

        {doc.sections.map((section) => (
          <section key={section.heading} className="mt-8">
            <h2 className="border-b border-line pb-2 font-semibold tracking-wide">
              {section.heading}
            </h2>
            <div className="mt-3 space-y-1">
              {section.lines.map((line, index) => (
                <p key={`${section.heading}-${index}`} className={lineClass(line.kind)}>
                  {line.kind === "bullet" ? `- ${line.text}` : line.text}
                </p>
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
