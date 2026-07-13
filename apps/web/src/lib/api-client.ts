const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';

export interface RepositoryRecord {
  id: string;
  organizationId: string;
  provider: string;
  providerRepoId: string;
  fullName: string;
  defaultBranch?: string | null;
  githubInstallationId?: string | null;
  webhookSecretEncrypted?: string | null;
  lastSyncedCommitSha?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CodeChunkRecord {
  id: string;
  organizationId: string;
  repositoryId: string;
  filePath: string;
  symbolName: string;
  language: string;
  startLine: number;
  endLine: number;
  rawCode: string;
  summary?: string | null;
  markdown?: string | null;
  mermaidDiagram?: string | null;
  embedding?: number[];
  contentHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SearchResultRecord {
  id: string;
  organizationId: string;
  repositoryId: string;
  filePath: string;
  symbolName: string;
  language: string;
  rawCode: string;
  score?: number;
  summary?: string | null;
  markdown?: string | null;
  mermaidDiagram?: string | null;
}

export async function searchCode(query: string, organizationId: string) {
  const params = new URLSearchParams({ q: query, organizationId });
  const response = await fetch(`${API_BASE}/api/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Search failed');
  }
  return response.json();
}

export async function getRepositories(organizationId: string): Promise<RepositoryRecord[]> {
  const params = new URLSearchParams({ organizationId });
  const response = await fetch(`${API_BASE}/api/repositories?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load repositories');
  }
  return response.json();
}

export async function getCodeChunks(repositoryId: string): Promise<CodeChunkRecord[]> {
  const params = new URLSearchParams({ repositoryId });
  const response = await fetch(`${API_BASE}/api/code-chunks?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to load code chunks');
  }
  return response.json();
}
