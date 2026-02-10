"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { markLessonCompleteAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

interface AssignmentPlayerProps {
    lesson: {
        id: string;
        title: string;
        assignment_data?: {
            prompt: string;
        };
    };
    isCompleted: boolean;
}

export function AssignmentPlayer({ lesson, isCompleted }: AssignmentPlayerProps) {
    const router = useRouter();
    const [submission, setSubmission] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(isCompleted);

    const handleSubmit = async () => {
        if (!submission.trim()) {
            toast.error("Please enter your answer before submitting.");
            return;
        }

        setIsSubmitting(true);

        try {
            // Ideally save submission text to DB
            await markLessonCompleteAction(lesson.id);
            setSubmitted(true);
            toast.success("Assignment submitted successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Something went wrong saving your progress");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
            <div className="space-y-2">

                <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p>{lesson.assignment_data?.prompt || "Complete the assignment below."}</p>
                </div>
            </div>

            {submitted ? (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-8 text-center space-y-4">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                        <h3 className="text-lg font-medium text-foreground">Assignment Completed</h3>
                        <p className="text-muted-foreground">You have successfully submitted this assignment.</p>
                    </div>
                    {submission && (
                        <div className="mt-6 text-left p-4 rounded-lg bg-background border border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">YOUR SUBMISSION</p>
                            <p className="whitespace-pre-wrap text-sm">{submission}</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <Textarea
                        placeholder="Type your answer here..."
                        className="min-h-[200px] resize-y"
                        value={submission}
                        onChange={(e) => setSubmission(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <Button
                            size="lg"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !submission.trim()}
                        >
                            {isSubmitting ? "Submitting..." : "Submit Assignment"}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
