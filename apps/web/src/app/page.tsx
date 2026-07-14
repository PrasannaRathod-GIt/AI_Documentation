import Link from 'next/link';

async function getRepository(repoSlug: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  const url = `${base}/api/repositories?organizationId=00e479cc-ed6b-48ea-afc4-e22de9a8a0d3`;
  console.log('🔍 Fetching repositories from:', url);
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    console.log('📡 Response status:', response.status);
    if (!response.ok) {
      console.log('❌ Response not ok:', await response.text());
      return null;
    }
    const repos = await response.json();
    console.log('📦 Repos received:', repos);
    const found = repos.find((r: any) => r.fullName.includes(repoSlug));
    console.log('🎯 Matched repo:', found);
    return found || null;
  } catch (error) {
    console.log('💥 Fetch error:', error);
    return null;
  }
}

async function getCodeChunks(repositoryId: string) {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
  const url = `${base}/api/code-chunks?repositoryId=${encodeURIComponent(repositoryId)}`;
  console.log('🔍 Fetching code chunks from:', url);
  
  try {
    const response = await fetch(url, { cache: 'no-store' });
    console.log('📡 Chunks response status:', response.status);
    if (!response.ok) return [];
    const chunks = await response.json();
    console.log('📦 Chunks received:', chunks.length);
    return chunks;
  } catch (error) {
    console.log('💥 Chunks fetch error:', error);
    return [];
  }
}

export default async function DocsPage({ params }: { params: Promise<{ repo: string }> }) {
  const { repo } = await params;
  const repository = await getRepository(repo);
  const codeChunks = repository ? await getCodeChunks(repository.id) : [];

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-6">

        {/* TEMPORARY DEBUG BLOCK — remove after fixing */}
        <div style={{ background: '#222', color: '#0f0', padding: '16px', fontFamily: 'monospace', fontSize: '12px', whiteSpace: 'pre-wrap' }}>
          <div>repo slug: {repo}</div>
          <div>API_URL env: {process.env.NEXT_PUBLIC_API_URL || 'NOT SET (using fallback)'}</div>
          <div>repository found: {JSON.stringify(repository, null, 2)}</div>
          <div>codeChunks count: {codeChunks.length}</div>
        </div>
        {/* END DEBUG BLOCK */}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Docs</p>
            <h1 className="text-3xl font-semibold">{repo}</h1>
          </div>
          <Link href="/dashboard" className="rounded-full border border-slate-700 px-4 py-2 text-sm hover:border-cyan-400">
            Back to dashboard
          </Link>
        </div>
        {codeChunks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-10 text-center text-slate-400">
            No code chunks available for this repository yet.
          </div>
        ) : (
          <div className="space-y-6">
            {codeChunks.map((chunk: any) => (
              <article key={chunk.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold">{chunk.symbolName}</h2>
                  <div className="flex gap-2">
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">{chunk.language}</span>
                    <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">{chunk.filePath}</span>
                  </div>
                </div>
                <div className="mt-4 whitespace-pre-wrap text-sm text-slate-400">{chunk.markdown || chunk.summary || 'No markdown summary available.'}</div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}