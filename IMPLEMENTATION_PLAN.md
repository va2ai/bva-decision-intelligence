# BVA Decision Intelligence & Multi-Agent Research Platform
## Implementation Plan

---

## Executive Summary

This plan outlines the implementation of a single-user, local-first BVA decision research platform that combines full-text search, semantic search, and multi-agent AI analysis. The system will enable legal practitioners to search BVA decisions, generate AI-powered briefs, analyze denial/grant/remand patterns, and maintain a searchable library of reports.

**Key Architectural Decisions:**
- **Next.js 14+ with App Router** - Full-stack React framework with server components and streaming
- **SQLite + Qdrant (Docker)** - Local database with vector search for semantic queries
- **Gemini via OpenRouter** - 1M+ token context windows, cost-effective, citation-capable
- **Single-user local deployment** - No auth complexity, runs on localhost
- **Event-driven multi-agent orchestration** - Resumable research sessions with live progress streaming

**Target Capabilities:**
- Search 10,000+ BVA decisions with hybrid full-text + semantic search
- Process 500+ decisions per research run with batched AI extraction
- Generate citation-anchored reports with PDF/DOCX export
- Cost: ~$0.05-$7.50 per research run depending on scope

---

## Technology Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Frontend Framework | Next.js 14+ (App Router) | Server components, streaming, built-in API routes |
| Database | SQLite + better-sqlite3 | Zero-config, file-based, perfect for single-user |
| ORM | Drizzle ORM | Type-safe, lightweight, excellent SQLite support |
| Vector Database | Qdrant (Docker container) | Self-hosted, persistent storage, rich filtering |
| LLM Provider | OpenRouter (Gemini models) | Unified API, competitive pricing, 1M-2M token context |
| UI Library | Tailwind CSS + Shadcn/ui | Rapid development, accessible components |
| Report Export | Puppeteer (PDF) + docx (DOCX) | Professional document generation |
| Embeddings | Gemini text-embedding-004 | 768 dimensions, integrated with LLM provider |

---

## Project Structure

```
bvaapp/
├── src/
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                 # Root layout
│   │   ├── page.tsx                   # Home/search page
│   │   ├── globals.css                # Tailwind styles
│   │   ├── decisions/
│   │   │   └── [id]/page.tsx          # Single decision view + analysis
│   │   ├── research/
│   │   │   ├── page.tsx               # Research runs list
│   │   │   ├── new/page.tsx           # Start new research
│   │   │   └── [runId]/page.tsx       # Live research progress viewer
│   │   ├── reports/
│   │   │   ├── page.tsx               # Reports library
│   │   │   └── [id]/page.tsx          # View/export report
│   │   └── api/
│   │       ├── decisions/
│   │       │   ├── search/route.ts    # Hybrid search endpoint
│   │       │   ├── sync/route.ts      # Sync from BVA API
│   │       │   └── [id]/route.ts      # Get single decision
│   │       ├── research/
│   │       │   ├── start/route.ts     # Initialize research run
│   │       │   ├── [runId]/
│   │       │   │   ├── stream/route.ts # SSE progress stream
│   │       │   │   └── status/route.ts # Current status
│   │       │   └── resume/route.ts    # Resume interrupted run
│   │       └── reports/
│   │           ├── generate/route.ts  # Generate report
│   │           ├── export/route.ts    # PDF/DOCX export
│   │           └── [id]/route.ts      # Report CRUD
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   ├── schema.ts              # Drizzle ORM schema (CRITICAL)
│   │   │   ├── client.ts              # SQLite connection
│   │   │   └── migrations/            # SQL migrations
│   │   ├── vector/
│   │   │   ├── client.ts              # Qdrant client wrapper
│   │   │   ├── embeddings.ts          # Generate embeddings
│   │   │   └── search.ts              # Vector similarity search
│   │   ├── agents/
│   │   │   ├── base.ts                # BaseAgent abstract class
│   │   │   ├── orchestrator.ts        # Orchestration engine (CRITICAL)
│   │   │   ├── state.ts               # Research state management
│   │   │   ├── planner.ts             # PlannerAgent
│   │   │   ├── retriever.ts           # RetrieverAgent
│   │   │   ├── extractor.ts           # ExtractorAgent
│   │   │   ├── outcome-analyst.ts     # OutcomeAnalystAgent
│   │   │   ├── synthesizer.ts         # SynthesizerAgent
│   │   │   ├── citation-qa.ts         # CitationQAAgent
│   │   │   └── report-writer.ts       # ReportWriterAgent
│   │   ├── llm/
│   │   │   ├── openrouter.ts          # OpenRouter client (CRITICAL)
│   │   │   ├── gemini.ts              # Gemini model configs
│   │   │   ├── prompt-templates.ts    # Structured prompts
│   │   │   └── cost-tracker.ts        # Token/cost tracking
│   │   ├── bva-api/
│   │   │   ├── client.ts              # BVA API client (CRITICAL)
│   │   │   ├── sync.ts                # Sync orchestration
│   │   │   └── parser.ts              # Parse BVA decision structure
│   │   ├── reports/
│   │   │   ├── generator.ts           # Report generation
│   │   │   ├── pdf-exporter.ts        # PDF generation
│   │   │   ├── docx-exporter.ts       # DOCX generation
│   │   │   └── templates/             # Report templates
│   │   ├── search/
│   │   │   ├── query-optimizer.ts     # AI query rewriting
│   │   │   ├── filters.ts             # Filter logic
│   │   │   └── ranking.ts             # Hybrid result ranking
│   │   └── utils/
│   │       ├── logger.ts              # Structured logging
│   │       ├── errors.ts              # Custom error classes
│   │       └── validation.ts          # Zod schemas
│   │
│   ├── components/
│   │   ├── ui/                        # Shadcn/ui components
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── ResultsList.tsx
│   │   ├── research/
│   │   │   ├── AgentProgressStream.tsx
│   │   │   ├── ResearchConfig.tsx
│   │   │   └── AgentTimeline.tsx
│   │   ├── decisions/
│   │   │   ├── DecisionCard.tsx
│   │   │   └── DecisionBrief.tsx
│   │   └── reports/
│   │       ├── ReportViewer.tsx
│   │       └── ExportMenu.tsx
│   │
│   ├── types/
│   │   ├── decision.ts                # Decision types
│   │   ├── research.ts                # Research run types
│   │   ├── agent.ts                   # Agent interfaces
│   │   └── report.ts                  # Report types
│   │
│   └── config/
│       ├── agents.ts                  # Agent configurations
│       ├── llm.ts                     # LLM model configs
│       └── constants.ts               # App constants
│
├── data/
│   ├── bva.db                         # SQLite database
│   └── qdrant/                        # Qdrant data files
│
├── docker-compose.yml                 # Qdrant container config
├── .env.local                         # Environment variables
├── .env.example                       # Example env file
├── next.config.js
├── tsconfig.json
├── package.json
├── tailwind.config.ts
├── drizzle.config.ts
└── README.md
```

