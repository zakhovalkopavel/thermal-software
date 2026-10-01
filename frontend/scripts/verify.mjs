#!/usr/bin/env node
// Full quality gate. Runs each stage in order, stops at the first failure, prints a summary.
// Usage: node scripts/verify.mjs [--offline]
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const OFFLINE = process.argv.includes('--offline');
const FAILURE_TAIL_LINES = 80;
const DUPLICATION_REPORT = 'test-results/jscpd/jscpd-report.json';
const BUILD_OUT_DIR = '/tmp/build-check';
const CHUNK_LIMIT_KB = 500;

// eslint-disable-next-line no-control-regex
const stripAnsi = (text) => text.replace(/\u001b\[[0-9;]*m/g, '');

function run(command) {
  const started = Date.now();
  const result = spawnSync('sh', ['-c', command], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = stripAnsi(`${result.stdout ?? ''}${result.stderr ?? ''}`);
  return { ok: result.status === 0, output, seconds: (Date.now() - started) / 1000 };
}

function vitestCounts(output) {
  const line = output.split('\n').find((text) => /^\s*Tests\s+/.test(text));
  return line ? line.replace(/^\s*Tests\s+/, '').trim() : '';
}

function largestChunk(output) {
  const sizes = [...output.matchAll(/([\w./-]+\.js)\s+([\d.,]+)\s*kB/g)].map((match) => ({
    file: match[1],
    kb: Number(match[2].replace(',', '')),
  }));
  if (sizes.length === 0) return { details: '', warn: false };
  const max = sizes.reduce((a, b) => (b.kb > a.kb ? b : a));
  return { details: `largest chunk ${Math.round(max.kb)} kB (${max.file.split('/').pop()})`, warn: max.kb > CHUNK_LIMIT_KB };
}

function duplicationDetails() {
  if (!existsSync(DUPLICATION_REPORT)) return 'no report';
  const total = JSON.parse(readFileSync(DUPLICATION_REPORT, 'utf8')).statistics.total;
  return `${total.percentage.toFixed(2)} % duplicated lines, ${total.clones} clones`;
}

const STAGES = [
  { name: 'typecheck', command: 'npm run -s typecheck', rerun: 'npm run typecheck' },
  { name: 'lint', command: 'npm run -s lint', rerun: 'npm run lint' },
  { name: 'test', command: 'npm run -s test', rerun: 'npm test', details: vitestCounts },
  {
    name: 'build',
    command: `npx vite build --outDir ${BUILD_OUT_DIR} --emptyOutDir`,
    rerun: `npx vite build --outDir ${BUILD_OUT_DIR}`,
    details: (output) => largestChunk(output).details,
    warn: (output) => largestChunk(output).warn,
  },
  { name: 'duplication', command: 'npm run -s duplication', rerun: 'npm run duplication', info: true, details: duplicationDetails },
  {
    name: 'contract',
    command: 'npm run -s test:contract',
    rerun: 'npm run test:contract',
    skip: OFFLINE,
    details: (output) => vitestCounts(output) || 'no contract tests yet',
  },
];

const rows = [];
let failed = null;

for (const stage of STAGES) {
  if (failed) {
    rows.push({ name: stage.name, result: 'NOT RUN', seconds: 0, details: '' });
    continue;
  }
  if (stage.skip) {
    rows.push({ name: stage.name, result: 'SKIPPED', seconds: 0, details: '--offline' });
    continue;
  }
  process.stdout.write(`… ${stage.name}\n`);
  const { ok, output, seconds } = run(stage.command);
  const details = stage.details ? stage.details(output) : '';
  const result = stage.info ? 'INFO' : !ok ? 'FAIL' : stage.warn?.(output) ? 'WARN' : 'PASS';
  rows.push({ name: stage.name, result, seconds, details });
  if (result === 'FAIL') failed = { stage, output };
}

const pad = (text, width) => String(text).padEnd(width);
console.log(`\n${pad('STAGE', 12)}${pad('RESULT', 9)}${pad('TIME', 9)}DETAILS`);
for (const row of rows) {
  console.log(`${pad(row.name, 12)}${pad(row.result, 9)}${pad(row.seconds ? `${row.seconds.toFixed(1)}s` : '', 9)}${row.details}`);
}

if (failed) {
  const tail = failed.output.trimEnd().split('\n').slice(-FAILURE_TAIL_LINES).join('\n');
  console.log(`\nFAILED: ${failed.stage.name}\n${tail}\n\nRerun only this stage: ${failed.stage.rerun}`);
  process.exit(1);
}

console.log(OFFLINE ? '\nOK (offline: contract stage skipped)' : '\nOK');
