#!/usr/bin/env node
/**
 * Native decompilation E2E: open an ELF binary via the REA MCP server,
 * locate the `transform` function, and retrieve Ghidra pseudocode.
 * Proves the full native analysis pipeline (MCP -> REA -> Ghidra -> JDK).
 */
import { spawn } from 'node:child_process';

const child = spawn('node', ['/home/z/my-project/rea-agent/scripts/rea.mjs', 'mcp'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: {
    ...process.env,
    GHIDRA_INSTALL_DIR: '/home/z/my-project/agent-context/tools/ghidra_12.1.4_PUBLIC',
    JAVA_HOME: '/home/z/my-project/agent-context/tools/jdk-21.0.12.1+1',
  },
});
let buf = '';
let nextId = 1;
let failures = 0;

child.stderr.on('data', (d) => {
  const s = d.toString().trim();
  if (s) console.error('[stderr]', s.slice(0, 200));
});

function send(msg, timeoutMs = 300000) {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    const payload = JSON.stringify({ jsonrpc: '2.0', id, ...msg });
    const timer = setTimeout(() => reject(new Error(`timeout waiting for id=${id} (${msg.method})`)), timeoutMs);
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
        } catch { /* partial */ }
      }
    };
    child.stdout.on('data', onData);
    child.stdin.write(payload + '\n');
  });
}

function check(name, cond, detail = '') {
  const ok = Boolean(cond);
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 160) : ''}`);
}

try {
  const init = await send({
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'rea-native-verifier', version: '1.0.0' },
    },
  });
  check('initialize', Boolean(init.result?.capabilities));
  child.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n');

  const binary = '/home/z/my-project/agent-context/rea/fixtures/native/secret-bin';
  const open = await send({
    method: 'tools/call',
    params: { name: 'open_binary', arguments: { path: binary } },
  }, 420000);
  const openText = (open.result?.content ?? []).map((c) => c.text ?? '').join('');
  check('open_binary (Ghidra import + analysis)', !open.result?.isError, openText.slice(0, 120));
  const docId = JSON.parse(openText)?.document?.id ?? JSON.parse(openText)?.document_id ?? null;
  console.log('   open result keys:', Object.keys(JSON.parse(openText)).join(','));

  // locate transform function
  const search = await send({
    method: 'tools/call',
    params: { name: 'search_procedures', arguments: { pattern: 'transform' } },
  }, 120000);
  const searchText = (search.result?.content ?? []).map((c) => c.text ?? '').join('');
  check('search_procedures finds transform', !search.result?.isError && /transform/i.test(searchText));
  const searchJson = (() => { try { return JSON.parse(searchText); } catch { return {}; } })();
  const procedures = searchJson.procedures ?? searchJson.results ?? searchJson.matches ?? [];
  const proc = Array.isArray(procedures) ? procedures.find((p) => (p.name ?? '').includes('transform')) : null;
  console.log('   procedures found:', Array.isArray(procedures) ? procedures.map((p) => p.name).join(', ') : 'n/a');

  // decompile
  const pseudo = await send({
    method: 'tools/call',
    params: {
      name: 'procedure_pseudo_code',
      arguments: proc
        ? { procedure: proc.name ?? 'transform', ...(proc.address ? {} : {}) }
        : { procedure: 'transform' },
    },
  }, 180000);
  const pseudoText = (pseudo.result?.content ?? []).map((c) => c.text ?? '').join('');
  check('procedure_pseudo_code returns C code', !pseudo.result?.isError && pseudoText.length > 100, `bytes=${pseudoText.length}`);
  check('pseudocode references hash constants (FNV-1a)', /16777619|2166136261|0x01000193|0x811c9dc5/i.test(pseudoText));

  const close = await send({
    method: 'tools/call',
    params: { name: 'close_binary', arguments: {} },
  }, 60000);
  check('close_binary', !close.result?.isError);
} catch (err) {
  failures++;
  console.error('FAIL  unexpected error —', err.message);
} finally {
  child.kill('SIGTERM');
  setTimeout(() => process.exit(failures ? 1 : 0), 300);
}
