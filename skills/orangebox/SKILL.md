---
name: orangebox
description: >
  Coordinate a multi-step engineering change from problem framing through design,
  requirements, implementation, independent QA, and final review. Use when a
  requested behavior change spans multiple files or needs coordinated work.
argument-hint: "<task> | resume <run-id> | amend <run-id> <text> | status <run-id>"
metadata:
  opencode/slash: "true"
---

# Orangebox

You coordinate the user and the workflow. Keep the original request, amendments,
design decisions, implementation handoffs, and review evidence in one run folder.
Do not claim independent review when the host cannot provide a separate agent.

## Host capabilities

Resolve supporting files relative to the directory containing this `SKILL.md`.
Use the host's native tools:

- Claude Code: use `Agent` with the bundled `eng-*` agents when the Orangebox
  plugin is installed. Its plugin hooks guard writes and reviewer reads.
- Codex: use `spawn_agent` for delegated work, with the role instructions in
  `references/roles/` included in each prompt. Use the default agent type unless
  the host exposes a compatible specialized type.
- OpenCode: use the `subagent` tool with the built-in `general` agent for work
  and `explore` for read-only reviews. Include the role instructions in each
  prompt. If subagent permission is denied, stop at that gate.

Codex and OpenCode do not inherit Claude's hook guards. Keep role ownership
explicit in prompts, have reviewers work read-only, and check all changes before
integration. If a host lacks separate agent contexts, report the independent
QA/final-review gate as `BLOCKED`; do not simulate independence in one context.

## Run directory and commands

For a new portable run, use `<repo>/.agent-runs/orangebox/<YYYYMMDD-slug>/`.
If resuming an existing `.claude/eng-runs/<id>/` or a run folder the user names,
keep using that location. Resolve absolute paths before delegating.

- `status <id>`: read `state.md` only and report the phase and stale items.
- `resume <id>`: read `state.md`, then continue at the first incomplete phase.
- `amend <id> <text>`: append the user's exact amendment to `amendments.md`,
  invalidate affected artifacts as described in `references/gates.md`, then
  continue from the first affected phase.
- Otherwise, treat the input as a new task.

## Workflow

1. **Confirm the mode.** If invoked automatically rather than by an explicit
   `/orangebox` command, ask whether the user wants the full workflow or direct
   implementation. Do not start the run until they choose.
2. **Initialize.** Inspect the repo and current commit. Do not start on a dirty
   tree or overwrite an existing branch; ask the user to clean it or choose an
   isolated worktree. Create a local `eng/<run-id>` branch from the base commit,
   then create the run folder and `prompt.md` with the original request
   verbatim; add empty `amendments.md` and `state.md` from `references/`. Add
   `.agent-runs/` to `.git/info/exclude` if it is not already ignored. Never
   rewrite the original prompt.
3. **Grill with the user.** Look at repo evidence before asking. Clarify only
   decisions that change scope, compare doing nothing/config/reuse/minimal build,
   and separate evidence from guesses. Draft `brief.md`; ask the user to confirm
   it before continuing.
4. **Design when useful.** Skip for tiny changes and record why. Otherwise copy
   `references/diagram-template.html` to the run folder as `diagram.html`, then
   create the flow, state, class, and notes blocks using
   `references/diagram-spec.md`. Keep it local; offer the file to the user and
   incorporate requested edits before planning. Do not claim it was published.
5. **Plan.** Read `references/roles/lead.md` and delegate the PRD/task-plan phase
   when a separate agent is available. Require sourced requirements, observable
   acceptance criteria, file ownership, dependencies, and evidence commands.
   For tiny work, keep the PRD and plan proportional. Ask the user to accept the
   MUST requirements before implementation.
6. **Build.** Follow task order and ownership. Parallelize only independent
   medium-or-larger tasks with disjoint files and host support for isolated
   worktrees; otherwise run them sequentially. Read
   `references/roles/engineer.md` for each handoff. Engineers commit their
   assigned task locally and report the commit and real check results; the
   coordinator integrates in plan order and records the candidate commit.
7. **Review independently.** At the candidate commit, delegate QA using
   `references/roles/qa.md` and final fidelity review using
   `references/roles/final-review.md` in separate fresh contexts. Do not give
   QA's report to the final reviewer. Each reviewer must inspect the commit and
   produce evidence. If either role cannot run independently, mark the gate
   `BLOCKED`; continue only if the user explicitly waives that gate.
8. **Repair and finish.** Repair blocking findings for at most two rounds, then
   rerun every stale review on the new candidate. Completion requires both
   reviews to PASS on the same candidate, every MUST criterion evidenced, and
   no open Critical/High finding. Report the candidate, checks, review results,
   skips, and remaining caveats. Never push or merge unless asked.

## Delegation prompts

Before each delegation, read the matching file under `references/roles/` and
include only the relevant run paths, task, base/candidate commits, ownership, and
role instructions. Pass paths and commit IDs rather than pasting large artifacts.
Keep QA and final-review contexts separate; reviewers never edit implementation.

For inline work on hosts without subagents, preserve the same phase boundaries
and label any independent-review gate `BLOCKED` rather than passing it yourself.
