import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { getCurrentUser, getAllStudents } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin-sidebar";

export default async function AdminUsersPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
        redirect('/dashboard');
    }

    const students = await getAllStudents();

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar user={user} activePage="users" />

            <main className="lg:ml-56 pt-14 lg:pt-0 w-full max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold">Students</h1>
                    <p className="text-sm text-muted-foreground">
                        {students.length} total students
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search students..."
                        className="pl-10 h-9 text-sm rounded-full border-border/50"
                    />
                </div>

                {/* Students List */}
                {students.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                        <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold mb-1">No students yet</h3>
                        <p className="text-sm text-muted-foreground">Students will appear here when they sign up.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {students.map((student) => (
                            <div
                                key={student.id}
                                className="rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* Avatar & Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={student.avatar_url || ""} />
                                            <AvatarFallback className="text-[10px] bg-foreground text-background">
                                                {student.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{student.full_name || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{student.email}</p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="flex items-center gap-4 text-xs sm:ml-auto pl-12 sm:pl-0">
                                        <div>
                                            <span className="text-muted-foreground">Courses: </span>
                                            <span className="font-medium">{student.enrolled_count}</span>
                                        </div>
                                        <div className="hidden sm:block">
                                            <span className="text-muted-foreground">Joined: </span>
                                            <span className="font-medium">{new Date(student.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className="rounded-full px-2 py-0.5 text-[10px] border-0 bg-emerald-500/10 text-emerald-500"
                                        >
                                            Active
                                        </Badge>
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
