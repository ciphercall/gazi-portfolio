import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";

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
 * One exception is opt-in rather than assumed: a profile photo. Most parsers
 * ignore images and several markets treat a photo as noise, so the document is
 * image-free by default. When the admin panel turns the photo on, it is a single
 * image placed beside the header block — the reading order of the text is
 * unchanged, and the test asserts both variants.
 *
 * The Chromium-printed "designed" variant is the pretty one; this one is the
 * one that survives being fed to a machine.
 */

export interface AtsRenderOptions {
  /** Print the portrait. Off unless the admin panel enables it. */
  includePhoto?: boolean;
  /** Square JPEG data URI, already re-encoded by `loadAvatarDataUri`. */
  photoDataUri?: string | null;
}

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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
  },
  headerId: {
    flexGrow: 1,
    flexShrink: 1,
  },
  // 72pt ≈ 25mm — a portrait that prints legibly without competing with the text.
  photo: {
    width: 72,
    height: 72,
    borderRadius: 36,
    objectFit: "cover",
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

export function AtsResumeDocument({
  source,
  options,
}: {
  source: CvSource;
  options?: AtsRenderOptions;
}) {
  const doc = buildAtsDocument(source);
  const keywords = source.skills.flatMap((group) => group.items).join(", ");
  const photo = options?.includePhoto ? (options.photoDataUri ?? null) : null;

  const identity = (
    <>
      <Text style={styles.name}>{doc.name}</Text>
      <Text style={styles.headline}>{doc.headline}</Text>
      {doc.contacts.map((contact) => (
        <Text key={contact} style={styles.contact}>
          {contact}
        </Text>
      ))}
    </>
  );

  return (
    <Document
      title={`${doc.name} — Curriculum Vitae (ATS)`}
      author={doc.name}
      subject="ATS-friendly curriculum vitae"
      creator="gazi-portfolio"
      keywords={keywords}
    >
      <Page size="A4" style={styles.page} wrap>
        {photo ? (
          /* Portrait beside the identity block, never inside the text flow. */
          <View style={styles.headerRow}>
            <View style={styles.headerId}>{identity}</View>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's Image is not an HTML img and has no alt prop */}
            <Image src={photo} style={styles.photo} />
          </View>
        ) : (
          identity
        )}

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
export async function renderAtsCv(
  source: CvSource,
  options?: AtsRenderOptions,
): Promise<Buffer> {
  return renderToBuffer(<AtsResumeDocument source={source} options={options} />);
}
