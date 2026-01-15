import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    BookOpen,
    Users,
    TrendingUp,
    Plus,
    Eye,
    Edit,
    GraduationCap,
} from "lucide-react";
import { getCurrentUser, getAdminStats, getAllCourses, getRecentStudents } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminDashboard() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
        redirect('/dashboard');
    }

    const [stats, courses, recentStudents] = await Promise.all([
        getAdminStats(),
        getAllCourses(),
        getRecentStudents(5),
    ]);

    const statCards = [
        { label: "Total Students", value: stats.totalStudents.toString(), icon: Users },
        { label: "Active Courses", value: stats.activeCourses.toString(), icon: BookOpen },
        { label: "Enrollments", value: stats.totalEnrollments.toString(), icon: GraduationCap },
        { label: "Total Courses", value: stats.totalCourses.toString(), icon: TrendingUp },
    ];

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar user={user} activePage="dashboard" />

            <main className="lg:ml-56 pt-14 lg:pt-0 w-full max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Welcome back, {user.full_name || 'Admin'}</p>
                    </div>
                    <Button className="h-9 px-4 text-sm rounded-full" asChild>
                        <Link href="/admin/courses/new">
                            <Plus className="mr-1.5 h-3 w-3" />
                            New Course
                        </Link>
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-4">
                    {statCards.map((stat, index) => (
                        <div key={index} className="rounded-xl border border-border/50 bg-card p-5">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/50 mb-3">
                                <stat.icon className="h-4 w-4 text-foreground" />
                            </div>
                            <p className="text-xl font-semibold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Tables */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Recent Courses */}
                    <div className="rounded-xl border border-border/50 bg-card">
                        <div className="flex items-center justify-between p-5 border-b border-border/50">
                            <div>
                                <h2 className="text-sm font-semibold">Recent Courses</h2>
                                <p className="text-[10px] text-muted-foreground">Manage your course content</p>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-full" asChild>
                                <Link href="/admin/courses">View All</Link>
                            </Button>
                        </div>
                        <div className="p-5">
                            {courses.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-6 w-6 mx-auto mb-2" />
                                    <p className="text-xs">No courses yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/50">
                                            <TableHead className="text-[10px]">Course</TableHead>
                                            <TableHead className="text-[10px]">Status</TableHead>
                                            <TableHead className="text-[10px] text-right">Students</TableHead>
                                            <TableHead className="text-[10px] text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {courses.slice(0, 4).map((course) => (
                                            <TableRow key={course.id} className="border-border/50">
                                                <TableCell className="text-xs font-medium">{course.title}</TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={`rounded-full px-2 py-0.5 text-[10px] border-0 ${course.status === "published"
                                                            ? "bg-emerald-500/10 text-emerald-500"
                                                            : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {course.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-xs text-right">{course.student_count}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                            <Link href={`/admin/courses/${course.id}`}>
                                                                <Edit className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                                                            <Link href={`/courses/${course.id}`}>
                                                                <Eye className="h-3 w-3" />
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>

                    {/* Recent Students */}
                    <div className="rounded-xl border border-border/50 bg-card">
                        <div className="flex items-center justify-between p-5 border-b border-border/50">
                            <div>
                                <h2 className="text-sm font-semibold">Recent Students</h2>
                                <p className="text-[10px] text-muted-foreground">New enrollments</p>
                            </div>
                            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs rounded-full" asChild>
                                <Link href="/admin/users">View All</Link>
                            </Button>
                        </div>
                        <div className="p-5">
                            {recentStudents.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Users className="h-6 w-6 mx-auto mb-2" />
                                    <p className="text-xs">No students yet</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/50">
                                            <TableHead className="text-[10px]">Student</TableHead>
                                            <TableHead className="text-[10px] text-right">Courses</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentStudents.map((student) => (
                                            <TableRow key={student.id} className="border-border/50">
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-7 w-7">
                                                            <AvatarFallback className="text-[10px] bg-muted">
                                                                {student.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-xs font-medium">{student.full_name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{student.email}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-right">{student.enrolled_count}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