---

## BVA API Integration

### API Specification

**Base URL:** `https://bva-api-1013743482040.us-central1.run.app`

**Authentication:** None required

**Key Endpoints:**

1. **GET /api/v1/decisions/search**
   - Query parameters:
     - `query` (required, min 2 chars) - Full-text search
     - `decision_type` (optional) - "AMA" | "legacy" | "all" (default: "all")
     - `start_year` (optional, ≥1990) - Filter by date range
     - `end_year` (optional, ≤2030) - Filter by date range
     - `sort` (optional) - "date.desc" | "date.asc" (default: "date.desc")
     - `offset` (optional, ≥0) - Pagination offset (default: 0)
     - `limit` (optional, 1-100) - Results per page (default: 20)

2. **GET /api/v1/decisions/{citation_number}**
   - Retrieves full decision details including paragraphs and raw text

3. **POST /api/v1/decisions/search/batch**
   - Batch search multiple queries

4. **GET /health**
   - Service health check

### Data Models

**BVADecisionSummary** (from search results):
```typescript
{
  id: string;
  citation_number: string;
  date: string; // ISO 8601
  type: "AMA" | "legacy";
  docket_numbers: string[];
  url: string;
}
```

**BVADecisionDetail** (from single decision fetch):
```typescript
{
  id: string;
  citation_number: string;
  date: string;
  type: "AMA" | "legacy";
  docket_numbers: string[];
  url: string;
  paragraphs: Array<{
    section?: string;
    text: string;
    order: number;
  }>;
  raw_text: string;
  filename: string;
  created_at: string;
  updated_at: string;
}
```

### Integration Strategy

**Initial Sync:**
1. Fetch decisions in batches (100 per request) using pagination
2. Parse and normalize decision structure
3. Use AI to extract outcomes (Granted/Denied/Remanded/Mixed) from raw_text
4. Store in SQLite with sections organized by paragraph structure
5. Generate embeddings for full text and key sections
6. Insert into Qdrant for vector search

**Incremental Sync:**
- Track last sync date in metadata table
- Fetch only new decisions using date range filters
- Update existing decisions if `updated_at` changed

**Section Parsing:**
- Use paragraph `section` field to organize content
- Common sections: Introduction, Findings of Fact, Analysis, Reasons and Bases, Conclusion
- If sections not provided, use AI to segment paragraphs into logical sections

---

## Database Schema

### SQLite Tables (Drizzle ORM)

