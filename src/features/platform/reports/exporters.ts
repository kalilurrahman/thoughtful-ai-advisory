// File exporters (CSV, JSON, Markdown) with CSV-injection protection — a port of
// platform/app/reports/veritrail_reports/exporters.py, producing browser downloads.

const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];

/** Neutralise spreadsheet formula injection (OWASP CSV injection guidance). */
export function csvSafe(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s: string;
  if (Array.isArray(v)) s = v.map(String).join("; ");
  else if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    s = JSON.stringify(Object.fromEntries(Object.keys(o).sort().map((k) => [k, o[k]])));
  } else if (typeof v === "boolean") s = v ? "True" : "False";
  else s = String(v);
  return FORMULA_PREFIXES.some((p) => s.startsWith(p)) ? `'${s}` : s;
}

function csvField(s: string): string {
  // Python csv.writer default dialect: quote when the field holds a delimiter, quote or newline.
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** write_csv(): header row then one safe row per record; CRLF line endings like csv.writer. */
export function toCsv(rows: Array<Record<string, unknown>>, columns?: string[]): string {
  const cols = columns ?? [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const lines = [cols.map(csvField).join(",")];
  for (const r of rows) lines.push(cols.map((c) => csvField(csvSafe(r[c]))).join(","));
  return lines.join("\r\n") + "\r\n";
}

export function toJson(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

/** Trigger a browser download. Call only from event handlers (never during render/SSR). */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(text: string, filename: string, type = "text/plain"): void {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}
