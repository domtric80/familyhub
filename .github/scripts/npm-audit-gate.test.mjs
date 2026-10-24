import assert from 'node:assert/strict';
import test from 'node:test';
import { inspectAudit } from './npm-audit-gate.mjs';

// Historical report used to ensure the removed CLI exception cannot return.
function fixture() {
  const fixAvailable = { name: 'mammoth', version: '0.3.29', isSemVerMajor: true };
  return {
    auditReportVersion: 2,
    vulnerabilities: {
      'sprintf-js': {
        name: 'sprintf-js', severity: 'moderate', isDirect: false,
        via: [{ name: 'sprintf-js', dependency: 'sprintf-js', severity: 'moderate', range: '<=1.1.3', url: 'https://github.com/advisories/GHSA-hp3w-g68c-fv3c' }],
        effects: ['argparse'], range: '*', nodes: ['node_modules/sprintf-js'], fixAvailable,
      },
      argparse: { name: 'argparse', severity: 'moderate', isDirect: false, via: ['sprintf-js'], effects: ['mammoth'], range: '1.0.0 - 1.0.10', nodes: ['node_modules/argparse'], fixAvailable },
      mammoth: { name: 'mammoth', severity: 'moderate', isDirect: true, via: ['argparse'], effects: [], range: '>=0.3.30', nodes: ['node_modules/mammoth'], fixAvailable },
    },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 3, high: 0, critical: 0, total: 3 } },
  };
}

test('the historical CLI chain has no exception if it appears in a report', () => {
  assert.deepEqual(inspectAudit(fixture()), { blocked: ['sprintf-js', 'argparse', 'mammoth'] });
});
test('clean report passes without an exception', () => {
  const report = fixture();
  report.vulnerabilities = {};
  report.metadata.vulnerabilities = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
  assert.deepEqual(inspectAudit(report), { blocked: [] });
});
for (const severity of ['info', 'low', 'moderate', 'high', 'critical']) {
  test(`every ${severity} advisory blocks`, () => {
    const report = fixture();
    report.vulnerabilities.other = { name: 'other', severity, via: [] };
    report.metadata.vulnerabilities[severity]++;
    report.metadata.vulnerabilities.total++;
    assert.deepEqual(inspectAudit(report).blocked, ['sprintf-js', 'argparse', 'mammoth', 'other']);
  });
}
test('a second upstream advisory blocks the entire affected chain', () => {
  const report = fixture();
  report.vulnerabilities['sprintf-js'].via.push({ url: 'https://github.com/advisories/NEW' });
  assert.equal(inspectAudit(report).blocked.length, 3);
});
test('a changed dependency route is not excepted', () => {
  const report = fixture();
  report.vulnerabilities.mammoth.via.push('other');
  assert.deepEqual(inspectAudit(report).blocked, ['sprintf-js', 'argparse', 'mammoth']);
});
test('a changed severity is not excepted', () => {
  const report = fixture();
  report.vulnerabilities.mammoth.severity = 'high';
  report.metadata.vulnerabilities.moderate--;
  report.metadata.vulnerabilities.high++;
  assert.deepEqual(inspectAudit(report).blocked, ['sprintf-js', 'argparse', 'mammoth']);
});
test('a changed fix or installation path requires review', () => {
  const report = fixture();
  report.vulnerabilities.mammoth.fixAvailable = true;
  report.vulnerabilities.argparse.nodes.push('node_modules/another/argparse');
  assert.deepEqual(inspectAudit(report).blocked, ['sprintf-js', 'argparse', 'mammoth']);
});
test('an unknown severity fails closed', () => {
  const report = fixture();
  report.vulnerabilities.mammoth.severity = 'unknown';
  assert.throws(() => inspectAudit(report));
});
test('network errors, malformed reports and inconsistent totals fail closed', () => {
  assert.throws(() => inspectAudit({ error: { code: 'ENETUNREACH' } }));
  assert.throws(() => inspectAudit({}));
  const report = fixture();
  report.metadata.vulnerabilities.total = 0;
  assert.throws(() => inspectAudit(report));
});