```typescript
// src/lib/db/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Decisions table
export const decisions = sqliteTable('decisions', {
  id: text('id').primaryKey(),
  citationNumber: text('citation_number').notNull().unique(),

  // From BVA API
  bvaApiId: text('bva_api_id').unique(),
  decisionDate: integer('decision_date', { mode: 'timestamp' }).notNull(),
  decisionType: text('decision_type').notNull(), // 'AMA' | 'legacy'
  docketNumbers: text('docket_numbers', { mode: 'json' }), // JSON array
  sourceUrl: text('source_url'),
  filename: text('filename'),

  // Extracted outcomes (AI-generated)
  outcome: text('outcome'), // 'Granted' | 'Denied' | 'Remanded' | 'Mixed'
  outcomeDetails: text('outcome_details', { mode: 'json' }), // Per-issue outcomes
  outcomeConfidence: real('outcome_confidence'), // 0-1 confidence score

  // Content
  rawText: text('raw_text').notNull(),
  paragraphs: text('paragraphs', { mode: 'json' }).notNull(), // Array of paragraph objects
  sections: text('sections', { mode: 'json' }), // Organized by section name

  // Extracted structured data
  extractedData: text('extracted_data', { mode: 'json' }), // Issues, contentions, evidence

  // Metadata
  issues: text('issues', { mode: 'json' }), // Array of issue categories
  boardMemberName: text('board_member_name'),
  veteranName: text('veteran_name'),

  // Indexing status
  syncedAt: integer('synced_at', { mode: 'timestamp' }).notNull(),
  lastUpdated: integer('last_updated', { mode: 'timestamp' }).notNull(),
  indexed: integer('indexed', { mode: 'boolean' }).default(false),
  embeddingGenerated: integer('embedding_generated', { mode: 'boolean' }).default(false),
});

// Research runs
export const researchRuns = sqliteTable('research_runs', {
  id: text('id').primaryKey(),
  objective: text('objective').notNull(),

  // Configuration
  config: text('config', { mode: 'json' }).notNull(), // Search params, agent configs

  // Status
  status: text('status').notNull(), // 'pending' | 'running' | 'completed' | 'failed' | 'paused'
  progress: integer('progress').default(0), // 0-100
  currentPhase: text('current_phase'), // 'planning' | 'retrieval' | 'extraction' | etc.

  // Decision set
  decisionIds: text('decision_ids', { mode: 'json' }).notNull(),
  decisionCount: integer('decision_count').notNull(),

  // Execution state
  agentLogs: text('agent_logs', { mode: 'json' }), // Agent execution history
  artifacts: text('artifacts', { mode: 'json' }), // Intermediate outputs

  // Results
  finalReport: text('final_report'),
  reportId: text('report_id'),

  // Cost tracking
  tokensUsed: integer('tokens_used').default(0),
  estimatedCost: real('estimated_cost').default(0),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  startedAt: integer('started_at', { mode: 'timestamp' }),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  lastActivity: integer('last_activity', { mode: 'timestamp' }),
});

// Reports
export const reports = sqliteTable('reports', {
  id: text('id').primaryKey(),

  // Metadata
  title: text('title').notNull(),
  type: text('type').notNull(), // 'single_decision' | 'multi_brief' | 'research_report'
  scope: text('scope', { mode: 'json' }).notNull(), // Decision IDs, filters

  // Content
  contentMarkdown: text('content_markdown').notNull(),
  contentHtml: text('content_html').notNull(),

  // Citations
  citationMap: text('citation_map', { mode: 'json' }).notNull(),
  citationCount: integer('citation_count').default(0),

  // Quality indicators
  qualityFlags: text('quality_flags', { mode: 'json' }),
  verifiedClaims: integer('verified_claims'),
  totalClaims: integer('total_claims'),

  // Organization
  tags: text('tags', { mode: 'json' }),

  // Relationships
  researchRunId: text('research_run_id'),

  // Timestamps
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

// Agent execution logs
export const agentLogs = sqliteTable('agent_logs', {
  id: text('id').primaryKey(),
  researchRunId: text('research_run_id').notNull(),

  agentName: text('agent_name').notNull(),
  action: text('action').notNull(),

  input: text('input', { mode: 'json' }),
  output: text('output', { mode: 'json' }),

  tokensUsed: integer('tokens_used'),
  duration: integer('duration'), // milliseconds

  status: text('status').notNull(), // 'success' | 'failure' | 'partial'
  error: text('error'),

  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Cost tracking
export const costTracking = sqliteTable('cost_tracking', {
  id: text('id').primaryKey(),

  entityType: text('entity_type').notNull(), // 'research_run' | 'report' | 'sync'
  entityId: text('entity_id').notNull(),

  model: text('model').notNull(),

  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  totalTokens: integer('total_tokens').notNull(),

  cost: real('cost').notNull(), // USD

  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
});

// Sync metadata
export const syncMetadata = sqliteTable('sync_metadata', {
  id: text('id').primaryKey(),
  lastSyncDate: integer('last_sync_date', { mode: 'timestamp' }),
  totalDecisions: integer('total_decisions').default(0),
  lastSyncStatus: text('last_sync_status'),
  lastSyncError: text('last_sync_error'),
});
```

