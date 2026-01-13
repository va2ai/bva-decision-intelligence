/**
 * BVA API Client
 * Interfaces with the BVA Search Service API
 * Base URL: https://bva-api-1013743482040.us-central1.run.app
 */

const BVA_API_BASE_URL = process.env.BVA_API_BASE_URL || 'https://bva-api-1013743482040.us-central1.run.app';

// API Response Types
export interface BVADecisionSummary {
  id: string;
  citation_number: string;
  date: string; // ISO 8601
  type: 'AMA' | 'legacy';
  docket_numbers: string[];
  url: string;
}

export interface BVADecisionDetail extends BVADecisionSummary {
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

export interface SearchResult {
  offset: number;
  limit: number;
  has_more: boolean;
  count: number;
  decisions: BVADecisionSummary[];
}

// Search Parameters
export interface SearchParams {
  query: string; // Required, min 2 chars
  decision_type?: 'AMA' | 'legacy' | 'all'; // Default: 'all'
  start_year?: number; // >= 1990
  end_year?: number; // <= 2030
  sort?: 'date.desc' | 'date.asc'; // Default: 'date.desc'
  offset?: number; // >= 0, default: 0
  limit?: number; // 1-100, default: 20
}

// BVA API Client Class
export class BVAApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || BVA_API_BASE_URL;
  }

  /**
   * Search BVA decisions
   * GET /api/v1/decisions/search
   */
  async searchDecisions(params: SearchParams): Promise<SearchResult> {
    const queryParams = new URLSearchParams();

    queryParams.append('query', params.query);

    if (params.decision_type) {
      queryParams.append('decision_type', params.decision_type);
    }
    if (params.start_year) {
      queryParams.append('start_year', params.start_year.toString());
    }
    if (params.end_year) {
      queryParams.append('end_year', params.end_year.toString());
    }
    if (params.sort) {
      queryParams.append('sort', params.sort);
    }
    if (params.offset !== undefined) {
      queryParams.append('offset', params.offset.toString());
    }
    if (params.limit) {
      queryParams.append('limit', params.limit.toString());
    }

    const url = `${this.baseUrl}/api/v1/decisions/search?${queryParams.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new BVAApiError(
          `API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data as SearchResult;
    } catch (error) {
      if (error instanceof BVAApiError) {
        throw error;
      }
      throw new BVAApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  /**
   * Get a single decision by citation number
   * GET /api/v1/decisions/{citation_number}
   */
  async getDecision(citationNumber: string): Promise<BVADecisionDetail> {
    const url = `${this.baseUrl}/api/v1/decisions/${encodeURIComponent(citationNumber)}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new BVAApiError(`Decision not found: ${citationNumber}`, 404);
        }
        throw new BVAApiError(
          `API error: ${response.statusText}`,
          response.status
        );
      }

      const data = await response.json();
      return data as BVADecisionDetail;
    } catch (error) {
      if (error instanceof BVAApiError) {
        throw error;
      }
      throw new BVAApiError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  /**
   * Fetch decisions in batches with pagination
   * Continues fetching until no more results
   */
  async *fetchAllDecisions(
    params: Omit<SearchParams, 'offset' | 'limit'>
  ): AsyncGenerator<BVADecisionSummary[], void, unknown> {
    let offset = 0;
    const limit = 100; // Max per request
    let hasMore = true;

    while (hasMore) {
      const result = await this.searchDecisions({
        ...params,
        offset,
        limit,
      });

      if (result.decisions.length > 0) {
        yield result.decisions;
      }

      hasMore = result.has_more;
      offset += limit;

      // Rate limiting: small delay between requests
      if (hasMore) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  /**
   * Health check
   * GET /health
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Custom error class
export class BVAApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'BVAApiError';
  }
}

// Export singleton instance
export const bvaApiClient = new BVAApiClient();
