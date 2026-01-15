import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ArrowLeft } from "lucide-react";
import { getCurrentUser, getAllStudents } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin-sidebar";
import Link from "next/link";

export default async function AdminUsersPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
        redirect('/dashboard');
    }

    const students = await getAllStudents();

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <AdminSidebar user={user} activePage="users" />

            {/* Main Content */}
            <main className="ml-64 p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Students</h1>
                            <p className="text-muted-foreground">
                                Manage your students and their enrollments
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search students..."
                            className="pl-10 bg-white border-0 shadow-premium"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <Card className="shadow-premium border-0 bg-white">
                    <CardHeader>
                        <CardTitle>All Students</CardTitle>
                        <CardDescription>
                            {students.length} total students
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {students.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Users className="h-12 w-12 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No students yet</h3>
                                <p>Students will appear here when they sign up.</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Courses Enrolled</TableHead>
                                        <TableHead>Joined</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {students.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={student.avatar_url || ""} />
                                                        <AvatarFallback className="bg-[#171717] text-white">
                                                            {student.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium">{student.full_name || 'Unknown'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {student.email}
                                            </TableCell>
                                            <TableCell>
                                                {student.enrolled_count}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {new Date(student.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">Active</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
