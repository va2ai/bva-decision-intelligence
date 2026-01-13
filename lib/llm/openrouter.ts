/**
 * OpenRouter LLM Client
 * Handles all interactions with OpenRouter API for Gemini models
 */

import OpenAI from 'openai';

// Gemini model configurations
export const GEMINI_MODELS = {
  flash: {
    id: 'google/gemini-2.0-flash-exp:free',
    contextWindow: 1000000,
    outputLimit: 8192,
    costPerMToken: { input: 0, output: 0 },
    useCases: ['planning', 'citation_qa', 'query_optimization', 'retrieval'],
  },
  pro: {
    id: 'google/gemini-1.5-pro',
    contextWindow: 2000000,
    outputLimit: 8192,
    costPerMToken: { input: 1.25, output: 5.0 },
    useCases: ['extraction', 'analysis', 'synthesis', 'report_writing'],
  },
  embedding: {
    id: 'google/text-embedding-004',
    dimensions: 768,
    costPerMToken: { input: 0.0125, output: 0 },
  },
} as const;

export type GeminiModelType = keyof typeof GEMINI_MODELS;

// Generation options
export interface GenerateOptions {
  prompt: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'text' | 'json_object';
  stream?: boolean;
}

// OpenRouter client
export class OpenRouterClient {
  private client: OpenAI;
  private modelId: string;

  constructor(modelType: GeminiModelType = 'flash') {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'BVA Decision Intelligence Platform',
      },
    });

    this.modelId = GEMINI_MODELS[modelType].id;
  }

  /**
   * Generate text completion
   */
  async generate(options: GenerateOptions): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: options.model || this.modelId,
        messages: [
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        ...(options.responseFormat === 'json_object' && {
          response_format: { type: 'json_object' },
        }),
      });

      const content = response.choices[0]?.message?.content || '';

      // Track usage if needed
      if (response.usage) {
        // TODO: Track token usage and cost
        console.log('Token usage:', response.usage);
      }

      return content;
    } catch (error) {
      console.error('OpenRouter API error:', error);
      throw new OpenRouterError(
        `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate streaming completion
   */
  async *generateStream(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.client.chat.completions.create({
        model: options.model || this.modelId,
        messages: [
          {
            role: 'user',
            content: options.prompt,
          },
        ],
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4096,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('OpenRouter streaming error:', error);
      throw new OpenRouterError(
        `Streaming failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate embeddings for text
   * Note: OpenRouter may not support embeddings directly, may need to use Google AI API
   */
  async generateEmbedding(_text: string): Promise<number[]> {
    // For now, throw an error - we'll implement this when we handle embeddings
    throw new Error(
      'Embedding generation not yet implemented. Use Google AI API directly for embeddings.'
    );
  }
}

// Custom error class
export class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenRouterError';
  }
}

// Helper to get model config
export function getModelConfig(modelType: GeminiModelType) {
  return GEMINI_MODELS[modelType];
}

// Export singleton instances for common use cases
export const flashClient = new OpenRouterClient('flash');
export const proClient = new OpenRouterClient('pro');
