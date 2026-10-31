import { describe, expect, it } from "vitest";
import { assistantInputSchema, modelMessages, parseMessages } from "./assistant-model";
import { retrieve } from "./assistant.functions";
import { buildSearchEntries } from "@/features/search/search-index";

describe("private assistant conversations", () => {
  it("restores valid messages and source links", () => {
    const messages = [
      {
        role: "assistant",
        content: "Use the incident register",
        sources: [{ title: "Incidents", url: "/incidents" }],
      },
    ];
    expect(parseMessages(messages)).toEqual(messages);
  });
  it("rejects corrupt saved messages instead of rendering unchecked data", () => {
    expect(parseMessages([{ role: "system", content: 42 }])).toBeNull();
    expect(
      parseMessages([
        {
          role: "assistant",
          content: "test",
          sources: [{ title: "Unsafe", url: "javascript:alert(1)" }],
        },
      ]),
    ).toBeNull();
  });
  it("masks sensitive details in every model history message", () => {
    const messages = [
      { role: "user" as const, content: "Contact ana@example.com about oversight" },
      { role: "assistant" as const, content: "Email ana@example.com" },
    ];
    const safe = modelMessages(messages);
    expect(safe.every((message) => !message.content.includes("ana@example.com"))).toBe(true);
    expect(safe[0]?.content).toContain("[REDACTED:email]");
    expect(messages[0]?.content).toContain("ana@example.com");
  });
  it("requires a real thread id for each model request", () => {
    expect(
      assistantInputSchema.safeParse({ content: "Where do I record an AI incident?" }).success,
    ).toBe(false);
    expect(
      assistantInputSchema.safeParse({
        threadId: "79455f81-8295-4372-8c91-fb2495662c15",
        content: "Where do I record an AI incident?",
      }).success,
    ).toBe(true);
  });
  it("retrieves the real incident register for a navigation question", () => {
    const hits = retrieve(buildSearchEntries(), "Where do I record an AI incident?");
    expect(hits.some((entry) => entry.url === "/incidents")).toBe(true);
  });
});
