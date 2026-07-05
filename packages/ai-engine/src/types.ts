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

export interface AIProvider {
  generateDocumentation(symbol: ParsedSymbol, fileContext: string): Promise<DocumentationResult>;
}
