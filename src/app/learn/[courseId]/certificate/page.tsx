import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser, getCourseWithContent, getUserProgress, isEnrolled, getCertificate } from "@/lib/supabase/queries";
import { LessonSidebar } from "@/components/lesson-sidebar";
import { Trophy, Mail, Sparkles, LayoutDashboard, ExternalLink } from "lucide-react";

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

    return (
        <div className="min-h-screen bg-background">
            <LessonSidebar
                course={course}
                allLessons={allLessons}
                currentLessonId="" // no lesson selected on certificate view
                progress={progress}
                completedLessons={completedLessons}
                overallProgress={overallProgress}
            />

            <main className="lg:ml-72 min-h-screen flex flex-col items-center justify-center px-4 md:px-6 py-12 relative overflow-hidden">
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
                        <div className="flex flex-col items-center gap-2 pt-4 text-muted-foreground">
                            <p className="flex items-center gap-2 text-base">
                                <Mail className="h-4 w-4 text-amber-500" />
                                Your certificate has been sent to your email — please check your inbox.
                            </p>
                            {certificate?.certificate_reference_no && (
                                <Button asChild variant="secondary" size="sm" className="mt-3 rounded-full">
                                    <a
                                        href={`https://credsverse.com/credentials/${certificate.certificate_reference_no}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2"
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                        View certificate
                                    </a>
                                </Button>
                            )}
                        </div>
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
            </main>
        </div>
    );
}
