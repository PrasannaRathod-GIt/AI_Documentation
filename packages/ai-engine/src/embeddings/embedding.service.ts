import { DocumentationResult } from '../types.js';

export class EmbeddingService {
  private readonly modelName = 'gemini-embedding-001';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('EmbeddingService requires GEMINI_API_KEY');
    }

    this.apiKey = apiKey;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:embedContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: `models/${this.modelName}`,
        content: {
          parts: [
            {
              text,
            },
          ],
        },
        outputDimensionality: 768,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(
        `Embedding generation failed (${response.status}): ${error}`,
      );
    }

    const data = (await response.json()) as {
      embedding?: {
        values?: number[];
      };
    };

    if (!data.embedding?.values) {
      throw new Error('Embedding response did not contain any vector.');
    }

    if (data.embedding.values.length !== 768) {
      throw new Error(
        `Expected 768 dimensions but received ${data.embedding.values.length}.`,
      );
    }

    return data.embedding.values;
  }

  async generateDocumentationEmbedding(
    result: DocumentationResult,
  ): Promise<number[]> {
    const input = [
      result.symbolName,
      result.filePath,
      result.markdown,
      result.mermaidDiagram ?? '',
    ]
      .filter(Boolean)
      .join('\n\n')
      .trim();

    const text =
      input.length > 8000 ? input.substring(0, 8000) : input;

    return this.generateEmbedding(text);
  }

  async generateQueryEmbedding(query: string): Promise<number[]> {
    const cleaned = query.trim();

    if (!cleaned) {
      throw new Error('Query cannot be empty.');
    }

    return this.generateEmbedding(cleaned);
  }
}