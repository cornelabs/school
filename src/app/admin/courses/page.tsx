import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    BookOpen,
    Plus,
    Eye,
    Edit,
    Search,
} from "lucide-react";
import { getCurrentUser, getAllCourses } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin-sidebar";
import { DeleteCourseButton } from "@/components/delete-course-button";

export default async function AdminCoursesPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
        redirect('/dashboard');
    }

    const courses = await getAllCourses();

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar user={user} activePage="courses" />

            <main className="lg:ml-56 pt-14 lg:pt-0 w-full max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-semibold">Courses</h1>
                        <p className="text-sm text-muted-foreground">Manage your course content</p>
                    </div>
                    <Button className="h-9 px-4 text-sm rounded-full w-full sm:w-auto" asChild>
                        <Link href="/admin/courses/new">
                            <Plus className="mr-1.5 h-3 w-3" />
                            New Course
                        </Link>
                    </Button>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search courses..." className="pl-10 h-9 text-sm rounded-full border-border/50" />
                </div>

                {/* Courses List */}
                {courses.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                        <BookOpen className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold mb-1">No courses yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">Create your first course to get started.</p>
                        <Button className="h-9 px-4 text-sm rounded-full" asChild>
                            <Link href="/admin/courses/new">
                                <Plus className="mr-1.5 h-3 w-3" />
                                New Course
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    {/* Thumbnail & Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="h-12 w-16 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 overflow-hidden">
                                            {course.thumbnail_url ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <BookOpen className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{course.title}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {course.category || 'Uncategorized'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Badges */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <Badge
                                            variant="outline"
                                            className={`rounded-full px-2 py-0.5 text-[10px] border-0 ${course.status === "published"
                                                    ? "bg-emerald-500/10 text-emerald-500"
                                                    : "bg-muted text-muted-foreground"
                                                }`}
                                        >
                                            {course.status}
                                        </Badge>
                                        <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[10px] capitalize">
                                            {course.difficulty}
                                        </Badge>
                                        <span className="text-[10px] text-muted-foreground">
                                            {course.student_count} students
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1 sm:ml-auto">
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <Link href={`/admin/courses/${course.id}`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                            <Link href={`/courses/${course.id}`}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <DeleteCourseButton courseId={course.id} courseTitle={course.title} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
