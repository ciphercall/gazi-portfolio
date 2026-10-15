import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CvDocument } from "./CvDocument";
import { verifyRenderToken } from "@/lib/crypto";
import { getCvSource } from "@/lib/queries";

import "./print.css";

/**
 * The print surface for the designed CV.
 *
 * Not a public page: it renders the full contact details of the CV owner, so it
 * is gated by a short-lived HMAC token that only the PDF pipeline can mint.
 * Anything else — a crawler, a visitor guessing the path, a stale bookmark — gets
 * a 404 rather than the document.
 *
 * Chromium loads this route over `http://127.0.0.1:$PORT` and prints it with
 * `preferCSSPageSize`, so `print.css` owns every dimension and page break.
 */

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "CV — designed",
};

export default async function DesignedCvRenderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.token;
  const token = typeof raw === "string" ? raw : null;

  if (!verifyRenderToken(token)) notFound();

  const source = await getCvSource();

  return <CvDocument source={source} />;
}
