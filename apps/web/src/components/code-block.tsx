'use client';

import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

export function CodeBlock({ code, language = 'ts' }: { code: string; language?: string }) {
  const [html, setHtml] = useState('');

  useEffect(() => {
    async function render() {
      const result = await codeToHtml(code, {
        lang: language,
        theme: 'github-dark',
      });
      setHtml(result);
    }

    render();
  }, [code, language]);

  return <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4" dangerouslySetInnerHTML={{ __html: html }} />;
}
