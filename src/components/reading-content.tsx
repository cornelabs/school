"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface ReadingContentProps {
    lesson: {
        id: string;
        title: string;
        content?: string | null;
    };
    isCompleted: boolean;
    onComplete?: () => void;
}

// Custom components for ReactMarkdown to match blog styling
const markdownComponents: Components = {
    // Headings
    h1: ({ children }) => (
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-0 mb-6 tracking-tight">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl md:text-2xl font-bold text-foreground mt-10 mb-4 tracking-tight">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg md:text-xl font-semibold text-foreground mt-8 mb-3">
            {children}
        </h3>
    ),

    // Paragraphs
    p: ({ children }) => (
        <p className="text-foreground/85 leading-[1.75] mb-5 text-base md:text-lg">
            {children}
        </p>
    ),

    // Lists
    ul: ({ children }) => (
        <ul className="my-5 ml-1 space-y-3 list-disc list-outside pl-5">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="my-5 ml-1 space-y-3 list-decimal list-outside pl-5">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="text-foreground/85 leading-[1.7] text-base md:text-lg pl-1">
            {children}
        </li>
    ),

    // Bold and emphasis
    strong: ({ children }) => (
        <strong className="font-bold text-foreground">{children}</strong>
    ),
    em: ({ children }) => (
        <em className="italic text-foreground/90">{children}</em>
    ),

    // Code
    code: ({ className, children }) => {
        const isInline = !className;
        if (isInline) {
            return (
                <code className="bg-muted text-foreground/90 px-1.5 py-0.5 rounded text-sm font-mono">
                    {children}
                </code>
            );
        }
        return (
            <code className={`${className} font-mono`}>{children}</code>
        );
    },
    pre: ({ children }) => (
        <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto my-6 text-sm">
            {children}
        </pre>
    ),

    // Blockquote
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-primary bg-muted/30 py-3 px-5 my-6 rounded-r-lg">
            {children}
        </blockquote>
    ),

    // Horizontal rule
    hr: () => <hr className="my-8 border-border/50" />,

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

    // Table
    table: ({ children }) => (
        <div className="my-6 overflow-x-auto">
            <table className="w-full border-collapse border border-border rounded-lg">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-muted">{children}</thead>
    ),
    th: ({ children }) => (
        <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="border border-border px-4 py-3 text-foreground/85">
            {children}
        </td>
    ),
};

export function ReadingContent({ lesson, isCompleted, onComplete }: ReadingContentProps) {
    const router = useRouter();
    const [isMarking, setIsMarking] = useState(false);

    const handleMarkComplete = async () => {
        setIsMarking(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Not authenticated");
            setIsMarking(false);
            return;
        }

        const { error } = await supabase
            .from("progress")
            .upsert({
                user_id: user.id,
                lesson_id: lesson.id,
                completed: true,
                last_watched_at: new Date().toISOString(),
            }, {
                onConflict: "user_id,lesson_id",
            });

        if (error) {
            toast.error("Failed to mark as complete");
        } else {
            toast.success("Lesson marked as complete!");
            onComplete?.();
            router.refresh();
        }
        setIsMarking(false);
    };

    if (!lesson.content) {
        return (
            <div className="bg-card border-b border-border/50 py-16">
                <div className="max-w-3xl mx-auto px-4 md:px-6 text-center">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground mb-6">Reading content coming soon</p>
                    {!isCompleted && (
                        <Button onClick={handleMarkComplete} disabled={isMarking}>
                            {isMarking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Mark as Complete
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border-b border-border/50">
            <div className="max-w-2xl mx-auto px-4 md:px-6 py-10 md:py-14">
                {/* Reading Content with Markdown */}
                <article>
                    <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
                        {lesson.content}
                    </ReactMarkdown>
                </article>

                {/* Mark Complete Button */}
                {!isCompleted && (
                    <div className="mt-8 pt-6 border-t border-border/50 flex justify-center">
                        <Button onClick={handleMarkComplete} disabled={isMarking} size="lg">
                            {isMarking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Mark as Complete
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