### Indexes

```sql
CREATE INDEX idx_decisions_date ON decisions(decision_date);
CREATE INDEX idx_decisions_outcome ON decisions(outcome);
CREATE INDEX idx_decisions_type ON decisions(decision_type);
CREATE INDEX idx_decisions_citation ON decisions(citation_number);
CREATE INDEX idx_research_runs_status ON research_runs(status);
CREATE INDEX idx_reports_type ON reports(type);
CREATE INDEX idx_agent_logs_run ON agent_logs(research_run_id);

-- Full-text search
CREATE VIRTUAL TABLE decisions_fts USING fts5(
  id UNINDEXED,
  raw_text,
  citation_number,
  issues,
  content='decisions',
  content_rowid='rowid'
);
```

### Qdrant Collections

**Collection: `bva_decisions`**
- Vector dimension: 768 (Gemini text-embedding-004)
- Distance metric: Cosine
- Payload:
  ```typescript
  {
    decision_id: string;
    citation_number: string;
    decision_date: number; // Unix timestamp
    outcome: string;
    decision_type: string;
    issues: string[];
  }
  ```

**Collection: `bva_decision_sections`**
- Vector dimension: 768
- Distance metric: Cosine
- Payload:
  ```typescript
  {
    decision_id: string;
    section_type: string; // 'findings' | 'analysis' | 'reasons_bases'
    citation_number: string;
    decision_date: number;
    outcome: string;
  }
  ```

---

## Multi-Agent Architecture

### Agent Roles & Responsibilities

| Agent | Model | Purpose | Inputs | Outputs |
|-------|-------|---------|--------|---------|
| **Planner** | Gemini Flash (free) | Generates research plan from objective | Objective, constraints | Search criteria, analysis type, extraction fields |
| **Retriever** | Gemini Flash (free) | Searches and retrieves relevant decisions | Search criteria, max count | Decision IDs and metadata |
| **Extractor** | Gemini Pro | Extracts structured data from decisions | Decision text, fields to extract | Structured JSON with citations |
| **Outcome Analyst** | Gemini Pro | Analyzes deny/grant/remand patterns | Extracted decisions | Pattern analysis with frequencies |
| **Synthesizer** | Gemini Pro | Synthesizes findings across decisions | Agent outputs | Comprehensive synthesis |
| **Citation QA** | Gemini Flash (free) | Verifies citation accuracy | Synthesis, source decisions | Verification report |
| **Report Writer** | Gemini Pro | Generates final formatted report | Synthesis, QA results | Markdown/HTML report |

### Orchestration Pattern: Event-Driven State Machine

**Research Phases:**
1. **PLANNING** - Planner agent creates execution plan
2. **RETRIEVAL** - Retriever agent fetches decisions
3. **EXTRACTION** - Extractor agent processes decisions in batches
4. **ANALYSIS** - Outcome Analyst identifies patterns
5. **SYNTHESIS** - Synthesizer combines findings
6. **QA** - Citation QA verifies accuracy
7. **REPORTING** - Report Writer generates output

**State Management:**
- Each phase saves artifacts to disk and DB
- Progress tracked with 0-100% completion
- Resumable: can restart from last completed phase
- Streaming: real-time progress updates via SSE

**Token Budget Management:**
- Track tokens per agent execution
- Enforce limits before each LLM call
- Fail gracefully if budget exceeded
- Show cost estimates in UI

### Citation Integrity

**Requirements:**
- Every claim must reference source decision(s)
- Citations include decision ID + text excerpt
- QA agent verifies each citation
- Low-confidence findings flagged with uncertainty markers
- Reports include citation map and verification stats

**Citation Format:**
```typescript
{
  claim: "Migraines were denied in 73% of cases due to lack of service connection",
  citations: [
    {
      decisionId: "abc123",
      citationNumber: "23-4567",
      excerpt: "The Board finds that service connection is not warranted...",
      verified: true,
      confidence: 0.92
    }
  ],
  uncertainty: false
}
```

### Batching Strategy

For large decision sets (100+ decisions):
- Process in batches of 10 decisions
- Each batch processed by Extractor independently
- Synthesizer performs meta-analysis across batches
- Prevents token limit issues and enables parallelization

---

## Gemini Model Selection

### Model Configuration

```typescript
export const GEMINI_MODELS = {
  flash: {
    id: 'google/gemini-2.0-flash-exp:free',
    contextWindow: 1000000, // 1M tokens
    outputLimit: 8192,
    costPerMToken: { input: 0, output: 0 }, // Free tier
    useCases: ['planning', 'citation_qa', 'query_optimization', 'retrieval'],
  },

  pro: {
    id: 'google/gemini-1.5-pro',
    contextWindow: 2000000, // 2M tokens
    outputLimit: 8192,
    costPerMToken: { input: 1.25, output: 5.00 },
    useCases: ['extraction', 'analysis', 'synthesis', 'report_writing'],
  },

  embedding: {
    id: 'google/text-embedding-004',
    dimensions: 768,
    costPerMToken: { input: 0.0125, output: 0 },
  },
};
```

