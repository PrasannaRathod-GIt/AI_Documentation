import Link from 'next/link';

const features = [
  {
    title: 'Repository-aware docs',
    description: 'Turn codebases into navigable documentation with structured summaries.',
  },
  {
    title: 'Fast search',
    description: 'Search across symbols, files, and generated docs from a single place.',
  },
  {
    title: 'Live syncs',
    description: 'Keep documentation current as repositories change through webhook-driven updates.',
  },
];

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-24">
        <div className="max-w-3xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">AI Documentation</p>
          <h1 className="text-4xl font-semibold sm:text-6xl">Turn your codebase into a living documentation experience.</h1>
          <p className="text-lg text-slate-300">
            Explore repositories, inspect generated code chunks, and ship better docs with the same workflow your team already uses.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/sign-up" className="rounded-full bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
              Get Started
            </Link>
            <Link href="/docs/acme-corp" className="rounded-full border border-slate-700 px-5 py-3 font-medium text-slate-200 transition hover:border-cyan-400 hover:text-cyan-400">
              View Demo
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-lg shadow-slate-950/40">
              <h2 className="text-xl font-semibold">{feature.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-6 text-center text-sm text-slate-500">
        AI Documentation — generated insights for every repository.
      </footer>
    </main>
  );
}
