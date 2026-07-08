import { GoogleGenerativeAI } from '@google/generative-ai';
import { DocumentationResult } from '../types.js';

export class EmbeddingService {
  private readonly model = 'text-embedding-004';
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('EmbeddingService requires GEMINI_API_KEY');
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.embedContent(text);
      const values = result.embedding?.values;

      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Embedding response did not contain a valid vector');
      }

      return values;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Embedding generation failed: ${message}`);
    }
  }

  async generateDocumentationEmbedding(result: DocumentationResult): Promise<number[]> {
    const input = [
      result.symbolName,
      result.filePath,
      result.markdown,
      result.mermaidDiagram ?? '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    const text = input.length > 8000 ? input.slice(0, 8000) : input;
    return this.generateEmbedding(text);
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    const cleaned = query.trim().toLowerCase();
    if (!cleaned) {
      throw new Error('Query text must not be empty');
    }

    return this.generateEmbedding(cleaned);
  }
}
