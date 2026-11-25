/**
 * Scanner report parsing — client-side preview before import.
 *
 * Uploaded reports are UNTRUSTED data: they are only parsed as JSON, never
 * executed or rendered as HTML. HTML fragments inside reports (e.g. ZAP
 * descriptions) are reduced to plain text.
 *
 * The output payloads match the fields read by the backend importer
 * (app/services/finding_service.py → FindingService.import_findings):
 *   required: title, description, severity
 *   optional: cve_id, package_name, installed_version, fixed_version, source, file_path
 * Any extra keys are stored by the backend in `original_data` for traceability.
 *
 * This module intentionally has no runtime imports so it can be tested directly with Node.
 */

export type ReportFormat = 'trivy' | 'owasp-zap' | 'patchpilot';

export const FORMAT_LABELS: Record<ReportFormat, string> = {
  trivy: 'Trivy JSON',
  'owasp-zap': 'OWASP ZAP JSON',
  patchpilot: 'PatchPilot findings JSON',
};

export type EntryStatus = 'valid' | 'invalid' | 'unsupported';

export interface ImportFindingPayload {
  title: string;
  description: string;
  severity: string;
  cve_id?: string | null;
  package_name?: string | null;
  installed_version?: string | null;
  fixed_version?: string | null;
  source: string;
  file_path?: string | null;
  [extra: string]: unknown;
}

export interface ParsedEntry {
  /** Position in the flattened list of entries found in the report. */
  index: number;
  /** Where the entry came from inside the report, e.g. "Results[0].Vulnerabilities[3]". */
  location: string;
  label: string;
  severity: string | null;
  status: EntryStatus;
  reason?: string;
  warnings: string[];
  payload?: ImportFindingPayload;
}

export interface ParsedReport {
  format: ReportFormat;
  formatLabel: string;
  /** Short description of what was scanned, as stated by the report. */
  subject: string | null;
  entries: ParsedEntry[];
  counts: Record<EntryStatus, number>;
}

export type ParseOutcome = { ok: true; report: ParsedReport } | { ok: false; error: string };

export const MAX_REPORT_BYTES = 10 * 1024 * 1024;

// Field limits from the backend models (app/schemas/finding.py)
const LIMITS = { title: 255, cve_id: 50, package_name: 255, version: 100, file_path: 1000, source: 100 };

const SEVERITY_MAP: Record<string, string> = {
  CRITICAL: 'Critical',
  HIGH: 'High',
  MEDIUM: 'Medium',
  MODERATE: 'Medium',
  LOW: 'Low',
  INFORMATIONAL: 'Informational',
  INFO: 'Informational',
};

/** Mirrors SeverityLevel.normalize in the backend; returns null when unsupported. */
export function normalizeSeverity(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return SEVERITY_MAP[value.trim().toUpperCase()] ?? null;
}

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => {
  if (typeof v === 'string') return v.trim() || null;
  if (typeof v === 'number') return String(v);
  return null;
};

