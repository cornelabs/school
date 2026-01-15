import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Clock,
    Play,
} from "lucide-react";
import { getCourseWithContent, getCurrentUser, isEnrolled } from "@/lib/supabase/queries";
import { EnrollButton } from "@/components/enroll-button";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface CourseDetailPageProps {
    params: Promise<{ id: string }>;
}

function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
        case "beginner":
            return "bg-emerald-500/10 text-emerald-500";
        case "intermediate":
            return "bg-amber-500/10 text-amber-500";
        case "advanced":
            return "bg-red-500/10 text-red-500";
        default:
            return "bg-muted text-muted-foreground";
    }
}

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
    const { id } = await params;

    const course = await getCourseWithContent(id);
    if (!course) {
        notFound();
    }

    const user = await getCurrentUser();
    const enrolled = user ? await isEnrolled(id) : false;

    const totalLessons = course.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalDuration = course.modules.reduce((acc, m) =>
        acc + m.lessons.reduce((lacc, l) => lacc + (l.duration_seconds || 0), 0), 0
    );

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <div className="flex items-center gap-2 text-sm min-w-0">
                        <Link href="/courses" className="text-muted-foreground hover:text-foreground shrink-0">
                            Courses
                        </Link>
                        <span className="text-muted-foreground">/</span>
                        <span className="font-medium truncate">{course.title}</span>
                    </div>
                </header>

                <main className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
                    <div className="flex flex-col-reverse lg:grid lg:grid-cols-3 gap-6 lg:gap-8">
                        {/* Main Content */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Course Header */}
                            <div>
                                <div className="flex items-center gap-1.5 mb-3">
                                    {course.category && (
                                        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                                            {course.category}
                                        </Badge>
                                    )}
                                    <Badge className={`rounded-full px-2 py-0.5 text-[10px] border-0 ${getDifficultyColor(course.difficulty)}`}>
                                        {course.difficulty.charAt(0).toUpperCase() + course.difficulty.slice(1)}
                                    </Badge>
                                </div>
                                <h1 className="text-xl font-semibold mb-2">{course.title}</h1>
                                <p className="text-sm text-muted-foreground">{course.description}</p>
                            </div>

                            {/* Course Stats */}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1.5">
                                    <BookOpen className="h-4 w-4" />
                                    <span>{totalLessons} lessons</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4" />
                                    <span>
                                        {totalDuration > 0
                                            ? `${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m`
                                            : 'Duration TBD'
                                        }
                                    </span>
                                </div>
                            </div>

                            <Separator className="border-border/50" />

                            {/* Curriculum */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold">Curriculum</h2>
                                <div className="space-y-3">
                                    {course.modules.map((module, moduleIndex) => (
                                        <div key={module.id} className="rounded-xl border border-border/50 bg-card p-5">
                                            <div className="mb-3">
                                                <h3 className="text-sm font-semibold">
                                                    {moduleIndex + 1}. {module.title}
                                                </h3>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {module.lessons.length} lessons
                                                </p>
                                            </div>
                                            <div className="space-y-1.5">
                                                {module.lessons.map((lesson) => (
                                                    <div
                                                        key={lesson.id}
                                                        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
                                                    >
                                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 shrink-0">
                                                            <Play className="h-3 w-3" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-medium">{lesson.title}</p>
                                                        </div>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {lesson.duration_seconds
                                                                ? `${Math.floor(lesson.duration_seconds / 60)}:${(lesson.duration_seconds % 60).toString().padStart(2, '0')}`
                                                                : '--:--'
                                                            }
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 rounded-xl border border-border/50 bg-card overflow-hidden">
                                {/* Thumbnail */}
                                <div className="aspect-video bg-muted/50 flex items-center justify-center">
                                    {course.thumbnail_url ? (
                                        <img
                                            src={course.thumbnail_url}
                                            alt={course.title}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <BookOpen className="h-12 w-12 text-muted-foreground" />
                                    )}
                                </div>
                                <div className="p-5 space-y-4">
                                    {enrolled ? (
                                        <Button className="w-full h-9 text-sm rounded-full" asChild>
                                            <Link href={`/learn/${course.id}`}>
                                                <Play className="mr-1.5 h-3 w-3" />
                                                Continue Learning
                                            </Link>
                                        </Button>
                                    ) : user ? (
                                        <EnrollButton courseId={course.id} />
                                    ) : (
                                        <Button className="w-full h-9 text-sm rounded-full" asChild>
                                            <Link href={`/login?redirect=/courses/${course.id}`}>
                                                Sign in to Enroll
                                            </Link>
                                        </Button>
                                    )}

                                    <Separator className="border-border/50" />

                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-muted-foreground">Lessons</span>
                                            <span className="font-medium">{totalLessons}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-muted-foreground">Modules</span>
                                            <span className="font-medium">{course.modules.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-1">
                                            <span className="text-muted-foreground">Difficulty</span>
                                            <span className="font-medium capitalize">{course.difficulty}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
