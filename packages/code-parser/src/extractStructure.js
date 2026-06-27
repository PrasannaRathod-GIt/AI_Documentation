"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractStructure = extractStructure;
const typescript_1 = __importDefault(require("typescript"));
const SUPPORTED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
function getLanguageFromPath(filePath) {
    const extension = filePath.split('.').pop()?.toLowerCase();
    if (extension === 'tsx' || extension === 'ts') {
        return 'typescript';
    }
    if (extension === 'jsx' || extension === 'js') {
        return 'javascript';
    }
    return 'unknown';
}
function getLineNumber(sourceFile, node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}
function buildClassSignature(node, sourceFile) {
    const parts = [`class ${node.name?.getText(sourceFile) ?? 'AnonymousClass'}`];
    const ctor = node.members.find((member) => typescript_1.default.isConstructorDeclaration(member));
    if (ctor) {
        const params = ctor.parameters
            .map((parameter) => parameter.getText(sourceFile))
            .join(', ');
        parts.push(`constructor(${params})`);
    }
    const publicMethods = node.members.filter((member) => typescript_1.default.isMethodDeclaration(member) && (member.modifiers?.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.PublicKeyword) ?? true));
    if (publicMethods.length > 0) {
        const methodSignatures = publicMethods.map((method) => method.getText(sourceFile).replace(/\s+/g, ' ').trim());
        parts.push(...methodSignatures);
    }
    return parts.join(' | ');
}
function buildFunctionSignature(node, sourceFile) {
    const name = node.name?.getText(sourceFile) ?? 'anonymous';
    const params = node.parameters.map((parameter) => parameter.getText(sourceFile)).join(', ');
    const returnType = node.type ? `: ${node.type.getText(sourceFile)}` : '';
    return `function ${name}(${params})${returnType}`;
}
function extractStructure(fileContent, filePath = 'unknown.ts') {
    const extension = filePath.includes('.') ? filePath.slice(filePath.lastIndexOf('.')) : '';
    if (!SUPPORTED_EXTENSIONS.has(extension.toLowerCase())) {
        return {
            filePath,
            language: getLanguageFromPath(filePath),
            symbols: [],
        };
    }
    const sourceFile = typescript_1.default.createSourceFile(filePath, fileContent, typescript_1.default.ScriptTarget.Latest, true, extension.endsWith('x') ? typescript_1.default.ScriptKind.TSX : typescript_1.default.ScriptKind.TS);
    const symbols = [];
    const visit = (node) => {
        if (typescript_1.default.isClassDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.ExportKeyword)) {
            symbols.push({
                type: 'class',
                name: node.name?.text ?? 'AnonymousClass',
                signature: buildClassSignature(node, sourceFile),
                startLine: getLineNumber(sourceFile, node),
                endLine: getLineNumber(sourceFile, node),
            });
        }
        if (typescript_1.default.isInterfaceDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.ExportKeyword)) {
            symbols.push({
                type: 'interface',
                name: node.name.text,
                signature: `interface ${node.name.text}`,
                startLine: getLineNumber(sourceFile, node),
                endLine: getLineNumber(sourceFile, node),
            });
        }
        if (typescript_1.default.isTypeAliasDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.ExportKeyword)) {
            symbols.push({
                type: 'type',
                name: node.name.text,
                signature: `type ${node.name.text}`,
                startLine: getLineNumber(sourceFile, node),
                endLine: getLineNumber(sourceFile, node),
            });
        }
        if (typescript_1.default.isFunctionDeclaration(node) && node.modifiers?.some((modifier) => modifier.kind === typescript_1.default.SyntaxKind.ExportKeyword)) {
            symbols.push({
                type: 'function',
                name: node.name?.text ?? 'anonymous',
                signature: buildFunctionSignature(node, sourceFile),
                startLine: getLineNumber(sourceFile, node),
                endLine: getLineNumber(sourceFile, node),
            });
        }
        typescript_1.default.forEachChild(node, visit);
    };
    visit(sourceFile);
    return {
        filePath,
        language: getLanguageFromPath(filePath),
        symbols: symbols.sort((a, b) => a.startLine - b.startLine),
    };
}
