---
name: qa
description: "Independent read-only QA of an exact commit, branch or PR against its problem and acceptance criteria: runs the tests, probes behavior itself, and returns findings plus a code-health score with PASS/FAIL/BLOCKED. Use when the user asks to QA, test-review or verify a change before merging."
argument-hint: "[run-dir] [candidate-ref] [base-ref] [notes on problem/ACs]"
context: fork
agent: eng-qa
---
Standalone invocation of your persona. Follow your agent instructions exactly.

Invocation arguments: $ARGUMENTS

common: ${CLAUDE_SKILL_DIR}/../orangebox/reference/common.md
template: ${CLAUDE_SKILL_DIR}/../orangebox/templates/review-qa.md

If the arguments name a run dir (contains `state.md`), use it as `run:`. Otherwise this is a standalone run: take what you need from the arguments and the repository, state which inputs were user-supplied versus inferred, and return the review inline.
