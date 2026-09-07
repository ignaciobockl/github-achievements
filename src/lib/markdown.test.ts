import { describe, expect, it } from "vitest";
import { parseMarkdownTable } from "./markdown";

describe("parseMarkdownTable", () => {
  it("parses a table with leading and trailing pipes", () => {
    const lines = [
      "| Title | Badge | Earnable? | Earned by |",
      "| --- | --- | --- | --- |",
      "| Pull Shark | img | ✔️ | 2 pull requests merged |",
    ];

    const table = parseMarkdownTable(lines);
    expect(table).not.toBeNull();
    expect(table?.headers).toEqual(["Title", "Badge", "Earnable?", "Earned by"]);
    expect(table?.rows).toEqual([["Pull Shark", "img", "✔️", "2 pull requests merged"]]);
  });

  it("parses a table without leading/trailing pipes (GitHub README style)", () => {
    const lines = [
      "Title | Badge | Earnable? | Earned by",
      "--- | --- | --- | ---",
      "Quickdraw | img | ✔️ | Closed an issue within 5 min",
    ];

    const table = parseMarkdownTable(lines);
    expect(table).not.toBeNull();
    expect(table?.headers).toEqual(["Title", "Badge", "Earnable?", "Earned by"]);
    expect(table?.rows).toEqual([["Quickdraw", "img", "✔️", "Closed an issue within 5 min"]]);
  });

  it("skips separator and empty rows", () => {
    const lines = ["| A | B |", "| --- | --- |", "|||", "| x | y |"];

    const table = parseMarkdownTable(lines);
    expect(table?.rows).toEqual([["x", "y"]]);
  });

  it("returns null for non-table input", () => {
    expect(parseMarkdownTable(["just some text"])).toBeNull();
  });
});
