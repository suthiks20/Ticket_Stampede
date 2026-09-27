# Decisions — Ticket Stampede

## 1. Architecture chosen, and what we rejected

**Chosen:** Node.js + Fastify for both seller and buyer, PostgreSQL 16 as the
single source of truth, Docker Compose for a reproducible stack.

**Why one language:** the buyer and seller share nothing but HTTP, but keeping
both in Node meant every concurrency decision (event loop, connection pooling,
retry backoff) could be reasoned about and defended the same way on both sides.

**Why push correctness into Postgres instead of the application:**

| Option | Rejected because |
|---|---|
| In-memory counter (`sold++`) | Only correct within one process; the entire point of the brief is that this oversells under concurrency — this *is* our naive version, kept on purpose |
| Application-level mutex/queue | Protects one process; silently breaks the moment there's more than one seller instance (the "take it further" bonus) |
| Redis-based lock or counter | Adds a second stateful system and a second consistency boundary to reason about, for a guarantee Postgres already gives for free via row locks and constraints |
| **Row-level locking + unique constraints (chosen)** | Correctness is enforced by the database engine itself — true regardless of how many stateless seller processes sit in front of it |

**Data model:**

sales(sale_id UUID PK, ticket_count INT, is_active BOOL, sold_out BOOL) UNIQUE(is_active) WHERE is_active -- only one live sale, ever tickets(sale_id FK, ticket_number INT, user_id TEXT, request_id TEXT) PRIMARY KEY (sale_id, ticket_number) -- one row pre-seeded per ticket UNIQUE (sale_id, request_id) WHERE request_id IS NOT NULL -- idempotency INDEX (sale_id, ticket_number) WHERE user_id IS NULL -- fast free-row scan



Tickets are **pre-allocated** at `/reset` (one row per ticket number). This turns
"sell a ticket" from "decrement a counter" into "claim a row" — a problem
Postgres's `FOR UPDATE SKIP LOCKED` already solves.

**Request flow (`/buy`), as actually implemented:** one round trip does all of
it via a single CTE — look up the active sale, check for a replay of this
`request_id` first, and if none exists, atomically claim one free row with
`FOR UPDATE SKIP LOCKED`:

```sql
WITH existing AS (SELECT ... WHERE sale_id=$1 AND request_id=$2),
     free     AS MATERIALIZED (SELECT ... WHERE user_id IS NULL
                                AND NOT EXISTS (SELECT 1 FROM existing)
                                ORDER BY ticket_number LIMIT 1
                                FOR UPDATE SKIP LOCKED),
     claimed  AS (UPDATE tickets SET user_id=$3, request_id=$2 FROM free ... RETURNING ...)
SELECT ... FROM claimed UNION ALL SELECT ... FROM existing
```


If the CTE returns nothing, an EXISTS check (no lock) distinguishes "genuinely sold out" from "every free row is momentarily locked by another in-flight request" — only the former returns 409; the latter retries with jittered backoff and a bounded deadline, returning 503 BUSY if it's exhausted. A replayed request_id under a different user_id returns 422. A ticket is only ever handed back to the caller after the statement (and thus the implicit transaction) has actually committed.

2. Trade-offs made under the time limit
    •	Single CTE over an explicit multi-statement transaction. An earlier version ran replay-check → claim → sold-out-check as separate statements inside BEGIN/COMMIT (up to 4 round trips per request). Collapsing it into one statement removed most of that overhead and shrank the in-doubt window during a DB failure. We kept the old version's reasoning as a design note but shipped the CTE.
    •	No Toxiproxy for the slowdown test, despite it being provisioned in docker-compose.yml. A direct script (slow-db.js) that takes an EXCLUSIVE lock on tickets for N seconds was simpler, deterministic, and easier to correlate against the buyer's timeline than proxy-level latency injection.
    •	Waitlist state machine was not built. It's the hardest "take it further" option and would have consumed the whole remaining budget; we chose depth on the DB-kill scenario instead (see §4).
    •	3-instance/nginx bonus was scaffolded but not independently re-verified after the sale-state fix (§3). The architecture argument for why it should hold is in §1 (stateless sellers, one Postgres), but we do not claim a measured multi-instance result.


