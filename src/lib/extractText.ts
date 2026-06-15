// Client-side text extraction for PDF, DOCX, and plain-text files.
// Used during document upload to populate `documents.content_text` so the AI
// knowledge base has searchable content.

import * as pdfjsLib from "pdfjs-dist";
// @ts-ignore - vite worker import
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

const MAX_CHARS = 200_000;
const TEXTUAL = /\.(txt|md|csv|json|html|xml|log|tsv|yml|yaml)$/i;

export type ExtractKind = "pdf" | "docx" | "text" | "unsupported";

export interface ExtractResult {
  text: string;
  kind: ExtractKind;
  error?: string;
}

export interface ExtractOptions {
  onProgress?: (current: number, total: number) => void;
}

export async function extractTextFromFile(
  file: File,
  opts: ExtractOptions = {},
): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  try {
    if (name.endsWith(".pdf")) {
      const text = (await extractPdf(file, opts.onProgress)).slice(0, MAX_CHARS);
      return { text, kind: "pdf" };
    }
    if (name.endsWith(".docx")) {
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return { text: (result.value || "").slice(0, MAX_CHARS), kind: "docx" };
    }
    if (TEXTUAL.test(name)) {
      const text = (await file.text()).slice(0, MAX_CHARS);
      return { text, kind: "text" };
    }
    return { text: "", kind: "unsupported" };
  } catch (err: any) {
    console.error("Text extraction failed for", file.name, err);
    return { text: "", kind: name.endsWith(".pdf") ? "pdf" : name.endsWith(".docx") ? "docx" : "unsupported", error: err?.message || "Extraction failed" };
  }
}

async function extractPdf(
  file: File,
  onProgress?: (current: number, total: number) => void,
): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjsLib.getDocument({ data }).promise;
  const parts: string[] = [];
  const maxPages = Math.min(pdf.numPages, 100);
  onProgress?.(0, maxPages);
  for (let i = 1; i <= maxPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((it: any) => ("str" in it ? it.str : ""))
      .join(" ");
    parts.push(pageText);
    onProgress?.(i, maxPages);
    if (parts.join("\n").length > MAX_CHARS) break;
  }
  return parts.join("\n\n");
}
