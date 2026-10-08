# orangebox common rules (shared by every persona)

Read once per task. Persona-specific rules live in your own agent/skill file; do not load other personas' instructions.

## Run directory

`<repo>/.claude/eng-runs/<run-id>/` (absolute path is always passed to you). Never assume it exists in a worktree; it lives in the main checkout.

| File | Owner | Mutable? |
|---|---|---|
| `prompt.md` | coordinator | **No** — original prompt verbatim |
| `amendments.md` | coordinator | append-only, `A-n` entries with date + verbatim user text |
| `brief.md` | grill | versioned (`v:` header) |
| `diagram.html` (artifact page; the diagrams live inside it) | architect (publish: coordinator) | versioned via the page rev |
| `prd.md` | lead | versioned; canonical home of `R-n` / `AC-n` once it exists |
| `tasks.md` | lead | versioned |
| `handoffs/T-n.md` | engineer | one per task attempt |
| `reviews/qa-<sha7>.md`, `reviews/final-<sha7>.md` | coordinator writes what reviewers return | immutable per sha |
| `state.md` | coordinator only | updated after every phase |

Templates: `templates/` next to this file. Copy the shape, not the comments. Small task = fewer sections, never fake content to fill a section.

## IDs (stable, never renumbered)

`R-n` requirement · `AC-n.m` acceptance criterion of R-n · `T-n` task · `A-n` amendment · `F-n` finding · `Q-n` open question. Deleted items are struck through with a reason, not removed. Every R-n has a `src:` (prompt line/quote, `A-n`, or `brief Q-n answer`).

Priority tags: `MUST` / `SHOULD` / `COULD`. Only the user (or prompt text) can create or drop a MUST.

## Evidence rules

- A checkbox is `[x]` only with evidence beside it: command + exit/result, `file:line`, commit sha, or a quoted user answer.
- `[ ]` = not done. `[?]` = **unknown** (not run, not observable, could not verify). Unknown is never reported as pass.
- Author claims (handoff text, commit messages, PR descriptions) are not evidence for a reviewer. Re-run or re-read.
- Report actual command output (trimmed), not paraphrase. If you did not run it, say "not run".

## Status vocabulary

Task/phase: `todo · doing · done · blocked · stale`. Gate verdict: `PASS · FAIL · BLOCKED`.
- **FAIL** — evaluated and wrong (missing MUST, serious correctness/security issue, failing required check).
- **BLOCKED** — cannot evaluate (missing artifact, wrong candidate, unavailable capability, MUST evidence unknown).
- **PASS** — evaluated, no blocker, threshold met. A score never overrides a blocker.

## Invalidation

- New amendment → coordinator marks affected R-n and everything derived from them (`prd`, `tasks`, any review) `stale`.
- New commit after a review → that review is stale for the new sha. Re-review is targeted: changed files + affected R-n only.

## Handoff to/from the coordinator

Return only: verdict/status · artifacts written (paths) · key evidence · assumptions · open questions/blockers. No narration of your process, no restating inputs. Target ≤ 40 lines unless the template needs more.

## Escalate (stop and return) when

Requirements conflict or are ambiguous in a way that changes behavior · a MUST looks infeasible · you need a capability you don't have · you'd need to touch files you don't own · base commit or inputs don't match what you were given.
