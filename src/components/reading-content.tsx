"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, Loader2, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

interface ReadingContentProps {
    lesson: {
        id: string;
        title: string;
        content?: string | null;
    };
    isCompleted: boolean;
    onComplete?: () => void;
}

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
            <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
                {/* Reading Content with Markdown */}
                <article className="prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none
                    prose-headings:font-semibold prose-headings:text-foreground
                    prose-h1:text-2xl prose-h1:md:text-3xl prose-h1:mb-6 prose-h1:mt-0
                    prose-h2:text-xl prose-h2:md:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-h3:text-lg prose-h3:md:text-xl prose-h3:mt-6 prose-h3:mb-3
                    prose-p:text-foreground/90 prose-p:leading-relaxed prose-p:mb-4
                    prose-li:text-foreground/90 prose-li:mb-2
                    prose-strong:text-foreground prose-strong:font-semibold
                    prose-ul:my-4 prose-ol:my-4
                    prose-blockquote:border-l-primary prose-blockquote:bg-muted/50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-md
                    prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
                    prose-pre:bg-muted prose-pre:border prose-pre:border-border
                ">
                    <ReactMarkdown>{lesson.content}</ReactMarkdown>
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

