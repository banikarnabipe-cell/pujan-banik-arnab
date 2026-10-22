#!/usr/bin/env node
/**
 * MCP E2E verification for the REA server registered in /home/z/my-project/.mcp.json
 * Spawns the server over stdio, performs the initialize handshake,
 * lists tools, and calls a real tool to prove the server works.
 *
 * Usage: node /home/z/my-project/scripts/verify-rea-mcp.mjs
 */
import { spawn } from 'node:child_process';

const SERVER_CMD = process.argv[2] ?? 'node';
const SERVER_ARGS = (process.argv[3] ?? '/home/z/my-project/rea-agent/scripts/rea.mjs mcp').split(' ');

const child = spawn(SERVER_CMD, SERVER_ARGS, { stdio: ['pipe', 'pipe', 'pipe'] });
let buf = '';
let nextId = 1;
let failures = 0;

child.stderr.on('data', (d) => {
  const s = d.toString();
  if (/error|fatal/i.test(s) && !/ExperimentalWarning|trace/i.test(s)) {
    console.error('[server:stderr]', s.trim().slice(0, 300));
  }
});

function send(msg) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, ...msg });
    const timer = setTimeout(() => reject(new Error(`timeout waiting for id=${id}`)), 60000);
    const onData = (chunk) => {
      buf += chunk.toString();
      let idx;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 1);
        if (!line) continue;
        try {
          const parsed = JSON.parse(line);
          if (parsed.id === id) {
            clearTimeout(timer);
            child.stdout.off('data', onData);
            resolve(parsed);
            return;
          }
        } catch { /* partial line */ }
      }
    };
    child.stdout.on('data', onData);
    child.stdin.write(payload + '\n');
  });
}

function check(name, cond, detail = '') {
  const ok = Boolean(cond);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

try {
  // 1. initialize handshake
  const init = await send({
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'rea-setup-verifier', version: '1.0.0' },
    },
  });
  const info = init.result?.serverInfo;
  check('initialize handshake', Boolean(init.result?.capabilities), JSON.stringify(info));
  check('server name is rea', /rea/i.test(info?.name ?? ''), `name=${info?.name}`);

  // 2. notifications/initialized
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  // 3. tools/list
  const tools = await send({ method: 'tools/list', params: {} });
  const toolNames = (tools.result?.tools ?? []).map((t) => t.name);
  check('tools/list returns tools', toolNames.length > 0, `${toolNames.length} tools`);
  check('tool count matches catalog (213)', toolNames.length === 213);
  const expected = ['analyze_javascript_application', 'inspect_model_artifact', 'inspect_web_page'];
  for (const name of expected) {
    check(`expected tool present: ${name}`, toolNames.includes(name));
  }

  // 4. real tool call: static JS analysis on a local fixture (built-in, no external engine)
  const fixture = '/home/z/my-project/agent-context/rea/fixtures/sample-app';
  const analysis = await send({
    method: 'tools/call',
    params: {
      name: 'analyze_javascript_application',
      arguments: { input_path: fixture, format: 'directory', detail: 'summary' },
    },
  });
  const text = (analysis.result?.content ?? []).map((c) => c.text ?? '').join('');
  check('analyze_javascript_application succeeds', !analysis.result?.isError && text.length > 0, `bytes=${text.length}`);
  check('analysis returns evidence identity', /"evidence_id":"ev_[0-9a-f]{16,}/.test(text));
  check('analysis covers fixture subject sample-app', /sample-app/.test(text) && /"coverage"/.test(text));
} catch (err) {
  failures++;
  console.error('FAIL  unexpected error —', err.message);
} finally {
  child.kill('SIGTERM');
  setTimeout(() => process.exit(failures ? 1 : 0), 300);
}
