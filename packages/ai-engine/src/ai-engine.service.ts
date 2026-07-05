import { ParsedSymbol, DocumentationResult, AIProvider } from './types.js';
import { GeminiProvider } from './providers/gemini.provider.js';

export class AIEngineService {
  private provider: AIProvider;

  constructor(apiKey: string, providerName: 'gemini' = 'gemini') {
    switch (providerName) {
      case 'gemini':
        this.provider = new GeminiProvider(apiKey);
        break;
      // Add 'openai' | 'anthropic' cases here later
      default:
        throw new Error(`Unsupported AI provider: ${providerName}`);
    }
  }

  async documentSymbol(symbol: ParsedSymbol, fileContext = ''): Promise<DocumentationResult> {
    return this.provider.generateDocumentation(symbol, fileContext);
  }

  async documentMultiple(
    symbols: ParsedSymbol[],
    fileContext = '',
  ): Promise<DocumentationResult[]> {
    const results: DocumentationResult[] = [];
    for (const symbol of symbols) {
      results.push(await this.documentSymbol(symbol, fileContext));
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
    return results;
  }
}
