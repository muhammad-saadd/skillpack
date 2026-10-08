---
name: final-review
description: "Requirements-fidelity review in a fresh context: checks an exact change against the original request and amendments, not the PRD, and scores how well it delivers what was asked. Use when the user asks whether a change actually does what was requested, or wants a final sign-off before merging."
argument-hint: "[run-dir] [candidate-ref] [base-ref] | <original request text>"
context: fork
agent: eng-final-reviewer
---
Standalone invocation of your persona. Follow your agent instructions exactly.

Invocation arguments: $ARGUMENTS

common: ${CLAUDE_SKILL_DIR}/../orangebox/reference/common.md
template: ${CLAUDE_SKILL_DIR}/../orangebox/templates/review-final.md

If the arguments name a run dir (contains `state.md`), use it as `run:`. Otherwise this is a standalone run: take what you need from the arguments and the repository, state which inputs were user-supplied versus inferred, and return the review inline.
