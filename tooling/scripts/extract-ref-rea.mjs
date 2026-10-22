#!/usr/bin/env node
/**
 * REA browser-tool extraction of the reference site.
 * Complements agent-browser with REA's own inspect_web_page + capture_web_screenshot.
 */
import { spawn } from 'node:child_process';

const child = spawn('node', ['/home/z/my-project/rea-agent/scripts/rea.mjs', 'mcp'], { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
let nextId = 1;

child.stderr.on('data', () => {});
function send(msg, timeoutMs = 180000) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const timer = setTimeout(() => reject(new Error(`timeout id=${id}`)), timeoutMs);
    const onData = (chunk) => {
      buf += chunk.toString();
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) { clearTimeout(timer); child.stdout.off('data', onData); resolve(parsed); return; }
        } catch {}
      }
    };
    child.stdout.on('data', onData);
    child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, ...msg }) + '\n');
  });
}

const text = (r) => (r.result?.content ?? []).map((c) => c.text ?? '').join('');

await send({ method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'ref-extract', version: '1.0.0' } } });
child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

// 1. structural inspection (attach to running Chrome via CDP)
const CDP = process.env.REA_CDP ?? 'http://127.0.0.1:46049';
const TARGET = process.argv[2] ?? '';
const page = await send({
  method: 'tools/call',
  params: { name: 'inspect_web_page', arguments: { cdp_endpoint: CDP, target_id: TARGET, observation_ms: 4000, include_accessibility_text: true } },
});
const fs = await import('node:fs');
fs.writeFileSync('/home/z/my-project/tool-results/ref-site/rea-inspect.json', text(page));
console.log('inspect_web_page bytes:', text(page).length);
try {
  const j = JSON.parse(text(page));
  console.log('title:', j.subject?.title ?? j.title ?? '(see json)');
  console.log('keys:', Object.keys(j).join(','));
} catch { console.log(text(page).slice(0, 400)); }

// 2. screenshot via REA
const shot = await send({
  method: 'tools/call',
  params: { name: 'capture_web_screenshot', arguments: { cdp_endpoint: CDP, target_id: TARGET } },
});
fs.writeFileSync('/home/z/my-project/tool-results/ref-site/rea-screenshot.json', text(shot));
console.log('capture_web_screenshot bytes:', text(shot).length);
console.log(text(shot).slice(0, 500));

child.kill('SIGTERM');
setTimeout(() => process.exit(0), 200);
