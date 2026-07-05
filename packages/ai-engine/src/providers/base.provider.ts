import { AIProvider, ParsedSymbol, DocumentationResult } from '../types.js';

export abstract class BaseAIProvider implements AIProvider {
  abstract generateDocumentation(
    symbol: ParsedSymbol,
    fileContext: string,
  ): Promise<DocumentationResult>;

  protected parseJsonResponse(raw: string): { markdown: string; mermaidDiagram?: string } {
    // Strip ```json and ``` fences if the model wraps the response in them
    const cleanedRaw = raw.replace(/^```json\n/g, '').replace(/\n```$/g, '');
    
    try {
      const parsed = JSON.parse(cleanedRaw);
      return {
        markdown: parsed.markdown,
        mermaidDiagram: parsed.mermaidDiagram,
      };
    } catch (error) {
      // If JSON.parse throws, return the raw string as markdown fallback
      return { markdown: raw };
    }
  }
}
