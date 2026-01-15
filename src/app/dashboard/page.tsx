import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
    BookOpen,
    Play,
    ArrowRight,
    Award,
} from "lucide-react";
import { getCurrentUser, getUserEnrollments, getUserProgress } from "@/lib/supabase/queries";
import { SharedHeader } from "@/components/shared-header";

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const enrollments = await getUserEnrollments(user.id);

    // Calculate stats
    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter(e => e.status === 'completed').length;

    // Get progress for all enrolled courses
    const enrollmentsWithProgress = await Promise.all(
        enrollments.map(async (enrollment) => {
            const progress = await getUserProgress(user.id, enrollment.course_id);
            const completedLessons = progress.filter(p => p.completed).length;
            const totalLessons = progress.length || 1;
            const progressPercent = Math.round((completedLessons / totalLessons) * 100);

            return {
                ...enrollment,
                completedLessons,
                totalLessons: progress.length,
                progressPercent: isNaN(progressPercent) ? 0 : progressPercent,
            };
        })
    );

    const stats = [
        { label: "Courses Enrolled", value: enrolledCount.toString(), icon: BookOpen },
        { label: "Completed", value: completedCount.toString(), icon: Award },
        { label: "In Progress", value: (enrolledCount - completedCount).toString(), icon: Play },
    ];

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <SharedHeader user={user} currentPage="dashboard" />

            <main className="container mx-auto px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Welcome back, {user.full_name?.split(' ')[0] || 'Student'}!</h1>
                    <p className="text-muted-foreground">Continue your AI learning journey.</p>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {stats.map((stat, index) => (
                        <Card key={index} className="shadow-premium border-0 bg-white">
                            <CardContent className="flex items-center gap-4 p-6">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f5]">
                                    <stat.icon className="h-6 w-6 text-[#171717]" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Enrolled Courses */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold">My Courses</h2>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/courses">
                                Browse More
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>

                    {enrollmentsWithProgress.length === 0 ? (
                        <Card className="text-center py-12 shadow-premium border-0 bg-white">
                            <CardContent>
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                                <p className="text-muted-foreground mb-4">Start your learning journey by enrolling in a course.</p>
                                <Button asChild>
                                    <Link href="/courses">
                                        Browse Courses
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {enrollmentsWithProgress.map((enrollment) => (
                                <Card key={enrollment.id} className="shadow-premium border-0 bg-white card-hover">
                                    <CardContent className="p-6">
                                        <div className="flex gap-4">
                                            <div className="h-24 w-32 rounded-lg bg-[#f5f5f5] flex items-center justify-center shrink-0">
                                                {enrollment.course?.thumbnail_url ? (
                                                    <img
                                                        src={enrollment.course.thumbnail_url}
                                                        alt={enrollment.course.title}
                                                        className="w-full h-full object-cover rounded-lg"
                                                    />
                                                ) : (
                                                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div>
                                                        <h3 className="font-semibold">{enrollment.course?.title}</h3>
                                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                                            {enrollment.course?.description}
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">{enrollment.progressPercent}%</Badge>
                                                </div>
                                                <div className="mb-3">
                                                    <div className="flex items-center justify-between text-sm mb-1">
                                                        <span className="text-muted-foreground">
                                                            {enrollment.completedLessons} of {enrollment.totalLessons} lessons
                                                        </span>
                                                    </div>
                                                    <Progress value={enrollment.progressPercent} className="h-2" />
                                                </div>
                                                <Button size="sm" asChild>
                                                    <Link href={`/learn/${enrollment.course_id}`}>
                                                        <Play className="mr-2 h-3 w-3" />
                                                        Continue
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
