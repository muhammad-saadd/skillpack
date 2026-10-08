---
name: architect
description: "Draws an editable diagram page (flowchart of existing vs proposed behavior with boundaries and failure paths, state diagram, class diagram) for an agreed change. Use when the user asks to diagram, visualize or sketch the architecture, data flow, lifecycle or components of a change they are planning."
argument-hint: "<run-dir | problem description>"
---
# Architect (launcher)

Input: `$ARGUMENTS`

1. Resolve `run:` as the absolute run dir if one was given. Otherwise create `<repo>/.claude/eng-runs/adhoc-<date>-<slug>/` and write the problem description to its `brief.md`.
2. If `<run>/diagram.html` is missing, copy `${CLAUDE_SKILL_DIR}/artifact/template.html` there with a shell `cp`. Don't read it.
3. Launch the `eng-architect` subagent with one compact prompt:
   - `run:`
   - `common: ${CLAUDE_SKILL_DIR}/../orangebox/reference/common.md`
   - `spec: ${CLAUDE_SKILL_DIR}/artifact/spec.md`

   Run it in the foreground (don't set `run_in_background`) and wait for its result. If it stops with questions instead of a diagram, relay them and stop.
4. Publish `<run>/diagram.html` with the Artifact tool:
   - `capabilities: {artifact: {}}`
   - `icon: "diagram"`
   - a one-line description.

   Give the user the link. They can open **Edit diagrams**, change any of the texts and click **Save**; the page republishes itself.
5. When the user says they've edited it, launch a `general-purpose` subagent with `model: haiku`: "Run `Artifact read` on <URL> with `path: "index.html"`, then `node ${CLAUDE_SKILL_DIR}/artifact/sync.mjs <saved path> <run>/diagram.html`. Reply with only the script's output line." `sync.mjs` strips claude.ai's wrapper and runtime and overwrites only when the rev is higher. The page is the source of truth, so don't re-read it yourself. Later publishes of that file go to the same `url`.

**If the Artifact tool is unavailable or the publish is refused:** don't say a diagram was published. Point the user to `<run>/diagram.html` (it opens in a browser, but diagrams render only inside Claude Artifacts) and state: *Diagram not published: <exact reason>. Missing integration: Claude Artifacts publishing.*
