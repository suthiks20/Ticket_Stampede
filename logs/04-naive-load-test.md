I'm building a take-home assignment called "Ticket Stampede." Here's the
full context so you understand what we're building and why.
THE PROBLEM
50,000 people want 100 tickets, and they all arrive in the same 60 seconds.
I need to build two things:
1. A Seller API (backend) with 3 endpoints:
   - POST /reset → wipes state, starts fresh sale with N tickets
   - POST /buy → takes user_id + request_id, returns ticket_number or SOLD_OUT
   - GET /status → returns sold count + list of who holds which ticket
2. A Buyer (load-testing client) that attacks the seller with thousands of
   concurrent requests and verifies correctness.
THE 4 INVARIANTS (must ALWAYS hold)
1. Never sell more tickets than exist (sold <= ticket_count)
2. Never issue the same ticket number twice
3. Same request_id sent twice → buyer gets ONE ticket, not two (idempotency)
4. /status count always matches tickets actually issued
WHY THIS IS HARD
Under concurrency, a naive "check count → decrement" approach breaks:
- 500 requests read "available = 1" simultaneously
- All 500 think they can buy
- Result: overselling, duplicate ticket numbers
The fix is to push correctness into PostgreSQL using:
- Pre-allocated ticket rows (one row per ticket)
- Row-level locking: SELECT ... FOR UPDATE SKIP LOCKED
- Composite unique constraints to prevent duplicates
- Atomic transactions so check + claim + assign is one operation
MY ARCHITECTURE DECISIONS (already locked in)
- Language: Node.js for both seller and buyer (one language, easier to
  defend in the live follow-up interview)