### Cost Estimates

**Per Research Run:**
- Small (10 decisions): $0.05 - $0.15
- Medium (50 decisions): $0.25 - $0.75
- Large (500 decisions): $2.50 - $7.50

**Initial Sync (1000 decisions):**
- Outcome extraction: ~$5-$10
- Embeddings: ~$0.10
- Total: ~$5-$10 one-time cost

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Objective:** Set up project infrastructure and basic data pipeline

**Tasks:**

1. **Project Initialization**
   - Create Next.js 14 app with App Router
   - Install dependencies: drizzle-orm, better-sqlite3, @qdrant/js-client-rest, openrouter-client, zod, tailwindcss
   - Configure TypeScript, ESLint, Prettier
   - Set up Tailwind + Shadcn/ui

2. **Database Setup**
   - Create `src/lib/db/schema.ts` with all tables
   - Set up Drizzle config and migrations
   - Initialize SQLite database in `data/bva.db`
   - Create seed scripts for testing

3. **Qdrant Setup**
   - Create `docker-compose.yml` for Qdrant container
   - Initialize Qdrant collections (bva_decisions, bva_decision_sections)
   - Create vector client wrapper in `src/lib/vector/client.ts`

4. **BVA API Integration**
   - Implement `src/lib/bva-api/client.ts`
   - Create parser for BVA decision structure
   - Implement sync service in `src/lib/bva-api/sync.ts`
   - Add outcome extraction using Gemini Flash
   - Test with small dataset (20-50 decisions)

5. **Basic Search UI**
   - Create search page (`src/app/page.tsx`)
   - Build SearchBar component
   - Implement FilterPanel (outcome, date range, decision type)
   - Display results as cards

**Critical Files:**
- `src/lib/db/schema.ts`
- `src/lib/bva-api/client.ts`
- `src/lib/vector/client.ts`
- `docker-compose.yml`

**Verification:**
- Can sync 50+ decisions from BVA API
- Decisions stored in SQLite with extracted outcomes
- Search UI displays results with filters

---

### Phase 2: Hybrid Search (Week 3)

**Objective:** Implement full-text and semantic search with ranking

**Tasks:**

1. **OpenRouter Integration**
   - Create `src/lib/llm/openrouter.ts` client
   - Configure Gemini models
   - Implement cost tracking in `src/lib/llm/cost-tracker.ts`
   - Add error handling and retry logic

2. **Embedding Generation**
   - Create `src/lib/vector/embeddings.ts`
   - Generate embeddings for decision full text
   - Generate embeddings for key sections
   - Insert into Qdrant collections
   - Update sync service to include embeddings

3. **Hybrid Search**
   - Implement full-text search (SQLite FTS)
   - Implement vector search (Qdrant)
   - Create `src/lib/search/ranking.ts` to merge results
   - Add query optimization in `src/lib/search/query-optimizer.ts`
   - Create API route: `src/app/api/decisions/search/route.ts`

4. **Search UI Enhancements**
   - Update SearchBar with query optimization options
   - Display search result quality indicators
   - Add pagination for large result sets

**Critical Files:**
- `src/lib/llm/openrouter.ts`
- `src/lib/vector/embeddings.ts`
- `src/lib/search/ranking.ts`
- `src/app/api/decisions/search/route.ts`

**Verification:**
- Semantic search returns relevant decisions
- Hybrid ranking combines keyword + vector results effectively
- Query optimization improves recall/precision

---

### Phase 3: Single-Decision Analysis (Week 4)

**Objective:** AI-powered brief generation for individual decisions

**Tasks:**

1. **Decision Detail Page**
   - Create `src/app/decisions/[id]/page.tsx`
   - Display full decision with organized sections
   - Show metadata (outcome, date, citation, issues)
   - Add "Generate Brief" button

2. **Brief Generation**
   - Create prompt templates in `src/lib/llm/prompt-templates.ts`
   - Implement structured extraction (findings, evidence, reasoning)
   - Generate executive summary
   - Extract key citations
   - Create API route: `src/app/api/reports/generate/route.ts`

3. **Decision Components**
   - Build DecisionCard component for lists
   - Build DecisionBrief component for AI output
   - Add loading states and error handling

4. **Report Storage**
   - Auto-save generated briefs to reports table
   - Add tags and metadata
   - Link to source decision

**Critical Files:**
- `src/app/decisions/[id]/page.tsx`
- `src/lib/llm/prompt-templates.ts`
- `src/app/api/reports/generate/route.ts`

**Verification:**
- Can view individual decision with full text
- Generate brief produces structured output
- Brief includes verified citations
- Report auto-saved to library

---

