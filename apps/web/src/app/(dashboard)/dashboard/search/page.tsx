'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/search?q=${encodeURIComponent(query)}&organizationId=00e479cc-ed6b-48ea-afc4-e22de9a8a0d3`,
      );
      const data = await response.json();
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const preview = useMemo(() => {
    return results[0]?.rawCode?.slice(0, 220) || '';
  }, [results]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="mt-2 text-sm text-slate-400">Search code chunks using the existing search endpoint contract.</p>
        <div className="mt-4 flex gap-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2"
            placeholder="Search symbols or docs"
          />
          <button
            onClick={runSearch}
            className="rounded-xl bg-cyan-500 px-4 py-2 font-medium text-slate-950"
            disabled={loading}
          >
            {loading ? 'Searchingâ€¦' : 'Search'}
          </button>
        </div>
      </div>

      {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">Loadingâ€¦</div> : null}

      {!loading && results.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-400">
          {query ? 'No results found.' : 'Enter a query to search the documentation index.'}
        </div>
      ) : null}

      <div className="space-y-3">
        {results.map((result: any) => (
          <article key={result.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">{result.symbolName}</h2>
                <p className="text-sm text-slate-400">{result.filePath} â€¢ {result.language}</p>
              </div>
              <div className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-sm text-cyan-300">
                {result.score?.toFixed(2) ?? 'â€”'}
              </div>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-950 p-4 text-sm text-slate-300">
              {result.rawCode?.slice(0, 400) || preview}
            </pre>
          </article>
        ))}
      </div>
    </div>
  );
}

