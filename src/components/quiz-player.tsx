"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { markLessonCompleteAction } from "@/app/actions";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correct_index: number;
}

interface QuizPlayerProps {
    lesson: {
        id: string;
        title: string;
        quiz_data?: {
            questions: QuizQuestion[];
            passing_score: number;
        };
    };
    isCompleted: boolean;
}

export function QuizPlayer({ lesson, isCompleted }: QuizPlayerProps) {
    const router = useRouter();
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(isCompleted);
    const [score, setScore] = useState<number | null>(null);

    const questions = lesson.quiz_data?.questions || [];
    const passingScore = lesson.quiz_data?.passing_score || 70;

    const handleOptionSelect = (questionId: string, optionIndex: number) => {
        if (submitted) return;
        setAnswers((prev) => ({
            ...prev,
            [questionId]: optionIndex,
        }));
    };

    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach((q) => {
            if (answers[q.id] === q.correct_index) {
                correctCount++;
            }
        });
        return Math.round((correctCount / questions.length) * 100);
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            toast.error("Please answer all questions before submitting.");
            return;
        }

        setIsSubmitting(true);
        const calculatedScore = calculateScore();
        setScore(calculatedScore);
        setSubmitted(true);

        try {
            // Ideally we'd save the score to the database here too, 
            // but for now we just mark as complete if they pass.
            // In a real app, we'd have a specific `submitQuiz` server action.

            if (calculatedScore >= passingScore) {
                await markLessonCompleteAction(lesson.id);
                toast.success(`Quiz passed! Score: ${calculatedScore}%`);
                router.refresh();
            } else {
                toast.error(`Quiz failed. Score: ${calculatedScore}%. Need ${passingScore}% to pass.`);
            }
        } catch (error) {
            toast.error("Something went wrong saving your progress");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRetry = () => {
        setAnswers({});
        setSubmitted(false);
        setScore(null);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    if (!questions.length) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                <p>No questions available for this quiz.</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-8">
            <div className="space-y-2">

                <p className="text-muted-foreground">
                    Pass this quiz with a score of {passingScore}% or higher to complete the lesson.
                </p>
            </div>

            {submitted && score !== null && (
                <Card className={cn(
                    "p-6 border-l-4",
                    score >= passingScore ? "border-l-emerald-500 bg-emerald-500/5" : "border-l-destructive bg-destructive/5"
                )}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">
                                {score >= passingScore ? "Congratulations! You passed." : "Keep trying!"}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Your score: <span className="font-medium text-foreground">{score}%</span>
                            </p>
                        </div>
                        {score < passingScore && (
                            <Button onClick={handleRetry} variant="outline">
                                Retry Quiz
                            </Button>
                        )}
                    </div>
                </Card>
            )}

            <div className="space-y-8">
                {questions.map((q, index) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCorrect = answers[q.id] === q.correct_index;

                    return (
                        <Card key={q.id} className="p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                        {index + 1}
                                    </span>
                                    <h3 className="font-medium leading-normal">{q.question}</h3>
                                </div>

                                <RadioGroup
                                    disabled={submitted}
                                    value={answers[q.id]?.toString()}
                                    onValueChange={(val) => handleOptionSelect(q.id, parseInt(val))}
                                    className="space-y-3 pl-9"
                                >
                                    {q.options.map((option, optIndex) => {
                                        let optionClassName = "flex items-center space-x-2 rounded-lg border border-border/50 p-4 transition-colors hover:bg-muted/50";

                                        if (submitted) {
                                            if (optIndex === q.correct_index) {
                                                optionClassName = "flex items-center space-x-2 rounded-lg border border-emerald-500 bg-emerald-500/10 p-4";
                                            } else if (answers[q.id] === optIndex && optIndex !== q.correct_index) {
                                                optionClassName = "flex items-center space-x-2 rounded-lg border border-destructive bg-destructive/10 p-4";
                                            }
                                        } else if (answers[q.id] === optIndex) {
                                            optionClassName = "flex items-center space-x-2 rounded-lg border border-primary bg-primary/5 p-4";
                                        }

                                        return (
                                            <div key={optIndex} className={optionClassName}>
                                                <RadioGroupItem value={optIndex.toString()} id={`${q.id}-${optIndex}`} />
                                                <Label
                                                    htmlFor={`${q.id}-${optIndex}`}
                                                    className="flex-1 cursor-pointer font-normal"
                                                >
                                                    {option}
                                                </Label>
                                                {submitted && optIndex === q.correct_index && (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                )}
                                                {submitted && answers[q.id] === optIndex && optIndex !== q.correct_index && (
                                                    <XCircle className="h-4 w-4 text-destructive" />
                                                )}
                                            </div>
                                        );
                                    })}
                                </RadioGroup>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {!submitted && (
                <div className="flex justify-end pt-4">
                    <Button
                        size="lg"
                        onClick={handleSubmit}
                        disabled={isSubmitting || Object.keys(answers).length < questions.length}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Quiz"}
                    </Button>
                </div>
            )}
        </div>
    );
}
