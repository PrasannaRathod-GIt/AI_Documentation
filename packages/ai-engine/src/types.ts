export interface ParsedSymbol {
  name: string;
  kind: 'function' | 'class' | 'interface' | 'type';
  startLine: number;
  endLine: number;
  code: string;
  filePath: string;
}

export interface DocumentationResult {
  symbolName: string;
  filePath: string;
  markdown: string;
  mermaidDiagram?: string;
  tokensUsed: number;
}

export interface SearchableChunk {
  id: string;
  symbolName: string;
  filePath: string;
  summary: string | null;
  rawCode: string;
  similarityScore: number;
}

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  inputLength: number;
}

export interface AIProvider {
  generateDocumentation(symbol: ParsedSymbol, fileContext: string): Promise<DocumentationResult>;
}
