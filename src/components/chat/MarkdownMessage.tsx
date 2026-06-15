import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarkdownMessageProps {
  content: string;
  isUser?: boolean;
  showCopyButton?: boolean;
}

export function MarkdownMessage({ content, isUser = false, showCopyButton = false }: MarkdownMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  if (isUser) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{content}</p>;
  }

  return (
    <div className="relative group">
      {showCopyButton && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className="absolute -top-1 -right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background shadow-sm z-10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      )}
      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => (
              <h1 className="text-lg font-bold mt-4 mb-2 first:mt-0">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-sm font-bold mt-2 mb-1 first:mt-0">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-2 last:mb-0 break-words">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed break-words">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="font-semibold text-foreground">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic">{children}</em>
            ),
            code: ({ className, children }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono text-xs break-all">
                    {children}
                  </code>
                );
              }
              return (
                <code className={cn("block", className)}>
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="bg-muted p-3 rounded-lg overflow-x-auto my-2 text-xs">
                {children}
              </pre>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-2 -mx-2 px-2">
                <table className="min-w-full border-collapse text-xs">
                  {children}
                </table>
              </div>
            ),
            thead: ({ children }) => (
              <thead className="bg-muted/50">{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody className="divide-y divide-border">{children}</tbody>
            ),
            tr: ({ children }) => (
              <tr className="border-b border-border">{children}</tr>
            ),
            th: ({ children }) => (
              <th className="px-2 py-1.5 text-left font-semibold border border-border whitespace-nowrap">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="px-2 py-1.5 border border-border">{children}</td>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline break-all"
              >
                {children}
              </a>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-primary pl-3 italic my-2">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="my-3 border-border" />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
