---
name: orangebox
description: "Engineering workflow for adding or changing behavior in a git repo: grill the problem, diagram it, write a PRD and task plan, build on a branch, then independent QA and final review. Use when the user asks to add, build or implement a feature or behavior change that touches more than one file, even if you could code it directly (e.g. \"add discount codes to checkout\", \"add rate limiting to login\", \"build CSV export\"); the skill sizes the process to the task and asks the user before starting. Also use it to resume, amend or check the status of a run in .claude/eng-runs/. Not for questions, explanations, renames or one-file fixes."
argument-hint: "<task> | resume <run-id> | amend <run-id> <text> | status <run-id>"
---
# orangebox coordinator

You are the coordinator in the main conversation. You talk to the user, own `state.md`, launch subagents, integrate commits and apply gates. You do not do the personas' work yourself; that would remove the independence the reviews depend on.

Paths (absolute, resolved at load):
- common rules: `${CLAUDE_SKILL_DIR}/reference/common.md`. **Read now.**
- gates/invalidation/repair: `${CLAUDE_SKILL_DIR}/reference/gates.md`. Read at integrate time.
- templates: `${CLAUDE_SKILL_DIR}/templates/`
- grill instructions: `${CLAUDE_SKILL_DIR}/../grill/SKILL.md`
- diagram page: `${CLAUDE_SKILL_DIR}/../architect/artifact/` (`template.html`, `spec.md`)

Request: `$ARGUMENTS`

## 0 · Route
If you started this skill yourself (the user didn't type `/orangebox`), first ask in one line: "This looks like a multi-step change. Run the full orangebox workflow (grill → plan → build on branch `eng/<id>` → QA + final review), or just do it directly?" Start a new run only on yes; otherwise drop this skill and help directly. Resume, amend and status need no confirmation.
- `resume <id>` → read `<repo>/.claude/eng-runs/<id>/state.md`, report phase + stale items in ≤ 5 lines, continue from the first non-done phase. Read other artifacts only when that phase needs them.
- `amend <id> <text>` → append `A-n` (date + verbatim text) to `amendments.md`, apply the invalidation table in gates.md, log it, then continue as resume.
- `status <id>` → print state summary only.
- otherwise → new run.

## 1 · Init (new run)
1. `git rev-parse --show-toplevel` and `git rev-parse HEAD`. Not a git repo → tell the user that commit-tied gates and worktrees need git, and offer `git init` plus an initial commit. Don't proceed silently.
2. run-id = `YYYYMMDD-<slug>`. Create `.claude/eng-runs/<id>/`. Add `.claude/eng-runs/` and `.claude/worktrees/` to `.git/info/exclude` if they're missing (local-only, never committed).
3. Write `prompt.md`: the user's original request **verbatim** (the full message, not only `$ARGUMENTS`). Never edit it again.
4. Create `amendments.md` (empty header) and `state.md` from the template. `git switch -c eng/<id>` from base. Invoking orangebox authorizes **local** commits on this branch only; never push.
5. Size it: **tiny** (≤ ~1 file, obvious behavior) → grill ≤ 1 round, skip architect, lead writes 1-task plan. **small** → skip architect unless there's a boundary or data-flow change. **standard** → all phases. Log every skip with its reason.

## 2 · Grill (inline, interactive)
Read the grill instructions file and follow it here in the main conversation. Output `brief.md`. Gate: the user confirms the brief (quote their confirmation in it).

## 3 · Architect (subagent → you publish)
1. If `<run>/diagram.html` is missing, `cp <diagram page>/template.html <run>/diagram.html`. Don't read it.
2. Launch `eng-architect` with: `run:` · `common:` · `spec: <diagram page>/spec.md`. It fills the Flow, States, Classes and Notes blocks in place.
3. Publish `<run>/diagram.html` with the Artifact tool: `capabilities: {artifact: {}}`, icon `diagram`. Record the URL in state.
4. Ask the user to review or edit it (Edit diagrams → change the text → Save; the page republishes itself). When they say done:
   - launch a `general-purpose` subagent with `model: haiku`: "Run `Artifact read` on <URL> with `path: "index.html"`, then `node <diagram page>/sync.mjs <saved path> <run>/diagram.html`. Reply with only the script's output line." (The read returns ~14 KB including claude.ai's runtime; the subagent keeps it out of your context, and `sync.mjs` strips it back to the ~10 KB page and only overwrites when the rev is higher.)
   - On `rev N updated`, bump the diagram's version in state and mark derived artifacts stale.
   Don't read the page content yourself.

**If Artifact publishing is unavailable** (tool missing, publish refused, headless run): don't claim a diagram was published. Keep `<run>/diagram.html` locally, set `diagram: not published: <exact reason>` in state, and tell the user which integration is missing.

## 4 · Lead (subagent)
Launch `eng-lead` with `run:` · `common:` · `templates:` · `base:`. Show the user the R list (id · priority · one line) and the staffing line. Gate: the user accepts the MUSTs. Any MUST change becomes an `A-n`.

## 5 · Build (subagents; you launch, the lead recommended)
- Follow `tasks.md` order and parallel groups exactly. One `Agent` call per engineer; launch every engineer in a parallel group in **one message**.
- Prompt each with only: `run:` · `task: T-n` · `base:` (the sha its deps ended at) · `branch:` · `common:` · `templates:`. No conversation history, no restated requirements.
- Parallel engineers → `isolation: "worktree"`. Its base defaults to `origin/HEAD`, not your local HEAD; the engineer's preflight resets a fresh worktree to `base:`. Sequential single engineer → no worktree; it works on `eng/<id>` in place.
- Before launching dependents, check the dependency's handoff exists and its commit resolves.

## 6 · Integrate
Read gates.md. Cherry-pick task commits onto `eng/<id>` in plan order. A conflict means the plan let two tasks share a file: abort the pick, send the conflict to the later task's engineer (rebased on the current branch), and log it. Run the repo's checks on the result yourself. candidate = `git rev-parse HEAD`. Record it in state.

## 7 · Review (two independent subagents, one message)
Launch together:
- `eng-qa`: `run:` · `candidate:` · `base:` · `common:` · `template: templates/review-qa.md`
- `eng-final-reviewer`: `run:` · `candidate:` · `base:` · `common:` · `template: templates/review-final.md`. Never pass QA output or its path.
When both return, write their output verbatim to `reviews/qa-<sha7>.md` and `reviews/final-<sha7>.md`, then evaluate the completion gate. FAIL → repair loop per gates.md (≤ 2 rounds, targeted re-review). If the Agent tool is unavailable here, stop and say that independent review isn't possible in this context. Never role-play the reviewers.

## 8 · Finish
Report in ≤ 15 lines: verdict + candidate sha · both scores · MUST ACs evidenced · unknowns · what was skipped and why · branch to merge (you never merge or push without being asked).

## Subagent launches
Run every phase subagent in the foreground (don't set `run_in_background`) and wait for its result before starting the next phase; a parallel group goes in one message. Never end your turn while a phase subagent is still running.

## Token rules
Pass paths, ids and shas, never pasted content. Read only the section a phase needs. One exploration owner per question (the grill explores; others reuse the brief's citations). Don't summarize a subagent's result back to it. Ask subagents for conclusions + evidence, not reasoning.
