import { useState } from 'react';
import type { ReactNode } from 'react';
import { Check, Copy } from 'lucide-react';
import { tokenize } from './highlight';
import { copyText } from '@/utils/clipboard';

/**
 * Safe, dependency-free Markdown renderer for assistant messages.
 * Supports headings, paragraphs, bold/italic, inline code, fenced code blocks
 * (with syntax highlighting + copy), ordered/unordered lists, block quotes,
 * tables, horizontal rules and http(s) links. Everything is rendered as React
 * elements; raw HTML in the source is shown as text, never interpreted.
 */

type Block =
  | { type: 'heading'; level: number; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'code'; lang: string; code: string }
  | { type: 'list'; ordered: boolean; start: number; items: string[] }
  | { type: 'quote'; text: string }
  | { type: 'table'; header: string[]; rows: string[][] }
  | { type: 'hr' };

const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const isTableSep = (l: string) => /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(l);
const splitRow = (l: string) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());

function parseMarkdown(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    const fence = line.match(/^\s*(```|~~~)\s*([\w+#.-]*)/);
    if (fence) {
      const marker = fence[1];
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith(marker)) body.push(lines[i++]);
      i++; // closing fence (or EOF)
      blocks.push({ type: 'code', lang: fence[2] || '', code: body.join('\n') });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      blocks.push({ type: 'heading', level: h[1].length, text: h[2].replace(/\s*#+\s*$/, '') });
      i++;
      continue;
    }

    if (/^\s*(?:(?:-\s*){3,}|(?:\*\s*){3,}|(?:_\s*){3,})$/.test(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && isTableRow(lines[i])) rows.push(splitRow(lines[i++]));
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    if (/^\s*>/.test(line)) {
      const body: string[] = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) body.push(lines[i++].replace(/^\s*>\s?/, ''));
      blocks.push({ type: 'quote', text: body.join('\n') });
      continue;
    }

    const listMatch = line.match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const start = ordered ? parseInt(listMatch[1], 10) : 1;
      const items: string[] = [];
      while (i < lines.length) {
        const m = lines[i].match(/^\s*([-*+]|\d+[.)])\s+(.*)$/);
        if (m && /\d/.test(m[1]) === ordered) {
          items.push(m[2]);
          i++;
        } else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length) {
          // continuation / nested line — append to the current item
          items[items.length - 1] += `\n${lines[i].trim()}`;
          i++;
        } else break;
      }
      blocks.push({ type: 'list', ordered, start, items });
      continue;
    }

    const para: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,6})\s/.test(lines[i]) &&
      !/^\s*(```|~~~)/.test(lines[i]) &&
      !/^\s*>/.test(lines[i]) &&
      !/^\s*([-*+]|\d+[.)])\s+/.test(lines[i]) &&
      !(isTableRow(lines[i]) && isTableSep(lines[i + 1] ?? ''))
    ) {
      para.push(lines[i++]);
    }
    blocks.push({ type: 'paragraph', text: para.join('\n') });
  }
  return blocks;
}

