// PreToolUse guard for orangebox agents.
//   node guard-paths.mjs write      -> Write/Edit/NotebookEdit only inside a .claude/eng-runs/ directory
//   node guard-paths.mjs no-qa-read -> block Read/Grep/Glob of reviews/qa-* (keeps the final reviewer blind to QA)
// Denies via JSON on stdout and exits 0. An exit-2 block is not used because the hook shell can rewrite exit
// codes: on Windows hooks may run through PowerShell, which turns node's exit 2 into 1, and 1 fails open.
let raw = '';
const deny = reason => {
  process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: reason } }));
  process.exit(0);
};
process.stdin.on('data', c => (raw += c));
process.stdin.on('end', () => {
  let input = {};
  try { input = JSON.parse(raw).tool_input || {}; } catch { process.exit(0); }
  const p = String(input.file_path || input.notebook_path || input.path || input.pattern || '').replace(/\\/g, '/');
  const mode = process.argv[2];
  if (mode === 'write' && p && !p.includes('/.claude/eng-runs/'))
    deny(`orangebox guard: this persona may only write inside <repo>/.claude/eng-runs/<run-id>/. Blocked: ${p}`);
  if (mode === 'no-qa-read' && /reviews\/qa-/.test(p))
    deny('orangebox guard: the final reviewer must not read QA reviews. Form your verdict independently.');
  process.exit(0);
});
