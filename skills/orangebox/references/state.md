# Run state: <run-id>
<!-- Coordinator-owned. Update after every phase. Resume reads this file first. -->
repo: <abs path> · branch: eng/<run-id> · base: <sha> · created: <date>
phase: init | grill | architect | lead | build | integrate | review | repair-<n> | done | blocked
size: tiny | small | standard  (tiny/small may skip phases. The reason goes in Log.)

## Artifacts
| file | v | status | derived from |
|---|---|---|---|
| prompt.md | 1 | frozen | - |
| amendments.md | A-0 | - | - |
| brief.md | 1 | todo | prompt, A-* |
| diagram.html | 1 | todo | brief v1 |
| prd.md | 1 | todo | brief v1 |
| tasks.md | 1 | todo | prd v1 |

diagram: <artifact url | not published: reason>

## Tasks
| T | engineer | isolation | status | commit | handoff |
|---|---|---|---|---|---|

## Candidate & gates
candidate: <sha or none> · checks on candidate: <cmd → result | not run>
| gate | sha | verdict | score | file | stale? |
|---|---|---|---|---|---|
| QA | | | /10 | reviews/qa-<sha7>.md | |
| Final | | | /10 | reviews/final-<sha7>.md | |
independent contexts: yes | NO (reason). Completion is BLOCKED unless the user waives it.
repair rounds used: 0/2

## Log (append-only, one line each)
- <date> init
