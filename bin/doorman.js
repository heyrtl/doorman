#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { checkSite } from '../src/check.js';

const usage = 'Usage: doorman check <url> [--expect <markdown text>] [--expect-html <html text>] [--json]';

try {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      expect: { type: 'string' },
      'expect-html': { type: 'string' },
      json: { type: 'boolean' },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (values.help) {
    console.log(usage);
  } else {
    const [command, url] = positionals;
    if (command !== 'check' || !url || positionals.length !== 2 || values.expect === '' || values['expect-html'] === '') {
      throw new Error(usage);
    }
    const report = await checkSite(url, { expect: values.expect, expectHtml: values['expect-html'] });
    if (values.json) {
      console.log(JSON.stringify(report, null, 2));
    } else {
      console.log(report.url);
      for (const check of report.checks) {
        const response = check.status === undefined ? '' : ` · ${check.status} · ${check.contentType ?? 'missing Content-Type'}`;
        console.log(`${check.errors.length ? 'FAIL' : 'PASS'} ${check.format}${response}`);
        for (const error of check.errors) console.log(`  ${error}`);
      }
    }
    process.exitCode = report.ok ? 0 : 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 2;
}
