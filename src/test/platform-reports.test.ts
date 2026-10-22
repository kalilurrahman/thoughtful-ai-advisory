import { describe, expect, it } from "vitest";
import { csvSafe, toCsv } from "@/features/platform/reports/exporters";
import { markdownToPdf, plainInline } from "@/features/platform/reports/pdf";

describe("report exporters", () => {
  it("neutralises CSV formula injection like exporters._csv_safe", () => {
    expect(csvSafe("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(csvSafe("-1")).toBe("'-1");
    expect(csvSafe(["a", "b"])).toBe("a; b");
    expect(csvSafe(null)).toBe("");
  });

  it("writes CSV with header, quoting and CRLF like csv.writer", () => {
    expect(toCsv([{ a: "x,y", b: '"q"' }, { a: "@cmd" }])).toBe(
      'a,b\r\n"x,y","""q"""\r\n\'@cmd,\r\n',
    );
  });

  it("renders Markdown to a multi-page PDF", () => {
    const md = [
      "# Report",
      "",
      "| A | B |",
      "|---|---|",
      "| 1 | 2 |",
      "",
      ...Array.from({ length: 120 }, (_, i) => `- item ${i}`),
    ].join("\n");
    const doc = markdownToPdf(md, { title: "Test", generated: "2026-10-22" });
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
    expect(plainInline("**Bold** [link](/x) “q” — ok")).toBe('Bold link "q" - ok');
  });
});
