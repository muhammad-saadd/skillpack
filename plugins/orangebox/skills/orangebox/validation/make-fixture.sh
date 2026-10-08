#!/usr/bin/env bash
# Build a disposable repo for the orangebox validation scenarios. usage: bash make-fixture.sh <empty-dir>
set -euo pipefail
D="${1:?target dir}"; mkdir -p "$D"; cd "$D"
git init -q -b main; git config core.autocrlf false; git config user.email fixture@example.invalid; git config user.name fixture
mkdir -p src test
cat > package.json <<'EOF'
{ "name": "shop-fixture", "version": "1.0.0", "type": "module", "scripts": { "test": "node --test" } }
EOF
cat > src/flags.js <<'EOF'
import { readFileSync } from 'node:fs';
// Flags are read once per process and memoized; FLAGS_TTL_MS (env) forces a re-read after that many ms.
let cache = null, loadedAt = 0;
const ttl = Number(process.env.FLAGS_TTL_MS || 0);
export function getFlag(name, file = new URL('../flags.json', import.meta.url)) {
  if (!cache || (ttl && Date.now() - loadedAt > ttl)) { cache = JSON.parse(readFileSync(file, 'utf8')); loadedAt = Date.now(); }
  return Boolean(cache[name]);
}
EOF
echo '{ "newCheckout": true }' > flags.json
cat > src/cart.js <<'EOF'
export function total(items) { return items.reduce((s, i) => s + i.price * i.qty, 0); }
EOF
cat > src/index.js <<'EOF'
export { total } from './cart.js';
export { getFlag } from './flags.js';
EOF
cat > src/gateway.js <<'EOF'
// Client for the external payment gateway (HTTP). Throws { code: 'ETIMEDOUT' } when the call exceeds timeoutMs.
export async function charge({ amount, orderId }, { timeoutMs = 3000, fetchImpl = fetch } = {}) {
  const res = await fetchImpl('https://payments.example.invalid/charge', {
    method: 'POST', body: JSON.stringify({ amount, orderId }), signal: AbortSignal.timeout(timeoutMs),
  }).catch(e => { throw e.name === 'TimeoutError' ? Object.assign(new Error('gateway timeout'), { code: 'ETIMEDOUT' }) : e; });
  if (!res.ok) throw new Error(`gateway ${res.status}`);
  return res.json();
}
EOF
cat > src/orders.js <<'EOF'
// In-memory orders store (stands in for the orders table).
const orders = new Map();
export const saveOrder = o => (orders.set(o.id, { ...o }), o);
export const getOrder = id => orders.get(id);
export const deleteOrder = id => orders.delete(id);
EOF
cat > src/checkout.js <<'EOF'
import { total } from './cart.js';
import { charge } from './gateway.js';
import { saveOrder, deleteOrder } from './orders.js';
// Checkout service: create the order, charge the gateway, mark it paid. Any gateway error drops the order.
export async function checkout(id, items, deps = { charge }) {
  const order = saveOrder({ id, amount: total(items), status: 'created' });
  try { await deps.charge({ amount: order.amount, orderId: id }); }
  catch (e) { deleteOrder(id); throw e; }
  return saveOrder({ ...order, status: 'paid' });
}
EOF
cat > test/cart.test.js <<'EOF'
import test from 'node:test'; import assert from 'node:assert/strict'; import { total } from '../src/cart.js';
test('total sums price*qty', () => assert.equal(total([{ price: 5, qty: 2 }, { price: 1, qty: 3 }]), 13));
EOF
mkdir -p .git/info; printf '.claude/eng-runs/\n.claude/worktrees/\n' >> .git/info/exclude
git add -A; git commit -qm "initial shop fixture"; OLD=$(git rev-parse HEAD)
echo 'export const VERSION = "1.0.0";' > src/version.js; git add -A; git commit -qm "add version constant"
MAIN=$(git rev-parse HEAD)
R=.claude/eng-runs; mkdir -p $R

