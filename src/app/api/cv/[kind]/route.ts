import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";

import { CV_FILENAMES, cvKindFromSlug, ensureCvAsset } from "@/lib/pdf/assets";

/**
 * The public download endpoint for both CV variants.
 *
 * `ensureCvAsset` decides whether the file on disk is still current. On a hit
 * this is a file read; on a miss it renders inline — the documented fallback
 * that keeps the very first visitor of a fresh deployment from waiting for a
 * background job to notice the asset is missing.
 *
 * `?inline=1` swaps the disposition so the mobile client can preview the PDF in
 * an embedded viewer instead of triggering a download.
 */

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ kind: string }> },
): Promise<Response> {
  const { kind: slug } = await params;
  const kind = cvKindFromSlug(slug);

  if (!kind) {
    return NextResponse.json(
      { error: "Unknown CV variant. Use 'designed' or 'ats'." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const inline = new URL(request.url).searchParams.get("inline") === "1";

  try {
    const asset = await ensureCvAsset(kind);
    const bytes = await readFile(asset.absolutePath);

    return new Response(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${CV_FILENAMES[kind]}"`,
        "Content-Length": String(bytes.byteLength),
        // Short and public: the file itself is content-addressed by its
        // sourceHash, and a proxy holding it for five minutes can only ever be
        // five minutes behind an edit.
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error(`[cv] could not serve ${kind}:`, error);
    return NextResponse.json(
      { error: "The CV could not be generated right now. Please try again shortly." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
