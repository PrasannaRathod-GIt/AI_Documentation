import Link from 'next/link';

async function getDashboardStats() {
  try {
    const [reposRes, chunksRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/repositories?organizationId=placeholder`, {
        cache: 'no-store',
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333'}/api/code-chunks?repositoryId=placeholder`, {
        cache: 'no-store',
      }),
    ]);

    if (!reposRes.ok || !chunksRes.ok) {
      return { repositories: 0, codeChunks: 0, offline: true };
    }

    const repositories = await reposRes.json();
    const codeChunks = await chunksRes.json();

    return {
      repositories: Array.isArray(repositories) ? repositories.length : 0,
      codeChunks: Array.isArray(codeChunks) ? codeChunks.length : 0,
      offline: false,
    };
  } catch {
    return { repositories: 0, codeChunks: 0, offline: true };
  }
}

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold">Welcome back</h1>
        <p className="mt-2 text-slate-400">Your documentation workspace is ready. Start by reviewing repositories or searching generated code chunks.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Repositories</p>
          <p className="mt-2 text-2xl font-semibold">{stats.repositories}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Code Chunks</p>
          <p className="mt-2 text-2xl font-semibold">{stats.codeChunks}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Last Sync</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-sm text-slate-400">Search Queries</p>
          <p className="mt-2 text-2xl font-semibold">0</p>
        </div>
      </div>

      {stats.offline ? (
        <div className="rounded-2xl border border-amber-700/40 bg-amber-500/10 p-4 text-sm text-amber-300">
          API endpoints unavailable; showing placeholder values.
        </div>
      ) : null}

      <div className="flex gap-3">
        <Link className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-medium text-slate-950" href="/dashboard/repositories">
          View repositories
        </Link>
        <Link className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300" href="/dashboard/search">
          Search docs
        </Link>
      </div>
    </div>
  );
}