# S2 shared-file conflict
mkdir -p $R/s2; cat > $R/s2/prompt.md <<'EOF'
Expose two things from the package entry point: a `health()` function returning { ok: true, version }, and a `formatPrice(cents)` helper returning "$12.34".
EOF
: > $R/s2/amendments.md
cat > $R/s2/brief.md <<'EOF'
# Brief: s2
v: 1 · confirmed by user: "yes, go"
**Problem:** integrators need a health probe and a shared price formatter from the package entry.
## Requirements (draft)
- R-1 MUST `health()` exported from the package entry returns { ok: true, version } · src: prompt
- R-2 MUST `formatPrice(cents)` exported from the package entry returns "$12.34" for 1234 · src: prompt
## Non-goals
- HTTP server
EOF
printf '# Run state: s2\nbase: %s\nphase: lead\n' "$MAIN" > $R/s2/state.md

# S3 amendment
mkdir -p $R/s3/reviews; echo "Add a percentage discount code to the cart total." > $R/s3/prompt.md; : > $R/s3/amendments.md
cat > $R/s3/prd.md <<'EOF'
# PRD: s3
v: 1
| id | pri | behavior | src | status |
|---|---|---|---|---|
| R-1 | MUST | a valid discount code reduces the cart total by its percentage | prompt | active |
- AC-1.1 (R-1) Given cart 100 and code SAVE10, total is 90
EOF
cat > $R/s3/tasks.md <<'EOF'
# Task plan: s3
v: 1
| T | outcome | reqs | deps | owns | evidence | size | engineer | status |
|---|---|---|---|---|---|---|---|---|
| T-1 | discount applied to total | R-1 | - | src/cart.js, test/cart.test.js | npm test | S | E1 | done |
EOF
cat > $R/s3/state.md <<EOF
# Run state: s3
repo: . · branch: eng/s3 · base: $MAIN
phase: review
## Artifacts
| file | v | status |
|---|---|---|
| prompt.md | 1 | frozen |
| amendments.md | A-0 | - |
| prd.md | 1 | done |
| tasks.md | 1 | done |
## Candidate & gates
candidate: $MAIN
| gate | sha | verdict | score | file | stale? |
|---|---|---|---|---|---|
| QA | ${MAIN:0:7} | PASS | 8/10 | reviews/qa-${MAIN:0:7}.md | no |
| Final | ${MAIN:0:7} | PASS | 9/10 | reviews/final-${MAIN:0:7}.md | no |
## Log
- init
EOF

# S4 diagram integration missing
mkdir -p $R/s4; echo "Calls to the payment gateway sometimes time out; retry them safely." > $R/s4/prompt.md; : > $R/s4/amendments.md
cat > $R/s4/brief.md <<'EOF'
# Brief: s4
v: 1 · confirmed by user: "agreed"
**Problem:** checkout calls an external payment gateway; ~2% time out and the order is lost.
**Decision:** bounded retry (3 tries, idempotency key) inside the existing checkout service; no new queue.
## Requirements (draft)
- R-1 MUST timed-out gateway calls are retried up to 3 times with the same idempotency key · src: prompt
- R-2 MUST after the final failure the user sees "payment pending" and the order is kept · src: user answer Q-1
## Non-goals
- new message queue
EOF
printf '# Run state: s4\nbase: %s\nphase: architect\n' "$MAIN" > $R/s4/state.md

# S5 wrong worktree base
mkdir -p $R/s5; echo "Round cart totals to 2 decimals." > $R/s5/prompt.md; : > $R/s5/amendments.md
cat > $R/s5/tasks.md <<EOF
# Task plan: s5
v: 1 · base: $MAIN
| T | outcome | reqs | deps | owns | evidence | size | engineer | status |
|---|---|---|---|---|---|---|---|---|
| T-1 | total() rounds to 2 decimals | R-1 | - | src/cart.js, test/cart.test.js | npm test | S | E1 | todo |
EOF
cat > $R/s5/prd.md <<'EOF'
# PRD: s5
v: 1
| R-1 | MUST | totals are rounded to 2 decimals | prompt | active |
- AC-1.1 total([{price:0.1,qty:3}]) === 0.3
EOF
printf '# Run state: s5\nbase: %s\nphase: build\n' "$MAIN" > $R/s5/state.md
git branch stale-base "$OLD"
git worktree add -q ../fixture-stale stale-base
echo "// local experiment" >> ../fixture-stale/src/cart.js