- Framework: Fastify (fast, schema validation built in)
- Database: PostgreSQL 16 in Docker
- Correctness strategy: DB-level constraints + FOR UPDATE SKIP LOCKED
- No Redis, no in-memory counters in the seller
- Chaos testing: Toxiproxy for DB slowdown, docker kill for DB crash test
RESPONSE CODES
- 200 = success or replay of original ticket (idempotent)
- 400 = bad input (missing fields, invalid ticket_count)
- 409 = SOLD_OUT (verified zero free tickets remain)
- 422 = request_id reused by a DIFFERENT user_id
- 503 = BUSY with Retry-After header (contention, NOT sold out)
WHAT I NEED FROM YOU RIGHT NOW (PHASE 1 ONLY)
Do NOT write any business logic, services, or handlers yet.
Just create the folder structure and empty/minimal scaffold files.
I want a production-grade layered architecture with strict separation:
ticket-stampede/ │ ├── docker-compose.yml (placeholder, we'll fill in Phase 2) ├── schema.sql (placeholder) ├── README.md (placeholder) ├── DECISIONS.md (placeholder) ├── .gitignore ├── .env.example │ ├── docs/ │ └── BRIEF.md │ ├── logs/ (AI session transcripts go here) │ ├── results/ (test outputs go here) │ ├── tests/ │ ├── unit/ │ └── integration/ │ ├── seller/ │ ├── package.json │ ├── Dockerfile │ └── src/ │ ├── server.js (entry point) │ ├── app.js (Fastify app factory) │ ├── config.js (env vars) │ ├── routes/ │ │ └── index.js │ ├── schemas/ │ ├── handlers/ │ ├── services/ │ ├── repositories/ │ ├── db/ │ │ └── pool.js │ ├── middleware/ │ └── utils/ │ └── errors.js │ └── buyer/ ├── package.json └── src/ ├── index.js (CLI entry point) ├── config.js ├── client/ ├── workers/ ├── metrics/ ├── ledger/ ├── verifier/ └── utils/  
look i need separate frontend and backend so accoridngly create the folder structure
SPECIFIC DELIVERABLES FOR THIS PHASE
Generate these files with the content described:
1. .gitignore — ignore node_modules, .env, pgdata, .log, results/.ndjson
2. .env.example — list all env vars with defaults:
   - DATABASE_URL=postgres://ticket:ticket@localhost:5432/tickets
   - PORT=3000
   - SELLER_MODE=naive
   - PG_POOL_MAX=20
3. seller/package.json — name "ticket-seller", dependencies: fastify, pg, dotenv. Script: "start": "node src/server.js"
4. buyer/package.json — name "ticket-buyer", NO external dependencies. Script: "start": "node src/index.js"
5. seller/src/config.js — reads process.env, exports frozen config object with defaults
6. seller/src/utils/errors.js — custom error classes:
   - SoldOutError (maps to 409)
   - BusyError (maps to 503)
   - ConflictError (maps to 422, request_id reused by different user)
   - ValidationError (maps to 400)
7. seller/src/db/pool.js — creates pg Pool using config, adds pool.on('error') handler, exports pool
8. seller/src/app.js — creates Fastify instance, registers error handler middleware, exports app (does NOT listen)
9. seller/src/server.js — imports app, imports pool, calls app.listen(), logs startup
10. seller/src/routes/index.js — empty async function that registers routes (placeholder)
11. buyer/src/config.js — parses process.argv for --url, --tickets, --total, --concurrency, --dup-rate
12. buyer/src/index.js — imports config, logs "buyer starting", exits (placeholder)
13. docs/BRIEF.md — write a 10-line summary of the problem
RULES
- Every file must be complete and syntactically valid
- Use CommonJS (require/module.exports), not ESM
- Add a 1-line comment at the top of each file explaining its purpose
- Do NOT implement any business logic, SQL queries, or route handlers
- Do NOT create docker-compose.yml or schema.sql yet (Phase 2)
- Keep files minimal — just enough to require/import without errors
Generate all 13 files now.





Show more

9:43 PM






Worked for 5m 17s



Created the separate seller and buyer scaffolds, shared docs and output folders, and all 13 requested files. The JavaScript files pass node --check.
The two package.json files use valid JSON, so they cannot contain the requested top-of-file comments; the other files have purpose comments. I left out docker-compose.yml and schema.sql for Phase 2, as requested.

  Edited 5 files+49-0Review changesUndoReview

buyer/src/config.jsbuyer/src/config.js+13-0
buyer/src/index.jsbuyer/src/index.js+4-0
docs/BRIEF.mddocs/BRIEF.md+12-0
seller/src/routes/index.jsseller/src/routes/index.js+4-0
seller/src/server.jsseller/src/server.js+16-0
Collapse files




9:48 PM







I'm building a take-home assignment called "Ticket Stampede." Here's the
full context so you understand what we're building and why.
THE PROBLEM
50,000 people want 100 tickets, and they all arrive in the same 60 seconds.
I need to build two things:
1. A Seller API (backend) with 3 endpoints:
   - POST /reset → wipes state, starts fresh sale with N tickets
   - POST /buy → takes user_id + request_id, returns ticket_number or SOLD_OUT
   - GET /status → returns sold count + list of who holds which ticket
2. A Buyer (load-testing client) that attacks the seller with thousands of
   concurrent requests and verifies correctness.
THE 4 INVARIANTS (must ALWAYS hold)
1. Never sell more tickets than exist (sold <= ticket_count)
2. Never issue the same ticket number twice
3. Same request_id sent twice → buyer gets ONE ticket, not two (idempotency)
4. /status count always matches tickets actually issued
WHY THIS IS HARD
Under concurrency, a naive "check count → decrement" approach breaks:
- 500 requests read "available = 1" simultaneously
- All 500 think they can buy
- Result: overselling, duplicate ticket numbers
The fix is to push correctness into PostgreSQL using:
- Pre-allocated ticket rows (one row per ticket)
- Row-level locking: SELECT ... FOR UPDATE SKIP LOCKED
- Composite unique constraints to prevent duplicates
- Atomic transactions so check + claim + assign is one operation
MY ARCHITECTURE DECISIONS (already locked in)
- Language: Node.js for both seller and buyer
- Framework: Fastify (fast, schema validation built in)
- Database: PostgreSQL 16 in Docker
- Correctness strategy: DB-level constraints + FOR UPDATE SKIP LOCKED
- No Redis, no in-memory counters in the seller
- Chaos testing: Toxiproxy for DB slowdown, docker kill for DB crash test
RESPONSE CODES
- 200 = success or replay of original ticket (idempotent)
- 400 = bad input (missing fields, invalid ticket_count)
- 409 = SOLD_OUT (verified zero free tickets remain)
- 422 = request_id reused by a DIFFERENT user_id
- 503 = BUSY with Retry-After header (contention, NOT sold out)
FOLDER STRUCTURE (MODULAR, FEATURE-BASED)
I want to follow a modular, domain-driven structure similar to my previous
project. Each domain entity gets its own module folder with routes, handlers,
services, repository, and schemas co-located.
ticket-stampede/ │ ├── docker-compose.yml (Phase 2) ├── schema.sql (Phase 2) ├── README.md (Phase 15) ├── DECISIONS.md (Phase 15) ├── .gitignore ├── .env.example │ ├── docs/ │ └── BRIEF.md │ ├── logs/ (AI session transcripts) │ ├── results/ (test outputs) │ ├── seller/ │ ├── package.json │ ├── Dockerfile │ └── src/ │ ├── server.js (entry point, starts HTTP server) │ ├── app.js (Fastify app factory) │ ├── config.js (env vars, defaults) │ │ │ ├── db/ │ │ ├── pool.js (pg Pool singleton) │ │ └── migrator.js (schema bootstrap) │ │ │ ├── middleware/ │ │ ├── error-handler.js │ │ └── request-logger.js │ │ │ ├── utils/ │ │ ├── logger.js │ │ ├── clock.js │ │ └── errors.js (custom error classes) │ │ │ └── modules/ (DOMAIN MODULES) │ │ │ ├── sales/ (sale lifecycle: reset, active sale) │ │ ├── commons/ │ │ │ └── constants.js │ │ ├── routes/ │ │ │ └── index.js │ │ ├── handlers/ │ │ │ ├── reset.js │ │ │ └── index.js │ │ ├── services/ │ │ │ ├── reset.js │ │ │ └── index.js │ │ ├── repository/ │ │ │ ├── sales.js │ │ │ └── mocks/ │ │ ── schemas/ │ │ ├── reset.js │ │ └── index.js │ │ │ └── tickets/ (ticket claiming, status, idempotency) │ ├── commons/ │ │ └── constants.js │ ├── routes/ │ │ └── index.js │ ├── handlers/ │ │ ├── buy.js │ │ ├── status.js │ │ └── index.js │ ├── services/ │ │ ├── buy.js │ │ ├── status.js │ │ └── index.js │ ├── repository/ │ │ ├── tickets.js │ │ └── mocks/ │ └── schemas/ │ ├── buy.js │ ├── status.js │ └── index.js │ └── buyer/ ├── package.json └── src/ ├── index.js (CLI entry point) ├── config.js (CLI args) ├── client/ │ └── seller-client.js ├── workers/ │ └── load-generator.js ├── metrics/ │ ├── collector.js │ ── reporter.js ├── ledger/ │ └── request-ledger.js ├── verifier/ │ ├── invariant-checker.js │ └── continuous-checker.js ── utils/ ├── logger.js ── ndjson-writer.js  
WHAT I NEED FROM YOU RIGHT NOW (PHASE 1 ONLY)
Do NOT write any business logic, SQL queries, or route handlers yet.
Just create the folder structure and empty/minimal scaffold files.
SPECIFIC DELIVERABLES FOR THIS PHASE
Generate these files with the content described:
1. .gitignore — ignore node_modules, .env, pgdata, .log, results/.ndjson
2. .env.example — list all env vars with defaults:
   - DATABASE_URL=postgres://ticket:ticket@localhost:5432/tickets
   - PORT=3000
   - SELLER_MODE=naive
   - PG_POOL_MAX=20
3. seller/package.json — name "ticket-seller", dependencies: fastify, pg, dotenv. Script: "start": "node src/server.js"
4. buyer/package.json — name "ticket-buyer", NO external dependencies. Script: "start": "node src/index.js"
5. seller/src/config.js — reads process.env, exports frozen config object with defaults
6. seller/src/utils/errors.js — custom error classes:
   - SoldOutError (maps to 409)
   - BusyError (maps to 503)
   - ConflictError (maps to 422, request_id reused by different user)
   - ValidationError (maps to 400)
7. seller/src/db/pool.js — creates pg Pool using config, adds pool.on('error') handler, exports pool
8. seller/src/app.js — creates Fastify instance, registers error handler middleware, exports app (does NOT listen)
9. seller/src/server.js — imports app, imports pool, calls app.listen(), logs startup
10. seller/src/middleware/error-handler.js — global Fastify error handler that maps custom errors to HTTP status codes
11. seller/src/middleware/request-logger.js — logs method, path, status, duration
12. seller/src/utils/logger.js — simple console wrapper with levels (info, warn, error)
13. seller/src/modules/sales/commons/constants.js — exports table names, error messages
14. seller/src/modules/sales/routes/index.js — empty async function that registers reset route (placeholder)
15. seller/src/modules/sales/handlers/reset.js — placeholder handler that returns { ok: true }
16. seller/src/modules/sales/handlers/index.js — barrel export of all handlers
17. seller/src/modules/sales/services/reset.js — placeholder service function
18. seller/src/modules/sales/services/index.js — barrel export
19. seller/src/modules/sales/repository/sales.js — placeholder repository with empty functions
20. seller/src/modules/sales/schemas/reset.js — JSON Schema for POST /reset body and response
21. seller/src/modules/sales/schemas/index.js — barrel export
22. seller/src/modules/tickets/commons/constants.js — exports table names, error messages
23. seller/src/modules/tickets/routes/index.js — empty async function that registers buy and status routes (placeholder)
24. seller/src/modules/tickets/handlers/buy.js — placeholder handler
25. seller/src/modules/tickets/handlers/status.js — placeholder handler
26. seller/src/modules/tickets/handlers/index.js — barrel export
27. seller/src/modules/tickets/services/buy.js — placeholder service function
28. seller/src/modules/tickets/services/status.js — placeholder service function
29. seller/src/modules/tickets/services/index.js — barrel export
30. seller/src/modules/tickets/repository/tickets.js — placeholder repository with empty functions
31. seller/src/modules/tickets/schemas/buy.js — JSON Schema for POST /buy body and response
32. seller/src/modules/tickets/schemas/status.js — JSON Schema for GET /status response
33. seller/src/modules/tickets/schemas/index.js — barrel export
34. buyer/src/config.js — parses process.argv for --url, --tickets, --total, --concurrency, --dup-rate
35. buyer/src/index.js — imports config, logs "buyer starting", exits (placeholder)
36. docs/BRIEF.md — write a 10-line summary of the problem
RULES
- Every file must be complete and syntactically valid
- Use CommonJS (require/module.exports), not ESM
- Add a 1-line comment at the top of each file explaining its purpose
- Do NOT implement any business logic, SQL queries, or route handlers
- Do NOT create docker-compose.yml or schema.sql yet (Phase 2)
- Keep files minimal — just enough to require/import without errors
- Use barrel exports (index.js) in each module folder for clean imports
- Repository files should export empty async functions with JSDoc comments describing what they'll do
Generate all 36 files now.





Show more

9:54 PM






Worked for 6m 24s



Expanded the scaffold to the sales and tickets domain modules, including middleware, placeholder handlers and services, empty async repository functions with JSDoc, schemas, and barrel exports. The routes modules are placeholders and register no routes.
All JavaScript passed node --check, and both package manifests parsed as valid JSON. The package manifests have no top-of-file comments because JSON does not allow comments. docker-compose.yml and schema.sql were not created.

  Edited 25 files+213-6Review changesUndoReview

seller/src/app.jsseller/src/app.js+8-6
seller/src/middleware/error-handler.jsseller/src/middleware/error-handler.js+9-0
seller/src/middleware/request-logger.jsseller/src/middleware/request-logger.js+13-0
seller/src/modules/sales/commons/constants.jsseller/src/modules/sales/commons/constants.js+7-0
seller/src/modules/sales/handlers/index.jsseller/src/modules/sales/handlers/index.js+4-0
seller/src/modules/sales/handlers/reset.jsseller/src/modules/sales/handlers/reset.js+8-0
seller/src/modules/sales/repository/sales.jsseller/src/modules/sales/repository/sales.js+10-0
seller/src/modules/sales/routes/index.jsseller/src/modules/sales/routes/index.js+6-0
seller/src/modules/sales/schemas/index.jsseller/src/modules/sales/schemas/index.js+4-0
seller/src/modules/sales/schemas/reset.jsseller/src/modules/sales/schemas/reset.js+18-0
seller/src/modules/sales/services/index.jsseller/src/modules/sales/services/index.js+4-0
seller/src/modules/sales/services/reset.jsseller/src/modules/sales/services/reset.js+6-0
seller/src/modules/tickets/commons/constants.jsseller/src/modules/tickets/commons/constants.js+7-0
seller/src/modules/tickets/handlers/buy.jsseller/src/modules/tickets/handlers/buy.js+6-0
seller/src/modules/tickets/handlers/index.jsseller/src/modules/tickets/handlers/index.js+4-0
seller/src/modules/tickets/handlers/status.jsseller/src/modules/tickets/handlers/status.js+6-0
seller/src/modules/tickets/repository/tickets.jsseller/src/modules/tickets/repository/tickets.js+13-0
seller/src/modules/tickets/routes/index.jsseller/src/modules/tickets/routes/index.js+6-0
seller/src/modules/tickets/schemas/buy.jsseller/src/modules/tickets/schemas/buy.js+21-0
seller/src/modules/tickets/schemas/index.jsseller/src/modules/tickets/schemas/index.js+4-0
seller/src/modules/tickets/schemas/status.jsseller/src/modules/tickets/schemas/status.js+25-0
seller/src/modules/tickets/services/buy.jsseller/src/modules/tickets/services/buy.js+6-0
seller/src/modules/tickets/services/index.jsseller/src/modules/tickets/services/index.js+4-0
seller/src/modules/tickets/services/status.jsseller/src/modules/tickets/services/status.js+6-0
seller/src/utils/logger.jsseller/src/utils/logger.js+8-0
Collapse files




10:00 PM







PHASE 2: INFRASTRUCTURE & DATABASE WIRING
We have the folder structure and placeholders. Now we need to set up the
PostgreSQL database, Docker infrastructure, and wire the database connection
to the Fastify app.
1. INFRASTRUCTURE FILES
Generate these two files in the project root:
File 1: docker-compose.yml
- postgres: PostgreSQL 16 image.
  - Env vars: POSTGRES_USER=ticket, POSTGRES_PASSWORD=ticket, POSTGRES_DB=tickets.
  - Command: ["postgres", "-c", "max_connections=200", "-c", "idle_in_transaction_session_timeout=5000"].
  - Ports: 5432:5432.
  - Volumes: Named volume pgdata mapped to /var/lib/postgresql/data, and mount ./schema.sql:/docker-entrypoint-initdb.d/schema.sql.
  - Healthcheck: pg_isready -U ticket -d tickets (interval 3s, timeout 3s, retries 10).
- toxiproxy: shopify/toxiproxy image. Ports: 8474:8474, 5433:5433.
- seller: Builds from ./seller.
  - Env: DATABASE_URL=postgres://ticket:ticket@postgres:5432/tickets, PORT=3000.
  - Depends on: postgres (condition: service_healthy).
  - Ports: 3000:3000.
- nginx: nginx:alpine image (placeholder for later). Ports: 8080:80.
File 2: schema.sql
This file will be executed by Postgres on first startup. Write the exact SQL:
-- Sales table
CREATE TABLE IF NOT EXISTS sales (
  sale_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_count INT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  sold_out BOOLEAN DEFAULT false
);

-- Prevent multiple active sales concurrently
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_active 
ON sales (is_active) 
WHERE is_active = true;

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  sale_id UUID NOT NULL REFERENCES sales(sale_id) ON DELETE CASCADE,
  ticket_number INT NOT NULL,
  user_id TEXT,
  request_id TEXT,
  PRIMARY KEY (sale_id, ticket_number)
);

