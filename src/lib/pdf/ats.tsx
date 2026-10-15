import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";

import { buildAtsDocument } from "./content";
import type { CvTextLine } from "./content";
import type { CvSource } from "@/lib/queries";

/**
 * The ATS-friendly CV: a deliberately plain, single-column PDF built with
 * `@react-pdf/renderer`.
 *
 * Why it looks like this — every rule below exists because a parser, not a
 * human, is the reader:
 *
 *   - One column, no tables, no columns, no images, no icons, no graphics. A
 *     two-column CV is the single most common reason a résumé parses as
 *     gibberish: the text layer interleaves the two columns.
 *   - Base-14 Helvetica, never embedded and never registered from a file. Every
 *     PDF reader and every parser has it, and nothing can fail to load.
 *   - Real text with real spaces. No letter-spacing tricks, no text inside
 *     shapes, no outlined glyphs: the extracted text layer is the document.
 *   - Section headings in the conventional order and wording (see
 *     `ATS_SECTION_ORDER`), because those strings are what section detection
 *     keys on.
 *   - Dates as `Month YYYY`, one fact per line, plain hyphen bullets.
 *
 * The Chromium-printed "designed" variant is the pretty one; this one is the
 * one that survives being fed to a machine.
 */

const styles = StyleSheet.create({
  page: {
    // 40pt ≈ 14mm on every side: a normal CV margin, and enough white space that
    // a page-breaking heuristic never splits a line in half.
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10.5,
    lineHeight: 1.45,
    color: "#000000",
  },
  name: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 16,
    lineHeight: 1.25,
  },
  headline: {
    fontSize: 11,
    marginTop: 2,
  },
  contact: {
    marginTop: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionHeading: {
    fontFamily: "Helvetica",
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 6,
  },
  title: {
    fontWeight: "bold",
  },
  meta: {},
  body: {},
  bullet: {
    marginLeft: 10,
    marginTop: 1,
  },
});

const LINE_STYLE = {
  title: styles.title,
  meta: styles.meta,
  body: styles.body,
  bullet: styles.bullet,
} as const;

/**
 * No hyphenation, ever.
 *
 * react-pdf hyphenates by default, which turned "inventory" into "in-" /
 * "ventory" across a line break — the extracted text then reads "in- ventory"
 * and a keyword match on "inventory" quietly fails. Every word in this document
 * is short enough to wrap whole, so the safest hyphenation is none.
 */
Font.registerHyphenationCallback((word) => [word]);

function lineText(line: CvTextLine): string {
  // One fact per line, introduced by a plain hyphen — the bullet character a
  // parser strips most reliably.
  return line.kind === "bullet" ? `- ${line.text}` : line.text;
}

export function AtsResumeDocument({ source }: { source: CvSource }) {
  const doc = buildAtsDocument(source);
  const keywords = source.skills.flatMap((group) => group.items).join(", ");

  return (
    <Document
      title={`${doc.name} — Curriculum Vitae (ATS)`}
      author={doc.name}
      subject="ATS-friendly curriculum vitae"
      creator="gazi-portfolio"
      keywords={keywords}
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.name}>{doc.name}</Text>
        <Text style={styles.headline}>{doc.headline}</Text>
        {doc.contacts.map((contact) => (
          <Text key={contact} style={styles.contact}>
            {contact}
          </Text>
        ))}

        {doc.sections.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            {section.lines.map((line, index) => (
              <Text key={`${section.heading}-${index}`} style={LINE_STYLE[line.kind]}>
                {lineText(line)}
              </Text>
            ))}
          </View>
        ))}
      </Page>
    </Document>
  );
}

/** Render the ATS variant to PDF bytes. Pure — no filesystem, no database. */
export async function renderAtsCv(source: CvSource): Promise<Buffer> {
  return renderToBuffer(<AtsResumeDocument source={source} />);
}
