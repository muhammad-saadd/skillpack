# Gates, invalidation, repair (coordinator only; load at integrate/review time)

## Completion gate: ALL must hold on the same candidate sha
- [ ] QA verdict PASS on `candidate` (not stale)
- [ ] Final verdict PASS on `candidate` (not stale)
- [ ] Both reviews ran in independent subagent contexts. Otherwise BLOCKED unless the user waives it (record the waiver as `A-n`).
- [ ] Every MUST AC is `[x]` with evidence in at least one review. Any `[?]` blocks completion.
- [ ] No open Critical/High finding (QA) and no unmet MUST obligation (Final), whatever the scores
- [ ] `git status` clean on the run branch; candidate == branch HEAD

Overall: **PASS** if all hold · **FAIL** if a review FAILed and repair rounds are exhausted · **BLOCKED** otherwise (say exactly what is missing).

## Invalidation table
| event | mark stale | re-run |
|---|---|---|
| amendment `A-n` | brief sections it touches → affected R/AC → tasks owning them → **all reviews** | grill (only if the amendment is ambiguous), lead re-plan (affected only), engineers for stale tasks, both reviews |
| diagram/brief edit after PRD | PRD entries whose `src` changed | lead re-plan (affected only) |
| new commit on run branch | every review whose sha ≠ new HEAD | targeted re-review |
| test/check command changed | QA | QA |

Never edit a frozen review. Write a new one for the new sha and mark the old one `stale` in state.md.

## Repair loop (max 2 rounds, then escalate. Never accept failing work.)
1. Collect blocking items: QA Critical/High, failing checks, `[ ]` MUST ACs, Final unmet obligations / drift fixes.
2. Map each item to the owning task (by file → `owns`). Unowned item → ask the lead for a minimal task delta.
3. Launch eng-engineer with `fix: F-ids/O-ids`, same branch, new base = current candidate.
4. New candidate → re-run **only** the stale reviews in targeted mode (`previous:` + `delta:`). Both reviewers re-check, because a fix can break fidelity.
5. After round 2 still failing → state `blocked`, show the user the open items and options (amend scope, accept a waiver for non-MUST items, continue manually).

## Score rules
Scores are diagnostics. Verdict rules in each reviewer's definition decide PASS/FAIL/BLOCKED; a 9/10 with a Critical finding is FAIL.
