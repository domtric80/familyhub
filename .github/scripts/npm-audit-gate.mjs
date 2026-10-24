import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// No exceptions: every finding blocks, regardless of npm's configured audit level.
// Invalid or incomplete reports also fail closed.
export function inspectAudit(report) {
  if (report?.auditReportVersion !== 2 || report.error
      || !report.vulnerabilities || typeof report.vulnerabilities !== 'object'
      || Array.isArray(report.vulnerabilities)
      || !report.metadata?.vulnerabilities) {
    throw new Error('Missing or invalid npm audit report; refusing to pass.');
  }
  const findings = Object.entries(report.vulnerabilities);
  const counts = { info: 0, low: 0, moderate: 0, high: 0, critical: 0 };
  for (const [, finding] of findings) {
    if (!finding || !Object.hasOwn(counts, finding.severity)) {
      throw new Error('Invalid finding severity; refusing to pass.');
    }
    counts[finding.severity]++;
  }
  if (report.metadata.vulnerabilities.total !== findings.length
      || Object.entries(counts).some(([severity, count]) => report.metadata.vulnerabilities[severity] !== count)) {
    throw new Error('Inconsistent npm audit totals; refusing to pass.');
  }
  return { blocked: findings.map(([name]) => name) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (result.error || ![0, 1].includes(result.status)) {
      throw new Error(`npm audit did not complete successfully: ${result.error?.message ?? result.stderr}`);
    }
    const report = JSON.parse(result.stdout);
    console.log(JSON.stringify(report, null, 2));
    const { blocked } = inspectAudit(report);
    if (blocked.length) {
      throw new Error(`Vulnerabilities must be remediated: ${blocked.join(', ')}`);
    }
    if (result.status !== 0) {
      throw new Error('npm audit failed without a usable vulnerability finding; refusing to pass.');
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