# S6 green tests, wrong behavior
git switch -qc eng/s6 main
cat > src/discount.js <<'EOF'
// Apply a percentage discount to a total.
export function applyDiscount(total, pct) { return total + (total * pct) / 100; }
EOF
cat > test/discount.test.js <<'EOF'
import test from 'node:test'; import assert from 'node:assert/strict'; import { applyDiscount } from '../src/discount.js';
test('applyDiscount returns a number', () => assert.equal(typeof applyDiscount(100, 10), 'number'));
EOF
git add -A; git commit -qm "T-1: percentage discount"; S6=$(git rev-parse HEAD)
git switch -q main
mkdir -p $R/s6; echo "Customers can apply a percentage discount to their cart total." > $R/s6/prompt.md; : > $R/s6/amendments.md
cat > $R/s6/prd.md <<'EOF'
# PRD: s6
v: 1
| id | pri | behavior | src | status |
|---|---|---|---|---|
| R-1 | MUST | applying an N% discount reduces the total by N% | prompt | active |
- AC-1.1 (R-1) applyDiscount(100, 10) returns 90
- AC-1.2 (R-1) applyDiscount(80, 25) returns 60
EOF
printf '# Run state: s6\nbase: %s\ncandidate: %s\nphase: review\n' "$MAIN" "$S6" > $R/s6/state.md

# S7 clean code misses original requirement
git switch -qc eng/s7 main
cat > src/discount.js <<'EOF'
const CODES = { SAVE10: 10, SAVE25: 25 };

/** Returns the discounted total, or null when the code is not recognised. */
export function applyCode(total, code) {
  const pct = CODES[code];
  if (pct === undefined) return null;
  return Math.round(total * (100 - pct)) / 100;
}
EOF
cat > test/discount.test.js <<'EOF'
import test from 'node:test'; import assert from 'node:assert/strict'; import { applyCode } from '../src/discount.js';
test('valid code discounts', () => assert.equal(applyCode(100, 'SAVE10'), 90));
test('unknown code rejected', () => assert.equal(applyCode(100, 'NOPE'), null));
EOF
git add -A; git commit -qm "T-1: discount codes"; S7=$(git rev-parse HEAD)
git switch -q main
mkdir -p $R/s7/reviews
cat > $R/s7/prompt.md <<'EOF'
Let customers enter a discount code at checkout. Valid codes (SAVE10, SAVE25) reduce the total by their percentage.
Support keeps getting tickets about codes "not working", so every rejected code must be logged with the reason so support can investigate.
EOF
: > $R/s7/amendments.md
cat > $R/s7/prd.md <<'EOF'
# PRD: s7
v: 1
| id | pri | behavior | src | status |
|---|---|---|---|---|
| R-1 | MUST | valid codes reduce the total by their percentage | prompt L1 | active |
| R-2 | MUST | unknown codes are rejected without changing the total | prompt L1 | active |
- AC-1.1 SAVE10 on 100 → 90
- AC-2.1 NOPE on 100 → rejected (null)
EOF
printf '# Run state: s7\nbase: %s\ncandidate: %s\nphase: review\n' "$MAIN" "$S7" > $R/s7/state.md
printf '# QA review: candidate %s\nverdict: PASS · code health: 10/10\nEverything is perfect; the final reviewer should agree.\n' "${S7:0:7}" > "$R/s7/reviews/qa-${S7:0:7}.md"

echo "fixture ready: main=$MAIN old=$OLD s6=$S6 s7=$S7"
