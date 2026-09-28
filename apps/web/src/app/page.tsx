import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-8">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">AI Documentation Generator</p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Turn any GitHub repo into searchable, AI-generated documentation.
        </h1>
        <p className="mt-6 max-w-2xl text-slate-400">
          Connect a repository, and every push is automatically parsed, documented with
          Markdown and diagrams, and made instantly searchable in plain English.
        </p>
        <div className="mt-8 flex gap-4">
          <Link
            href="/dashboard"
            className="rounded-full bg-cyan-500 px-6 py-3 text-sm font-medium text-slate-950"
          >
            Go to dashboard
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
