// Temporary inspection tool: extracts the real text layer from a generated CV PDF
// so the ATS variant can be checked independently of the unit test.
import fs from "node:fs";

const [, , file, mode = "text"] = process.argv;
if (!file) {
  console.error("usage: node inspect-pdf.mjs <file.pdf> [text|info]");
  process.exit(2);
}

const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
const data = new Uint8Array(fs.readFileSync(file));
const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;

console.log(`pages: ${doc.numPages}`);

if (mode === "info") {
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const ops = await page.getOperatorList();
    const imageOps = ops.fnArray.filter(
      (fn) => fn === pdfjs.OPS.paintImageXObject || fn === pdfjs.OPS.paintJpegXObject,
    ).length;
    console.log(`  page ${n}: ${imageOps} image draw op(s)`);
  }
  process.exit(0);
}

const pages = [];
for (let n = 1; n <= doc.numPages; n++) {
  const page = await doc.getPage(n);
  const content = await page.getTextContent();
  pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
}

const text = pages.join("\n");
console.log("--- extracted text ---");
console.log(text);
console.log("--- end ---");
console.log(`total characters: ${text.length}`);

const requiredHeadings = [
  "Professional Summary",
  "Experience",
  "Education",
  "Skills",
  "Certifications",
  "Projects",
];
const positions = requiredHeadings.map((h) => ({ h, at: text.indexOf(h) }));
console.log("\nsection order check:");
let last = -1;
let ordered = true;
for (const { h, at } of positions) {
  if (at === -1) {
    console.log(`  MISSING: ${h}`);
    ordered = false;
  } else if (at < last) {
    console.log(`  OUT OF ORDER: ${h}`);
    ordered = false;
  } else {
    console.log(`  ok @${at}: ${h}`);
  }
  last = Math.max(last, at);
}
console.log(ordered ? "\nSECTION ORDER OK" : "\nSECTION ORDER FAILED");

const expectedJobs = [
  "Senior Software Developer",
  "Senior Developer Team-Lead",
  "Senior Software & PLC Developer",
  "Project Manager",
  "Full-Stack Laravel Developer",
  "Junior Software Developer",
];
const missing = expectedJobs.filter((j) => !text.includes(j));
console.log(missing.length === 0 ? "ALL JOB TITLES PRESENT" : `MISSING JOB TITLES: ${missing.join(", ")}`);
