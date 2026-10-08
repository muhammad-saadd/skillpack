// Structural validation for orangebox (no model calls). usage: node check.mjs
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const FLOW = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SKILLS = resolve(FLOW, '..');
const AGENTS = resolve(SKILLS, '..', 'agents');
let fails = 0;
const ok = (c, msg) => { console.log(`${c ? 'PASS' : 'FAIL'}  ${msg}`); if (!c) fails++; };

const SKILL_KEYS = new Set(['name', 'description', 'when_to_use', 'argument-hint', 'arguments', 'disable-model-invocation', 'user-invocable', 'allowed-tools', 'disallowed-tools', 'model', 'effort', 'context', 'agent', 'background', 'hooks', 'paths', 'shell', 'metadata', 'license', 'compatibility']);
const AGENT_KEYS = new Set(['name', 'description', 'tools', 'disallowedTools', 'model', 'permissionMode', 'maxTurns', 'skills', 'mcpServers', 'hooks', 'memory', 'background', 'effort', 'isolation', 'color', 'omitClaudeMd', 'initialPrompt', 'experimental']);
const TOOLS = new Set(['Read', 'Write', 'Edit', 'Glob', 'Grep', 'Bash', 'PowerShell', 'Agent', 'WebFetch', 'WebSearch', 'NotebookEdit', 'Skill', 'ToolSearch']);

function front(path) {
  const t = readFileSync(path, 'utf8'); const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return null;
  const fm = {}; for (const line of m[1].split(/\r?\n/)) { const k = line.match(/^([A-Za-z][\w-]*):\s?(.*)$/); if (k) fm[k[1]] = k[2].replace(/^"(.*)"$/, '$1'); }
  return { fm, body: m[2] };
}

