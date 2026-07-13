import Link from 'next/link';

async function getRepositories() {
  try {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3333';
    const response = await fetch(`${base}/api/repositories?organizationId=placeholder`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return [];
    }

    return response.json();
  } catch {
    return [];
  }
}

export default async function RepositoriesPage() {
  const repositories = await getRepositories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Repositories</h1>
          <p className="text-sm text-slate-400">Connected repositories available in the current workspace.</p>
        </div>
      </div>

      {repositories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-10 text-center text-slate-400">
          No repositories available yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800/70 text-left text-slate-300">
              <tr>
                <th className="px-4 py-3">Repository</th>
                <th className="px-4 py-3">Provider</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Last Sync</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {repositories.map((repository: any) => (
                <tr key={repository.id} className="border-t border-slate-800">
                  <td className="px-4 py-3 font-medium">{repository.fullName}</td>
                  <td className="px-4 py-3">{repository.provider}</td>
                  <td className="px-4 py-3">{repository.defaultBranch}</td>
                  <td className="px-4 py-3">{repository.lastSyncedCommitSha || '—'}</td>
                  <td className="px-4 py-3">
                    <Link href={`/docs/${repository.fullName}`} className="text-cyan-400 hover:underline">
                      View Docs
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
