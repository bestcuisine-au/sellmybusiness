"use client";

import React from "react";

// ─── Simple Markdown-to-JSX renderer for IM section content ───
// Handles: bold, bullet lists, markdown tables, paragraphs

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }
    parts.push(
      <strong key={key++} className="font-semibold text-gray-900">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return parts.length > 0 ? parts : [<span key={0}>{text}</span>];
}

function parseTable(lines: string[]): { headers: string[]; rows: string[][] } {
  const headers: string[] = [];
  const rows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) continue;

    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());

    // Skip separator rows (|---|---|)
    if (cells.every((c) => /^[-:]+$/.test(c))) continue;

    if (headers.length === 0) {
      headers.push(...cells);
    } else {
      rows.push(cells);
    }
  }

  return { headers, rows };
}

function MarkdownTable({ lines }: { lines: string[] }) {
  const { headers, rows } = parseTable(lines);

  if (headers.length === 0) return null;

  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#2e7847] text-white">
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-semibold border-r border-[#245f39] last:border-r-0"
              >
                {renderInlineMarkdown(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              className={`border-b border-gray-100 ${
                ri % 2 === 0 ? "bg-white" : "bg-gray-50"
              } hover:bg-gray-100/60 transition-colors`}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-4 py-2.5 border-r border-gray-100 last:border-r-0 ${
                    ci === 0 ? "font-medium text-gray-800" : "text-gray-700"
                  }`}
                >
                  {renderInlineMarkdown(cell)}
                </td>
              ))}
              {/* Fill missing cells if row is shorter than headers */}
              {row.length < headers.length &&
                Array.from({ length: headers.length - row.length }).map((_, ci) => (
                  <td
                    key={`empty-${ci}`}
                    className="px-4 py-2.5 border-r border-gray-100 last:border-r-0 text-gray-400"
                  >
                    —
                  </td>
                ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="my-3 space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-gray-700 leading-relaxed">
          <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#2e7847] flex-shrink-0" />
          <span>{renderInlineMarkdown(item)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function MarkdownContent({ content }: { content: string }) {
  if (!content || content.trim().length === 0) return null;

  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line — skip
    if (trimmed === "") {
      i++;
      continue;
    }

    // Table block: collect consecutive lines with pipes
    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(<MarkdownTable key={key++} lines={tableLines} />);
      continue;
    }

    // Bullet list: collect consecutive bullet items
    if (/^[-*]\s/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length) {
        const bulletLine = lines[i].trim();
        if (/^[-*]\s/.test(bulletLine)) {
          items.push(bulletLine.replace(/^[-*]\s+/, ""));
          i++;
        } else if (bulletLine === "") {
          // Allow one blank line within bullets
          if (i + 1 < lines.length && /^[-*]\s/.test(lines[i + 1].trim())) {
            i++;
          } else {
            break;
          }
        } else {
          break;
        }
      }
      elements.push(<BulletList key={key++} items={items} />);
      continue;
    }

    // Regular paragraph: collect lines until empty line, bullet, or table
    const paraLines: string[] = [];
    while (i < lines.length) {
      const pLine = lines[i].trim();
      if (pLine === "" || pLine.startsWith("|") || /^[-*]\s/.test(pLine)) {
        break;
      }
      paraLines.push(pLine);
      i++;
    }
    if (paraLines.length > 0) {
      const paraText = paraLines.join(" ");
      elements.push(
        <p key={key++} className="text-gray-700 leading-relaxed mb-4">
          {renderInlineMarkdown(paraText)}
        </p>
      );
    }
  }

  return <div className="markdown-content">{elements}</div>;
}
