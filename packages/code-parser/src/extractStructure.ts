import ts from 'typescript';

export interface StructuralSymbol {
  type: 'class' | 'interface' | 'type' | 'function';
  name: string;
  signature: string;
  startLine: number;
  endLine: number;
}

export interface StructuralMap {
  filePath: string;
  language: string;
  symbols: StructuralSymbol[];
}

const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function getLanguageFromPath(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();
  if (extension === 'tsx' || extension === 'ts') {
    return 'typescript';
  }
  if (extension === 'jsx' || extension === 'js') {
    return 'javascript';
  }
  return 'unknown';
}

function getLineNumber(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function getEndLine(sourceFile: ts.SourceFile, node: ts.Node): number {
  return sourceFile.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
}

function buildClassSignature(node: ts.ClassDeclaration, sourceFile: ts.SourceFile): string {
  const parts = [`class ${node.name?.getText(sourceFile) ?? 'AnonymousClass'}`];
  const ctor = node.members.find((member): member is ts.ConstructorDeclaration => ts.isConstructorDeclaration(member));
  if (ctor) {
    const params = ctor.parameters
      .map((parameter) => parameter.getText(sourceFile))
      .join(', ');
    parts.push(`constructor(${params})`);
  }

  const publicMethods = node.members.filter((member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member) && (member.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.PublicKeyword) ?? true));
  if (publicMethods.length > 0) {
    const methodSignatures = publicMethods.map((method) => {
      const name = method.name.getText(sourceFile);
      const params = method.parameters.map((parameter) => parameter.getText(sourceFile)).join(', ');
      const returnType = method.type ? `: ${method.type.getText(sourceFile)}` : '';
      return `${name}(${params})${returnType}`;
    });
    parts.push(...methodSignatures);
  }

  return parts.join(' | ');
}

function buildFunctionSignature(node: ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction, sourceFile: ts.SourceFile): string {
  const name = node.name?.getText(sourceFile) ?? 'anonymous';
  const params = node.parameters.map((parameter) => parameter.getText(sourceFile)).join(', ');
  const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
  return `function ${name}(${params})${returnType}`;
}

export function extractStructure(fileContent: string, filePath = 'unknown.ts'): StructuralMap {
  const extension = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '';
  if (!SUPPORTED_EXTENSIONS.has(extension.toLowerCase())) {
    return {
      filePath,
      language: getLanguageFromPath(filePath),
      symbols: [],
    };
  }

  const sourceFile = ts.createSourceFile(filePath, fileContent, ts.ScriptTarget.Latest, true, extension.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const symbols: StructuralSymbol[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isClassDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      symbols.push({
        type: 'class',
        name: node.name?.text ?? 'AnonymousClass',
        signature: buildClassSignature(node, sourceFile),
        startLine: getLineNumber(sourceFile, node),
        endLine: getEndLine(sourceFile, node),
      });
    }

    if (ts.isInterfaceDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      symbols.push({
        type: 'interface',
        name: node.name.text,
        signature: `interface ${node.name.text}`,
        startLine: getLineNumber(sourceFile, node),
        endLine: getEndLine(sourceFile, node),
      });
    }

    if (ts.isTypeAliasDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      symbols.push({
        type: 'type',
        name: node.name.text,
        signature: `type ${node.name.text}`,
        startLine: getLineNumber(sourceFile, node),
        endLine: getEndLine(sourceFile, node),
      });
    }

    if (ts.isFunctionDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
      symbols.push({
        type: 'function',
        name: node.name?.text ?? 'anonymous',
        signature: buildFunctionSignature(node, sourceFile),
        startLine: getLineNumber(sourceFile, node),
        endLine: getEndLine(sourceFile, node),
      });
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);

  return {
    filePath,
    language: getLanguageFromPath(filePath),
    symbols: symbols.sort((a, b) => a.startLine - b.startLine),
  };
}
