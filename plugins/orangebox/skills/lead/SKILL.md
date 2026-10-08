---
name: lead
description: "Writes a PRD (requirements, not a tech spec) and a task plan with requirement ids, file ownership, dependencies and staffing. Use when the user asks for a PRD, requirements, acceptance criteria, a task breakdown or an implementation plan for a feature."
argument-hint: "<run-dir | problem statement>"
context: fork
agent: eng-lead
---
Standalone invocation of your persona. Follow your agent instructions exactly.

Invocation arguments: $ARGUMENTS

common: ${CLAUDE_SKILL_DIR}/../orangebox/reference/common.md
templates: ${CLAUDE_SKILL_DIR}/../orangebox/templates/
base: (run `git rev-parse HEAD` yourself if no run dir)

If the arguments name a run dir (contains `state.md`), use it as `run:`. Otherwise this is a standalone run: take what you need from the arguments and the repository, state which inputs were user-supplied versus inferred, and return the PRD and task plan inline.
