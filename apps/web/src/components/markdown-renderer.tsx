import { MDXRemote } from 'next-mdx-remote/rsc';

export function MarkdownRenderer({ content }: { content: string }) {
  return <MDXRemote source={content} />;
}