### Phase 4: Multi-Agent Foundation (Week 5-6)

**Objective:** Build core multi-agent orchestration system

**Tasks:**

1. **Agent Base Infrastructure**
   - Create `src/lib/agents/base.ts` abstract class
   - Implement `src/lib/agents/state.ts` for persistence
   - Build `src/lib/agents/orchestrator.ts` with state machine
   - Add agent logging to database

2. **Core Agent Implementations**
   - **PlannerAgent** (`src/lib/agents/planner.ts`)
     - Parse objective into search criteria
     - Determine analysis type
     - Generate extraction plan

   - **RetrieverAgent** (`src/lib/agents/retriever.ts`)
     - Execute hybrid search
     - Apply filters
     - Return ranked decision set

   - **ExtractorAgent** (`src/lib/agents/extractor.ts`)
     - Process decisions in batches (10 per batch)
     - Extract structured data per plan
     - Include citation anchors

   - **SynthesizerAgent** (`src/lib/agents/synthesizer.ts`)
     - Combine extracted data
     - Identify themes
     - Generate synthesis

   - **ReportWriterAgent** (`src/lib/agents/report-writer.ts`)
     - Format final report
     - Apply template
     - Include citation map

3. **Orchestration Logic**
   - Implement phase transitions
   - Add progress tracking (0-100%)
   - Save artifacts after each phase
   - Implement resume capability

4. **Research API Routes**
   - `src/app/api/research/start/route.ts` - Initialize run
   - `src/app/api/research/[runId]/status/route.ts` - Get status
   - `src/app/api/research/resume/route.ts` - Resume interrupted run

**Critical Files:**
- `src/lib/agents/orchestrator.ts`
- `src/lib/agents/base.ts`
- `src/lib/agents/planner.ts`
- `src/lib/agents/extractor.ts`
- `src/lib/agents/synthesizer.ts`

**Verification:**
- Can start research run from objective
- Agents execute in sequence
- State persists between phases
- Can view progress in database

---

### Phase 5: Streaming & Real-Time Progress (Week 7)

**Objective:** Live progress updates and streaming UI

**Tasks:**

1. **Server-Sent Events (SSE)**
   - Create `src/app/api/research/[runId]/stream/route.ts`
   - Emit progress events from orchestrator
   - Handle connection lifecycle
   - Implement reconnection logic

2. **Research UI**
   - Create `src/app/research/new/page.tsx` - Start research form
   - Build `src/app/research/[runId]/page.tsx` - Live progress viewer
   - Implement `src/components/research/AgentProgressStream.tsx`
   - Build `src/components/research/AgentTimeline.tsx`
   - Show current phase, progress %, agent logs

3. **Research Configuration**
   - Create ResearchConfig component
   - Input: objective, max decisions, token budget
   - Show cost estimate before starting
   - Add preset research templates

4. **Error Handling & Recovery**
   - Display agent errors in UI
   - Add "Resume" button for failed runs
   - Show retry options
   - Log errors to agent_logs table

**Critical Files:**
- `src/app/api/research/[runId]/stream/route.ts`
- `src/app/research/[runId]/page.tsx`
- `src/components/research/AgentProgressStream.tsx`

**Verification:**
- Can start research and watch live progress
- Progress bar updates in real-time
- Agent logs stream to UI
- Errors displayed with recovery options

---

### Phase 6: Advanced Analysis Agents (Week 8-9)

**Objective:** Add specialized agents for outcome analysis and quality assurance

**Tasks:**

1. **Outcome Analyst Agent**
   - Create `src/lib/agents/outcome-analyst.ts`
   - Implement denial pattern analysis
     - Extract common denial reasons
     - Quantify frequency across decisions
     - Identify evidence gaps
   - Implement grant driver analysis
     - Extract what leads to grants
     - Identify favorable evidence types
   - Implement remand trigger analysis
     - Extract common remand reasons
     - Identify procedural issues
   - Generate comparison tables

2. **Citation QA Agent**
   - Create `src/lib/agents/citation-qa.ts`
   - Extract all claims from synthesis
   - Verify each citation against source text
   - Calculate verification rate
   - Flag unsupported claims
   - Generate quality report

3. **Integration with Orchestrator**
   - Add ANALYSIS phase after EXTRACTION
   - Add QA phase after SYNTHESIS
   - Update state machine
   - Stream QA results to UI

4. **Analysis Visualization**
   - Create components for outcome distribution
   - Build comparison tables for deny vs grant vs remand
   - Display citation verification stats
   - Show confidence indicators

**Critical Files:**
- `src/lib/agents/outcome-analyst.ts`
- `src/lib/agents/citation-qa.ts`

**Verification:**
- Outcome Analyst identifies patterns with frequencies
- Citation QA verifies >90% of citations
- Analysis results included in final report
- Low-confidence findings flagged

---

### Phase 7: Reports Library & Export (Week 10)

