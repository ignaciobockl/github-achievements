export interface MarkdownTable {
  headers: string[];
  rows: string[][];
}

const CELL_PATTERN = /\|/;

function splitRow(line: string): string[] {
  let content = line;
  if (content.startsWith("|")) {
    content = content.slice(1);
  }
  if (content.endsWith("|")) {
    content = content.slice(0, -1);
  }
  return content.split(CELL_PATTERN).map((cell) => cell.trim());
}

function isSeparatorRow(cells: string[]): boolean {
  return cells.length > 0 && cells.every((cell) => /^-{3,}$/.test(cell));
}

export function parseMarkdownTable(lines: string[]): MarkdownTable | null {
  const tableLines = lines.filter((line) => CELL_PATTERN.test(line));

  if (tableLines.length === 0) {
    return null;
  }

  const headerCells = splitRow(tableLines[0] ?? "");
  if (headerCells.length === 0) {
    return null;
  }

  const dataRows: string[][] = [];
  for (const line of tableLines.slice(1)) {
    const cells = splitRow(line);
    if (isSeparatorRow(cells)) {
      continue;
    }
    if (cells.every((cell) => cell === "")) {
      continue;
    }
    dataRows.push(cells);
  }

  if (dataRows.length === 0) {
    return null;
  }

  return {
    headers: headerCells,
    rows: dataRows.map((row) => row.slice(0, headerCells.length)),
  };
}