/** Converts an HTML fragment from a report into plain text. Output is still treated as text. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*(br|\/p|\/li|\/div)\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function clamp(value: string | null, max: number, field: string, warnings: string[]): string | null {
  if (value && value.length > max) {
    warnings.push(`${field} exceeded ${max} characters and was shortened.`);
    return value.slice(0, max - 1) + '…';
  }
  return value;
}

function finalize(payload: ImportFindingPayload, warnings: string[]): ImportFindingPayload {
  payload.title = clamp(payload.title, LIMITS.title, 'Title', warnings) as string;
  payload.cve_id = clamp(payload.cve_id ?? null, LIMITS.cve_id, 'CVE ID', warnings);
  payload.package_name = clamp(payload.package_name ?? null, LIMITS.package_name, 'Package name', warnings);
  payload.installed_version = clamp(payload.installed_version ?? null, LIMITS.version, 'Installed version', warnings);
  payload.fixed_version = clamp(payload.fixed_version ?? null, LIMITS.version, 'Fixed version', warnings);
  payload.file_path = clamp(payload.file_path ?? null, LIMITS.file_path, 'File path', warnings);
  return payload;
}

function tally(entries: ParsedEntry[]): Record<EntryStatus, number> {
  const counts: Record<EntryStatus, number> = { valid: 0, invalid: 0, unsupported: 0 };
  entries.forEach((e) => counts[e.status]++);
  return counts;
}

// ---------------------------------------------------------------- format detection

export function detectFormat(data: unknown): ReportFormat | null {
  if (isObj(data)) {
    if (Array.isArray(data.Results) || ('SchemaVersion' in data && 'ArtifactName' in data)) return 'trivy';
    const site = data.site;
    if (
      (Array.isArray(site) || isObj(site)) &&
      ('@version' in data || '@generated' in data || '@programName' in data ||
        (Array.isArray(site) ? site.some((s) => isObj(s) && Array.isArray(s.alerts)) : Array.isArray(site.alerts)))
    ) {
      return 'owasp-zap';
    }
    if (Array.isArray(data.findings)) return 'patchpilot';
    return null;
  }
  if (Array.isArray(data)) return 'patchpilot';
  return null;
}

// ---------------------------------------------------------------- Trivy

function parseTrivy(data: Json): ParsedReport {
  const entries: ParsedEntry[] = [];
  const results = Array.isArray(data.Results) ? data.Results : [];
  const push = (e: Omit<ParsedEntry, 'index'>) => entries.push({ ...e, index: entries.length });

  results.forEach((result, ri) => {
    if (!isObj(result)) {
      push({ location: `Results[${ri}]`, label: 'Malformed result', severity: null, status: 'invalid', reason: 'Result is not a JSON object.', warnings: [] });
      return;
    }
    const target = str(result.Target);

    const vulns = Array.isArray(result.Vulnerabilities) ? result.Vulnerabilities : [];
    vulns.forEach((v, vi) => {
      const location = `Results[${ri}].Vulnerabilities[${vi}]`;
      if (!isObj(v)) {
        push({ location, label: 'Malformed vulnerability', severity: null, status: 'invalid', reason: 'Entry is not a JSON object.', warnings: [] });
        return;
      }
      const warnings: string[] = [];
      const id = str(v.VulnerabilityID);
      const pkg = str(v.PkgName);
      const rawSeverity = str(v.Severity);
      const severity = normalizeSeverity(rawSeverity);
      const title = str(v.Title) ?? (id && pkg ? `${id} in ${pkg}` : id);
      const description = str(v.Description) ?? str(v.Title);
      const label = title ?? id ?? 'Untitled vulnerability';

      if (!title || !description) {
        push({ location, label, severity: rawSeverity, status: 'invalid', reason: `Missing ${!title ? 'title / VulnerabilityID' : 'description'} — required by the importer.`, warnings });
        return;
      }
      if (!severity) {
        push({ location, label, severity: rawSeverity, status: 'unsupported', reason: `Severity "${rawSeverity ?? 'missing'}" is not supported (allowed: Critical, High, Medium, Low, Informational).`, warnings });
        return;
      }
      if (!str(v.Description)) warnings.push('Report has no description; the vulnerability title is used as the description.');
      const cve = id && /^CVE-\d{4}-\d+$/i.test(id) ? id.toUpperCase() : null;
      if (id && !cve) warnings.push(`Identifier ${id} is not a CVE; it is kept in the title and raw record only.`);

      push({
        location,
        label,
        severity,
        status: 'valid',
        warnings,
        payload: finalize(
          {
            title,
            description,
            severity,
            cve_id: cve,
            package_name: pkg,
            installed_version: str(v.InstalledVersion),
            fixed_version: str(v.FixedVersion),
            source: 'trivy',
            file_path: str(v.PkgPath) ?? target,
            scanner_id: id,
            scanner_target: target,
            reference_url: str(v.PrimaryURL),
          },
          warnings
        ),
      });
    });

    const misconfigs = Array.isArray(result.Misconfigurations) ? result.Misconfigurations : [];
    misconfigs.forEach((m, mi) => {
      const location = `Results[${ri}].Misconfigurations[${mi}]`;
      if (!isObj(m)) {
        push({ location, label: 'Malformed misconfiguration', severity: null, status: 'invalid', reason: 'Entry is not a JSON object.', warnings: [] });
        return;
      }
      const warnings: string[] = [];
      const id = str(m.ID) ?? str(m.AVDID);
      const rawSeverity = str(m.Severity);
      const severity = normalizeSeverity(rawSeverity);
      const title = str(m.Title) ?? id;
      const description = [str(m.Description), str(m.Message)].filter(Boolean).join('\n\n') || null;
      const label = title ?? 'Untitled misconfiguration';
      const status = str(m.Status);

      if (status && status.toUpperCase() !== 'FAIL') {
        push({ location, label, severity: rawSeverity, status: 'unsupported', reason: `Check status is "${status}" — only failed checks are findings.`, warnings });
        return;
      }
      if (!title || !description) {
        push({ location, label, severity: rawSeverity, status: 'invalid', reason: `Missing ${!title ? 'title' : 'description'} — required by the importer.`, warnings });
        return;
      }
      if (!severity) {
        push({ location, label, severity: rawSeverity, status: 'unsupported', reason: `Severity "${rawSeverity ?? 'missing'}" is not supported.`, warnings });
        return;
      }
      const cause = isObj(m.CauseMetadata) ? m.CauseMetadata : null;
      const line = cause && typeof cause.StartLine === 'number' ? `:${cause.StartLine}` : '';
      push({
        location,
        label,
        severity,
        status: 'valid',
        warnings,
        payload: finalize(
          {
            title: id && title !== id ? `${title} (${id})` : title,
            description,
            severity,
            cve_id: null,
            package_name: null,
            installed_version: null,
            fixed_version: null,
            source: 'trivy',
            file_path: target ? `${target}${line}` : null,
            scanner_id: id,
            scanner_target: target,
            resolution: str(m.Resolution),
            reference_url: str(m.PrimaryURL),
          },
          warnings
        ),
      });
    });

    const secrets = Array.isArray(result.Secrets) ? result.Secrets : [];
    secrets.forEach((s, si) => {
      const label = isObj(s) ? (str(s.Title) ?? str(s.RuleID) ?? 'Secret') : 'Secret';
      push({
        location: `Results[${ri}].Secrets[${si}]`,
        label,
        severity: isObj(s) ? str(s.Severity) : null,
        status: 'unsupported',
        reason: 'Secret findings are not imported: the report contains the matched secret text, which should not be copied into another system. Rotate the secret and track it manually.',
        warnings: [],
      });
    });

    const licenses = Array.isArray(result.Licenses) ? result.Licenses : [];
    licenses.forEach((l, li) => {
      push({
        location: `Results[${ri}].Licenses[${li}]`,
        label: isObj(l) ? (str(l.Name) ?? 'License finding') : 'License finding',
        severity: isObj(l) ? str(l.Severity) : null,
        status: 'unsupported',
        reason: 'License findings are not security vulnerabilities and are not imported.',
        warnings: [],
      });
    });
  });

  return {
    format: 'trivy',
    formatLabel: FORMAT_LABELS.trivy,
    subject: str(data.ArtifactName),
    entries,
    counts: tally(entries),
  };
}

// ---------------------------------------------------------------- OWASP ZAP

const ZAP_RISK: Record<string, string> = { '3': 'High', '2': 'Medium', '1': 'Low', '0': 'Informational' };

function parseZap(data: Json): ParsedReport {
  const entries: ParsedEntry[] = [];
  const sites = Array.isArray(data.site) ? data.site : isObj(data.site) ? [data.site] : [];
  const push = (e: Omit<ParsedEntry, 'index'>) => entries.push({ ...e, index: entries.length });
  const siteNames: string[] = [];

  sites.forEach((site, si) => {
    if (!isObj(site)) {
      push({ location: `site[${si}]`, label: 'Malformed site', severity: null, status: 'invalid', reason: 'Site is not a JSON object.', warnings: [] });
      return;
    }
    const siteName = str(site['@name']);
    if (siteName) siteNames.push(siteName);
    const alerts = Array.isArray(site.alerts) ? site.alerts : [];

    alerts.forEach((a, ai) => {
      const location = `site[${si}].alerts[${ai}]`;
      if (!isObj(a)) {
        push({ location, label: 'Malformed alert', severity: null, status: 'invalid', reason: 'Alert is not a JSON object.', warnings: [] });
        return;
      }
      const warnings: string[] = [];
      const title = str(a.alert) ?? str(a.name);
      const descHtml = str(a.desc);
      const description = descHtml ? htmlToText(descHtml) || null : null;
      const riskcode = str(a.riskcode);
      const severity = riskcode !== null ? (ZAP_RISK[riskcode] ?? null) : null;
      const label = title ?? 'Untitled alert';

      if (!title || !description) {
        push({ location, label, severity: str(a.riskdesc) ?? riskcode, status: 'invalid', reason: `Missing ${!title ? 'alert name' : 'description'} — required by the importer.`, warnings });
        return;
      }
      if (!severity) {
        push({ location, label, severity: riskcode, status: 'unsupported', reason: `Risk code "${riskcode ?? 'missing'}" is not a recognised ZAP risk level (0–3).`, warnings });
        return;
      }

      const instances = Array.isArray(a.instances) ? a.instances.filter(isObj) : [];
      const firstUri = instances.length > 0 ? str(instances[0].uri) : null;
      if (instances.length > 1) {
        warnings.push(`${instances.length} affected URLs; the first is stored as the location and all are kept in the raw record.`);
      }
      const cwe = str(a.cweid);
      const cweId = cwe && cwe !== '-1' && cwe !== '0' ? `CWE-${cwe}` : null;

      push({
        location,
        label,
        severity,
        status: 'valid',
        warnings,
        payload: finalize(
          {
            title,
            description,
            severity,
            cve_id: null,
            package_name: null,
            installed_version: null,
            fixed_version: null,
            source: 'owasp-zap',
            file_path: firstUri ?? siteName,
            scanner_id: str(a.pluginid),
            cwe_id: cweId,
            confidence: str(a.confidence),
            solution: str(a.solution) ? htmlToText(str(a.solution) as string) : null,
            affected_urls: instances.map((i) => str(i.uri)).filter(Boolean).slice(0, 50),
            instance_count: instances.length || (typeof a.count === 'string' ? Number(a.count) : null),
          },
          warnings
        ),
      });
    });
  });

  return {
    format: 'owasp-zap',
    formatLabel: FORMAT_LABELS['owasp-zap'],
    subject: siteNames.length ? siteNames.join(', ') : null,
    entries,
    counts: tally(entries),
  };
}

// ---------------------------------------------------------------- PatchPilot native

function parseNative(data: unknown): ParsedReport {
  const items = Array.isArray(data) ? data : isObj(data) && Array.isArray(data.findings) ? data.findings : [];
  const entries: ParsedEntry[] = items.map((item, i): ParsedEntry => {
    const location = `findings[${i}]`;
    if (!isObj(item)) {
      return { index: i, location, label: 'Malformed entry', severity: null, status: 'invalid', reason: 'Item is not a JSON object.', warnings: [] };
    }
    const title = str(item.title);
    const description = str(item.description);
    const rawSeverity = str(item.severity);
    const severity = normalizeSeverity(rawSeverity);
    const label = title ?? 'Untitled finding';
    const missing = [!title && 'title', !description && 'description', !rawSeverity && 'severity'].filter(Boolean);
    if (missing.length) {
      return { index: i, location, label, severity: rawSeverity, status: 'invalid', reason: `Missing required field(s): ${missing.join(', ')}.`, warnings: [] };
    }
    if (!severity) {
      return { index: i, location, label, severity: rawSeverity, status: 'invalid', reason: `Invalid severity "${rawSeverity}". Allowed: Critical, High, Medium, Low, Informational.`, warnings: [] };
    }
    const warnings: string[] = [];
    return {
      index: i,
      location,
      label,
      severity,
      status: 'valid',
      warnings,
      payload: finalize({ ...item, title: title as string, description: description as string, severity, source: str(item.source) ?? 'json_import' }, warnings),
    };
  });
  return { format: 'patchpilot', formatLabel: FORMAT_LABELS.patchpilot, subject: null, entries, counts: tally(entries) };
}

// ---------------------------------------------------------------- entry point

export function parseReportText(text: string): ParseOutcome {
  if (!text.trim()) return { ok: false, error: 'The file is empty.' };
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { ok: false, error: `The file is not valid JSON: ${detail}` };
  }
  const format = detectFormat(data);
  if (!format) {
    return {
      ok: false,
      error:
        'Unrecognised report format. Supported formats: Trivy JSON (`trivy … --format json`), OWASP ZAP JSON report, or a PatchPilot findings array / { "findings": [...] } object.',
    };
  }
  const report = format === 'trivy' ? parseTrivy(data as Json) : format === 'owasp-zap' ? parseZap(data as Json) : parseNative(data);
  if (report.entries.length === 0) {
    return { ok: false, error: `${report.formatLabel} detected, but the report contains no findings to import.` };
  }
  return { ok: true, report };
}