**Objective:** Searchable report library with PDF/DOCX export

**Tasks:**

1. **Reports Library UI**
   - Create `src/app/reports/page.tsx` - List all reports
   - Add search/filter by type, tags, date
   - Show report metadata (verified claims, decision count)
   - Add pagination

2. **Report Viewer**
   - Create `src/app/reports/[id]/page.tsx`
   - Render markdown content
   - Display citation map
   - Show quality indicators
   - Add export menu

3. **PDF Export**
   - Create `src/lib/reports/pdf-exporter.ts`
   - Install Puppeteer
   - Design PDF template with:
     - Cover page
     - Table of contents
     - Content sections
     - Citation appendix
   - Create API route: `src/app/api/reports/export/route.ts?format=pdf`

4. **DOCX Export**
   - Create `src/lib/reports/docx-exporter.ts`
   - Install docx library
   - Convert markdown to DOCX
   - Include citations as footnotes
   - Support same API route with `?format=docx`

5. **Report Templates**
   - Create templates in `src/lib/reports/templates/`
   - Single Decision Brief template
   - Multi-Decision Brief template
   - Research Report template
   - Custom template builder

**Critical Files:**
- `src/app/reports/page.tsx`
- `src/app/reports/[id]/page.tsx`
- `src/lib/reports/pdf-exporter.ts`
- `src/lib/reports/docx-exporter.ts`

**Verification:**
- Reports library shows all generated reports
- Can search and filter reports
- PDF export produces professional documents
- DOCX export includes proper formatting
- Citations correctly linked

---

### Phase 8: Optimization & Scaling (Week 11-12)

**Objective:** Handle 500+ decision workloads efficiently

**Tasks:**

1. **Batch Processing Optimization**
   - Optimize ExtractorAgent batch size (test 5, 10, 20)
   - Implement parallel batch processing where possible
   - Add progress indicators per batch
   - Cache extraction results

2. **Embedding Optimization**
   - Batch embed multiple decisions simultaneously
   - Cache embeddings to avoid regeneration
   - Implement incremental embedding updates

3. **Cost Controls**
   - Add token budget enforcement per agent
   - Show cost estimate before starting research
   - Display running cost during execution
   - Add cost breakdown in report metadata
   - Create cost dashboard in UI

4. **Performance Monitoring**
   - Add timing metrics to agent logs
   - Track average time per agent type
   - Identify bottlenecks
   - Optimize slow operations

5. **Large Dataset Handling**
   - Test with 500+ decision research run
   - Ensure memory doesn't overflow
   - Optimize SQLite queries
   - Add result streaming for large queries

**Verification:**
- Can process 500 decisions in <30 minutes
- Memory usage stays under 2GB
- Cost estimates accurate within 10%
- No performance degradation with large datasets

---

### Phase 9: Production Hardening (Week 13-14)

**Objective:** Production-ready system with testing and monitoring

**Tasks:**

1. **Testing**
   - Unit tests for core functions
   - Integration tests for agent orchestration
   - E2E tests for critical user flows:
     - Search → Single brief
     - Search → Multi-brief
     - Research run → Report export
   - Test error scenarios and recovery

2. **Error Handling**
   - Comprehensive error classes
   - User-friendly error messages
   - Automatic retry for transient failures
   - Graceful degradation

3. **Logging & Monitoring**
   - Structured logging with winston or pino
   - Log levels: debug, info, warn, error
   - Separate log files for agents, API, sync
   - Add monitoring dashboard (optional)

4. **Documentation**
   - README with setup instructions
   - Architecture documentation
   - API documentation
   - User guide with screenshots
   - Troubleshooting guide

5. **Deployment Preparation**
   - Create .env.example with all variables
   - Document Qdrant Docker setup
   - Add health check endpoints
   - Create backup/restore scripts for SQLite
   - Optimize production build

6. **Security**
   - Validate all user inputs
   - Sanitize LLM outputs
   - Rate limit API endpoints (if needed)
   - Add CORS configuration
   - Secure sensitive data in .env

**Verification:**
- All tests passing
- Error scenarios handled gracefully
- Documentation complete and accurate
- Can deploy from scratch using README
- No security vulnerabilities

---

## Environment Configuration

### Required Environment Variables

```bash
# .env.local

# OpenRouter API
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Qdrant
QDRANT_URL=http://localhost:6333

# BVA API
BVA_API_BASE_URL=https://bva-api-1013743482040.us-central1.run.app

# Database
DATABASE_URL=./data/bva.db

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Model overrides
GEMINI_FLASH_MODEL=google/gemini-2.0-flash-exp:free
GEMINI_PRO_MODEL=google/gemini-1.5-pro
GEMINI_EMBEDDING_MODEL=google/text-embedding-004
```

---

## Docker Compose Configuration

```yaml
# docker-compose.yml

version: '3.8'

services:
  qdrant:
    image: qdrant/qdrant:latest
    container_name: bva_qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - ./data/qdrant:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped
```

