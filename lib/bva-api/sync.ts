/**
 * BVA Decision Sync Service
 * Orchestrates syncing decisions from BVA API to local database
 * Includes AI-powered outcome extraction
 */

import { db } from '../db/client';
import { decisions, syncMetadata } from '../db/schema';
import { bvaApiClient, type BVADecisionDetail } from './client';
import { parseBVADecision } from './parser';
import { flashClient } from '../llm/openrouter';
import { eq } from 'drizzle-orm';

// Sync result tracking
export interface SyncResult {
  total: number;
  synced: number;
  skipped: number;
  errors: Array<{
    decisionId: string;
    citationNumber: string;
    error: string;
  }>;
  startTime: Date;
  endTime?: Date;
  duration?: number; // milliseconds
}

// Sync options
export interface SyncOptions {
  query?: string;
  startYear?: number;
  endYear?: number;
  decisionType?: 'AMA' | 'legacy' | 'all';
  maxDecisions?: number;
  skipExisting?: boolean;
  extractOutcomes?: boolean;
}

/**
 * Main sync service class
 */
export class BVASyncService {
  /**
   * Sync decisions from BVA API
   */
  async syncDecisions(options: SyncOptions = {}): Promise<SyncResult> {
    const result: SyncResult = {
      total: 0,
      synced: 0,
      skipped: 0,
      errors: [],
      startTime: new Date(),
    };

    try {
      // Default query if none provided
      const query = options.query || 'veteran';

      // Fetch decisions from BVA API
      console.log(`Starting sync with query: "${query}"`);

      let decisionsProcessed = 0;
      const maxDecisions = options.maxDecisions || 100;

      for await (const batch of bvaApiClient.fetchAllDecisions({
        query,
        decision_type: options.decisionType || 'all',
        start_year: options.startYear,
        end_year: options.endYear,
        sort: 'date.desc',
      })) {
        for (const summary of batch) {
          // Check if we've reached the limit
          if (decisionsProcessed >= maxDecisions) {
            console.log(`Reached max decisions limit: ${maxDecisions}`);
            break;
          }

          result.total++;

          try {
            // Check if already exists
            if (options.skipExisting) {
              const existing = await db.query.decisions.findFirst({
                where: eq(decisions.citationNumber, summary.citation_number),
              });

              if (existing) {
                result.skipped++;
                console.log(`Skipping existing decision: ${summary.citation_number}`);
                continue;
              }
            }

            // Fetch full decision details
            console.log(`Fetching decision: ${summary.citation_number}`);
            const detail = await bvaApiClient.getDecision(summary.citation_number);

            // Parse decision
            const parsed = parseBVADecision(detail);

            // Extract outcome using AI (if enabled)
            let outcome: string | null = null;
            let outcomeConfidence: number | null = null;

            if (options.extractOutcomes !== false) {
              console.log(`Extracting outcome for: ${summary.citation_number}`);
              const outcomeResult = await this.extractOutcome(detail);
              outcome = outcomeResult.outcome;
              outcomeConfidence = outcomeResult.confidence;
            }

            // Insert into database
            await db.insert(decisions).values({
              ...parsed,
              outcome,
              outcomeConfidence,
            }).onConflictDoUpdate({
              target: decisions.citationNumber,
              set: {
                ...parsed,
                outcome,
                outcomeConfidence,
                lastUpdated: new Date(),
              },
            });

            result.synced++;
            decisionsProcessed++;
            console.log(`Synced: ${summary.citation_number} (${result.synced}/${maxDecisions})`);

          } catch (error) {
            result.errors.push({
              decisionId: summary.id,
              citationNumber: summary.citation_number,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
            console.error(`Error syncing ${summary.citation_number}:`, error);
          }

          // Small delay to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Break outer loop if limit reached
        if (decisionsProcessed >= maxDecisions) {
          break;
        }
      }

      // Update sync metadata
      await this.updateSyncMetadata(result);

      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();

      console.log('\nSync completed:');
      console.log(`  Total: ${result.total}`);
      console.log(`  Synced: ${result.synced}`);
      console.log(`  Skipped: ${result.skipped}`);
      console.log(`  Errors: ${result.errors.length}`);
      console.log(`  Duration: ${(result.duration / 1000).toFixed(2)}s`);

      return result;

    } catch (error) {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      console.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Extract outcome from decision using AI
   */
  private async extractOutcome(
    decision: BVADecisionDetail
  ): Promise<{ outcome: string; confidence: number }> {
    // Build a concise excerpt for analysis
    const textExcerpt = decision.raw_text.slice(0, 4000); // First 4000 chars

    const prompt = `Analyze this BVA (Board of Veterans' Appeals) decision and determine the outcome.

Decision Citation: ${decision.citation_number}
Decision Date: ${decision.date}

Decision Text (excerpt):
${textExcerpt}

Based on the decision text, classify the outcome as ONE of the following:
- "Granted" - The veteran's appeal was granted (approved)
- "Denied" - The veteran's appeal was denied
- "Remanded" - The case was sent back for additional development/evidence
- "Mixed" - Some issues granted, some denied/remanded

Also provide a confidence score from 0.0 to 1.0.

Respond ONLY with valid JSON in this exact format:
{
  "outcome": "Granted" | "Denied" | "Remanded" | "Mixed",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why you classified it this way"
}`;

    try {
      const response = await flashClient.generate({
        prompt,
        temperature: 0.1,
        responseFormat: 'json_object',
      });

      const parsed = JSON.parse(response);

      return {
        outcome: parsed.outcome,
        confidence: parsed.confidence || 0.5,
      };
    } catch (error) {
      console.error('Error extracting outcome:', error);
      // Return unknown outcome with low confidence
      return {
        outcome: 'Unknown',
        confidence: 0.0,
      };
    }
  }

  /**
   * Update sync metadata in database
   */
  private async updateSyncMetadata(result: SyncResult): Promise<void> {
    const status = result.errors.length > 0 ? 'completed_with_errors' : 'completed';
    const errorSummary = result.errors.length > 0
      ? `${result.errors.length} errors: ${result.errors.slice(0, 3).map(e => e.citationNumber).join(', ')}`
      : null;

    await db.insert(syncMetadata).values({
      id: 'latest',
      lastSyncDate: result.endTime || new Date(),
      totalDecisions: result.synced,
      lastSyncStatus: status,
      lastSyncError: errorSummary,
    }).onConflictDoUpdate({
      target: syncMetadata.id,
      set: {
        lastSyncDate: result.endTime || new Date(),
        totalDecisions: result.synced,
        lastSyncStatus: status,
        lastSyncError: errorSummary,
      },
    });
  }
}

// Export singleton instance
export const bvaSyncService = new BVASyncService();
