# BVA Decision Intelligence Platform

Multi-agent research platform for analyzing Board of Veterans' Appeals decisions with AI-powered insights, semantic search, and automated report generation.

## Features

- **Hybrid Search**: Full-text + semantic vector search across BVA decisions
- **AI Analysis**: Multi-agent system for deep decision analysis
- **Outcome Extraction**: Automatic classification (Granted/Denied/Remanded/Mixed)
- **Research Automation**: Natural language objectives → comprehensive reports
- **Citation Verification**: AI-powered citation accuracy checking
- **Report Library**: Searchable repository with PDF/DOCX export
- **Cost Tracking**: Token usage and cost monitoring

## Prerequisites

- **Node.js**: v18 or higher
- **Docker**: For Qdrant vector database
- **OpenRouter API Key**: For Gemini models

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenRouter API key:

```env
OPENROUTER_API_KEY=your_api_key_here
QDRANT_URL=http://localhost:6333
BVA_API_BASE_URL=https://bva-api-1013743482040.us-central1.run.app
DATABASE_URL=./data/bva.db
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start Qdrant Vector Database

```bash
docker-compose up -d
```

Verify Qdrant is running:
```bash
curl http://localhost:6333/health
```

### 4. Initialize Database

```bash
# Generate and run migrations
npm run db:generate
npm run db:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Initial Data Sync

To populate the database with BVA decisions, create a sync script:

```typescript
// scripts/sync.ts
import { bvaSyncService } from './lib/bva-api/sync';

async function main() {
  await bvaSyncService.syncDecisions({
    query: 'veteran',
    maxDecisions: 50,
    extractOutcomes: true,
    skipExisting: true,
  });
}

main().catch(console.error);
```

Run the sync:

```bash
npx tsx scripts/sync.ts
```

## Project Structure

```
bvaapp/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Home page
│   ├── layout.tsx         # Root layout
│   ├── api/               # API routes
│   ├── decisions/         # Decision pages
│   ├── research/          # Research interface
│   └── reports/           # Reports library
├── lib/
│   ├── db/               # Database (SQLite + Drizzle ORM)
│   │   ├── schema.ts     # Database schema
│   │   └── client.ts     # DB connection
│   ├── vector/           # Qdrant vector DB
│   │   └── client.ts     # Vector operations
│   ├── agents/           # Multi-agent system (Phase 4+)
│   │   ├── orchestrator.ts
│   │   ├── planner.ts
│   │   ├── retriever.ts
│   │   ├── extractor.ts
│   │   └── ...
│   ├── llm/              # LLM integration
│   │   └── openrouter.ts # OpenRouter client
│   ├── bva-api/          # BVA API integration
│   │   ├── client.ts     # API client
│   │   ├── parser.ts     # Decision parser
│   │   └── sync.ts       # Sync service
│   ├── reports/          # Report generation (Phase 7)
│   └── search/           # Search logic (Phase 2)
├── components/           # React components
├── data/                # Local data storage
│   ├── bva.db          # SQLite database
│   └── qdrant/         # Qdrant storage
└── docker-compose.yml   # Qdrant container
```

## Development Phases

### ✅ Phase 1: Foundation (Current)
- [x] Project setup
- [x] Database schema
- [x] BVA API integration
- [x] Outcome extraction
- [x] Basic UI

### 🔄 Phase 2: Hybrid Search (Next)
- [ ] Embedding generation
- [ ] Vector search
- [ ] Hybrid ranking
- [ ] Query optimization

### 📋 Phase 3-9: See Implementation Plan
- Phase 3: Single-decision analysis
- Phase 4: Multi-agent foundation
- Phase 5: Streaming & progress
- Phase 6: Advanced analysis agents
- Phase 7: Reports & export
- Phase 8: Optimization
- Phase 9: Production hardening

## Architecture

### Database: SQLite + Drizzle ORM
- **decisions**: BVA decision records
- **research_runs**: Multi-agent research sessions
- **reports**: Generated reports
- **agent_logs**: Agent execution audit trail
- **cost_tracking**: Token usage and costs

### Vector Database: Qdrant
- **bva_decisions**: Decision-level embeddings
- **bva_decision_sections**: Section-level embeddings

### LLM: Gemini via OpenRouter
- **Gemini Flash (free)**: Planning, QA, query optimization
- **Gemini Pro**: Extraction, analysis, synthesis
- **Gemini Embedding**: Vector embeddings (768 dims)

### Multi-Agent System (Phase 4+)
7 specialized agents:
1. **Planner**: Research planning
2. **Retriever**: Decision search & retrieval
3. **Extractor**: Structured data extraction
4. **Outcome Analyst**: Pattern analysis
5. **Synthesizer**: Cross-decision synthesis
6. **Citation QA**: Citation verification
7. **Report Writer**: Report generation

## API Routes

### Decisions
- `GET /api/decisions/search` - Search decisions
- `GET /api/decisions/:id` - Get single decision
- `POST /api/decisions/sync` - Sync from BVA API

### Research (Phase 5)
- `POST /api/research/start` - Start research run
- `GET /api/research/:runId/stream` - SSE progress stream
- `GET /api/research/:runId/status` - Get status
- `POST /api/research/resume` - Resume interrupted run

### Reports (Phase 7)
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report
- `GET /api/reports/:id/export?format=pdf` - Export to PDF
- `GET /api/reports/:id/export?format=docx` - Export to DOCX

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npm run db:generate      # Generate migrations
npm run db:migrate       # Run migrations
npm run db:studio        # Open Drizzle Studio
```

## Configuration

### Gemini Models
- **Flash (free)**: `google/gemini-2.0-flash-exp:free`
- **Pro (paid)**: `google/gemini-1.5-pro`
- **Embedding**: `google/text-embedding-004`

### Cost Estimates
- Small run (10 decisions): $0.05 - $0.15
- Medium run (50 decisions): $0.25 - $0.75
- Large run (500 decisions): $2.50 - $7.50
- Initial sync (1000 decisions): ~$5-$10

## Troubleshooting

### Qdrant Connection Error
```bash
# Check if Qdrant is running
docker ps | grep qdrant

# Restart Qdrant
docker-compose restart qdrant
```

### Database Lock Error
```bash
# Close all connections and restart
rm data/bva.db-shm data/bva.db-wal
```

### OpenRouter API Errors
- Verify API key is set in `.env.local`
- Check rate limits: [OpenRouter Dashboard](https://openrouter.ai/activity)

## Testing

```bash
# Run tests (Phase 9)
npm test

# Run specific test suite
npm test -- decisions
npm test -- agents
```

## Deployment

For local single-user deployment:
1. Build the application: `npm run build`
2. Start Qdrant: `docker-compose up -d`
3. Run: `npm start`

## Contributing

This is a single-user application. For multi-user deployment or cloud hosting, see the implementation plan for scaling considerations.

## License

Proprietary - Internal use only

## Support

For issues or questions, refer to:
- Implementation Plan: `.claude/plans/imperative-skipping-matsumoto.md`
- BVA API Docs: OpenAPI spec at BVA_API_BASE_URL/api/v1/openapi.json
- OpenRouter Docs: https://openrouter.ai/docs
- Qdrant Docs: https://qdrant.tech/documentation/

---

**Status**: Phase 1 (Foundation) - In Progress
**Next**: Phase 2 (Hybrid Search)
