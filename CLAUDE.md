# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BVA Decision Intelligence Platform - A multi-agent research platform for analyzing Board of Veterans' Appeals decisions using AI-powered semantic search, outcome extraction, and automated report generation. Single-user, local-first architecture designed for legal practitioners.

**Current Status**: Phase 1 (Foundation) complete. Ready for Phase 2 (Hybrid Search).

## Essential Commands

### Development
```bash
npm run dev              # Start Next.js dev server (localhost:3000)
npm run build            # Production build with type checking
npm run lint             # ESLint check
```

### Database (Drizzle ORM + SQLite)
```bash
npm run db:generate      # Generate migrations from schema changes
npm run db:migrate       # Apply migrations to database
npm run db:studio        # Open Drizzle Studio (GUI for database)
```

### Infrastructure
```bash
docker-compose up -d     # Start Qdrant vector database (required)
docker-compose down      # Stop Qdrant
docker ps | grep qdrant  # Check if Qdrant is running
```

### Running Scripts
```bash
npx tsx scripts/verify-setup.ts    # Verify all services are working
npx tsx scripts/sync.ts             # Sync BVA decisions (create this script)
```

## Architecture Overview

### Three-Tier Data System

1. **SQLite Database** (`lib/db/`)
   - Primary data store using Drizzle ORM with `@libsql/client`
   - 6 tables: `decisions`, `research_runs`, `reports`, `agent_logs`, `cost_tracking`, `sync_metadata`
   - JSON columns store structured data (paragraphs, outcomes, agent artifacts)
   - Timestamps stored as integers (Unix epoch) using `{ mode: 'timestamp' }`
   - Schema is source of truth - modify `lib/db/schema.ts` then run `npm run db:generate`

2. **Qdrant Vector Database** (`lib/vector/`)
   - Runs in Docker container (port 6333)
   - Two collections: `bva_decisions` (full text), `bva_decision_sections` (granular)
   - 768-dimensional embeddings from Gemini text-embedding-004
   - Used for semantic search alongside SQLite full-text search
   - Initialize with `initializeCollections()` before first use

3. **BVA API** (`lib/bva-api/`)
   - External source: `https://bva-api-1013743482040.us-central1.run.app`
   - No authentication required
   - Pagination: max 100 results per request, use `offset`/`limit`
   - Rate limit via 500ms delay between requests in sync service

### Multi-Agent System (Phase 4+)

Event-driven orchestration with 7 specialized agents that execute in phases:
1. **Planner** → 2. **Retriever** → 3. **Extractor** → 4. **Outcome Analyst** → 5. **Synthesizer** → 6. **Citation QA** → 7. **Report Writer**

Each phase:
- Saves state to `research_runs.artifacts` (JSON column) and disk (`/data/artifacts/{runId}/{phase}.json`)
- Enables resumable sessions after interruption
- Tracks tokens/cost in `cost_tracking` table

**Agent Model Assignment**:
- **Gemini Flash (free)**: Planner, Citation QA, query optimization
- **Gemini Pro (paid)**: Extractor, Outcome Analyst, Synthesizer, Report Writer

### LLM Integration (`lib/llm/openrouter.ts`)

- Uses OpenRouter API with `openai` client library (compatible interface)
- Base URL: `https://openrouter.ai/api/v1`
- Models configured in `GEMINI_MODELS` constant
- Cost tracking: Calculate from token counts using `costPerMToken` rates
- Singleton clients: `flashClient` and `proClient` exported for convenience

**Important**: Embedding generation not yet implemented - throws error with instructions to use Google AI API directly.

### Decision Sync Flow

1. `BVAApiClient.searchDecisions()` - Fetch decision summaries (paginated)
2. `BVAApiClient.getDecision(citationNumber)` - Get full decision details
3. `parseBVADecision()` - Transform API format to database schema
4. `flashClient.generate()` - Extract outcome classification (AI-powered)
5. `db.insert(decisions)` - Store with `onConflictDoUpdate` for idempotency
6. Repeat with rate limiting (100ms delay between decisions)

**Outcome Extraction**: Uses Gemini Flash with temperature=0.1 to classify as Granted/Denied/Remanded/Mixed with confidence score. First 4000 chars of decision text sent to LLM.

## Critical Implementation Details

### Database JSON Columns Pattern
```typescript
// Drizzle uses { mode: 'json' } for JSON columns
paragraphs: text('paragraphs', { mode: 'json' }).notNull()

// In code, TypeScript treats this as any type
// Always parse/validate with Zod or type assertion
const paragraphs = decision.paragraphs as Array<{section?: string; text: string; order: number}>;
```

### Qdrant Type Casting
```typescript
// Qdrant expects Record<string, unknown> for payload
// Use double cast to satisfy TypeScript:
payload: payload as unknown as Record<string, unknown>
```

