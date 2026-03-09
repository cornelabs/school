import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getCourseWithContent, getUserProgress, isEnrolled, getCertificate } from "@/lib/supabase/queries";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { Trophy, Sparkles, LayoutDashboard } from "lucide-react";
import { CertificateGenerator } from "./certificate-generator";

interface CertificatePageProps {
    params: Promise<{ courseId: string }>;
}

export default async function CertificatePage({ params }: CertificatePageProps) {
    const { courseId } = await params;

    const user = await getCurrentUser();
    if (!user) redirect("/login");

    const enrolled = await isEnrolled(courseId);
    if (!enrolled) redirect(`/courses/${courseId}`);

    const course = await getCourseWithContent(courseId);
    if (!course) redirect("/dashboard");

    const progress = await getUserProgress(user.id, courseId);
    const allLessons = course.modules.flatMap((m) => m.lessons);
    const completedLessons = progress.filter((p) => p.completed).length;
    const overallProgress = Math.round((allLessons.length ? (completedLessons / allLessons.length) * 100 : 0));

    if (overallProgress !== 100) {
        redirect(`/learn/${courseId}`);
    }

    const certificate = await getCertificate(user.id, courseId);

    const allLessonsCount = allLessons.length;

    return (
        <div className="min-h-screen bg-background">
            <LessonSidebar
                course={course}
                allLessons={allLessons}
                currentLessonId=""
                progress={progress}
                completedLessons={completedLessons}
                overallProgress={overallProgress}
            />

            <main className="lg:ml-72">
                {/* Top Bar - same as learn content pages */}
                <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-card px-4 md:px-6">
                    <div className="flex items-center gap-2 min-w-0 text-sm">
                        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground shrink-0 hidden sm:flex items-center">
                            <LayoutDashboard className="h-4 w-4 mr-1" />
                            Dashboard
                        </Link>
                        <span className="text-muted-foreground hidden sm:inline">/</span>
                        <span className="font-medium truncate">{course.title}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground shrink-0 rounded-full px-2 py-0.5">
                        {allLessonsCount} {allLessonsCount === 1 ? "lesson" : "lessons"}
                    </span>
                </header>

                <div className="flex flex-col items-center justify-center px-4 md:px-6 py-12 relative overflow-hidden min-h-[calc(100vh-3.5rem)]">
                    {/* Decorative background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 via-background to-emerald-50/60 dark:from-amber-950/20 dark:via-background dark:to-emerald-950/20 pointer-events-none" />
                    <div className="absolute top-20 left-10 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-xl w-full text-center space-y-8">
                    {/* Trophy and badge */}
                    <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl scale-150 animate-pulse" />
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-lg ring-4 ring-amber-400/30">
                                <Trophy className="h-12 w-12" strokeWidth={2} />
                            </div>
                            <div className="absolute -top-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white">
                                <Sparkles className="h-4 w-4" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-amber-700 dark:from-amber-400 dark:to-amber-300 bg-clip-text text-transparent">
                            Congratulations!
                        </h1>
                        <p className="text-lg md:text-xl font-semibold text-foreground">
                            You’ve completed the{" "}
                            <span className="text-amber-600 dark:text-amber-400">{course.title}</span> course.
                        </p>
                        <CertificateGenerator
                            courseId={courseId}
                            studentName={user.full_name ?? user.email ?? "Learner"}
                            studentEmail={user.email ?? ""}
                            certificateExists={!!certificate}
                            existingReferenceNo={certificate?.certificate_reference_no ?? null}
                        />
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                        <Button asChild className="rounded-full bg-amber-600 hover:bg-amber-700 text-white shadow-md">
                            <Link href={`/learn/${courseId}`}>
                                Back to course
                            </Link>
                        </Button>
                        <Button variant="outline" asChild className="rounded-full">
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard
                            </Link>
                        </Button>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
