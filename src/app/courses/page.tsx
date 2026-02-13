import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Clock,
    ArrowRight,
    Search,
    Lock,
} from "lucide-react";
import { getPublishedCourses, getCurrentUser } from "@/lib/supabase/queries";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

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

function formatDifficulty(difficulty: string) {
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}

export default async function CoursesPage() {
    const courses = await getPublishedCourses();
    const user = await getCurrentUser();

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-sm font-medium">Courses</h1>
                </header>

                <main className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
                    {/* Page Header */}
                    <div>
                        <h2 className="text-xl font-semibold">All Courses</h2>
                        <p className="text-sm text-muted-foreground">
                            Explore our comprehensive collection of courses
                        </p>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search courses..."
                                className="pl-10 h-9 text-sm rounded-full border-border/50"
                            />
                        </div>
                    </div>

                    {/* Courses Grid */}
                    {courses.length === 0 ? (
                        <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                            <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                            <h3 className="text-base font-semibold mb-1">No courses available yet</h3>
                            <p className="text-sm text-muted-foreground">Check back soon for new courses!</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course) => (
                                <div
                                    key={course.id}
                                    className="rounded-xl border border-border/50 bg-card overflow-hidden hover:border-border transition-colors"
                                >
                                    {/* Course Thumbnail */}
                                    <div className="h-36 bg-muted/50 flex items-center justify-center relative">
                                        {course.status === 'locked' && (
                                            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                                                <div className="bg-background/80 px-3 py-1 rounded-full border shadow-sm flex items-center gap-2">
                                                    <Lock className="h-4 w-4" />
                                                    <span className="text-xs font-medium">Locked</span>
                                                </div>
                                            </div>
                                        )}
                                        {course.status !== 'locked' && (
                                            <div className="absolute top-3 right-3 z-10">
                                                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm text-[10px] px-2 py-0.5">
                                                    Premium
                                                </Badge>
                                            </div>
                                        )}
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <BookOpen className="h-10 w-10 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center gap-1.5">
                                            {course.category && (
                                                <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px]">
                                                    {course.category}
                                                </Badge>
                                            )}
                                            <Badge className={`rounded-full px-2 py-0.5 text-[10px] border-0 ${getDifficultyColor(course.difficulty)}`}>
                                                {formatDifficulty(course.difficulty)}
                                            </Badge>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold mb-1">{course.title}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {course.description}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" />
                                                {course.lesson_count || 0} lessons
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {course.duration_minutes ? `${Math.round(course.duration_minutes / 60)}h` : 'TBD'}
                                            </span>
                                        </div>
                                        <Button className="w-full h-9 text-sm rounded-full" asChild>
                                            <Link href={`/courses/${course.id}`}>
                                                View Course
                                                <ArrowRight className="ml-1.5 h-3 w-3" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
