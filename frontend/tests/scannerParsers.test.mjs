// Unit tests for the scanner report parsers.
// Run with: npm run test:parsers   (Node >= 22.18 / 24 — uses built-in TypeScript type stripping)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseReportText, detectFormat, normalizeSeverity, htmlToText } from '../src/features/import/scannerParsers.ts';

const fixture = (name) => readFileSync(fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url)), 'utf8');

test('Trivy JSON: detects format and classifies every entry', () => {
  const out = parseReportText(fixture('trivy-image.json'));
  assert.equal(out.ok, true);
  const r = out.report;
  assert.equal(r.format, 'trivy');
  assert.equal(r.subject, 'example/billing-api:1.4.0');
  // 5 vulns + 2 misconfigs + 1 secret = 8 entries, none silently dropped
  assert.equal(r.entries.length, 8);
  assert.deepEqual(r.counts, { valid: 4, invalid: 1, unsupported: 3 });
});

test('Trivy JSON: valid vulnerability maps to backend import fields', () => {
  const r = parseReportText(fixture('trivy-image.json')).report;
  const libwebp = r.entries.find((e) => e.payload?.cve_id === 'CVE-2023-4863');
  assert.ok(libwebp);
  assert.equal(libwebp.status, 'valid');
  assert.deepEqual(
    {
      severity: libwebp.payload.severity,
      package_name: libwebp.payload.package_name,
      installed_version: libwebp.payload.installed_version,
      fixed_version: libwebp.payload.fixed_version,
      source: libwebp.payload.source,
    },
    { severity: 'High', package_name: 'libwebp7', installed_version: '1.2.4-0.2', fixed_version: '1.2.4-0.2+deb12u1', source: 'trivy' }
  );
});

test('Trivy JSON: non-CVE identifiers are never placed in cve_id', () => {
  const r = parseReportText(fixture('trivy-image.json')).report;
  const ghsa = r.entries.find((e) => e.payload?.scanner_id === 'GHSA-xxxx-yyyy-zzzz');
  assert.equal(ghsa.status, 'valid');
  assert.equal(ghsa.payload.cve_id, null);
  assert.ok(ghsa.warnings.some((w) => w.includes('not a CVE')));
  // description falls back to the report's Title, with a warning (no invented text)
  assert.equal(ghsa.payload.description, 'Fixture advisory without a CVE identifier');
});

test('Trivy JSON: UNKNOWN severity, passed checks and secrets are unsupported, not dropped', () => {
  const r = parseReportText(fixture('trivy-image.json')).report;
  const unknown = r.entries.find((e) => e.location === 'Results[0].Vulnerabilities[2]');
  assert.equal(unknown.status, 'unsupported');
  const passed = r.entries.find((e) => e.location === 'Results[2].Misconfigurations[1]');
  assert.equal(passed.status, 'unsupported');
  const secret = r.entries.find((e) => e.location.startsWith('Results[3].Secrets'));
  assert.equal(secret.status, 'unsupported');
  assert.equal(secret.payload, undefined, 'secret entries must never produce an import payload');
});

test('Trivy JSON: entry missing title/description is invalid', () => {
  const r = parseReportText(fixture('trivy-image.json')).report;
  const bad = r.entries.find((e) => e.location === 'Results[0].Vulnerabilities[3]');
  assert.equal(bad.status, 'invalid');
});

test('Trivy JSON: failed misconfiguration is importable with file location', () => {
  const r = parseReportText(fixture('trivy-image.json')).report;
  const ds002 = r.entries.find((e) => e.location === 'Results[2].Misconfigurations[0]');
  assert.equal(ds002.status, 'valid');
  assert.equal(ds002.payload.file_path, 'Dockerfile:1');
  assert.equal(ds002.payload.severity, 'High');
});

test('OWASP ZAP JSON: detects format and classifies every alert', () => {
  const out = parseReportText(fixture('zap-report.json'));
  assert.equal(out.ok, true);
  const r = out.report;
  assert.equal(r.format, 'owasp-zap');
  assert.equal(r.entries.length, 6);
  assert.deepEqual(r.counts, { valid: 4, invalid: 1, unsupported: 1 });
});

test('OWASP ZAP JSON: risk codes, CWE and HTML handling', () => {
  const r = parseReportText(fixture('zap-report.json')).report;
  const sqli = r.entries[0];
  assert.equal(sqli.payload.severity, 'High');
  assert.equal(sqli.payload.cwe_id, 'CWE-89');
  assert.equal(sqli.payload.cve_id, null, 'ZAP alerts have no CVE; none may be invented');
  assert.equal(sqli.payload.description, 'SQL injection may be possible.');
  assert.equal(sqli.payload.file_path, 'http://localhost:8080/search?q=test');
  assert.ok(sqli.warnings.some((w) => w.includes('2 affected URLs')));
  assert.equal(r.entries[2].payload.severity, 'Low');
  assert.ok(r.entries[2].payload.description.includes('"Server"'));
  assert.equal(r.entries[3].payload.severity, 'Informational');
  assert.equal(r.entries[3].payload.cwe_id, null);
  assert.equal(r.entries[4].status, 'invalid');
  assert.equal(r.entries[5].status, 'unsupported');
});

test('Invalid JSON syntax is rejected with a clear error', () => {
  const out = parseReportText(fixture('invalid-syntax.json'));
  assert.equal(out.ok, false);
  assert.match(out.error, /not valid JSON/);
});

test('Unknown JSON structure is rejected, not guessed', () => {
  const out = parseReportText(fixture('unknown-format.json'));
  assert.equal(out.ok, false);
  assert.match(out.error, /Unrecognised report format/);
});

test('Empty file is rejected', () => {
  assert.equal(parseReportText('   ').ok, false);
});

test('PatchPilot native array: validates required fields like the backend', () => {
  const out = parseReportText(
    JSON.stringify([
      { title: 'A', description: 'd', severity: 'moderate' },
      { title: 'B', severity: 'High' },
      { title: 'C', description: 'd', severity: 'urgent' },
      'not-an-object',
    ])
  );
  assert.equal(out.ok, true);
  assert.equal(out.report.format, 'patchpilot');
  assert.deepEqual(out.report.counts, { valid: 1, invalid: 3, unsupported: 0 });
  assert.equal(out.report.entries[0].payload.severity, 'Medium');
});

test('helpers', () => {
  assert.equal(normalizeSeverity('info'), 'Informational');
  assert.equal(normalizeSeverity('UNKNOWN'), null);
  assert.equal(detectFormat({ findings: [] }), 'patchpilot');
  assert.equal(htmlToText('<p>a &amp; b</p><script>x</script>'), 'a & b\nx');
});
