import type { BVADecisionDetail } from './client';
import type { NewDecision } from '../db/schema';
import { randomUUID } from 'crypto';

/**
 * Parse BVA API decision into our database format
 */
export function parseBVADecision(apiDecision: BVADecisionDetail): Omit<NewDecision, 'outcome' | 'outcomeDetails' | 'outcomeConfidence'> {
  const decisionDate = new Date(apiDecision.date);

  // Organize paragraphs by section
  const sections: Record<string, string> = {};
  for (const para of apiDecision.paragraphs) {
    const sectionName = para.section || 'content';
    if (!sections[sectionName]) {
      sections[sectionName] = '';
    }
    sections[sectionName] += para.text + '\n\n';
  }

  // Clean up sections
  for (const key in sections) {
    sections[key] = sections[key].trim();
  }

  return {
    id: randomUUID(),
    citationNumber: apiDecision.citation_number,
    bvaApiId: apiDecision.id,
    decisionDate,
    decisionType: apiDecision.type,
    docketNumbers: apiDecision.docket_numbers,
    sourceUrl: apiDecision.url,
    filename: apiDecision.filename,
    rawText: apiDecision.raw_text,
    paragraphs: apiDecision.paragraphs,
    sections,
    extractedData: null,
    issues: null,
    boardMemberName: null,
    veteranName: null,
    syncedAt: new Date(),
    lastUpdated: new Date(apiDecision.updated_at),
    indexed: false,
    embeddingGenerated: false,
  };
}

/**
 * Extract potential section types from paragraph sections
 */
export function identifySectionTypes(paragraphs: BVADecisionDetail['paragraphs']): string[] {
  const sections = new Set<string>();

  for (const para of paragraphs) {
    if (para.section) {
      sections.add(para.section);
    }
  }

  return Array.from(sections);
}

/**
 * Normalize section names to standard types
 */
export function normalizeSectionName(sectionName: string): string {
  const name = sectionName.toLowerCase().trim();

  // Map common variations to standard names
  if (name.includes('introduction') || name.includes('intro')) {
    return 'introduction';
  }
  if (name.includes('finding') || name.includes('fact')) {
    return 'findings_of_fact';
  }
  if (name.includes('analysis') || name.includes('discussion')) {
    return 'analysis';
  }
  if (name.includes('reason') && name.includes('base')) {
    return 'reasons_and_bases';
  }
  if (name.includes('conclusion') || name.includes('order')) {
    return 'conclusion';
  }
  if (name.includes('evidence')) {
    return 'evidence';
  }
  if (name.includes('procedural')) {
    return 'procedural_history';
  }

  // Return original if no match
  return sectionName;
}

/**
 * Extract key sections for embedding
 * Prioritize sections that are most useful for semantic search
 */
export function extractKeySections(sections: Record<string, string>): Record<string, string> {
  const keySections: Record<string, string> = {};

  // Priority sections for analysis
  const prioritySections = [
    'findings_of_fact',
    'reasons_and_bases',
    'analysis',
    'conclusion',
  ];

  for (const section of prioritySections) {
    if (sections[section]) {
      keySections[section] = sections[section];
    }
  }

  // If no priority sections found, include all sections
  if (Object.keys(keySections).length === 0) {
    return sections;
  }

  return keySections;
}