const skills = ['orangebox', 'grill', 'architect', 'lead', 'engineer', 'qa', 'final-review'];
for (const s of skills) {
  const p = join(SKILLS, s, 'SKILL.md'); const f = existsSync(p) && front(p);
  ok(!!f, `${s}: SKILL.md exists with frontmatter`); if (!f) continue;
  ok(f.fm.name === s, `${s}: name matches directory`);
  ok(f.fm.description && f.fm.description.length <= 1536, `${s}: description present, ≤1536 chars`);
  const unknown = Object.keys(f.fm).filter(k => !SKILL_KEYS.has(k)); ok(!unknown.length, `${s}: only documented keys ${unknown.length ? '(unknown: ' + unknown + ')' : ''}`);
  ok(!f.fm['disable-model-invocation'] && /\bUse when\b/.test(f.fm.description) && !/Use only when/.test(f.fm.description), `${s}: auto-detectable (has a "Use when" trigger)`);
  if (f.fm.context) { ok(f.fm.context === 'fork' && !!f.fm.agent, `${s}: context fork has agent`); ok(existsSync(join(AGENTS, f.fm.agent + '.md')), `${s}: agent ${f.fm.agent} defined`); }
  for (const [, rel] of f.body.matchAll(/\$\{CLAUDE_SKILL_DIR\}\/([^\s`)"']+)/g)) {
    const clean = rel.replace(/[.,:;]+$/, ''); ok(existsSync(join(SKILLS, s, clean)), `${s}: referenced path ${clean} exists`);
  }
  ok(f.body.split('\n').length < 500, `${s}: body < 500 lines (${f.body.split('\n').length})`);
}
const agents = ['eng-architect', 'eng-lead', 'eng-engineer', 'eng-qa', 'eng-final-reviewer'];
for (const a of agents) {
  const p = join(AGENTS, a + '.md'); const f = existsSync(p) && front(p);
  ok(!!f, `${a}: agent file exists`); if (!f) continue;
  ok(f.fm.name === a, `${a}: name matches file`);
  const unknown = Object.keys(f.fm).filter(k => !AGENT_KEYS.has(k)); ok(!unknown.length, `${a}: only documented keys ${unknown.length ? '(unknown: ' + unknown + ')' : ''}`);
  const tools = (f.fm.tools || f.fm.disallowedTools || '').split(',').map(x => x.trim()).filter(Boolean);
  ok(tools.every(t => TOOLS.has(t)), `${a}: tool names valid (${tools.join(' ')})`);
  ok(!tools.includes('Agent') || !!f.fm.disallowedTools, `${a}: cannot spawn subagents`);
  ok(['sonnet', 'opus', 'haiku', 'inherit'].includes(f.fm.model), `${a}: model alias ${f.fm.model}`);
}
for (const a of ['eng-qa', 'eng-final-reviewer']) {
  const f = front(join(AGENTS, a + '.md')); ok(!/Write|Edit/.test(f.fm.tools), `${a}: no Write/Edit tools (read-only reviewer)`);
}

// hook guard behaviour
const guard = join(FLOW, 'hooks', 'guard-paths.mjs');
// 'deny' | 'allow' | 'bad-exit'. Must deny via JSON with exit 0; the hook shell may rewrite non-zero exit codes.
const runGuard = (mode, input) => {
  const r = spawnSync(process.execPath, [guard, mode], { input: JSON.stringify({ tool_input: input }), encoding: 'utf8' });
  if (r.status !== 0) return 'bad-exit';
  try { return JSON.parse(r.stdout).hookSpecificOutput.permissionDecision === 'deny' ? 'deny' : 'allow'; } catch { return 'allow'; }
};
ok(runGuard('write', { file_path: 'C:\\repo\\.claude\\eng-runs\\r1\\prd.md' }) === 'allow', 'guard: allows artifact write');
ok(runGuard('write', { file_path: 'C:\\repo\\src\\app.js' }) === 'deny', 'guard: denies source write (JSON, exit 0)');
ok(runGuard('no-qa-read', { file_path: '/r/.claude/eng-runs/r1/reviews/qa-abc1234.md' }) === 'deny', 'guard: denies QA review read');
ok(runGuard('no-qa-read', { pattern: '**/reviews/qa-*' }) === 'deny', 'guard: denies QA glob');
ok(runGuard('no-qa-read', { file_path: '/r/.claude/eng-runs/r1/prompt.md' }) === 'allow', 'guard: allows prompt read');
for (const a of ['eng-lead', 'eng-qa', 'eng-final-reviewer']) {
  const t = front(join(AGENTS, a + '.md')).fm.tools; ok(/Bash/.test(t) && /PowerShell/.test(t), `${a}: declares both Bash and PowerShell (Windows hosts may expose only one)`);
}

// templates
for (const t of ['state', 'brief', 'prd', 'tasks', 'handoff', 'review-qa', 'review-final']) ok(existsSync(join(FLOW, 'templates', t + '.md')), `template ${t}.md`);


// diagram page: template placeholders, architect fill, self-rebuild on Save, escaping
const ART = join(SKILLS, 'architect', 'artifact');
const tpl = readFileSync(join(ART, 'template.html'), 'utf8');
const spec = readFileSync(join(ART, 'spec.md'), 'utf8').replace(/\r/g, '');
const count = (s, x) => s.split(x).length - 1;
ok(count(tpl, '%% TITLE') === 2 && ['SOURCE', 'FLOW', 'STATE', 'CLASS', 'NOTES'].every(k => count(tpl, '%% ' + k) === 1), 'diagram: template has every placeholder once (TITLE twice)');
const unesc = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// minimal DOM stub: enough for the page script's parse step (main() returns its state outside a browser)
const stub = html => {
  const els = {};
  const byId = id => els[id] || (els[id] = { className: '', textContent: unesc((html.match(new RegExp('id="' + id + '">([\\s\\S]*?)</(?:pre|span|style)>')) || [])[1] || '') });
  return { els, getElementById: byId, querySelector: q => q === 'main' ? { dataset: { rev: html.match(/<main data-rev="(\d+)"/)[1] } } : { textContent: unesc(html.match(/<h1>([\s\S]*?)<\/h1>/)[1]) } };
};
const load = html => {
  const logic = html.match(/<script id="dg-logic">([\s\S]*?)<\/script>/)[1];
  const doc = stub(html);
  const { build, main } = new Function('document', logic.replace(/\nmain\(\);$/, '') + '\nreturn { build, main };')(doc);
  return { build, state: main(), doc };
};
let L = null;
try { L = load(tpl); ok(true, 'diagram: page script parses'); } catch (e) { ok(false, 'diagram: page script parses: ' + e.message); }
if (L) {
  ok(L.build(L.state) === tpl, 'diagram: template rebuilds itself byte-identically');
  const flow = spec.match(/```text\n([\s\S]*?)\n```/)[1];
  const fill = {
    TITLE: 'Checkout Gateway Retry', SOURCE: 'brief v1', FLOW: flow,
    STATE: 'stateDiagram-v2\n[*] --> created\ncreated --> paid : charge ok\ncreated --> pending : final timeout (new, R-2)\ncreated --> dropped : non-timeout error\npaid --> [*]',
    CLASS: 'classDiagram\nclass Checkout { +checkout(id, items) (changed) }\nclass Gateway { +charge(amount, orderId, idemKey) (changed) }\nCheckout ..> Gateway : uses',
    NOTES: 'assume: only ETIMEDOUT is retried\nQ-1: does the gateway accept an idempotency key?',
  };
  let page = tpl; for (const [k, v] of Object.entries(fill)) page = page.split('%% ' + k).join(v);
  const P = load(page);
  ok(P.state.title === fill.TITLE && P.state.source === fill.SOURCE && P.state.rev === 1 && P.state.flow === fill.FLOW && P.state.state === fill.STATE && P.state.class === fill.CLASS && P.state.notes === fill.NOTES, 'diagram: architect-filled page parses back to the same texts');
  const saved = P.build({ ...P.state, rev: 2 });
  const S = load(saved);
  ok(S.state.rev === 2 && S.state.flow === fill.FLOW && S.build(S.state) === saved, 'diagram: saved page round-trips and rebuilds byte-identically');
  ok(page.length < 10000, `diagram: filled page is small (${page.length} bytes)`);
  const evil = P.build({ ...P.state, flow: 'flowchart LR\na["</textarea></script><img src=x onerror=alert(1)> & b"]' });
  ok(count(evil, '</script>') === 1 && !/<img/.test(evil) && !/<\/textarea>/.test(evil), 'diagram: saved text containing </script> or tags cannot break out');
  // Save path in a fake browser whose head has an extension-injected <style> before the platform reset.
  const RESET = ':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px)}body{margin:0}';
  const d = stub(page), made = []; let onSave = null, published = null;
  const el = id => Object.assign(d.getElementById(id), { addEventListener: (_, f) => { onSave = f; }, appendChild() {} });
  const bdoc = { ...d, getElementById: el, createElement: () => { const e = { appendChild() {} }; made.push(e); return e; },
    head: { querySelectorAll: () => [{ textContent: '.ad-box{display:none!important}' }, { textContent: RESET }] } };
  const bwin = { claude: { use: () => Promise.resolve({ publish: async h => { published = h; } }) } };
  const logic = page.match(/<script id="dg-logic">([\s\S]*?)<\/script>/)[1];
  new Function('document', 'window', logic)(bdoc, bwin);
  await new Promise(r => setTimeout(r, 0));
  const box = made.find(e => e.value === fill.STATE); if (box) box.value += '\npending --> paid : late webhook';
  if (onSave) await onSave();
  const head = published && published.match(/^<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>([\s\S]*?)<\/style><\/head><body>/);
  ok(!!head && head[1] === RESET && !/ad-box/.test(published), 'diagram: Save publishes the exact skeleton with the platform reset, not an injected head style');
  ok(!!published && load(published.replace(/^[\s\S]*?<body>|<\/body><\/html>$/g, '')).state.rev === 2 && /late webhook/.test(published), 'diagram: Save bumps rev and keeps the edit');
  const N = load(P.build({ ...P.state, class: 'n/a: no classes in a functional module' }));
  ok(N.doc.els['d-class'].className === 'na' && N.doc.els['d-flow'].className === '', 'diagram: n/a block is not handed to Mermaid');
}
console.log(fails ? `\n${fails} check(s) failed` : '\nall structural checks passed');
process.exit(fails ? 1 : 0);
