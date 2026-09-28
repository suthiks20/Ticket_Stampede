# Ticket Stampede Incident Report

Summary: 1849 request IDs across 13244 attempts; confirmed_first_try=878, confirmed_after_retry=121, sold_out=717, in_doubt_resolved=1, in_doubt_unresolved=132, lost=0.

## Incident window
Detected: 2026-09-26T14:10:49.821Z to 2026-09-26T14:11:10.844Z (21.023 seconds).

## Categories and examples
- confirmed_first_try: count=878; examples: "req-0", "req-1", "req-2"
- confirmed_after_retry: count=121; examples: "req-23", "req-30", "req-34"
- sold_out: count=717; examples: "req-1089", "req-1090", "req-1091"
- in_doubt_resolved: count=1; examples: "req-953", "req-953", "req-953" (repeated raw IDs fill the three example slots)
- in_doubt_unresolved: count=132; examples: "req-954", "req-956", "req-955"
- lost: count=0; examples: "N/A", "N/A", "N/A" (no request IDs in this category)

## Final verdict
Invariant 1 (never oversell): PASS — final sold count was 1000 against a ticket_count of 1000
Invariant 2 (no duplicate ticket numbers): PASS
Invariant 3 (idempotency): PASS — 121 confirmed_after_retry requests all resolved to a single consistent ticket_number across their own attempts, 0 mismatches found
Invariant 4 (no lost confirmed sales): PASS — 0 requests in the lost category

## Recovery duration
0.137 seconds from the last error/in_doubt attempt in the incident window to the first subsequent confirmed attempt (2026-09-26T14:11:10.284Z to 2026-09-26T14:11:10.421Z).

Audit log: C:\Users\suthikshan k\Desktop\ticket\results\audit.ndjson
Status snapshot: C:\Users\suthikshan k\Desktop\ticket\results\final-status.json