**Start Qdrant:**
```bash
docker-compose up -d
```

---

## Testing Strategy

### Unit Tests
- Agent logic (plan generation, extraction, synthesis)
- Search ranking algorithms
- Citation verification
- Cost calculation
- Parser functions

### Integration Tests
- BVA API sync
- Database operations
- Vector search
- Agent orchestration
- Report generation

### E2E Tests (Critical User Flows)

**Flow 1: Search & Single Brief**
1. Search for "migraine headaches"
2. Apply outcome filter: "Denied"
3. Select first result
4. Generate single-decision brief
5. Verify brief includes citations
6. Export to PDF

**Flow 2: Multi-Decision Research**
1. Start new research with objective: "Analyze TDIU denials 2023"
2. Configure max 20 decisions
3. Watch live progress
4. Wait for completion
5. View report in library
6. Export to DOCX

**Flow 3: Resume Interrupted Research**
1. Start research run
2. Kill process mid-execution
3. Restart application
4. Resume research from last phase
5. Verify no data loss

---

## Success Criteria

### MVP is complete when:

1. **Search & Filter**
   - ✓ Can search 1000+ BVA decisions with hybrid search
   - ✓ Filter by outcome, date range, decision type
   - ✓ Results ranked by relevance

2. **Single-Decision Analysis**
   - ✓ View full decision with organized sections
   - ✓ Generate AI brief with executive summary
   - ✓ Brief includes verified citations
   - ✓ Auto-saved to reports library

3. **Multi-Decision Research**
   - ✓ Start research from natural language objective
   - ✓ Process 50+ decisions with multi-agent workflow
   - ✓ Real-time progress streaming
   - ✓ Analyze denial/grant/remand patterns
   - ✓ Generate comprehensive report

4. **Reports Library**
   - ✓ View all generated reports
   - ✓ Search/filter reports
   - ✓ Export to PDF with professional formatting
   - ✓ Export to DOCX with citations

5. **Quality & Cost**
   - ✓ >90% citation verification rate
   - ✓ Cost per research run under $10 for 500 decisions
   - ✓ Research runs resumable after interruption
   - ✓ Token budget enforcement working

6. **Performance**
   - ✓ 500 decision research completes in <30 minutes
   - ✓ Search results return in <3 seconds
   - ✓ UI responsive during research runs

---

## Critical Files (Priority Order)

1. **`src/lib/db/schema.ts`** - Core data model; defines all tables and relationships
2. **`src/lib/agents/orchestrator.ts`** - Central orchestration; coordinates all agent execution
3. **`src/lib/llm/openrouter.ts`** - LLM gateway; handles all AI interactions and cost tracking
4. **`src/lib/bva-api/client.ts`** - Data pipeline; manages API integration and sync
5. **`src/app/api/research/[runId]/stream/route.ts`** - Real-time communication; streams progress to UI

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Hallucinated legal reasoning** | Citation QA agent verifies all claims; uncertainty flags; manual review |
| **API rate limits (OpenRouter)** | Implement exponential backoff; batch requests; use free tier strategically |
| **Cost overruns** | Token budget enforcement; cost estimates before execution; use Flash for non-critical tasks |
| **Long research runs timeout** | Resumable sessions; phase-based persistence; progress streaming |
| **SQLite concurrency limits** | Single-user design avoids issue; future: migrate to PostgreSQL if needed |
| **Qdrant container downtime** | Docker restart policy; health checks; fallback to FTS-only search |
| **BVA API changes** | Version API client; graceful degradation; parser error handling |

---

## Future Enhancements (Post-MVP)

- **Evidence Upload**: Allow users to upload medical records and compare to decision patterns
- **Predictive Scoring**: Train model to predict outcome likelihood based on evidence
- **CAVC Integration**: Extend to Court of Appeals for Veterans Claims decisions
- **Collaborative Research**: Multi-user support with shared reports
- **Custom Agent Plugins**: Allow users to define custom analysis agents
- **Real-time Decision Monitoring**: Alert when new decisions match saved searches
- **Export to Legal Brief Format**: Generate draft legal briefs from research

---

## Appendix: Key Technologies

| Technology | Purpose | Documentation |
|------------|---------|---------------|
| Next.js 14 | Full-stack React framework | https://nextjs.org/docs |
| Drizzle ORM | Type-safe database ORM | https://orm.drizzle.team/docs |
| Qdrant | Vector database | https://qdrant.tech/documentation/ |
| OpenRouter | LLM API gateway | https://openrouter.ai/docs |
| Shadcn/ui | UI component library | https://ui.shadcn.com/ |
| Puppeteer | PDF generation | https://pptr.dev/ |
| docx | DOCX generation | https://docx.js.org/ |
| Zod | Schema validation | https://zod.dev/ |

---

**End of Implementation Plan**
