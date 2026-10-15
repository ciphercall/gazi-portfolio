import { ImageResponse } from "next/og";

import { DEFAULT_HEADLINE, SITE_NAME, SITE_URL, loadProfileSafe } from "@/lib/seo";

/**
 * The OpenGraph card, painted in the Midnight Aurora style.
 *
 * It reads the profile but never *requires* it: if the database is unreachable
 * (which is the normal state while the production image is being built) the card
 * still renders with the configured site name, so a broken image preview is
 * impossible. Fonts come from the bundled default — no network fetch, no build
 * dependency on Google Fonts.
 */

export const dynamic = "force-dynamic";
export const alt = `${SITE_NAME} — senior Laravel & React full-stack developer`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#f8fafc";
const MUTED = "#94a3b8";
const FAINT = "#64748b";
const TEAL = "#17c7b7";
const CYAN = "#2ad6ff";

export default async function OpengraphImage() {
  const profile = await loadProfileSafe();

  const name = profile?.fullName.trim() || SITE_NAME;
  const headline = profile?.headline.trim() || DEFAULT_HEADLINE;
  const location = profile?.location.trim() || "Dhaka, Bangladesh";
  const host = SITE_URL.replace(/^https?:\/\//, "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          backgroundColor: "#060910",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(760px 520px at 180px 90px, rgba(23,199,183,0.42), transparent 72%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(700px 460px at 1010px 60px, rgba(42,214,255,0.32), transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            backgroundImage:
              "radial-gradient(900px 520px at 720px 660px, rgba(163,126,225,0.38), transparent 72%)",
          }}
        />

        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "72px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div
              style={{
                display: "flex",
                width: "16px",
                height: "16px",
                borderRadius: "999px",
                backgroundColor: TEAL,
              }}
            />
            <div
              style={{
                display: "flex",
                fontSize: "22px",
                letterSpacing: "4px",
                color: MUTED,
              }}
            >
              AVAILABLE FOR WORK
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", fontSize: "82px", color: INK, lineHeight: 1.05 }}>
              {name}
            </div>
            <div style={{ display: "flex", fontSize: "38px", color: MUTED }}>{headline}</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            <div style={{ display: "flex", fontSize: "24px", color: FAINT }}>{location}</div>
            <div style={{ display: "flex", fontSize: "24px", color: CYAN }}>{host}</div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
