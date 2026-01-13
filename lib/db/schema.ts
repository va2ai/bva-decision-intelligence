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

// Export types
export type Decision = typeof decisions.$inferSelect;
export type NewDecision = typeof decisions.$inferInsert;
export type ResearchRun = typeof researchRuns.$inferSelect;
export type NewResearchRun = typeof researchRuns.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type AgentLog = typeof agentLogs.$inferSelect;
export type NewAgentLog = typeof agentLogs.$inferInsert;
export type CostTracking = typeof costTracking.$inferSelect;
export type NewCostTracking = typeof costTracking.$inferInsert;
export type SyncMetadata = typeof syncMetadata.$inferSelect;
export type NewSyncMetadata = typeof syncMetadata.$inferInsert;
