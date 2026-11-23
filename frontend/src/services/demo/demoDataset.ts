import type { FindingDetailResponse } from '@/types';

/**
 * SAMPLE DATA — for the optional, clearly-labelled demo mode only.
 *
 * - Every record has `source: "demo-dataset"`; none of these are scanner results.
 * - Where a real CVE is referenced, the package, affected and fixed versions
 *   match the public advisory for that CVE. Application-level findings have no
 *   CVE (cve_id = null) rather than a made-up identifier.
 * - Risk scores use the same deterministic formula as the backend
 *   (severity base + 2 if CVE + 1 if a fix exists).
 */

const BASE: Record<string, number> = { Critical: 95, High: 75, Medium: 50, Low: 25, Informational: 5 };
const score = (sev: string, cve: string | null, fix: string | null) =>
  Math.min(100, BASE[sev] + (cve ? 2 : 0) + (fix ? 1 : 0));

const DEMO_SOURCE = 'demo-dataset';

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

type Seed = Omit<FindingDetailResponse, 'risk_score' | 'source' | 'tasks_count' | 'is_verified_fixed'>;

const seeds: Seed[] = [
  {
    id: 1,
    title: 'Apache Log4j2 JNDI lookup remote code execution (Log4Shell)',
    description:
      'Apache Log4j2 versions 2.0-beta9 through 2.14.1 evaluate JNDI lookups in logged messages. An attacker who can control logged data can make the application load and execute code from an attacker-controlled LDAP server.',
    severity: 'Critical',
    cve_id: 'CVE-2021-44228',
    package_name: 'org.apache.logging.log4j:log4j-core',
    installed_version: '2.14.1',
    fixed_version: '2.15.0',
    file_path: 'services/billing/pom.xml',
    created_at: daysAgo(6),
    original_data: null,
    tasks: [
      {
        id: 101,
        finding_id: 1,
        title: 'Upgrade log4j-core in billing service',
        description:
          'Upgrade to the latest patched 2.x release (later advisories CVE-2021-45046 and CVE-2021-45105 affect 2.15.0 and 2.16.0) and rebuild the service image.',
        assignee: 'Platform team',
        status: 'In Progress',
        created_at: daysAgo(5),
        updated_at: daysAgo(4),
      },
    ],
    verifications: [],
  },
  {
    id: 2,
    title: 'runc file descriptor leak allows container escape',
    description:
      'runc versions up to and including 1.1.11 leak an internal file descriptor into the container process. A malicious image or a crafted working directory can use it to access the host filesystem.',
    severity: 'High',
    cve_id: 'CVE-2024-21626',
    package_name: 'runc',
    installed_version: '1.1.11',
    fixed_version: '1.1.12',
    file_path: 'infrastructure/ci-runner/Dockerfile',
    created_at: daysAgo(5),
    original_data: null,
    tasks: [
      {
        id: 102,
        finding_id: 2,
        title: 'Rebuild CI runner images with runc 1.1.12 or later',
        description: null,
        assignee: 'DevOps team',
        status: 'Open',
        created_at: daysAgo(4),
        updated_at: daysAgo(4),
      },
    ],
    verifications: [],
  },
  {
    id: 3,
    title: 'libwebp heap buffer overflow in lossless image decoding',
    description:
      'A heap buffer overflow in libwebp before 1.3.2 can be triggered by a crafted WebP image, potentially allowing out-of-bounds memory writes when untrusted images are decoded.',
    severity: 'High',
    cve_id: 'CVE-2023-4863',
    package_name: 'libwebp',
    installed_version: '1.3.1',
    fixed_version: '1.3.2',
    file_path: 'services/media/Dockerfile',
    created_at: daysAgo(4),
    original_data: null,
    tasks: [
      {
        id: 103,
        finding_id: 3,
        title: 'Update libwebp in the media service base image',
        description: 'Bump the base image and confirm libwebp >= 1.3.2 is installed.',
        assignee: 'Backend team',
        status: 'Completed',
        created_at: daysAgo(4),
        updated_at: daysAgo(2),
      },
    ],
    verifications: [
      {
        id: 201,
        finding_id: 3,
        task_id: 103,
        evidence_description:
          '(Sample evidence) Image rebuilt; package manifest shows libwebp 1.3.2 and a re-scan of the image no longer lists CVE-2023-4863.',
        evidence_url: null,
        verification_result: 'Verified Fixed',
        created_at: daysAgo(2, 15),
      },
    ],
  },
  {
    id: 4,
    title: 'SQL injection in product search endpoint',
    description:
      'The search handler builds a SQL query by concatenating the "q" query parameter into the WHERE clause. Crafted input can alter the query and read data from other tables (CWE-89).',
    severity: 'High',
    cve_id: null,
    package_name: null,
    installed_version: null,
    fixed_version: null,
    file_path: 'app/routers/search.py',
    created_at: daysAgo(3),
    original_data: null,
    tasks: [],
    verifications: [],
  },
  {
    id: 5,
    title: 'Password reset form lacks CSRF protection',
    description:
      'The POST /account/reset endpoint accepts requests without an anti-CSRF token and the session cookie has no SameSite attribute, enabling cross-site request forgery (CWE-352).',
    severity: 'Medium',
    cve_id: null,
    package_name: null,
    installed_version: null,
    fixed_version: null,
    file_path: 'app/routers/account.py',
    created_at: daysAgo(2),
    original_data: null,
    tasks: [
      {
        id: 104,
        finding_id: 5,
        title: 'Add CSRF token validation to account forms',
        description: null,
        assignee: null,
        status: 'Blocked',
        created_at: daysAgo(2),
        updated_at: daysAgo(1),
      },
    ],
    verifications: [],
  },
  {
    id: 6,
    title: 'Server version disclosed in HTTP response headers',
    description:
      'Responses include a "Server" header with the exact web server version, which helps attackers identify applicable exploits (CWE-200).',
    severity: 'Low',
    cve_id: null,
    package_name: null,
    installed_version: null,
    fixed_version: null,
    file_path: 'deploy/nginx.conf',
    created_at: daysAgo(1),
    original_data: null,
    tasks: [],
    verifications: [],
  },
];

export function buildDemoFindings(): FindingDetailResponse[] {
  return seeds.map((s) => ({
    ...structuredClone(s),
    source: DEMO_SOURCE,
    risk_score: score(s.severity, s.cve_id, s.fixed_version),
    tasks_count: s.tasks.length,
    is_verified_fixed: s.verifications.some((v) => v.verification_result === 'Verified Fixed'),
  }));
}
