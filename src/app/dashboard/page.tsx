import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Play,
    ArrowRight,
    Award,
} from "lucide-react";
import { getCurrentUser, getUserEnrollments, getUserProgress } from "@/lib/supabase/queries";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const enrollments = await getUserEnrollments(user.id);

    // Get progress for all enrolled courses
    const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
            const progress = await getUserProgress(user.id, enrollment.course_id);
            const completedLessons = progress.filter(p => p.completed).length;

            // Get total lesson count from course modules
            const course = enrollment.course;
            let totalLessons = 0;
            if (course?.modules) {
                totalLessons = course.modules.reduce((acc: number, m: any) =>
                    acc + (m.lessons?.length || 0), 0);
            }

            // If we have progress data, use that length as fallback
            if (totalLessons === 0) {
                totalLessons = progress.length || 1;
            }

            const progressPercent = totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            return {
                ...enrollment,
                completedLessons,
                totalLessons,
                progressPercent: isNaN(progressPercent) ? 0 : progressPercent,
                isCompleted: progressPercent === 100,
            };
        })
    );

    // Calculate stats based on actual progress
    const enrolledCount = enrollments.length;
    const completedCount = enrollmentsWithProgress.filter(e => e.isCompleted).length;
    const inProgressCount = enrolledCount - completedCount;

    const stats = [
        { label: "Courses Enrolled", value: enrolledCount.toString(), icon: BookOpen },
        { label: "Completed", value: completedCount.toString(), icon: Award },
        { label: "In Progress", value: inProgressCount.toString(), icon: Play },
    ];

    return (
        <SidebarProvider>
            <AppSidebar user={user} />
            <SidebarInset>
                {/* Header */}
                <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border/50 px-4 md:px-6">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-sm font-medium">Dashboard</h1>
                </header>

                <main className="w-full max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8 space-y-6">
                    {/* Welcome Section */}
                    <div>
                        <h2 className="text-xl font-semibold">Welcome back, {user.full_name?.split(' ')[0] || 'Student'}!</h2>
                        <p className="text-sm text-muted-foreground">Continue your learning journey.</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid gap-4 md:grid-cols-3">
                        {stats.map((stat, index) => (
                            <div key={index} className="rounded-xl border border-border/50 bg-card p-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50">
                                        <stat.icon className="h-5 w-5 text-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-semibold">{stat.value}</p>
                                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Enrolled Courses */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold">My Courses</h3>
                            <Button variant="ghost" size="sm" className="h-8 text-xs" asChild>
                                <Link href="/courses">
                                    Browse More
                                    <ArrowRight className="ml-1.5 h-3 w-3" />
                                </Link>
                            </Button>
                        </div>

                        {enrollmentsWithProgress.length === 0 ? (
                            <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                                <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-base font-semibold mb-1">No courses yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">Start your learning journey by enrolling in a course.</p>
                                <Button className="h-9 px-4 text-sm rounded-full" asChild>
                                    <Link href="/courses">
                                        Browse Courses
                                        <ArrowRight className="ml-1.5 h-3 w-3" />
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {enrollmentsWithProgress.map((enrollment) => (
                                    <div key={enrollment.id} className="rounded-xl border border-border/50 bg-card p-5 hover:border-border transition-colors">
                                        <div className="flex gap-4">
                                            <div className="h-20 w-28 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                                                {enrollment.course?.thumbnail_url ? (
                                                    <img
                                                        src={enrollment.course.thumbnail_url}
                                                        alt={enrollment.course.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <BookOpen className="h-6 w-6 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <h4 className="text-sm font-semibold">{enrollment.course?.title}</h4>
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {enrollment.course?.description}
                                                        </p>
                                                    </div>
                                                    <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] shrink-0">
                                                        {enrollment.progressPercent}%
                                                    </Badge>
                                                </div>
                                                <div>
                                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                                                        <span>{enrollment.completedLessons} of {enrollment.totalLessons} lessons</span>
                                                    </div>
                                                    <Progress value={enrollment.progressPercent} className="h-1.5" />
                                                </div>
                                                <Button size="sm" className="h-8 px-3 text-xs rounded-full" asChild>
                                                    <Link href={`/learn/${enrollment.course_id}`}>
                                                        <Play className="mr-1.5 h-3 w-3" />
                                                        Continue
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
