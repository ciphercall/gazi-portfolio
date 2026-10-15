import type { JsonLdNode } from "@/lib/seo";

/**
 * Structured data. `JSON.stringify` output is escaped so a stray `</script>` in
 * content can never break out of the tag.
 */
export function JsonLd({ data }: { data: JsonLdNode | JsonLdNode[] }) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: payload }} />;
}
