"use client";

import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";

interface MarkdownTextProps {
    content: string;
    className?: string;
}

// Custom components matching reading-content.tsx style but smaller
const markdownComponents: Components = {
    // Headings
    h1: ({ children }) => (
        <h1 className="text-sm font-bold text-foreground mt-4 mb-2 first:mt-0 tracking-tight">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-[13px] font-bold text-foreground mt-4 mb-2 tracking-tight">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-xs font-semibold text-foreground mt-3 mb-1.5">
            {children}
        </h3>
    ),

    // Paragraphs
    p: ({ children }) => (
        <p className="text-xs text-muted-foreground leading-[1.7] mb-3 last:mb-0">
            {children}
        </p>
    ),

    // Lists
    ul: ({ children }) => (
        <ul className="my-2 ml-0.5 space-y-1.5 list-disc list-outside pl-4">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="my-2 ml-0.5 space-y-1.5 list-decimal list-outside pl-4">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="text-xs text-muted-foreground leading-[1.65] pl-0.5">
            {children}
        </li>
    ),

    // Bold and emphasis
    strong: ({ children }) => (
        <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-muted-foreground">{children}</em>
    ),

    // Code
    code: ({ className, children }) => {
        const isInline = !className;
        if (isInline) {
            return (
                <code className="bg-muted text-foreground/90 px-1 py-0.5 rounded text-[10px] font-mono">
                    {children}
                </code>
            );
        }
        return (
            <code className={`${className} font-mono text-[10px]`}>{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-muted border border-border rounded-md p-2.5 overflow-x-auto my-3 text-[10px]">
            {children}
        </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
        <blockquote className="border-l-2 border-primary bg-muted/30 py-1.5 px-3 my-3 rounded-r-md text-xs">
            {children}
        </blockquote>
    ),

    // Horizontal rule
    hr: () => <hr className="my-4 border-border/50" />,

    // Links
    a: ({ href, children }) => (
        <a
            href={href}
            className="text-primary hover:underline"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
            {children}
        </a>
    ),

    // Tables
    table: ({ children }) => (
        <div className="my-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-muted">{children}</thead>
    ),
    tbody: ({ children }) => (
        <tbody>{children}</tbody>
    ),
    tr: ({ children }) => (
        <tr className="border-b border-border">{children}</tr>
    ),
    th: ({ children }) => (
        <th className="border border-border px-3 py-2 text-left font-semibold text-foreground text-xs">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border border-border px-3 py-2 text-muted-foreground text-xs">
            {children}
        </td>
    ),
};

export function MarkdownText({ content, className = "" }: MarkdownTextProps) {
    return (
        <div className={className}>
            <ReactMarkdown components={markdownComponents}>
                {content}
            </ReactMarkdown>
        </div>
    );
}
