# diagram.html: the architect's artifact page

The coordinator copies `template.html` to `<run>/diagram.html` before you start. It is the published page, and the text inside it is the only copy of the diagrams. Read lines 16–28, then use Edit to replace the placeholder lines below, nothing else. Replace `%% TITLE` everywhere (replace_all) with a 2–4 word name. Replace `%% SOURCE` with e.g. `brief v1`. The artifact draws the diagrams; you write no coordinates, CSS or script. When revising, Read the same region and edit the block text in place. The page bumps its own rev on Save; don't touch `data-rev`.

| block | placeholder | first line | shows |
|---|---|---|---|
| flow | `%% FLOW` | `flowchart TB` | existing vs proposed components, boundaries, data flow, failure paths |
| state | `%% STATE` | `stateDiagram-v2` | lifecycle of the main entity the change touches (e.g. an order) |
| class | `%% CLASS` | `classDiagram` | modules/types touched and their relations |
| notes | `%% NOTES` | plain text | `assume:` lines, `Q-n:` open questions, deliberate omissions |

A diagram that doesn't apply is one line: `n/a: <reason>` (common for `class` in non-OO code; never for `flow`).

**flow**: paste the four `classDef` lines verbatim, end every node with `:::existing|proposed|changed|removed`, and draw at least one failure path (`-.->`) per external dependency or boundary crossing the change touches, or add `%% no-failure: <reason>`.
```text
flowchart TB
classDef existing fill:#e8edf7,stroke:#55627a,color:#1d2321
classDef proposed fill:#e3f3e6,stroke:#2f7a45,stroke-width:2px,color:#1d2321
classDef changed fill:#fbf1d9,stroke:#a8761c,stroke-width:2px,color:#1d2321
classDef removed fill:#f8e1df,stroke:#a8433a,stroke-dasharray:4 3,color:#1d2321
subgraph app["App process · trust boundary"]
  co["checkout() · src/checkout.js:5 · R-1"]:::changed
end
gw{{"Payment gateway"}}:::existing
co -->|"charge + idemKey"| gw
gw -.->|"timeout → retry ≤3"| co
```
**state**: `[*] --> created`, `created --> paid : charge ok`. Mark new states or transitions in the label: `created --> pending : final timeout (new, R-2)`.
**class**: `class Checkout { +checkout(id, items) }`, relations `Checkout ..> Gateway : uses`. Mark changes in the member text: `+charge(amount, orderId, idemKey) (changed)`. Use `~T~` for generics.

Rules for every block:
- The text sits raw inside HTML, so never write `<` directly before a letter, `/`, `!` or `?`, and never write `&` directly before a letter or `#`. Write `lt`, `and` or `~T~` instead. Mermaid arrows such as `<|--` are fine.
- Labels go in double quotes and contain no `"`.
- Keep labels short so they don't overlap when rendered:
  - node labels ≤ 40 characters (name · `file:line` · `R-n`);
  - edge and transition labels ≤ 4 words plus an optional `R-n`. Put the detail in notes;
  - between the same two nodes or states, at most one edge per direction, and label only one of the pair (labels on a there-and-back pair collide).
- Always `flowchart TB`: `LR` with a subgraph renders about twice as wide and needs sideways scrolling.
- In state diagrams, avoid self-loops: draw an explicit state such as `retrying`.
- Don't use `note` in class diagrams; put `file:line` in the class name's line instead, e.g. `class Checkout["Checkout · src/checkout.js:5"]`.
- Put `file:line` and `R-n` refs in labels.
- Size caps keep the page readable and the run cheap:
  - flow: ≤ 12 nodes;
  - state: ≤ 8 transitions;
  - class: ≤ 5 classes, touched members only;
  - notes: ≤ 6 lines.
  Mention merged or omitted parts in notes.
- Make one Edit per placeholder: `%% TITLE` (replace_all), `%% SOURCE`, then the four blocks. No retries for style.
- When revising, keep ids stable.
- Self-check before returning:
  - every edge endpoint is a declared node or state;
  - every flow node has a state class;
  - the failure-path rule is met;
  - the HTML-safety rule is met.

  There is no checker; a broken diagram shows as a Mermaid error on the page.
