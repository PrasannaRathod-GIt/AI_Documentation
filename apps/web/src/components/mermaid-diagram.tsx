'use client';

import mermaid from 'mermaid';
import { useEffect, useRef } from 'react';

export function MermaidDiagram({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({ startOnLoad: false, securityLevel: 'loose' });
    if (ref.current) {
      mermaid.render('mermaid-' + Math.random().toString(36).slice(2), chart).then(({ svg }) => {
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      });
    }
  }, [chart]);

  return <div ref={ref} className="overflow-x-auto" />;
}
