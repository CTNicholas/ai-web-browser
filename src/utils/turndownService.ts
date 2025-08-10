import TurndownService from "turndown";

// Configure turndown service for webpage to markdown conversion
const turndownService = new TurndownService({
  headingStyle: "atx",
  hr: "---",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  fence: "```",
  emDelimiter: "*",
  strongDelimiter: "**",
  linkStyle: "inlined",
  linkReferenceStyle: "full",
});

// Configure turndown to handle common webpage elements better
turndownService.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

turndownService.addRule("highlight", {
  filter: ["mark"],
  replacement: (content) => `==${content}==`,
});

// Remove unwanted elements
turndownService.remove(["script", "style", "noscript", "iframe", "object", "embed"]);

export { turndownService };
