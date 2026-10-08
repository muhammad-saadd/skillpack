# Orangebox diagram specification

The run's `diagram.html` is a local, editable view. Replace its title/source and
the SVG and text placeholders; do not change its CSS or page structure. Use
inline SVG so the diagram renders without a Claude Artifact service, network
connection, or JavaScript dependency. Give each SVG a useful accessible title
and description.

- **Flow:** show existing and proposed/changed/removed nodes, boundaries, data
  flow, and at least one dashed red failure path for each touched external
  dependency or boundary. Use the CSS classes already in the template.
- **State:** show the main entity lifecycle and label new or changed
  transitions. If none applies, put the reason in the section and description.
- **Class:** show touched modules/types and relations, or explain why none
  applies in the section and description.
- **Notes:** list assumptions and open questions with `assume:` and `Q-n:`.

Put source `file:line` and requirement IDs in labels. Keep the flow to 12 nodes,
state diagram to 8 transitions, class diagram to 5 classes, and notes to 6 lines.
Use SVG `rect`/`text` nodes and `line`/`path` arrows sized to the viewBox; set
`marker-end` to the section's arrow ID (`flow-arrow`, `state-arrow`, or
`class-arrow`). Keep labels short and readable. Give failure arrows the
`failure` class. Escape text for HTML/SVG. Check that every connection has
declared endpoints and no placeholder remains. Return the local path and state
any rendering limitation.
