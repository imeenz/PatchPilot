/**
 * Minimal, dependency-free syntax highlighter for chat code blocks.
 * Produces token spans (rendered as React text nodes — never HTML strings),
 * so model output cannot inject markup.
 */

export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'literal' | 'key' | 'plain';
export interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS: Record<string, string[]> = {
  js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'import', 'from', 'export', 'default', 'class', 'new', 'await', 'async', 'try', 'catch', 'throw', 'typeof', 'interface', 'type', 'extends', 'implements', 'of', 'in', 'switch', 'case', 'break'],
  py: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'async', 'await', 'pass', 'in', 'not', 'and', 'or', 'is', 'yield', 'assert'],
  sql: ['select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set', 'delete', 'join', 'left', 'right', 'inner', 'on', 'and', 'or', 'not', 'order', 'by', 'group', 'limit', 'create', 'table', 'drop', 'union', 'like', 'as'],
  sh: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'echo', 'export', 'sudo', 'npm', 'pip', 'docker', 'trivy', 'git', 'curl', 'apt-get', 'run', 'install', 'cd'],
  go: ['func', 'return', 'if', 'else', 'for', 'range', 'package', 'import', 'var', 'const', 'type', 'struct', 'interface', 'go', 'defer', 'err'],
  java: ['public', 'private', 'protected', 'class', 'static', 'void', 'return', 'if', 'else', 'for', 'new', 'import', 'package', 'try', 'catch', 'throw', 'throws', 'final', 'extends', 'implements'],
  docker: ['from', 'run', 'copy', 'add', 'workdir', 'user', 'env', 'expose', 'cmd', 'entrypoint', 'arg', 'label', 'healthcheck'],
  yaml: [],
  json: [],
};

const ALIASES: Record<string, string> = {
  javascript: 'js', typescript: 'js', ts: 'js', tsx: 'js', jsx: 'js', node: 'js',
  python: 'py', bash: 'sh', shell: 'sh', zsh: 'sh', console: 'sh', powershell: 'sh', ps1: 'sh',
  golang: 'go', dockerfile: 'docker', yml: 'yaml', kotlin: 'java', csharp: 'java', cs: 'java',
  postgres: 'sql', mysql: 'sql', sqlite: 'sql',
};

const LITERALS = new Set(['true', 'false', 'null', 'none', 'undefined', 'nil', 'True', 'False', 'None']);

function langKey(lang: string): string {
  const l = lang.toLowerCase();
  return ALIASES[l] ?? l;
}

export function tokenize(code: string, language: string): Token[] {
  const key = langKey(language);
  const kw = KEYWORDS[key];
  if (!kw) return [{ type: 'plain', text: code }];
  const caseInsensitive = key === 'sql' || key === 'docker';
  const kwSet = new Set(caseInsensitive ? kw : kw);

  const commentRe =
    key === 'py' || key === 'sh' || key === 'yaml' || key === 'docker'
      ? /#[^\n]*/y
      : key === 'sql'
        ? /--[^\n]*/y
        : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;

  const tokens: Token[] = [];
  let i = 0;
  let plain = '';
  const flush = () => {
    if (plain) tokens.push({ type: 'plain', text: plain });
    plain = '';
  };
  const tryMatch = (re: RegExp): string | null => {
    re.lastIndex = i;
    const m = re.exec(code);
    return m ? m[0] : null;
  };

  while (i < code.length) {
    const c = code[i];
    let m: string | null;

    if ((m = key !== 'json' ? tryMatch(commentRe) : null)) {
      flush();
      tokens.push({ type: 'comment', text: m });
    } else if ((c === '"' || c === "'" || c === '`') && (m = tryMatch(new RegExp(`${c === '`' ? '`' : c}(?:\\\\.|[^\\\\${c}\\n])*${c}?`, 'y')))) {
      flush();
      // JSON / YAML object keys get their own colour
      const after = code.slice(i + m.length).match(/^\s*:/);
      tokens.push({ type: after && (key === 'json' || key === 'yaml') ? 'key' : 'string', text: m });
    } else if (/[0-9]/.test(c) && !/[A-Za-z_]/.test(code[i - 1] ?? '') && (m = tryMatch(/\d+(?:\.\d+)*/y))) {
      flush();
      tokens.push({ type: 'number', text: m });
    } else if (/[A-Za-z_$]/.test(c) && (m = tryMatch(/[A-Za-z_$][\w$-]*/y))) {
      const word = caseInsensitive ? m.toLowerCase() : m;
      if (kwSet.has(word)) {
        flush();
        tokens.push({ type: 'keyword', text: m });
      } else if (LITERALS.has(m)) {
        flush();
        tokens.push({ type: 'literal', text: m });
      } else if (key === 'yaml' && /^\s*:/.test(code.slice(i + m.length))) {
        flush();
        tokens.push({ type: 'key', text: m });
      } else {
        plain += m;
      }
    } else {
      m = c;
      plain += c;
    }
    i += m.length;
  }
  flush();
  return tokens;
}