-- Composite uniqueness for idempotency (allow NULL request_id for unclaimed)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_request 
ON tickets (sale_id, request_id) 
WHERE request_id IS NOT NULL;

-- Partial index for fast available ticket lookup
CREATE INDEX IF NOT EXISTS idx_tickets_available 
ON tickets (sale_id, ticket_number) 
WHERE user_id IS NULL;


File 3: seller/Dockerfile
Base: node:20-alpine
Workdir: /app
Copy package.json, run npm install --production
Copy src/
Expose 3000
CMD: ["node", "src/server.js"]
2. DATABASE & APP WIRING
Update or create the following files in seller/src/ to connect everything.
File 4: seller/src/db/pool.js
Import pg Pool.
Create pool using DATABASE_URL from ../config.js (or process.env directly if config isn't ready).
Config: max: 20, connectionTimeoutMillis: 5000, keepAlive: true.
Add pool.on('error', (err) => console.error('Unexpected pool error:', err));
Export the pool instance.
File 5: seller/src/db/migrator.js
Import the pool.
Export an async function ensureSchema().
It should read the schema.sql file (using fs) and execute it against the pool.
Why? docker-entrypoint-initdb.d only runs on first container creation. This ensures the schema exists even if we reset the DB manually.
File 6: seller/src/app.js
Update this to actually register the routes.
Import the route modules:
const salesRoutes = require('./modules/sales/routes');
const ticketRoutes = require('./modules/tickets/routes');
Inside the app factory, call await fastify.register(salesRoutes); and await fastify.register(ticketRoutes);.
Register the middleware: fastify.addHook('onRequest', require('./middleware/request-logger')); (or however Fastify handles it, use fastify.use if using middleware plugin, or just addHook). Correction for Fastify: use fastify.addHook('preHandler', ...) or just register the logger as a plugin. Keep it simple: just register the routes for now.
File 7: seller/src/server.js
Import app from ./app.js.
Import ensureSchema from ./db/migrator.js.
Import pool from ./db/pool.js.
In the start function:
Call await ensureSchema();
Call await app.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
Log: Seller running on port ${port}.
Add a graceful shutdown handler that closes the pool on SIGINT/SIGTERM.
RULES
Use CommonJS (require/module.exports).
Ensure all imports match the file paths created in Phase 1.
Do NOT write business logic in handlers/services yet. Just get the server to start, connect to Postgres, and return a 404 or placeholder response for the routes.
Verify that node --check passes for all JS files.
Generate these files now.





Show more

10:04 PM






Worked for 4m 22s



Added the PostgreSQL 16 Compose setup, the requested schema and seller Dockerfile. The seller now applies the schema at startup, registers both placeholder route modules, listens on the configured port, and closes its Fastify server and database pool on SIGINT/SIGTERM.
All seller JavaScript files pass node --check. The route modules remain empty, so endpoints are not implemented yet. The seller container mounts schema.sql at /app/schema.sql so the startup schema check can read it.

  Edited 7 files+165-16Review changesUndoReview

docker-compose.ymldocker-compose.yml+45-0
schema.sqlschema.sql+31-0
seller/Dockerfileseller/Dockerfile+10-0
seller/src/app.jsseller/src/app.js+9-8
seller/src/db/migrator.jsseller/src/db/migrator.js+27-0
seller/src/db/pool.jsseller/src/db/pool.js+7-2
seller/src/server.jsseller/src/server.js+36-6
Collapse files




10:08 PM


eqId":"req-p6","res":{"statusCode":409},"responseTime":0.35899999999674037,"msg":"request completed"}
{"level":30,"time":1790269691356,"pid":27024,"hostname":"suthi123","reqId":"req-p7","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53078},"msg":"incoming request"}
{"level":30,"time":1790269691356,"pid":27024,"hostname":"suthi123","reqId":"req-p7","res":{"statusCode":409},"responseTime":0.4790999999968335,"msg":"request completed"}
{"level":30,"time":1790269691356,"pid":27024,"hostname":"suthi123","reqId":"req-p8","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53079},"msg":"incoming request"}
{"level":30,"time":1790269691357,"pid":27024,"hostname":"suthi123","reqId":"req-p8","res":{"statusCode":409},"responseTime":0.43439999999827705,"msg":"request completed"}
{"level":30,"time":1790269691357,"pid":27024,"hostname":"suthi123","reqId":"req-p9","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53080},"msg":"incoming request"}
{"level":30,"time":1790269691357,"pid":27024,"hostname":"suthi123","reqId":"req-p9","res":{"statusCode":409},"responseTime":0.3548000000009779,"msg":"request completed"}
{"level":30,"time":1790269691358,"pid":27024,"hostname":"suthi123","reqId":"req-pa","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53081},"msg":"incoming request"}
{"level":30,"time":1790269691358,"pid":27024,"hostname":"suthi123","reqId":"req-pa","res":{"statusCode":409},"responseTime":0.4801000000152271,"msg":"request completed"}
{"level":30,"time":1790269691358,"pid":27024,"hostname":"suthi123","reqId":"req-pb","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53082},"msg":"incoming request"}
{"level":30,"time":1790269691359,"pid":27024,"hostname":"suthi123","reqId":"req-pb","res":{"statusCode":409},"responseTime":0.5168000000121538,"msg":"request completed"}
{"level":30,"time":1790269691359,"pid":27024,"hostname":"suthi123","reqId":"req-pc","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53083},"msg":"incoming request"}
{"level":30,"time":1790269691359,"pid":27024,"hostname":"suthi123","reqId":"req-pc","res":{"statusCode":409},"responseTime":0.3789000000106171,"msg":"request completed"}
{"level":30,"time":1790269691361,"pid":27024,"hostname":"suthi123","reqId":"req-pd","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53084},"msg":"incoming request"}
{"level":30,"time":1790269691362,"pid":27024,"hostname":"suthi123","reqId":"req-pd","res":{"statusCode":409},"responseTime":0.6117000000085682,"msg":"request completed"}
{"level":30,"time":1790269691362,"pid":27024,"hostname":"suthi123","reqId":"req-pe","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53085},"msg":"incoming request"}
{"level":30,"time":1790269691362,"pid":27024,"hostname":"suthi123","reqId":"req-pe","res":{"statusCode":409},"responseTime":0.3712999999988824,"msg":"request completed"}
{"level":30,"time":1790269691362,"pid":27024,"hostname":"suthi123","reqId":"req-pf","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53086},"msg":"incoming request"}
{"level":30,"time":1790269691363,"pid":27024,"hostname":"suthi123","reqId":"req-pf","res":{"statusCode":409},"responseTime":0.3189000000129454,"msg":"request completed"}
{"level":30,"time":1790269691363,"pid":27024,"hostname":"suthi123","reqId":"req-pg","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53087},"msg":"incoming request"}
{"level":30,"time":1790269691363,"pid":27024,"hostname":"suthi123","reqId":"req-pg","res":{"statusCode":409},"responseTime":0.2902999999932945,"msg":"request completed"}
{"level":30,"time":1790269691363,"pid":27024,"hostname":"suthi123","reqId":"req-ph","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53088},"msg":"incoming request"}
{"level":30,"time":1790269691363,"pid":27024,"hostname":"suthi123","reqId":"req-ph","res":{"statusCode":409},"responseTime":0.28969999999389984,"msg":"request completed"}
{"level":30,"time":1790269691364,"pid":27024,"hostname":"suthi123","reqId":"req-pi","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53089},"msg":"incoming request"}
{"level":30,"time":1790269691364,"pid":27024,"hostname":"suthi123","reqId":"req-pi","res":{"statusCode":409},"responseTime":0.45680000001448207,"msg":"request completed"}
{"level":30,"time":1790269691364,"pid":27024,"hostname":"suthi123","reqId":"req-pj","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53090},"msg":"incoming request"}
{"level":30,"time":1790269691365,"pid":27024,"hostname":"suthi123","reqId":"req-pj","res":{"statusCode":409},"responseTime":0.3633999999728985,"msg":"request completed"}
{"level":30,"time":1790269691365,"pid":27024,"hostname":"suthi123","reqId":"req-pk","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53091},"msg":"incoming request"}
{"level":30,"time":1790269691365,"pid":27024,"hostname":"suthi123","reqId":"req-pk","res":{"statusCode":409},"responseTime":0.2899000000033993,"msg":"request completed"}
{"level":30,"time":1790269691365,"pid":27024,"hostname":"suthi123","reqId":"req-pl","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53092},"msg":"incoming request"}
{"level":30,"time":1790269691366,"pid":27024,"hostname":"suthi123","reqId":"req-pl","res":{"statusCode":409},"responseTime":0.36739999998826534,"msg":"request completed"}
{"level":30,"time":1790269691366,"pid":27024,"hostname":"suthi123","reqId":"req-pm","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53093},"msg":"incoming request"}
{"level":30,"time":1790269691366,"pid":27024,"hostname":"suthi123","reqId":"req-pm","res":{"statusCode":409},"responseTime":0.35190000000875443,"msg":"request completed"}
{"level":30,"time":1790269691366,"pid":27024,"hostname":"suthi123","reqId":"req-pn","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53094},"msg":"incoming request"}
{"level":30,"time":1790269691367,"pid":27024,"hostname":"suthi123","reqId":"req-pn","res":{"statusCode":409},"responseTime":0.33359999998356216,"msg":"request completed"}
{"level":30,"time":1790269691367,"pid":27024,"hostname":"suthi123","reqId":"req-po","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53095},"msg":"incoming request"}
{"level":30,"time":1790269691367,"pid":27024,"hostname":"suthi123","reqId":"req-po","res":{"statusCode":409},"responseTime":0.2991000000038184,"msg":"request completed"}
{"level":30,"time":1790269691368,"pid":27024,"hostname":"suthi123","reqId":"req-pp","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53096},"msg":"incoming request"}
{"level":30,"time":1790269691368,"pid":27024,"hostname":"suthi123","reqId":"req-pp","res":{"statusCode":409},"responseTime":0.30689999999594875,"msg":"request completed"}
{"level":30,"time":1790269691368,"pid":27024,"hostname":"suthi123","reqId":"req-pq","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53097},"msg":"incoming request"}
{"level":30,"time":1790269691369,"pid":27024,"hostname":"suthi123","reqId":"req-pq","res":{"statusCode":409},"responseTime":0.5302000000083353,"msg":"request completed"}
{"level":30,"time":1790269691369,"pid":27024,"hostname":"suthi123","reqId":"req-pr","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53098},"msg":"incoming request"}
{"level":30,"time":1790269691369,"pid":27024,"hostname":"suthi123","reqId":"req-pr","res":{"statusCode":409},"responseTime":0.3989000000001397,"msg":"request completed"}
{"level":30,"time":1790269691369,"pid":27024,"hostname":"suthi123","reqId":"req-ps","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53099},"msg":"incoming request"}
{"level":30,"time":1790269691370,"pid":27024,"hostname":"suthi123","reqId":"req-ps","res":{"statusCode":409},"responseTime":0.40700000000651926,"msg":"request completed"}
{"level":30,"time":1790269691370,"pid":27024,"hostname":"suthi123","reqId":"req-pt","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53100},"msg":"incoming request"}
{"level":30,"time":1790269691371,"pid":27024,"hostname":"suthi123","reqId":"req-pt","res":{"statusCode":409},"responseTime":0.6851000000024214,"msg":"request completed"}
{"level":30,"time":1790269691371,"pid":27024,"hostname":"suthi123","reqId":"req-pu","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53101},"msg":"incoming request"}
{"level":30,"time":1790269691372,"pid":27024,"hostname":"suthi123","reqId":"req-pu","res":{"statusCode":409},"responseTime":0.459900000016205,"msg":"request completed"}
{"level":30,"time":1790269691372,"pid":27024,"hostname":"suthi123","reqId":"req-pv","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53102},"msg":"incoming request"}
{"level":30,"time":1790269691372,"pid":27024,"hostname":"suthi123","reqId":"req-pv","res":{"statusCode":409},"responseTime":0.3513000000093598,"msg":"request completed"}
{"level":30,"time":1790269691372,"pid":27024,"hostname":"suthi123","reqId":"req-pw","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53103},"msg":"incoming request"}
{"level":30,"time":1790269691373,"pid":27024,"hostname":"suthi123","reqId":"req-pw","res":{"statusCode":409},"responseTime":0.30840000000898726,"msg":"request completed"}
{"level":30,"time":1790269691373,"pid":27024,"hostname":"suthi123","reqId":"req-px","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53104},"msg":"incoming request"}
{"level":30,"time":1790269691373,"pid":27024,"hostname":"suthi123","reqId":"req-px","res":{"statusCode":409},"responseTime":0.29050000000279397,"msg":"request completed"}
{"level":30,"time":1790269691373,"pid":27024,"hostname":"suthi123","reqId":"req-py","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53105},"msg":"incoming request"}
{"level":30,"time":1790269691374,"pid":27024,"hostname":"suthi123","reqId":"req-py","res":{"statusCode":409},"responseTime":0.2828000000154134,"msg":"request completed"}
{"level":30,"time":1790269691374,"pid":27024,"hostname":"suthi123","reqId":"req-pz","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53106},"msg":"incoming request"}
{"level":30,"time":1790269691374,"pid":27024,"hostname":"suthi123","reqId":"req-pz","res":{"statusCode":409},"responseTime":0.4153000000223983,"msg":"request completed"}
{"level":30,"time":1790269691374,"pid":27024,"hostname":"suthi123","reqId":"req-q0","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53107},"msg":"incoming request"}
{"level":30,"time":1790269691375,"pid":27024,"hostname":"suthi123","reqId":"req-q0","res":{"statusCode":409},"responseTime":0.36899999997694977,"msg":"request completed"}
{"level":30,"time":1790269691375,"pid":27024,"hostname":"suthi123","reqId":"req-q1","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53108},"msg":"incoming request"}
{"level":30,"time":1790269691376,"pid":27024,"hostname":"suthi123","reqId":"req-q1","res":{"statusCode":409},"responseTime":0.6631999999808613,"msg":"request completed"}
{"level":30,"time":1790269691376,"pid":27024,"hostname":"suthi123","reqId":"req-q2","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53109},"msg":"incoming request"}
{"level":30,"time":1790269691376,"pid":27024,"hostname":"suthi123","reqId":"req-q2","res":{"statusCode":409},"responseTime":0.5125000000116415,"msg":"request completed"}
{"level":30,"time":1790269691376,"pid":27024,"hostname":"suthi123","reqId":"req-q3","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53110},"msg":"incoming request"}
{"level":30,"time":1790269691377,"pid":27024,"hostname":"suthi123","reqId":"req-q3","res":{"statusCode":409},"responseTime":0.6900000000023283,"msg":"request completed"}
{"level":30,"time":1790269691377,"pid":27024,"hostname":"suthi123","reqId":"req-q4","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53111},"msg":"incoming request"}
{"level":30,"time":1790269691378,"pid":27024,"hostname":"suthi123","reqId":"req-q4","res":{"statusCode":409},"responseTime":0.5546000000031199,"msg":"request completed"}
{"level":30,"time":1790269691378,"pid":27024,"hostname":"suthi123","reqId":"req-q5","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53112},"msg":"incoming request"}
{"level":30,"time":1790269691379,"pid":27024,"hostname":"suthi123","reqId":"req-q5","res":{"statusCode":409},"responseTime":0.38159999999334104,"msg":"request completed"}
{"level":30,"time":1790269691379,"pid":27024,"hostname":"suthi123","reqId":"req-q6","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53113},"msg":"incoming request"}
{"level":30,"time":1790269691379,"pid":27024,"hostname":"suthi123","reqId":"req-q6","res":{"statusCode":409},"responseTime":0.4979000000166707,"msg":"request completed"}
{"level":30,"time":1790269691380,"pid":27024,"hostname":"suthi123","reqId":"req-q7","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53114},"msg":"incoming request"}
{"level":30,"time":1790269691380,"pid":27024,"hostname":"suthi123","reqId":"req-q7","res":{"statusCode":409},"responseTime":0.45230000000447035,"msg":"request completed"}
{"level":30,"time":1790269691380,"pid":27024,"hostname":"suthi123","reqId":"req-q8","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53115},"msg":"incoming request"}
{"level":30,"time":1790269691381,"pid":27024,"hostname":"suthi123","reqId":"req-q8","res":{"statusCode":409},"responseTime":0.3961999999883119,"msg":"request completed"}
{"level":30,"time":1790269691381,"pid":27024,"hostname":"suthi123","reqId":"req-q9","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53116},"msg":"incoming request"}
{"level":30,"time":1790269691381,"pid":27024,"hostname":"suthi123","reqId":"req-q9","res":{"statusCode":409},"responseTime":0.40700000000651926,"msg":"request completed"}
{"level":30,"time":1790269691382,"pid":27024,"hostname":"suthi123","reqId":"req-qa","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53117},"msg":"incoming request"}
{"level":30,"time":1790269691382,"pid":27024,"hostname":"suthi123","reqId":"req-qa","res":{"statusCode":409},"responseTime":0.42610000001150183,"msg":"request completed"}
{"level":30,"time":1790269691382,"pid":27024,"hostname":"suthi123","reqId":"req-qb","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53118},"msg":"incoming request"}
{"level":30,"time":1790269691383,"pid":27024,"hostname":"suthi123","reqId":"req-qb","res":{"statusCode":409},"responseTime":0.3286000000080094,"msg":"request completed"}
{"level":30,"time":1790269691383,"pid":27024,"hostname":"suthi123","reqId":"req-qc","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53119},"msg":"incoming request"}
{"level":30,"time":1790269691383,"pid":27024,"hostname":"suthi123","reqId":"req-qc","res":{"statusCode":409},"responseTime":0.3263999999908265,"msg":"request completed"}
{"level":30,"time":1790269691383,"pid":27024,"hostname":"suthi123","reqId":"req-qd","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53120},"msg":"incoming request"}
{"level":30,"time":1790269691383,"pid":27024,"hostname":"suthi123","reqId":"req-qd","res":{"statusCode":409},"responseTime":0.380700000008801,"msg":"request completed"}
{"level":30,"time":1790269691384,"pid":27024,"hostname":"suthi123","reqId":"req-qe","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53121},"msg":"incoming request"}
{"level":30,"time":1790269691384,"pid":27024,"hostname":"suthi123","reqId":"req-qe","res":{"statusCode":409},"responseTime":0.2993999999889638,"msg":"request completed"}
{"level":30,"time":1790269691384,"pid":27024,"hostname":"suthi123","reqId":"req-qf","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53122},"msg":"incoming request"}
{"level":30,"time":1790269691384,"pid":27024,"hostname":"suthi123","reqId":"req-qf","res":{"statusCode":409},"responseTime":0.3326999999990221,"msg":"request completed"}
{"level":30,"time":1790269691385,"pid":27024,"hostname":"suthi123","reqId":"req-qg","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53123},"msg":"incoming request"}
{"level":30,"time":1790269691385,"pid":27024,"hostname":"suthi123","reqId":"req-qg","res":{"statusCode":409},"responseTime":0.33909999998286366,"msg":"request completed"}
{"level":30,"time":1790269691385,"pid":27024,"hostname":"suthi123","reqId":"req-qh","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53124},"msg":"incoming request"}
{"level":30,"time":1790269691385,"pid":27024,"hostname":"suthi123","reqId":"req-qh","res":{"statusCode":409},"responseTime":0.40429999999469146,"msg":"request completed"}
{"level":30,"time":1790269691386,"pid":27024,"hostname":"suthi123","reqId":"req-qi","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53125},"msg":"incoming request"}
{"level":30,"time":1790269691386,"pid":27024,"hostname":"suthi123","reqId":"req-qi","res":{"statusCode":409},"responseTime":0.4646999999822583,"msg":"request completed"}
{"level":30,"time":1790269691386,"pid":27024,"hostname":"suthi123","reqId":"req-qj","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53126},"msg":"incoming request"}
{"level":30,"time":1790269691387,"pid":27024,"hostname":"suthi123","reqId":"req-qj","res":{"statusCode":409},"responseTime":0.4402000000118278,"msg":"request completed"}
{"level":30,"time":1790269691387,"pid":27024,"hostname":"suthi123","reqId":"req-qk","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53127},"msg":"incoming request"}
{"level":30,"time":1790269691387,"pid":27024,"hostname":"suthi123","reqId":"req-qk","res":{"statusCode":409},"responseTime":0.36240000001271255,"msg":"request completed"}
{"level":30,"time":1790269691387,"pid":27024,"hostname":"suthi123","reqId":"req-ql","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53128},"msg":"incoming request"}
{"level":30,"time":1790269691388,"pid":27024,"hostname":"suthi123","reqId":"req-ql","res":{"statusCode":409},"responseTime":0.348599999997532,"msg":"request completed"}
{"level":30,"time":1790269691388,"pid":27024,"hostname":"suthi123","reqId":"req-qm","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53129},"msg":"incoming request"}
{"level":30,"time":1790269691388,"pid":27024,"hostname":"suthi123","reqId":"req-qm","res":{"statusCode":409},"responseTime":0.4661999999952968,"msg":"request completed"}
{"level":30,"time":1790269691388,"pid":27024,"hostname":"suthi123","reqId":"req-qn","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53130},"msg":"incoming request"}
{"level":30,"time":1790269691389,"pid":27024,"hostname":"suthi123","reqId":"req-qn","res":{"statusCode":409},"responseTime":0.3948999999847729,"msg":"request completed"}
{"level":30,"time":1790269691389,"pid":27024,"hostname":"suthi123","reqId":"req-qo","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53131},"msg":"incoming request"}
{"level":30,"time":1790269691389,"pid":27024,"hostname":"suthi123","reqId":"req-qo","res":{"statusCode":409},"responseTime":0.32209999999031425,"msg":"request completed"}
{"level":30,"time":1790269691389,"pid":27024,"hostname":"suthi123","reqId":"req-qp","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53132},"msg":"incoming request"}
{"level":30,"time":1790269691390,"pid":27024,"hostname":"suthi123","reqId":"req-qp","res":{"statusCode":409},"responseTime":0.3288999999931548,"msg":"request completed"}
{"level":30,"time":1790269691390,"pid":27024,"hostname":"suthi123","reqId":"req-qq","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53133},"msg":"incoming request"}
{"level":30,"time":1790269691390,"pid":27024,"hostname":"suthi123","reqId":"req-qq","res":{"statusCode":409},"responseTime":0.28320000000530854,"msg":"request completed"}
{"level":30,"time":1790269691390,"pid":27024,"hostname":"suthi123","reqId":"req-qr","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53134},"msg":"incoming request"}
{"level":30,"time":1790269691391,"pid":27024,"hostname":"suthi123","reqId":"req-qr","res":{"statusCode":409},"responseTime":0.3230000000039581,"msg":"request completed"}
{"level":30,"time":1790269691391,"pid":27024,"hostname":"suthi123","reqId":"req-qs","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53135},"msg":"incoming request"}
{"level":30,"time":1790269691392,"pid":27024,"hostname":"suthi123","reqId":"req-qs","res":{"statusCode":409},"responseTime":0.6244000000006054,"msg":"request completed"}
{"level":30,"time":1790269691392,"pid":27024,"hostname":"suthi123","reqId":"req-qt","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53136},"msg":"incoming request"}
{"level":30,"time":1790269691393,"pid":27024,"hostname":"suthi123","reqId":"req-qt","res":{"statusCode":409},"responseTime":0.5239000000001397,"msg":"request completed"}
{"level":30,"time":1790269691393,"pid":27024,"hostname":"suthi123","reqId":"req-qu","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53137},"msg":"incoming request"}
{"level":30,"time":1790269691393,"pid":27024,"hostname":"suthi123","reqId":"req-qu","res":{"statusCode":409},"responseTime":0.5614999999816064,"msg":"request completed"}
{"level":30,"time":1790269691394,"pid":27024,"hostname":"suthi123","reqId":"req-qv","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53138},"msg":"incoming request"}
{"level":30,"time":1790269691395,"pid":27024,"hostname":"suthi123","reqId":"req-qv","res":{"statusCode":409},"responseTime":1.0297000000136904,"msg":"request completed"}
{"level":30,"time":1790269691395,"pid":27024,"hostname":"suthi123","reqId":"req-qw","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53139},"msg":"incoming request"}
{"level":30,"time":1790269691395,"pid":27024,"hostname":"suthi123","reqId":"req-qw","res":{"statusCode":409},"responseTime":0.44409999999334104,"msg":"request completed"}
{"level":30,"time":1790269691396,"pid":27024,"hostname":"suthi123","reqId":"req-qx","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53140},"msg":"incoming request"}
{"level":30,"time":1790269691396,"pid":27024,"hostname":"suthi123","reqId":"req-qx","res":{"statusCode":409},"responseTime":0.39350000000558794,"msg":"request completed"}
{"level":30,"time":1790269691396,"pid":27024,"hostname":"suthi123","reqId":"req-qy","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53141},"msg":"incoming request"}
{"level":30,"time":1790269691396,"pid":27024,"hostname":"suthi123","reqId":"req-qy","res":{"statusCode":409},"responseTime":0.2993000000133179,"msg":"request completed"}
{"level":30,"time":1790269691397,"pid":27024,"hostname":"suthi123","reqId":"req-qz","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53142},"msg":"incoming request"}
{"level":30,"time":1790269691397,"pid":27024,"hostname":"suthi123","reqId":"req-qz","res":{"statusCode":409},"responseTime":0.33209999999962747,"msg":"request completed"}
{"level":30,"time":1790269691397,"pid":27024,"hostname":"suthi123","reqId":"req-r0","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53143},"msg":"incoming request"}
{"level":30,"time":1790269691397,"pid":27024,"hostname":"suthi123","reqId":"req-r0","res":{"statusCode":409},"responseTime":0.32310000000870787,"msg":"request completed"}
{"level":30,"time":1790269691398,"pid":27024,"hostname":"suthi123","reqId":"req-r1","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53144},"msg":"incoming request"}
{"level":30,"time":1790269691398,"pid":27024,"hostname":"suthi123","reqId":"req-r1","res":{"statusCode":409},"responseTime":0.27749999999650754,"msg":"request completed"}
{"level":30,"time":1790269691398,"pid":27024,"hostname":"suthi123","reqId":"req-r2","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53145},"msg":"incoming request"}
{"level":30,"time":1790269691399,"pid":27024,"hostname":"suthi123","reqId":"req-r2","res":{"statusCode":409},"responseTime":0.5023999999975786,"msg":"request completed"}
{"level":30,"time":1790269691399,"pid":27024,"hostname":"suthi123","reqId":"req-r3","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53146},"msg":"incoming request"}
{"level":30,"time":1790269691399,"pid":27024,"hostname":"suthi123","reqId":"req-r3","res":{"statusCode":409},"responseTime":0.4418000000005122,"msg":"request completed"}
{"level":30,"time":1790269691399,"pid":27024,"hostname":"suthi123","reqId":"req-r4","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53147},"msg":"incoming request"}
{"level":30,"time":1790269691400,"pid":27024,"hostname":"suthi123","reqId":"req-r4","res":{"statusCode":409},"responseTime":0.4021000000066124,"msg":"request completed"}
{"level":30,"time":1790269691400,"pid":27024,"hostname":"suthi123","reqId":"req-r5","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53148},"msg":"incoming request"}
{"level":30,"time":1790269691400,"pid":27024,"hostname":"suthi123","reqId":"req-r5","res":{"statusCode":409},"responseTime":0.4271000000007916,"msg":"request completed"}
{"level":30,"time":1790269691400,"pid":27024,"hostname":"suthi123","reqId":"req-r6","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53149},"msg":"incoming request"}
{"level":30,"time":1790269691401,"pid":27024,"hostname":"suthi123","reqId":"req-r6","res":{"statusCode":409},"responseTime":0.33859999998821877,"msg":"request completed"}
{"level":30,"time":1790269691401,"pid":27024,"hostname":"suthi123","reqId":"req-r7","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53150},"msg":"incoming request"}
{"level":30,"time":1790269691401,"pid":27024,"hostname":"suthi123","reqId":"req-r7","res":{"statusCode":409},"responseTime":0.2814000000071246,"msg":"request completed"}
{"level":30,"time":1790269691401,"pid":27024,"hostname":"suthi123","reqId":"req-r8","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53151},"msg":"incoming request"}
{"level":30,"time":1790269691402,"pid":27024,"hostname":"suthi123","reqId":"req-r8","res":{"statusCode":409},"responseTime":0.35469999999622814,"msg":"request completed"}
{"level":30,"time":1790269691402,"pid":27024,"hostname":"suthi123","reqId":"req-r9","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53152},"msg":"incoming request"}
{"level":30,"time":1790269691402,"pid":27024,"hostname":"suthi123","reqId":"req-r9","res":{"statusCode":409},"responseTime":0.5525999999954365,"msg":"request completed"}
{"level":30,"time":1790269691402,"pid":27024,"hostname":"suthi123","reqId":"req-ra","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53153},"msg":"incoming request"}
{"level":30,"time":1790269691403,"pid":27024,"hostname":"suthi123","reqId":"req-ra","res":{"statusCode":409},"responseTime":0.40270000000600703,"msg":"request completed"}
{"level":30,"time":1790269691403,"pid":27024,"hostname":"suthi123","reqId":"req-rb","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53154},"msg":"incoming request"}
{"level":30,"time":1790269691403,"pid":27024,"hostname":"suthi123","reqId":"req-rb","res":{"statusCode":409},"responseTime":0.27999999999883585,"msg":"request completed"}
{"level":30,"time":1790269691403,"pid":27024,"hostname":"suthi123","reqId":"req-rc","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53155},"msg":"incoming request"}
{"level":30,"time":1790269691404,"pid":27024,"hostname":"suthi123","reqId":"req-rc","res":{"statusCode":409},"responseTime":0.28070000000298023,"msg":"request completed"}
{"level":30,"time":1790269691404,"pid":27024,"hostname":"suthi123","reqId":"req-rd","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53156},"msg":"incoming request"}
{"level":30,"time":1790269691404,"pid":27024,"hostname":"suthi123","reqId":"req-rd","res":{"statusCode":409},"responseTime":0.44779999999445863,"msg":"request completed"}
{"level":30,"time":1790269691405,"pid":27024,"hostname":"suthi123","reqId":"req-re","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53157},"msg":"incoming request"}
{"level":30,"time":1790269691405,"pid":27024,"hostname":"suthi123","reqId":"req-re","res":{"statusCode":409},"responseTime":0.6486999999906402,"msg":"request completed"}
{"level":30,"time":1790269691406,"pid":27024,"hostname":"suthi123","reqId":"req-rf","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53158},"msg":"incoming request"}
{"level":30,"time":1790269691407,"pid":27024,"hostname":"suthi123","reqId":"req-rf","res":{"statusCode":409},"responseTime":0.9661999999952968,"msg":"request completed"}
{"level":30,"time":1790269691407,"pid":27024,"hostname":"suthi123","reqId":"req-rg","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53159},"msg":"incoming request"}
{"level":30,"time":1790269691407,"pid":27024,"hostname":"suthi123","reqId":"req-rg","res":{"statusCode":409},"responseTime":0.43989999999757856,"msg":"request completed"}
{"level":30,"time":1790269691407,"pid":27024,"hostname":"suthi123","reqId":"req-rh","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53160},"msg":"incoming request"}
{"level":30,"time":1790269691408,"pid":27024,"hostname":"suthi123","reqId":"req-rh","res":{"statusCode":409},"responseTime":0.38479999999981374,"msg":"request completed"}
{"level":30,"time":1790269691408,"pid":27024,"hostname":"suthi123","reqId":"req-ri","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53161},"msg":"incoming request"}
{"level":30,"time":1790269691408,"pid":27024,"hostname":"suthi123","reqId":"req-ri","res":{"statusCode":409},"responseTime":0.37309999999706633,"msg":"request completed"}
{"level":30,"time":1790269691408,"pid":27024,"hostname":"suthi123","reqId":"req-rj","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53162},"msg":"incoming request"}
{"level":30,"time":1790269691409,"pid":27024,"hostname":"suthi123","reqId":"req-rj","res":{"statusCode":409},"responseTime":0.25759999998263083,"msg":"request completed"}
{"level":30,"time":1790269691409,"pid":27024,"hostname":"suthi123","reqId":"req-rk","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53163},"msg":"incoming request"}
{"level":30,"time":1790269691409,"pid":27024,"hostname":"suthi123","reqId":"req-rk","res":{"statusCode":409},"responseTime":0.5174999999871943,"msg":"request completed"}
{"level":30,"time":1790269691410,"pid":27024,"hostname":"suthi123","reqId":"req-rl","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53164},"msg":"incoming request"}
{"level":30,"time":1790269691410,"pid":27024,"hostname":"suthi123","reqId":"req-rl","res":{"statusCode":409},"responseTime":0.452499999984866,"msg":"request completed"}
{"level":30,"time":1790269691410,"pid":27024,"hostname":"suthi123","reqId":"req-rm","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53165},"msg":"incoming request"}
{"level":30,"time":1790269691410,"pid":27024,"hostname":"suthi123","reqId":"req-rm","res":{"statusCode":409},"responseTime":0.29819999999017455,"msg":"request completed"}
{"level":30,"time":1790269691411,"pid":27024,"hostname":"suthi123","reqId":"req-rn","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53166},"msg":"incoming request"}
{"level":30,"time":1790269691411,"pid":27024,"hostname":"suthi123","reqId":"req-rn","res":{"statusCode":409},"responseTime":0.2816000000166241,"msg":"request completed"}
{"level":30,"time":1790269691411,"pid":27024,"hostname":"suthi123","reqId":"req-ro","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53167},"msg":"incoming request"}
{"level":30,"time":1790269691411,"pid":27024,"hostname":"suthi123","reqId":"req-ro","res":{"statusCode":409},"responseTime":0.4200000000128057,"msg":"request completed"}
{"level":30,"time":1790269691411,"pid":27024,"hostname":"suthi123","reqId":"req-rp","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53168},"msg":"incoming request"}
{"level":30,"time":1790269691412,"pid":27024,"hostname":"suthi123","reqId":"req-rp","res":{"statusCode":409},"responseTime":0.4402000000118278,"msg":"request completed"}
{"level":30,"time":1790269691412,"pid":27024,"hostname":"suthi123","reqId":"req-rq","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53169},"msg":"incoming request"}
{"level":30,"time":1790269691413,"pid":27024,"hostname":"suthi123","reqId":"req-rq","res":{"statusCode":409},"responseTime":0.4073000000207685,"msg":"request completed"}
{"level":30,"time":1790269691413,"pid":27024,"hostname":"suthi123","reqId":"req-rr","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53170},"msg":"incoming request"}
{"level":30,"time":1790269691413,"pid":27024,"hostname":"suthi123","reqId":"req-rr","res":{"statusCode":409},"responseTime":0.37880000000586733,"msg":"request completed"}
{"level":30,"time":1790269691413,"pid":27024,"hostname":"suthi123","reqId":"req-rs","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53171},"msg":"incoming request"}
{"level":30,"time":1790269691413,"pid":27024,"hostname":"suthi123","reqId":"req-rs","res":{"statusCode":409},"responseTime":0.30939999999827705,"msg":"request completed"}
{"level":30,"time":1790269691414,"pid":27024,"hostname":"suthi123","reqId":"req-rt","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53172},"msg":"incoming request"}
{"level":30,"time":1790269691414,"pid":27024,"hostname":"suthi123","reqId":"req-rt","res":{"statusCode":409},"responseTime":0.3926999999966938,"msg":"request completed"}
{"level":30,"time":1790269691414,"pid":27024,"hostname":"suthi123","reqId":"req-ru","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53173},"msg":"incoming request"}
{"level":30,"time":1790269691415,"pid":27024,"hostname":"suthi123","reqId":"req-ru","res":{"statusCode":409},"responseTime":0.44089999998686835,"msg":"request completed"}
{"level":30,"time":1790269691415,"pid":27024,"hostname":"suthi123","reqId":"req-rv","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53174},"msg":"incoming request"}
{"level":30,"time":1790269691415,"pid":27024,"hostname":"suthi123","reqId":"req-rv","res":{"statusCode":409},"responseTime":0.6507999999739695,"msg":"request completed"}
{"level":30,"time":1790269691416,"pid":27024,"hostname":"suthi123","reqId":"req-rw","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53175},"msg":"incoming request"}
{"level":30,"time":1790269691416,"pid":27024,"hostname":"suthi123","reqId":"req-rw","res":{"statusCode":409},"responseTime":0.4609000000054948,"msg":"request completed"}
{"level":30,"time":1790269691416,"pid":27024,"hostname":"suthi123","reqId":"req-rx","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53176},"msg":"incoming request"}
{"level":30,"time":1790269691417,"pid":27024,"hostname":"suthi123","reqId":"req-rx","res":{"statusCode":409},"responseTime":0.36669999998412095,"msg":"request completed"}
{"level":30,"time":1790269691417,"pid":27024,"hostname":"suthi123","reqId":"req-ry","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53177},"msg":"incoming request"}
{"level":30,"time":1790269691417,"pid":27024,"hostname":"suthi123","reqId":"req-ry","res":{"statusCode":409},"responseTime":0.3467999999993481,"msg":"request completed"}
{"level":30,"time":1790269691417,"pid":27024,"hostname":"suthi123","reqId":"req-rz","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53178},"msg":"incoming request"}
{"level":30,"time":1790269691418,"pid":27024,"hostname":"suthi123","reqId":"req-rz","res":{"statusCode":409},"responseTime":0.5002000000094995,"msg":"request completed"}
{"level":30,"time":1790269691418,"pid":27024,"hostname":"suthi123","reqId":"req-s0","req":{"method":"POST","url":"/buy","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53179},"msg":"incoming request"}
{"level":30,"time":1790269691420,"pid":27024,"hostname":"suthi123","reqId":"req-s0","res":{"statusCode":409},"responseTime":1.0883000000030734,"msg":"request completed"}
{"level":30,"time":1790269691422,"pid":27024,"hostname":"suthi123","reqId":"req-es","res":{"statusCode":200},"responseTime":327.3857999999891,"msg":"request completed"}
{"level":30,"time":1790269691447,"pid":27024,"hostname":"suthi123","reqId":"req-et","res":{"statusCode":200},"responseTime":350.65030000000843,"msg":"request completed"}
{"level":30,"time":1790269691454,"pid":27024,"hostname":"suthi123","reqId":"req-eu","res":{"statusCode":200},"responseTime":355.4114999999874,"msg":"request completed"}
{"level":30,"time":1790269691461,"pid":27024,"hostname":"suthi123","reqId":"req-ev","res":{"statusCode":200},"responseTime":359.3405999999959,"msg":"request completed"}
{"level":30,"time":1790269691471,"pid":27024,"hostname":"suthi123","reqId":"req-e7","res":{"statusCode":200},"responseTime":431.82730000000447,"msg":"request completed"}
{"level":30,"time":1790269691481,"pid":27024,"hostname":"suthi123","reqId":"req-ew","res":{"statusCode":200},"responseTime":377.1907000000065,"msg":"request completed"}
{"level":30,"time":1790269691482,"pid":27024,"hostname":"suthi123","reqId":"req-e8","res":{"statusCode":200},"responseTime":441.3212000000058,"msg":"request completed"}
{"level":30,"time":1790269691483,"pid":27024,"hostname":"suthi123","reqId":"req-eb","res":{"statusCode":200},"responseTime":431.796399999992,"msg":"request completed"}
{"level":30,"time":1790269691484,"pid":27024,"hostname":"suthi123","reqId":"req-e9","res":{"statusCode":200},"responseTime":438.51979999998,"msg":"request completed"}
{"level":30,"time":1790269691484,"pid":27024,"hostname":"suthi123","reqId":"req-ea","res":{"statusCode":200},"responseTime":436.24950000000536,"msg":"request completed"}
{"level":30,"time":1790269691485,"pid":27024,"hostname":"suthi123","reqId":"req-ex","res":{"statusCode":200},"responseTime":380.63959999999497,"msg":"request completed"}
{"level":30,"time":1790269691486,"pid":27024,"hostname":"suthi123","reqId":"req-ef","res":{"statusCode":200},"responseTime":410.8380999999936,"msg":"request completed"}
{"level":30,"time":1790269691486,"pid":27024,"hostname":"suthi123","reqId":"req-ee","res":{"statusCode":200},"responseTime":412.8752000000095,"msg":"request completed"}
{"level":30,"time":1790269691487,"pid":27024,"hostname":"suthi123","reqId":"req-eg","res":{"statusCode":200},"responseTime":410.37630000000354,"msg":"request completed"}
{"level":30,"time":1790269691487,"pid":27024,"hostname":"suthi123","reqId":"req-ec","res":{"statusCode":200},"responseTime":425.27799999999115,"msg":"request completed"}
{"level":30,"time":1790269691492,"pid":27024,"hostname":"suthi123","reqId":"req-ek","res":{"statusCode":200},"responseTime":410.17440000001807,"msg":"request completed"}
{"level":30,"time":1790269691493,"pid":27024,"hostname":"suthi123","reqId":"req-f2","res":{"statusCode":200},"responseTime":386.5435999999754,"msg":"request completed"}
{"level":30,"time":1790269691493,"pid":27024,"hostname":"suthi123","reqId":"req-eh","res":{"statusCode":200},"responseTime":415.8417999999947,"msg":"request completed"}
{"level":30,"time":1790269691494,"pid":27024,"hostname":"suthi123","reqId":"req-f1","res":{"statusCode":200},"responseTime":387.5991999999969,"msg":"request completed"}
{"level":30,"time":1790269691494,"pid":27024,"hostname":"suthi123","reqId":"req-ej","res":{"statusCode":200},"responseTime":412.95470000000205,"msg":"request completed"}
{"level":30,"time":1790269691495,"pid":27024,"hostname":"suthi123","reqId":"req-ez","res":{"statusCode":200},"responseTime":389.3542000000016,"msg":"request completed"}
{"level":30,"time":1790269691495,"pid":27024,"hostname":"suthi123","reqId":"req-f6","res":{"statusCode":200},"responseTime":375.75640000001295,"msg":"request completed"}
{"level":30,"time":1790269691495,"pid":27024,"hostname":"suthi123","reqId":"req-ey","res":{"statusCode":200},"responseTime":390.7441000000108,"msg":"request completed"}
{"level":30,"time":1790269691496,"pid":27024,"hostname":"suthi123","reqId":"req-f3","res":{"statusCode":200},"responseTime":389.0011999999988,"msg":"request completed"}
{"level":30,"time":1790269691496,"pid":27024,"hostname":"suthi123","reqId":"req-el","res":{"statusCode":200},"responseTime":412.6128000000026,"msg":"request completed"}
{"level":30,"time":1790269691496,"pid":27024,"hostname":"suthi123","reqId":"req-ed","res":{"statusCode":200},"responseTime":425.1033999999927,"msg":"request completed"}
{"level":30,"time":1790269691497,"pid":27024,"hostname":"suthi123","reqId":"req-f0","res":{"statusCode":200},"responseTime":391.0032000000065,"msg":"request completed"}
{"level":30,"time":1790269691497,"pid":27024,"hostname":"suthi123","reqId":"req-em","res":{"statusCode":200},"responseTime":412.47260000000824,"msg":"request completed"}
{"level":30,"time":1790269691497,"pid":27024,"hostname":"suthi123","reqId":"req-f4","res":{"statusCode":200},"responseTime":379.37160000001313,"msg":"request completed"}
{"level":30,"time":1790269691498,"pid":27024,"hostname":"suthi123","reqId":"req-ei","res":{"statusCode":200},"responseTime":418.1274000000267,"msg":"request completed"}
{"level":30,"time":1790269691498,"pid":27024,"hostname":"suthi123","reqId":"req-en","res":{"statusCode":200},"responseTime":412.5768000000098,"msg":"request completed"}
{"level":30,"time":1790269691498,"pid":27024,"hostname":"suthi123","reqId":"req-ep","res":{"statusCode":200},"responseTime":408.3506000000052,"msg":"request completed"}
{"level":30,"time":1790269691499,"pid":27024,"hostname":"suthi123","reqId":"req-f5","res":{"statusCode":200},"responseTime":380.10250000000815,"msg":"request completed"}
{"level":30,"time":1790269691506,"pid":27024,"hostname":"suthi123","reqId":"req-f7","res":{"statusCode":200},"responseTime":386.6255999999994,"msg":"request completed"}
{"level":30,"time":1790269691507,"pid":27024,"hostname":"suthi123","reqId":"req-eo","res":{"statusCode":200},"responseTime":419.40810000000056,"msg":"request completed"}
{"level":30,"time":1790269691507,"pid":27024,"hostname":"suthi123","reqId":"req-f8","res":{"statusCode":200},"responseTime":387.3175999999803,"msg":"request completed"}
{"level":30,"time":1790269691508,"pid":27024,"hostname":"suthi123","reqId":"req-fa","res":{"statusCode":200},"responseTime":386.9089999999851,"msg":"request completed"}
{"level":30,"time":1790269691508,"pid":27024,"hostname":"suthi123","reqId":"req-f9","res":{"statusCode":200},"responseTime":387.73359999997774,"msg":"request completed"}
{"level":30,"time":1790269691508,"pid":27024,"hostname":"suthi123","reqId":"req-fn","res":{"statusCode":200},"responseTime":377.58480000001146,"msg":"request completed"}
{"level":30,"time":1790269691509,"pid":27024,"hostname":"suthi123","reqId":"req-fg","res":{"statusCode":200},"responseTime":380.44229999999516,"msg":"request completed"}
{"level":30,"time":1790269691509,"pid":27024,"hostname":"suthi123","reqId":"req-fd","res":{"statusCode":200},"responseTime":383.58070000002044,"msg":"request completed"}
{"level":30,"time":1790269691509,"pid":27024,"hostname":"suthi123","reqId":"req-fb","res":{"statusCode":200},"responseTime":386.5127999999968,"msg":"request completed"}
{"level":30,"time":1790269691510,"pid":27024,"hostname":"suthi123","reqId":"req-fo","res":{"statusCode":200},"responseTime":378.6909999999916,"msg":"request completed"}
{"level":30,"time":1790269691510,"pid":27024,"hostname":"suthi123","reqId":"req-ff","res":{"statusCode":200},"responseTime":383.37899999998626,"msg":"request completed"}
{"level":30,"time":1790269691510,"pid":27024,"hostname":"suthi123","reqId":"req-fj","res":{"statusCode":200},"responseTime":380.87669999999343,"msg":"request completed"}
{"level":30,"time":1790269691511,"pid":27024,"hostname":"suthi123","reqId":"req-fh","res":{"statusCode":200},"responseTime":382.000400000019,"msg":"request completed"}
{"level":30,"time":1790269691511,"pid":27024,"hostname":"suthi123","reqId":"req-fe","res":{"statusCode":200},"responseTime":384.67169999997714,"msg":"request completed"}
{"level":30,"time":1790269691511,"pid":27024,"hostname":"suthi123","reqId":"req-fp","res":{"statusCode":200},"responseTime":379.84660000001895,"msg":"request completed"}
{"level":30,"time":1790269691512,"pid":27024,"hostname":"suthi123","reqId":"req-fk","res":{"statusCode":200},"responseTime":381.58480000001146,"msg":"request completed"}
{"level":30,"time":1790269691512,"pid":27024,"hostname":"suthi123","reqId":"req-fl","res":{"statusCode":200},"responseTime":381.77599999998347,"msg":"request completed"}
{"level":30,"time":1790269691513,"pid":27024,"hostname":"suthi123","reqId":"req-fc","res":{"statusCode":200},"responseTime":389.8715000000084,"msg":"request completed"}
{"level":30,"time":1790269691514,"pid":27024,"hostname":"suthi123","reqId":"req-fm","res":{"statusCode":200},"responseTime":383.6681000000099,"msg":"request completed"}
{"level":30,"time":1790269691517,"pid":27024,"hostname":"suthi123","reqId":"req-fi","res":{"statusCode":200},"responseTime":387.32050000000163,"msg":"request completed"}
{"level":30,"time":1790269691518,"pid":27024,"hostname":"suthi123","reqId":"req-fq","res":{"statusCode":200},"responseTime":386.01679999998305,"msg":"request completed"}
{"level":30,"time":1790269691519,"pid":27024,"hostname":"suthi123","reqId":"req-g2","res":{"statusCode":200},"responseTime":379.2878999999957,"msg":"request completed"}
{"level":30,"time":1790269691519,"pid":27024,"hostname":"suthi123","reqId":"req-fs","res":{"statusCode":200},"responseTime":386.81019999997807,"msg":"request completed"}
{"level":30,"time":1790269691520,"pid":27024,"hostname":"suthi123","reqId":"req-ft","res":{"statusCode":200},"responseTime":386.7899000000034,"msg":"request completed"}
{"level":30,"time":1790269691520,"pid":27024,"hostname":"suthi123","reqId":"req-fr","res":{"statusCode":200},"responseTime":387.95100000000093,"msg":"request completed"}
{"level":30,"time":1790269691520,"pid":27024,"hostname":"suthi123","reqId":"req-fw","res":{"statusCode":200},"responseTime":383.9353000000119,"msg":"request completed"}
{"level":30,"time":1790269691521,"pid":27024,"hostname":"suthi123","reqId":"req-g6","res":{"statusCode":200},"responseTime":380.0174999999872,"msg":"request completed"}
{"level":30,"time":1790269691521,"pid":27024,"hostname":"suthi123","reqId":"req-g1","res":{"statusCode":200},"responseTime":381.79099999999744,"msg":"request completed"}
{"level":30,"time":1790269691521,"pid":27024,"hostname":"suthi123","reqId":"req-fy","res":{"statusCode":200},"responseTime":383.81119999999646,"msg":"request completed"}
{"level":30,"time":1790269691521,"pid":27024,"hostname":"suthi123","reqId":"req-fx","res":{"statusCode":200},"responseTime":384.72139999998035,"msg":"request completed"}
{"level":30,"time":1790269691522,"pid":27024,"hostname":"suthi123","reqId":"req-g0","res":{"statusCode":200},"responseTime":383.14969999997993,"msg":"request completed"}
{"level":30,"time":1790269691522,"pid":27024,"hostname":"suthi123","reqId":"req-fu","res":{"statusCode":200},"responseTime":388.3105000000214,"msg":"request completed"}
{"level":30,"time":1790269691522,"pid":27024,"hostname":"suthi123","reqId":"req-g3","res":{"statusCode":200},"responseTime":382.57379999998375,"msg":"request completed"}
{"level":30,"time":1790269691523,"pid":27024,"hostname":"suthi123","reqId":"req-fz","res":{"statusCode":200},"responseTime":384.5612999999721,"msg":"request completed"}
{"level":30,"time":1790269691523,"pid":27024,"hostname":"suthi123","reqId":"req-g4","res":{"statusCode":200},"responseTime":382.81339999998454,"msg":"request completed"}
{"level":30,"time":1790269691523,"pid":27024,"hostname":"suthi123","reqId":"req-g5","res":{"statusCode":200},"responseTime":383.0080999999773,"msg":"request completed"}
{"level":30,"time":1790269691524,"pid":27024,"hostname":"suthi123","reqId":"req-fv","res":{"statusCode":200},"responseTime":388.56950000001234,"msg":"request completed"}
{"level":30,"time":1790269691531,"pid":27024,"hostname":"suthi123","reqId":"req-g7","res":{"statusCode":200},"responseTime":389.95350000000326,"msg":"request completed"}
{"level":30,"time":1790269691532,"pid":27024,"hostname":"suthi123","reqId":"req-ga","res":{"statusCode":200},"responseTime":389.2576999999874,"msg":"request completed"}
{"level":30,"time":1790269691532,"pid":27024,"hostname":"suthi123","reqId":"req-gp","res":{"statusCode":200},"responseTime":380.81340000001364,"msg":"request completed"}
{"level":30,"time":1790269691533,"pid":27024,"hostname":"suthi123","reqId":"req-g8","res":{"statusCode":200},"responseTime":391.5907999999763,"msg":"request completed"}
{"level":30,"time":1790269691534,"pid":27024,"hostname":"suthi123","reqId":"req-gd","res":{"statusCode":200},"responseTime":389.31200000000536,"msg":"request completed"}
{"level":30,"time":1790269691534,"pid":27024,"hostname":"suthi123","reqId":"req-gc","res":{"statusCode":200},"responseTime":391.0841000000073,"msg":"request completed"}
{"level":30,"time":1790269691534,"pid":27024,"hostname":"suthi123","reqId":"req-gm","res":{"statusCode":200},"responseTime":383.49770000000717,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gj","res":{"statusCode":200},"responseTime":384.3233000000182,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gg","res":{"statusCode":200},"responseTime":385.8032999999996,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gf","res":{"statusCode":200},"responseTime":386.47339999998803,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gk","res":{"statusCode":200},"responseTime":384.59270000000834,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gb","res":{"statusCode":200},"responseTime":392.56299999999464,"msg":"request completed"}
{"level":30,"time":1790269691535,"pid":27024,"hostname":"suthi123","reqId":"req-gi","res":{"statusCode":200},"responseTime":385.40770000001066,"msg":"request completed"}
{"level":30,"time":1790269691536,"pid":27024,"hostname":"suthi123","reqId":"req-ge","res":{"statusCode":200},"responseTime":389.34330000000773,"msg":"request completed"}
{"level":30,"time":1790269691536,"pid":27024,"hostname":"suthi123","reqId":"req-go","res":{"statusCode":200},"responseTime":384.55340000000433,"msg":"request completed"}
{"level":30,"time":1790269691536,"pid":27024,"hostname":"suthi123","reqId":"req-gh","res":{"statusCode":200},"responseTime":386.3359000000055,"msg":"request completed"}
{"level":30,"time":1790269691536,"pid":27024,"hostname":"suthi123","reqId":"req-gq","res":{"statusCode":200},"responseTime":384.5593999999983,"msg":"request completed"}
{"level":30,"time":1790269691536,"pid":27024,"hostname":"suthi123","reqId":"req-gn","res":{"statusCode":200},"responseTime":385.2676999999967,"msg":"request completed"}
{"level":30,"time":1790269691537,"pid":27024,"hostname":"suthi123","reqId":"req-g9","res":{"statusCode":200},"responseTime":394.5176999999967,"msg":"request completed"}
{"level":30,"time":1790269691537,"pid":27024,"hostname":"suthi123","reqId":"req-gl","res":{"statusCode":200},"responseTime":385.9658000000054,"msg":"request completed"}
{"level":30,"time":1790269691541,"pid":27024,"hostname":"suthi123","reqId":"req-gr","res":{"statusCode":200},"responseTime":388.9158999999927,"msg":"request completed"}
{"level":30,"time":1790269691549,"pid":27024,"hostname":"suthi123","reqId":"req-gs","res":{"statusCode":200},"responseTime":396.83619999999064,"msg":"request completed"}
{"level":30,"time":1790269691549,"pid":27024,"hostname":"suthi123","reqId":"req-gw","res":{"statusCode":200},"responseTime":396.3323000000091,"msg":"request completed"}
{"level":30,"time":1790269691550,"pid":27024,"hostname":"suthi123","reqId":"req-gv","res":{"statusCode":200},"responseTime":396.8242999999784,"msg":"request completed"}
{"level":30,"time":1790269691550,"pid":27024,"hostname":"suthi123","reqId":"req-gu","res":{"statusCode":200},"responseTime":397.86410000000615,"msg":"request completed"}
{"level":30,"time":1790269691551,"pid":27024,"hostname":"suthi123","reqId":"req-gt","res":{"statusCode":200},"responseTime":398.5382999999856,"msg":"request completed"}
{"level":30,"time":1790269691553,"pid":27024,"hostname":"suthi123","reqId":"req-s1","req":{"method":"GET","url":"/status","host":"localhost:3000","remoteAddress":"127.0.0.1","remotePort":53031},"msg":"incoming request"}
✅ STATUS ENDPOINT HIT
{"level":30,"time":1790269691558,"pid":27024,"hostname":"suthi123","reqId":"req-s1","res":{"statusCode":200},"responseTime":4.421100000006845,"msg":"request completed"}


Microsoft Windows [Version 10.0.26200.9550]
(c) Microsoft Corporation. All rights reserved.

C:\Users\suthikshan k\Desktop\ticket>docker compose up -d postgres
[+] up 20/20
 ✔ Image postgres:16           Pulled                           55.5s
 ✔ Network ticket_default      Created                           0.6s
 ✔ Volume ticket_pgdata        Created                           0.2s
 ✔ Container ticket-postgres-1 Started                           0.8s

C:\Users\suthikshan k\Desktop\ticket>docker compose ps
NAME                IMAGE         COMMAND                  SERVICE    CREATED          STATUS                    PORTS
ticket-postgres-1   postgres:16   "docker-entrypoint.s…"   postgres   27 seconds ago   Up 26 seconds (healthy)   0.0.0.0:5432->5432/tcp, [::]:5432->5432/tcp

C:\Users\suthikshan k\Desktop\ticket>docker exec -it ticket-pg psql -U ticket -d tickets -c "\dt"

What's next:
    Try Docker Debug for seamless, persistent debugging tools in any container or image → docker debug ticket-pg
    Learn more at https://docs.docker.com/go/debug-cli/
Error response from daemon: No such container: ticket-pg

C:\Users\suthikshan k\Desktop\ticket>



Microsoft Windows [Version 10.0.26200.9550]
(c) Microsoft Corporation. All rights reserved.

C:\Users\suthikshan k\Desktop\ticket>cd C:\Users\suthikshan k\Desktop\ticket\buyer

C:\Users\suthikshan k\Desktop\ticket\buyer>node src/load.js

🎯 TARGET: 100 tickets
⚔️  ATTACK: 500 concurrent requests

1. Resetting seller...
✅ Seller reset.

2. Firing concurrent requests...
✅ All requests completed.

📊 RESULTS:
   Total Requests:      500
   Successful (200 OK): 100
   Sold Out (409):      400
   Unique Tickets Issued: 100
   Max Allowed:         100

🔍 INVARIANT CHECKS:
   [✅ PASS] Invariant 1: Never oversell (Sold 100 <= 100)
   [✅ PASS] Invariant 2: No duplicate ticket numbers

3. Verifying /status truth...
   [✅ PASS] Invariant 4: /status matches issued tickets (Server says 100, we got 100)

🏁 TEST COMPLETE. If you see ❌ FAIL, the naive implementation is successfully broken!

C:\Users\suthikshan k\Desktop\ticket\buyer>node src/load.js > ..\results\naive-run.txt

C:\Users\suthikshan k\Desktop\ticket\buyer>
C:\Users\suthikshan k\Desktop\ticket\buyer>

Successfully proved the naive in-memory counter oversells under concurrent load.