### Environment Variables Required
```bash
OPENROUTER_API_KEY=sk-or-v1-...        # Required for LLM operations
QDRANT_URL=http://localhost:6333       # Default, override if needed
BVA_API_BASE_URL=https://...           # Default set, rarely change
DATABASE_URL=./data/bva.db              # Relative path from project root
```

### Drizzle ORM Migration Workflow
1. Modify `lib/db/schema.ts` (add/change tables or columns)
2. Run `npm run db:generate` - creates SQL in `lib/db/migrations/`
3. Run `npm run db:migrate` - applies to `data/bva.db`
4. Migrations are timestamp-named, committed to git

**Note**: Database uses libsql (not better-sqlite3) to avoid Windows C++ build tools requirement.

### Next.js App Router Conventions
- Use Server Components by default (no "use client")
- Add "use client" only for: hooks, event handlers, browser APIs, streaming SSE consumers
- API routes in `app/api/*/route.ts` - export GET/POST/etc functions
- Dynamic routes: `[id]` folders for path parameters
- Server actions not yet used (can add in Phase 3+)

## BVA Decision Structure

Decisions from API contain:
```typescript
{
  citation_number: "23-1234",     // Unique identifier
  date: "2023-01-15",             // ISO 8601
  type: "AMA" | "legacy",         // Appeal type
  paragraphs: [{                  // Decision broken into paragraphs
    section?: "Introduction" | "Findings of Fact" | "Analysis" | ...,
    text: "...",
    order: 0                      // Sequential ordering
  }],
  raw_text: "full text...",       // Complete decision as single string
}
```

**Section Normalization**: `parser.ts` normalizes section names to standard types (findings_of_fact, reasons_and_bases, analysis, conclusion) for consistent extraction.

## Development Workflow for New Phases

When implementing Phase 2+ features:

1. **Create types first** in `types/` directory (decisions.ts, research.ts, etc.)
2. **Add database columns** if needed, then regenerate migrations
3. **Build API routes** in `app/api/` following RESTful conventions
4. **Implement lib/** business logic (agents, search, reports)
5. **Create components/** for UI last
6. **Test with scripts/** before integrating into UI

**Phase 2 (Hybrid Search) Next Steps**:
- Create `lib/vector/embeddings.ts` - generate embeddings via Google AI API
- Create `lib/search/ranking.ts` - merge FTS + vector results with scoring
- Create `lib/search/query-optimizer.ts` - AI-powered query rewriting
- Build `app/api/decisions/search/route.ts` - unified search endpoint

## Common Patterns

### Error Handling
- Use custom error classes (`BVAApiError`, `OpenRouterError`) in lib/
- Catch and log errors with context, don't let them bubble silently
- Display user-friendly messages in UI, log technical details to console

### Async Generators for Pagination
```typescript
// Used in BVAApiClient for fetching all decisions
async *fetchAllDecisions(params) {
  let offset = 0;
  while (hasMore) {
    const batch = await this.searchDecisions({...params, offset, limit: 100});
    yield batch.decisions;
    offset += 100;
  }
}
```

### State Persistence for Long-Running Operations
- Save to `research_runs` table after each agent phase
- Store large artifacts in `/data/artifacts/` as JSON files
- Keep database row lightweight with references to artifact files
- Enable resume by loading last completed phase from DB

## Troubleshooting

**"Cannot find module" errors**: Run `npm install`, check imports use `@/` prefix for absolute paths

**Database locked**: Close all DB connections (Drizzle Studio, other processes), delete `data/bva.db-wal` if needed

**Qdrant connection refused**: Run `docker-compose up -d`, verify with `curl http://localhost:6333/health`

**TypeScript errors in build**: Fix errors in `lib/` files first (they're imported by app/), use `npm run build` not just dev server

**OpenRouter rate limits**: Implement exponential backoff, check dashboard at openrouter.ai/activity, consider using free tier (Flash) more

## Important Constraints

- **Single-user**: No authentication, no multi-tenancy, assumes localhost deployment
- **SQLite limits**: ~2000 concurrent writes/sec, fine for single user but can't scale to multi-user without migration to PostgreSQL
- **Cost control**: Every LLM call costs money - use Flash (free) when possible, track in `cost_tracking` table
- **Citation integrity**: All AI-generated claims MUST include source decision references - enforced by Citation QA agent
- **No silent web access**: Agents only work with provided decision set, no external fetching during research

## Reference Documentation

- **BVA API OpenAPI spec**: `https://bva-api-1013743482040.us-central1.run.app/api/v1/openapi.json`
- **Implementation Plan**: `IMPLEMENTATION_PLAN.md` (1200+ lines, comprehensive)
- **OpenRouter models**: https://openrouter.ai/models
- **Drizzle ORM docs**: https://orm.drizzle.team/docs/overview
- **Qdrant docs**: https://qdrant.tech/documentation/
