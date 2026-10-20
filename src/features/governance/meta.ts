export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: title + " — AEGIS" },
      { name: "description", content: description },
      { property: "og:title", content: title + " — AEGIS" },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  };
}
