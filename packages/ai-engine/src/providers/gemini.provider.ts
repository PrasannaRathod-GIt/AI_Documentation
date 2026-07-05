import { GoogleGenerativeAI } from '@google/generative-ai';
import { BaseAIProvider } from './base.provider.js';
import { ParsedSymbol, DocumentationResult } from '../types.js';
import { scrubSensitiveData, auditScrubbing } from '../scrubber.js';
import { buildDocumentationPrompt } from '../prompts.js';

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI;
  private modelName = 'gemini-2.5-flash';

  constructor(apiKey: string) {
    super();
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateDocumentation(
    symbol: ParsedSymbol,
    fileContext: string,
  ): Promise<DocumentationResult> {
    // Step 1: scrubSensitiveData(symbol.code)
    const scrubbedCode = scrubSensitiveData(symbol.code);

    // Step 2: auditScrubbing — if changed, log with emoji 🔒
    const { changed, redactionCount } = auditScrubbing(symbol.code, scrubbedCode);
    if (changed) {
      console.log(`🔒 Sensitive data scrubbed in '${symbol.name}'. Redactions: ${redactionCount}`);
    }

    // Step 3: buildDocumentationPrompt(symbol, scrubbedCode)
    const prompt = buildDocumentationPrompt(symbol, scrubbedCode);

    // Step 4: client.getGenerativeModel({ model: modelName }).generateContent(prompt)
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent(prompt);

    // Step 5: parseJsonResponse(result.response.text())
    const { markdown, mermaidDiagram } = this.parseJsonResponse(result.response.text());

    // Step 6: return DocumentationResult with tokensUsed from result.response.usageMetadata?.totalTokenCount ?? 0
    const tokensUsed = result.response.usageMetadata?.totalTokenCount ?? 0;

    return {
      symbolName: symbol.name,
      filePath: symbol.filePath,
      markdown,
      mermaidDiagram,
      tokensUsed,
    };
  }
}
