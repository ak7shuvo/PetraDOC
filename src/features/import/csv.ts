/** Minimal RFC 4180 CSV parser (quotes, escaped quotes, CRLF, embedded commas/newlines). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) {
      if (ch === '"') { if (t[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && t[i + 1] === "\n") i++;
      row.push(cell); cell = ""; rows.push(row); row = [];
    } else cell += ch;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

export const normHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Parses CSV or JSON text into rows keyed by normalised header. */
export function parseTable(text: string, fileName: string, listKey: string): Record<string, string>[] {
  const isJson = fileName.toLowerCase().endsWith(".json") || /^\s*[[{]/.test(text);
  if (isJson) {
    let data: unknown;
    try { data = JSON.parse(text); } catch { throw new Error("The file is not valid JSON."); }
    const arr = Array.isArray(data) ? data : (data as Record<string, unknown>)?.[listKey];
    if (!Array.isArray(arr)) throw new Error(`JSON must be an array of objects (or an object with a "${listKey}" array).`);
    return arr.map((o) => Object.fromEntries(Object.entries((o ?? {}) as Record<string, unknown>).map(([k, v]) => [normHeader(k), v == null ? "" : String(v).trim()])));
  }
  const [head, ...body] = parseCsv(text);
  if (!head) throw new Error("The file is empty.");
  const keys = head.map(normHeader);
  return body.map((r) => Object.fromEntries(keys.map((k, i) => [k, (r[i] ?? "").trim()])));
}
