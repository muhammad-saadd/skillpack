# orangebox: usage (for humans; not loaded by the model)

## What's where
| path | role | loaded when |
|---|---|---|
| `~/.claude/skills/orangebox/SKILL.md` | coordinator | `/orangebox …` |
| `orangebox/reference/common.md` | shared rules (IDs, evidence, statuses, handoff) | each persona reads it once |
| `orangebox/reference/gates.md` | completion gate, invalidation, repair loop | coordinator, integrate/review only |
| `orangebox/templates/*` | state, brief, prd, tasks, handoff, review-qa, review-final | when writing that artifact |
| `orangebox/hooks/guard-paths.mjs` | PreToolUse guard: artifact-only writes; final reviewer can't read QA | agent hooks |
| `orangebox/validation/` | scenarios, fixture builder, structural check | manual |
| `~/.claude/skills/grill` | Grill (inline, interactive) | `/grill` or orangebox phase 2 |
| `~/.claude/skills/architect` (+ `artifact/`) | Architect launcher + page template and block spec | `/architect` or phase 3 |
| `~/.claude/skills/{lead,engineer,qa,final-review}` | thin `context: fork` launchers | `/…` |
| `~/.claude/agents/eng-{architect,lead,engineer,qa,final-reviewer}.md` | persona instructions + tool boundaries | subagent start |

Every skill is auto-detectable: Claude picks it from its description's "Use when" trigger, and you can still type it. Two guard against unwanted runs. `orangebox` asks for a one-line confirmation before starting a new run it chose itself, since a run creates a branch and commits. `engineer` triggers only on a named task from a run or plan, so ordinary coding stays in the main conversation. The seven descriptions add about 2.3 KB to every session's skill list.

## Three kinds of isolation (they're different)
| | what it means here | how |
|---|---|---|
| **Standalone invocation** | run one persona without the workflow | `/qa`, `/lead`, … |
| **Isolated context** | fresh context window, no conversation history | `context: fork` skills and every `Agent` launch (all personas except grill) |
| **Repository isolation** | separate git checkout | `isolation: "worktree"`, used only for parallel engineers. Its base defaults to `origin/HEAD`, so the engineer's preflight resets it to the run base. |

Grill is deliberately not isolated: it needs your answers.

## Commands
```text
# full workflow
/orangebox Add rate limiting to the public login endpoint; we're getting credential-stuffing spikes

# resume after a break or a new session
/orangebox status 20261001-login-rate-limit
/orangebox resume 20261001-login-rate-limit

# change requirements mid-run (invalidates affected plan items and all reviews)
/orangebox amend 20261001-login-rate-limit Also exempt our internal health-checker IPs

# personas standalone
/grill We want to add Redis to cache feature flags
/architect .claude/eng-runs/20261001-login-rate-limit
/lead "Users can export invoices as CSV from the billing page"
/engineer "Fix the off-by-one in pagination in src/api/list.ts; add a regression test"
/qa HEAD main "AC: GET /items?page=2 returns items 11-20"
/final-review .claude/eng-runs/20261001-login-rate-limit <candidate-sha> <base-sha>
```
Small task? Skip the workflow: `/engineer` then `/qa`.

## Run artifacts
`<repo>/.claude/eng-runs/<run-id>/`: added to `.git/info/exclude` (local, never committed). Work happens on branch `eng/<run-id>` with **local commits only**. Nothing is pushed or merged without your request.

## Diagram integration
The diagram is one Claude Artifact page, `diagram.html`, about 7.5 KB empty and 9–12 KB filled. It has three sections, Flow (flowchart), States (stateDiagram) and Classes (classDiagram), plus Notes for `assume:` and `Q-n:`. The artifact viewer draws them natively, so there's no `.mmd` file, renderer or checker.
The coordinator copies `architect/artifact/template.html` into the run. The architect fills its four placeholder blocks with Edit, following `artifact/spec.md`, and the coordinator publishes the page.
In the page, **Edit diagrams** opens one text box per block, and **Save** republishes the page through the `artifact` capability with the rev bumped. The text inside the page is the source of truth. Claude syncs edits back through a haiku subagent: `Artifact read` (`path: "index.html"`, ~14 KB with claude.ai's wrapper and Mermaid runtime), then `artifact/sync.mjs`, which strips those back to the authored page (~10 KB) and writes it over the run's copy only when its rev is higher. The main context sees one line (`rev N updated|unchanged`).
History:
- Amendment A-1 replaced tldraw with a drag-and-drop whiteboard.
- The whiteboard was dropped because it cost too much: the architect had to write coordinates, and every read-back pulled in a ~37 KB page.
- The Mermaid-file stage after it was dropped because a separate `.mmd` file plus a checker CLI was more machinery than needed.
If artifacts can't be published (headless `claude -p`, no claude.ai login, publish refused), the run keeps `diagram.html` locally and records `diagram: not published: <reason>`. Diagrams render only inside Claude Artifacts.
tldraw, if you ever want it back: the official MCP app (`https://tldraw-mcp-app.tldraw.workers.dev/mcp`, tools `search`/`exec`/`save_checkpoint`/`read_checkpoint`) needs a host that renders MCP-app iframes (Claude desktop/web), not the Claude Code terminal.

## Known limits
- Tool boundaries are real for Write/Edit (hooks). The **shell** (Bash, or PowerShell on Windows hosts without Bash; agents declare both) in QA, final-reviewer and lead is read-only by instruction only.
- The final reviewer's QA-blindness is enforced for Read/Grep/Glob, and structurally (QA output isn't written until both reviews return). It isn't enforced against reading the file through the shell.
- Hooks call `node`; Node must be on PATH.
- Agent frontmatter hooks run only for agents from a **trusted** source. The eng agents live in `~/.claude/agents` (user level), so they qualify. A copy placed in an untrusted project's `.claude/agents/` silently loses its guards.
- Guards fail open if `node` is missing or the script crashes. They deny via JSON (`permissionDecision: "deny"`, exit 0), not exit 2, because Windows hook shells can rewrite exit codes.
