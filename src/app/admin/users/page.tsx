import { redirect } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search } from "lucide-react";
import { getCurrentUser, getAllProfiles } from "@/lib/supabase/queries";
import { AdminSidebar } from "@/components/admin-sidebar";
import { UserRoleToggle } from "./user-role-toggle";

export default async function AdminUsersPage() {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
        redirect('/dashboard');
    }

    const profiles = await getAllProfiles();

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar user={user} activePage="users" />

            <main className="lg:ml-56 pt-14 lg:pt-0 w-full max-w-5xl px-4 md:px-6 py-6 md:py-8 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-xl font-semibold">Users</h1>
                    <p className="text-sm text-muted-foreground">
                        {profiles.length} total users
                    </p>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-10 h-9 text-sm rounded-full border-border/50"
                    />
                </div>

                {/* Users List */}
                {profiles.length === 0 ? (
                    <div className="rounded-xl border border-border/50 bg-card p-12 text-center">
                        <Users className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-base font-semibold mb-1">No users yet</h3>
                        <p className="text-sm text-muted-foreground">Users will appear here when they sign up.</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {profiles.map((profile) => (
                            <div
                                key={profile.id}
                                className="rounded-xl border border-border/50 bg-card p-4 hover:border-border transition-colors"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    {/* Avatar & Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={profile.avatar_url || ""} />
                                            <AvatarFallback className="text-[10px] bg-foreground text-background">
                                                {profile.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold truncate">{profile.full_name || 'Unknown'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{profile.email}</p>
                                        </div>
                                    </div>

                                    {/* Stats & Role */}
                                    <div className="flex items-center gap-4 text-xs sm:ml-auto pl-12 sm:pl-0">
                                        <div>
                                            <span className="text-muted-foreground">Courses: </span>
                                            <span className="font-medium">{profile.enrolled_count}</span>
                                        </div>
                                        <div className="hidden sm:block">
                                            <span className="text-muted-foreground">Joined: </span>
                                            <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
                                        </div>

                                        <UserRoleToggle
                                            userId={profile.id}
                                            currentRole={profile.role || 'student'}
                                            currentUserId={user.id}
                                        />
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
