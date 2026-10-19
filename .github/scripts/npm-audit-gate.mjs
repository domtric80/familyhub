import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const exceptionExpires = '2026-11-18T00:00:00Z';
const advisory = 'https://github.com/advisories/GHSA-hp3w-g68c-fv3c';
const routes = {
  'sprintf-js': { via: null, effects: ['argparse'], range: '*' },
  argparse: { via: 'sprintf-js', effects: ['mammoth'], range: '1.0.0 - 1.0.10' },
  mammoth: { via: 'argparse', effects: [], range: '>=0.3.30' },
};
const same = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);

// Temporary, explicit review exception for Mammoth's CLI-only dependency path.
// All other findings, even Low, continue to block. No advisory is hidden.
export function inspectAudit(report, now = new Date()) {
  if (report?.auditReportVersion !== 2 || report.error
      || !report.vulnerabilities || Array.isArray(report.vulnerabilities)
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
  const allowed = [];
  const blocked = [];
  for (const [name, finding] of findings) {
    const route = routes[name];
    const leaf = report.vulnerabilities['sprintf-js'];
    const knownLeaf = leaf?.via?.length === 1
      && leaf.via[0]?.url === advisory
      && leaf.via[0]?.name === 'sprintf-js'
      && leaf.via[0]?.dependency === 'sprintf-js'
      && leaf.via[0]?.severity === 'moderate'
      && leaf.via[0]?.range === '<=1.1.3';
    const known = route && now < new Date(exceptionExpires) && knownLeaf
      && finding.name === name && finding.severity === 'moderate'
      && finding.isDirect === (name === 'mammoth')
      && finding.range === route.range
      && same(finding.nodes, [`node_modules/${name}`])
      && same(finding.effects, route.effects)
      && (route.via === null || (same(finding.via, [route.via]) && report.vulnerabilities[route.via]))
      // npm currently proposes only an incompatible Mammoth downgrade.
      // A changed fix or a second advisory requires a new human review.
      && same(finding.fixAvailable, { name: 'mammoth', version: '0.3.29', isSemVerMajor: true });
    (known ? allowed : blocked).push(name);
  }
  return { allowed, blocked };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = spawnSync('npm', ['audit', '--json'], { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    if (result.error || ![0, 1].includes(result.status)) {
      throw new Error(`npm audit did not complete successfully: ${result.error?.message ?? result.stderr}`);
    }
    const report = JSON.parse(result.stdout);
    console.log(JSON.stringify(report, null, 2));
    const { allowed, blocked } = inspectAudit(report);
    if (allowed.length) {
      console.log(`::warning::Known unpatched Mammoth CLI chain (${allowed.join(', ')}), ${advisory}. Exception expires ${exceptionExpires}; team risk review required.`);
    }
    if (blocked.length) {
      throw new Error(`Unexcepted or expired vulnerabilities: ${blocked.join(', ')}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