/** Inline formatting: `code`, **bold**, *italic*, [link](https://…), bare https URLs. */
function renderInline(text: string, keyPrefix = 'i'): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)|(\[[^\]\n]+\]\([^)\s]+\))|(https?:\/\/[^\s<>()]+[^\s<>().,;:!?'"])/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${keyPrefix}-${n++}`;
    const tok = m[0];
    if (m[1]) {
      out.push(
        <code key={k} className="px-1.5 py-0.5 rounded bg-surface-2 border border-line font-mono text-[0.85em] text-accent break-words">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (m[2]) {
      out.push(<strong key={k} className="font-semibold text-fg">{renderInline(tok.slice(2, -2), k)}</strong>);
    } else if (m[3]) {
      out.push(<em key={k}>{renderInline(tok.slice(1, -1), k)}</em>);
    } else if (m[4]) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      out.push(<SafeLink key={k} href={lm[2]}>{lm[1]}</SafeLink>);
    } else if (m[5]) {
      out.push(<SafeLink key={k} href={tok}>{tok}</SafeLink>);
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  // keep explicit line breaks inside paragraphs
  return out.flatMap((node, idx): ReactNode[] =>
    typeof node === 'string'
      ? node.split('\n').flatMap((part, j, arr) => (j < arr.length - 1 ? [part, <br key={`${keyPrefix}-br-${idx}-${j}`} />] : [part]))
      : [node]
  );
}

function SafeLink({ href, children }: { href: string; children: ReactNode }) {
  if (!/^https?:\/\//i.test(href)) return <span>{children}</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer nofollow" className="text-accent underline underline-offset-2 hover:opacity-80 break-all">
      {children}
    </a>
  );
}

export function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const tokens = tokenize(code, lang);
  return (
    <div className="my-3 rounded-lg overflow-hidden border border-code-line bg-code text-code-fg">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-code-line text-[11px] font-mono">
        <span className="uppercase tracking-wider text-code-fg/60">{lang || 'code'}</span>
        <button
          type="button"
          onClick={async () => {
            if (await copyText(code)) {
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }
          }}
          className="inline-flex items-center gap-1 text-code-fg/70 hover:text-code-fg cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[0.8rem] leading-relaxed font-mono">
        <code>
          {tokens.map((t, i) =>
            t.type === 'plain' ? t.text : <span key={i} className={`tok-${t.type}`}>{t.text}</span>
          )}
        </code>
      </pre>
    </div>
  );
}

const HEADING_STYLES = [
  'text-lg font-semibold',
  'text-base font-semibold',
  'text-[0.95rem] font-semibold',
  'text-sm font-semibold uppercase tracking-wide text-fg-muted',
];

export function Markdown({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  return (
    <div className="space-y-2.5 text-sm leading-relaxed text-fg-muted break-words">
      {blocks.map((b, i) => {
        const k = `b${i}`;
        switch (b.type) {
          case 'heading': {
            const cls = HEADING_STYLES[Math.min(b.level, 4) - 1];
            return (
              <p key={k} role="heading" aria-level={Math.min(b.level + 1, 6)} className={`${cls} text-fg pt-1.5`}>
                {renderInline(b.text, k)}
              </p>
            );
          }
          case 'paragraph':
            return <p key={k}>{renderInline(b.text, k)}</p>;
          case 'code':
            return <CodeBlock key={k} code={b.code} lang={b.lang} />;
          case 'list': {
            const Tag = b.ordered ? 'ol' : 'ul';
            return (
              <Tag
                key={k}
                start={b.ordered ? b.start : undefined}
                className={`${b.ordered ? 'list-decimal' : 'list-disc'} pl-5 space-y-1 marker:text-fg-subtle`}
              >
                {b.items.map((item, j) => (
                  <li key={j}>{renderInline(item, `${k}-${j}`)}</li>
                ))}
              </Tag>
            );
          }
          case 'quote':
            return (
              <blockquote key={k} className="border-l-2 border-primary/50 pl-3 text-fg-subtle italic">
                {renderInline(b.text, k)}
              </blockquote>
            );
          case 'table':
            return (
              <div key={k} className="overflow-x-auto rounded-lg border border-line">
                <table className="w-full text-xs">
                  <thead className="bg-surface-2">
                    <tr>
                      {b.header.map((h, j) => (
                        <th key={j} className="text-left font-semibold text-fg px-3 py-2 border-b border-line">
                          {renderInline(h, `${k}-h${j}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, ri) => (
                      <tr key={ri} className="border-b border-line last:border-0">
                        {r.map((c, ci) => (
                          <td key={ci} className="px-3 py-2 align-top">
                            {renderInline(c, `${k}-${ri}-${ci}`)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'hr':
            return <hr key={k} className="border-line" />;
        }
      })}
    </div>
  );
}
