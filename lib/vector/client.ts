import { QdrantClient } from '@qdrant/js-client-rest';

// Initialize Qdrant client
export const qdrantClient = new QdrantClient({
  url: process.env.QDRANT_URL || 'http://localhost:6333',
});

// Collection names
export const COLLECTIONS = {
  decisions: 'bva_decisions',
  sections: 'bva_decision_sections',
};

// Vector dimensions for Gemini text-embedding-004
export const VECTOR_DIMENSION = 768;

// Initialize collections
export async function initializeCollections() {
  try {
    // Check if collections exist
    const collections = await qdrantClient.getCollections();
    const existingCollections = collections.collections.map(c => c.name);

    // Create decision-level embeddings collection
    if (!existingCollections.includes(COLLECTIONS.decisions)) {
      await qdrantClient.createCollection(COLLECTIONS.decisions, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
      });
      console.log(`Created collection: ${COLLECTIONS.decisions}`);
    }

    // Create section-level embeddings collection
    if (!existingCollections.includes(COLLECTIONS.sections)) {
      await qdrantClient.createCollection(COLLECTIONS.sections, {
        vectors: {
          size: VECTOR_DIMENSION,
          distance: 'Cosine',
        },
        optimizers_config: {
          default_segment_number: 2,
        },
      });
      console.log(`Created collection: ${COLLECTIONS.sections}`);
    }
  } catch (error) {
    console.error('Error initializing Qdrant collections:', error);
    throw error;
  }
}

// Payload interfaces
export interface DecisionPayload {
  decision_id: string;
  citation_number: string;
  decision_date: number; // Unix timestamp
  outcome?: string;
  decision_type: string;
  issues?: string[];
}

export interface SectionPayload extends DecisionPayload {
  section_type: string; // 'findings' | 'analysis' | 'reasons_bases' | etc.
}

// Upsert decision embedding
export async function upsertDecisionEmbedding(
  decisionId: string,
  embedding: number[],
  payload: DecisionPayload
) {
  await qdrantClient.upsert(COLLECTIONS.decisions, {
    wait: true,
    points: [
      {
        id: decisionId,
        vector: embedding,
        payload: payload as unknown as Record<string, unknown>,
      },
    ],
  });
}

// Upsert section embedding
export async function upsertSectionEmbedding(
  sectionId: string,
  embedding: number[],
  payload: SectionPayload
) {
  await qdrantClient.upsert(COLLECTIONS.sections, {
    wait: true,
    points: [
      {
        id: sectionId,
        vector: embedding,
        payload: payload as unknown as Record<string, unknown>,
      },
    ],
  });
}

// Search decisions by vector similarity
export async function searchDecisions(
  queryEmbedding: number[],
  limit: number = 20,
  filter?: Record<string, unknown>
) {
  return await qdrantClient.search(COLLECTIONS.decisions, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    ...(filter && { filter }),
  });
}

// Search sections by vector similarity
export async function searchSections(
  queryEmbedding: number[],
  limit: number = 20,
  filter?: Record<string, unknown>
) {
  return await qdrantClient.search(COLLECTIONS.sections, {
    vector: queryEmbedding,
    limit,
    with_payload: true,
    ...(filter && { filter }),
  });
}
