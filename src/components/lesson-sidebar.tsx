"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    GraduationCap,
    Play,
    Check,
    X,
} from "lucide-react";
import { useState } from "react";

interface LessonSidebarProps {
    course: {
        id: string;
        title: string;
        modules: {
            id: string;
            title: string;
            lessons: {
                id: string;
                title: string;
                duration_seconds: number;
            }[];
        }[];
    };
    allLessons: { id: string; title: string; duration_seconds: number }[];
    currentLessonId: string;
    progress: { lesson_id: string; completed: boolean }[];
    completedLessons: number;
    overallProgress: number;
}

export function LessonSidebar({
    course,
    allLessons,
    currentLessonId,
    progress,
    completedLessons,
    overallProgress,
}: LessonSidebarProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (!isOpen) {
        return (
            <Button
                variant="outline"
                className="fixed left-4 top-20 z-50"
                onClick={() => setIsOpen(true)}
            >
                Show Lessons
            </Button>
        );
    }

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-80 border-r bg-background">
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b px-4">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5f5f5]">
                            <img
                                src="/icononly_transparent_nobuffer.png"
                                alt="Logo"
                                className="h-5 w-5"
                            />
                        </div>
                        <span className="font-bold">School</span>
                    </Link>
                    <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Course Info */}
                <div className="p-4 border-b">
                    <h2 className="font-semibold mb-2 line-clamp-2">{course.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>{completedLessons} of {allLessons.length} lessons</span>
                    </div>
                    <Progress value={overallProgress} className="h-2" />
                </div>

                {/* Lessons List */}
                <div className="flex-1 overflow-y-auto p-4">
                    {course.modules.map((module, moduleIndex) => (
                        <div key={module.id} className="mb-6">
                            <h3 className="text-sm font-medium text-muted-foreground mb-2">
                                {moduleIndex + 1}. {module.title}
                            </h3>
                            <div className="space-y-1">
                                {module.lessons.map((lesson, lessonIndex) => {
                                    const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed);
                                    const isCurrent = lesson.id === currentLessonId;

                                    return (
                                        <Link
                                            key={lesson.id}
                                            href={`/learn/${course.id}?lesson=${lesson.id}`}
                                            className={`flex items-center gap-3 p-2 rounded-lg text-sm transition-colors ${isCurrent
                                                ? 'bg-primary/10 text-primary'
                                                : isCompleted
                                                    ? 'text-muted-foreground hover:bg-muted'
                                                    : 'hover:bg-muted'
                                                }`}
                                        >
                                            <div className={`flex h-6 w-6 items-center justify-center rounded-full shrink-0 ${isCompleted
                                                ? 'bg-green-500 text-white'
                                                : isCurrent
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'border-2'
                                                }`}>
                                                {isCompleted ? (
                                                    <Check className="h-3 w-3" />
                                                ) : isCurrent ? (
                                                    <Play className="h-3 w-3 ml-0.5" />
                                                ) : (
                                                    <span className="text-xs">{lessonIndex + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="truncate">{lesson.title}</p>
                                            </div>
                                            <span className="text-xs text-muted-foreground shrink-0">
                                                {lesson.duration_seconds
                                                    ? `${Math.floor(lesson.duration_seconds / 60)}:${(lesson.duration_seconds % 60).toString().padStart(2, '0')}`
                                                    : '--:--'
                                                }
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </aside>
    );
}