## 3. Real bugs we found in our own build (and fixed)

| # | Bug | Fix |
|---|---|---|
| 1 | Active sale ID kept in JS memory. | Persisted in `sales.is_active`; read per request. |
| 2 | Startup `DROP TABLE` erased data. | Use `CREATE ... IF NOT EXISTS`; verified row survival. |
| 3 | DB disconnect crashed the seller. | Add client error listeners; release failed clients with the error. |
| 4 | Retry backoff held a pool connection. | Release the client before waiting to retry. |
| 5 | Replay 200s falsely failed Invariant 2. | Check distinct request IDs per ticket and replay consistency. |

## 4. How we tested it (numbers from `results/`)

| Test | Setup | Result |
|---|---|---|
| **Naive** | 100 tickets; 500 requests; 10% duplicates. | 171 sold, only 5 unique numbers; oversell reproduced. |
| **Fixed** | Same 100-ticket, 500-request load. | 100 sold; 0 lost; median 808.7 ms; P99 1,192.7 ms. Old checker falsely failed Invariant 2. |
| **Ramp** | 1,000 tickets; 2,000 requests; 500 then 1,000 concurrency. | P99 1,155.9 ms then 2,014.9 ms; corrected invariants pass. First capture: 346.9 ms, concurrency unrecorded. |
| **10s slowdown** | 1,000 tickets; 5,000 requests paced over 20s; 10s DB lock. | Median 5.8 ms; P99 4,301.4 ms; 1,000 sold; 0 lost. |
| **DB kill + autopsy** | Kill and restart Postgres during a 1,000-ticket sale. | 21.023s incident; 878 first-try; 121 after-retry; 1,000 sold; 0 lost; recovery 0.137s; 132 unresolved IDs. |

**A note on the Invariant 2 quirk in the raw text files:** `naive-run.txt`, `fixed-run.txt`, and `ramp-test.txt` were captured with an earlier buyer build and print `[FAIL] Invariant 2` even on the fixed server, because that build's checker counted idempotent replays as duplicates (bug #5 above). `slowdown-test.txt` was captured after the fix and correctly prints `[PASS]`. The server's actual behavior was correct in every run — this was a false positive in the test client's self-report, not a server defect, and it's fixed in the current `buyer/src/load.js`. The stale files were kept rather than edited, so the evidence trail stays honest.

**A note on the naive server's artificial delay:** Node's single-threaded event loop processes an unawaited check-then-increment fast enough that it doesn't reliably race at moderate concurrency. `naive-server.js` inserts a small `await setTimeout(..., 2)` between the check and the write specifically to widen that window enough for the load test to reproduce overselling consistently — without it, the same flawed logic can appear to "work" by luck.


5. Where it breaks / known limitations
    •	Single Postgres instance is a single point of failure by design here — no replica, no managed failover. Acceptable for the scope of this brief, not for production.
    •	results/db-kill-test.txt (raw terminal capture) is empty. The kill test is documented instead through incident-report.md and final-status.json, generated by the autopsy tool from the actual audit log — arguably stronger evidence than a pasted terminal transcript, but the raw capture itself is missing.
    •	3-instance/nginx path is unverified under load with the current, sale-state-in-Postgres code (§2).
    •	AI Session Logs: Full transcripts of the AI coding sessions (Codex and Claude) are now populated in the /logs directory as required by the brief.


6. What we'd do with two more weeks
    1.	Waitlist state machine — reserved-but-unconfirmed tickets return to the pool after 30s and flow to the next queued buyer.
    2.	Re-verify the 3-instance/nginx bonus with the current code, using the same naive → fixed → kill test matrix run against :8080 instead of a single instance.
    3.	Distributed buyer — split load generation across multiple processes/ machines and prove throughput isn't limited by the client itself.
    4.	Toxiproxy-based partial failures (packet loss, asymmetric latency) instead of only a clean full outage, which is a more realistic failure mode.
    5.	A live dashboard over the audit log, so the autopsy becomes real-time instead of a post-hoc report.

