import { ParsedSymbol } from './types.js';

export function buildDocumentationPrompt(
  symbol: ParsedSymbol,
  scrubbedCode: string,
): string {
  return `You are a senior software engineer writing technical documentation.

Analyze this ${symbol.kind} and generate comprehensive GitHub-Flavored Markdown.

## Symbol Information
- Name: ${symbol.name}
- Type: ${symbol.kind}
- File: ${symbol.filePath}
- Lines: ${symbol.startLine}-${symbol.endLine}

## Source Code
\`\`\`typescript
${scrubbedCode}
\`\`\`

Respond with ONLY valid JSON, no markdown fences:
{
  "markdown": "full documentation here",
  "mermaidDiagram": "graph TD\\n  A --> B"
}

Markdown must include:
## Overview
## Parameters (table with Name, Type, Description columns)
## Returns
## Example Usage
## Notes

Only include mermaidDiagram for non-trivial logic.`;
}