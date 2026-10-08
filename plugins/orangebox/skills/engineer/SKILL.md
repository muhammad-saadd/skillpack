---
name: engineer
description: "Implements one planned task with the minimum adequate change on a checked base commit, commits it and reports real check results. Use when the user asks to implement a specific task from an orangebox run or task plan (e.g. \"do T-2 from .claude/eng-runs/x\"). Ordinary coding requests stay in the main conversation."
argument-hint: "<run-dir T-n [base-sha] | task description>"
context: fork
agent: eng-engineer
---
Standalone invocation of your persona. Follow your agent instructions exactly.

Invocation arguments: $ARGUMENTS

common: ${CLAUDE_SKILL_DIR}/../orangebox/reference/common.md
templates: ${CLAUDE_SKILL_DIR}/../orangebox/templates/

If the arguments name a run dir (contains `state.md`), use it as `run:`. Otherwise this is a standalone run: take what you need from the arguments and the repository, state which inputs were user-supplied versus inferred, and return the implementation and handoff inline.
