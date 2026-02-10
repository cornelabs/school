import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Check,
    Clock,
    BookOpen,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { getCurrentUser, getCourseWithContent, getUserProgress, isEnrolled } from "@/lib/supabase/queries";
import { VideoPlayer } from "@/components/video-player";
import { ReadingContent } from "@/components/reading-content";
import { YouTubePlayer } from "@/components/youtube-player";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { MarkdownText } from "@/components/markdown-text";
import { QuizPlayer } from "@/components/quiz-player";
import { AssignmentPlayer } from "@/components/assignment-player";

interface LearnPageProps {
    params: Promise<{ courseId: string }>;
    searchParams: Promise<{ lesson?: string }>;
}

export default async function LearnPage({ params, searchParams }: LearnPageProps) {
    const { courseId } = await params;
    const { lesson: lessonParam } = await searchParams;

    const user = await getCurrentUser();
    if (!user) {
        redirect('/login');
    }

    // Check enrollment
    const enrolled = await isEnrolled(courseId);
    if (!enrolled) {
        redirect(`/courses/${courseId}`);
    }

    // Get course content
    const course = await getCourseWithContent(courseId);
    if (!course) {
        redirect('/dashboard');
    }

    // Get user progress
    const progress = await getUserProgress(user.id, courseId);

    // Get all lessons flat
    const allLessons = course.modules.flatMap(m => m.lessons);

    // Determine current lesson
    const currentLessonId = lessonParam || allLessons[0]?.id;
    const currentLesson = allLessons.find(l => l.id === currentLessonId) || allLessons[0];
    const currentModule = course.modules.find(m => m.lessons.some(l => l.id === currentLesson?.id));

    if (!currentLesson) {
        redirect('/dashboard');
    }

    // Calculate progress
    const completedLessons = progress.filter(p => p.completed).length;
    const overallProgress = Math.round((completedLessons / allLessons.length) * 100);

    // Find prev/next lessons
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson.id);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Check if current lesson is completed
    const isLessonCompleted = progress.some(p => p.lesson_id === currentLesson.id && p.completed);

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <LessonSidebar
                course={course}
                allLessons={allLessons}
                currentLessonId={currentLesson.id}
                progress={progress}
                completedLessons={completedLessons}
                overallProgress={overallProgress}
            />

            {/* Main Content */}
            <main className="lg:ml-72">
                {/* Top Bar */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-card px-4 md:px-6">
                    <div className="flex items-center gap-2 min-w-0 text-sm">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground shrink-0 hidden sm:flex items-center">
                            <LayoutDashboard className="h-4 w-4 mr-1" />
                            Dashboard
                        </Link>
                        <span className="text-muted-foreground hidden sm:inline">/</span>
                        <span className="font-medium truncate">{course.title}</span>
                    </div>
                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] shrink-0">
                        Lesson {currentIndex + 1} of {allLessons.length}
                    </Badge>
                </header>

                {/* For reading lessons: show title at the top */}
                {currentLesson.type === 'reading' && (
                    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-8 pb-4">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                                <h1 className="text-xl font-semibold mb-1">{currentLesson.title}</h1>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {currentLesson.duration_seconds
                                            ? `${Math.floor(currentLesson.duration_seconds / 60)}:${(currentLesson.duration_seconds % 60).toString().padStart(2, '0')}`
                                            : 'Duration TBD'
                                        }
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {currentModule?.title}
                                    </span>
                                </div>
                            </div>
                            {isLessonCompleted && (
                                <Badge className="rounded-full px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-500 border-0 shrink-0">
                                    <Check className="mr-1 h-3 w-3" />
                                    Completed
                                </Badge>
                            )}
                        </div>

                        {currentLesson.description && (
                            <>
                                <Separator className="my-4 border-border/50" />
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">About this lesson</h3>
                                    <MarkdownText content={currentLesson.description} />
                                </div>
                            </>
                        )}
                        <Separator className="mt-6 border-border/50" />
                    </div>
                )}

                {/* Lesson Content - switches based on lesson type */}
                {currentLesson.type === 'reading' ? (
                    <ReadingContent
                        lesson={currentLesson}
                        isCompleted={isLessonCompleted}
                    />
                ) : currentLesson.type === 'youtube' ? (
                    <YouTubePlayer
                        lesson={currentLesson}
                        isCompleted={isLessonCompleted}
                    />
                ) : currentLesson.type === 'quiz' ? (
                    <QuizPlayer
                        lesson={currentLesson}
                        isCompleted={isLessonCompleted}
                    />
                ) : currentLesson.type === 'assignment' ? (
                    <AssignmentPlayer
                        lesson={currentLesson}
                        isCompleted={isLessonCompleted}
                    />
                ) : (
                    <VideoPlayer
                        lesson={currentLesson}
                        isCompleted={isLessonCompleted}
                    />
                )}

                {/* Lesson Info - only for non-reading lessons */}
                {currentLesson.type !== 'reading' && (
                    <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-lg font-semibold mb-1">{currentLesson.title}</h1>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {currentLesson.duration_seconds
                                            ? `${Math.floor(currentLesson.duration_seconds / 60)}:${(currentLesson.duration_seconds % 60).toString().padStart(2, '0')}`
                                            : 'Duration TBD'
                                        }
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="h-3 w-3" />
                                        {currentModule?.title}
                                    </span>
                                </div>
                            </div>
                            {isLessonCompleted && (
                                <Badge className="rounded-full px-2 py-0.5 text-[10px] bg-emerald-500/10 text-emerald-500 border-0 shrink-0">
                                    <Check className="mr-1 h-3 w-3" />
                                    Completed
                                </Badge>
                            )}
                        </div>

                        {currentLesson.description && (
                            <>
                                <Separator className="my-6 border-border/50" />
                                <div className="space-y-2">
                                    <h3 className="text-sm font-semibold">About this lesson</h3>
                                    <MarkdownText content={currentLesson.description} />
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Navigation - for all lesson types */}
                <div className="max-w-4xl mx-auto px-4 md:px-6 py-6">
                    <Separator className="mb-6 border-border/50" />

                    <div className="flex items-center justify-between gap-4">
                        {prevLesson ? (
                            <Button variant="outline" className="h-9 px-4 text-xs rounded-full" asChild>
                                <Link href={`/learn/${courseId}?lesson=${prevLesson.id}`}>
                                    <ChevronLeft className="mr-1 h-3 w-3" />
                                    Previous
                                </Link>
                            </Button>
                        ) : (
                            <div />
                        )}
                        {nextLesson ? (
                            <Button className="h-9 px-4 text-xs rounded-full" asChild>
                                <Link href={`/learn/${courseId}?lesson=${nextLesson.id}`}>
                                    Next
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        ) : overallProgress === 100 ? (
                            <Button className="h-9 px-4 text-xs rounded-full" asChild>
                                <Link href="/dashboard">
                                    Complete Course
                                    <Check className="ml-1 h-3 w-3" />
                                </Link>
                            </Button>
                        ) : (
                            <Button className="h-9 px-4 text-xs rounded-full" disabled>
                                Complete all lessons
                            </Button>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
