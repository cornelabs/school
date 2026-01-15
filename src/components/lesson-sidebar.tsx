"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Play,
    Check,
    X,
    Menu,
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

function SidebarContent({
    course,
    allLessons,
    currentLessonId,
    progress,
    completedLessons,
    overallProgress,
    onNavClick,
}: LessonSidebarProps & { onNavClick?: () => void }) {
    return (
        <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
                <Link href="/dashboard" className="flex items-center gap-2" onClick={onNavClick}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                        <img
                            src="/icononly_transparent_nobuffer.png"
                            alt="Logo"
                            className="h-5 w-5"
                        />
                    </div>
                    <span className="text-sm font-semibold">School</span>
                </Link>
            </div>

            {/* Course Info */}
            <div className="p-4 border-b border-border/50">
                <h2 className="text-sm font-semibold mb-1 line-clamp-2">{course.title}</h2>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2">
                    <span>{completedLessons} of {allLessons.length} lessons</span>
                </div>
                <Progress value={overallProgress} className="h-1.5" />
            </div>

            {/* Lessons List */}
            <div className="flex-1 overflow-y-auto p-3">
                {course.modules.map((module, moduleIndex) => (
                    <div key={module.id} className="mb-4">
                        <h3 className="text-[10px] font-medium text-muted-foreground mb-2 px-2">
                            {moduleIndex + 1}. {module.title}
                        </h3>
                        <div className="space-y-0.5">
                            {module.lessons.map((lesson, lessonIndex) => {
                                const isCompleted = progress.some(p => p.lesson_id === lesson.id && p.completed);
                                const isCurrent = lesson.id === currentLessonId;

                                return (
                                    <Link
                                        key={lesson.id}
                                        href={`/learn/${course.id}?lesson=${lesson.id}`}
                                        onClick={onNavClick}
                                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-xs transition-colors ${isCurrent
                                            ? 'bg-foreground text-background'
                                            : isCompleted
                                                ? 'text-muted-foreground hover:bg-muted'
                                                : 'hover:bg-muted'
                                            }`}
                                    >
                                        <div className={`flex h-5 w-5 items-center justify-center rounded-full shrink-0 ${isCompleted
                                            ? 'bg-emerald-500 text-white'
                                            : isCurrent
                                                ? 'bg-background text-foreground'
                                                : 'border border-border'
                                            }`}>
                                            {isCompleted ? (
                                                <Check className="h-3 w-3" />
                                            ) : isCurrent ? (
                                                <Play className="h-2.5 w-2.5 ml-0.5" />
                                            ) : (
                                                <span className="text-[10px]">{lessonIndex + 1}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate">{lesson.title}</p>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground shrink-0">
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
    );
}

export function LessonSidebar(props: LessonSidebarProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-72 border-r border-border/50 bg-card">
                <SidebarContent {...props} />
            </aside>

            {/* Mobile Menu Button - This will be placed in the header of the learn page */}
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden fixed bottom-4 left-4 z-50 h-10 px-4 rounded-full shadow-lg bg-card border-border/50"
                    >
                        <Menu className="h-4 w-4 mr-2" />
                        Lessons
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                    <SidebarContent {...props} onNavClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </>
    );
}
