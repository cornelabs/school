import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
    BookOpen,
    Clock,
    ArrowRight,
    Search,
} from "lucide-react";
import { getPublishedCourses, getCurrentUser } from "@/lib/supabase/queries";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

function getDifficultyColor(difficulty: string) {
    switch (difficulty) {
        case "beginner":
            return "bg-green-100 text-green-700";
        case "intermediate":
            return "bg-yellow-100 text-yellow-700";
        case "advanced":
            return "bg-red-100 text-red-700";
        default:
            return "bg-gray-100 text-gray-700";
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
                {/* Header with sidebar trigger */}
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <h1 className="text-lg font-semibold">Courses</h1>
                </header>

                <main className="flex-1 p-6">
                    {/* Page Header */}
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold mb-2">All Courses</h2>
                        <p className="text-muted-foreground">
                            Explore our comprehensive collection of AI courses
                        </p>
                    </div>

                    {/* Search */}
                    <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search courses..." className="pl-10 bg-white border-0 shadow-premium" />
                        </div>
                    </div>

                    {/* Courses Grid */}
                    {courses.length === 0 ? (
                        <Card className="text-center py-12 shadow-premium border-0 bg-white">
                            <CardContent>
                                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                                <h3 className="text-lg font-semibold mb-2">No courses available yet</h3>
                                <p className="text-muted-foreground">Check back soon for new courses!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {courses.map((course) => (
                                <Card key={course.id} className="flex flex-col overflow-hidden shadow-premium border-0 bg-white card-hover">
                                    {/* Course Thumbnail */}
                                    <div className="h-40 bg-gradient-to-br from-[#f5f5f5] to-[#e5e5e5] flex items-center justify-center">
                                        {course.thumbnail_url ? (
                                            <img
                                                src={course.thumbnail_url}
                                                alt={course.title}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <BookOpen className="h-12 w-12 text-[#a3a3a3]" />
                                        )}
                                    </div>
                                    <CardHeader className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            {course.category && (
                                                <Badge variant="outline" className="text-xs border-[#e5e5e5]">{course.category}</Badge>
                                            )}
                                            <Badge className={`text-xs border-0 ${getDifficultyColor(course.difficulty)}`}>
                                                {formatDifficulty(course.difficulty)}
                                            </Badge>
                                        </div>
                                        <CardTitle className="text-lg">{course.title}</CardTitle>
                                        <CardDescription className="line-clamp-2">
                                            {course.description}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                                            <span className="flex items-center gap-1">
                                                <BookOpen className="h-4 w-4" />
                                                {course.lesson_count || 0} lessons
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" />
                                                {course.duration_minutes ? `${Math.round(course.duration_minutes / 60)}h` : 'TBD'}
                                            </span>
                                        </div>
                                        <Button className="w-full" asChild>
                                            <Link href={`/courses/${course.id}`}>
                                                View Course
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
