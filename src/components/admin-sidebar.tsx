"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    GraduationCap,
    BookOpen,
    Users,
    Settings,
    LayoutDashboard,
    Video,
    LogOut
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface AdminSidebarProps {
    user: {
        full_name?: string;
        email: string;
        avatar_url?: string;
    };
    activePage: 'dashboard' | 'courses' | 'users' | 'media' | 'settings';
}

export function AdminSidebar({ user, activePage }: AdminSidebarProps) {
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
    };

    const navItems = [
        { key: 'dashboard', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'courses', href: '/admin/courses', label: 'Courses', icon: BookOpen },
        { key: 'users', href: '/admin/users', label: 'Users', icon: Users },
        { key: 'media', href: '/admin/media', label: 'Media', icon: Video },
        { key: 'settings', href: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background">
            <div className="flex h-full flex-col">
                {/* Logo */}
                <div className="flex h-16 items-center gap-2 border-b px-6">
                    <Link href="/admin" className="flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f5f5f5]">
                            <img
                                src="/icononly_transparent_nobuffer.png"
                                alt="Logo"
                                className="h-6 w-6"
                            />
                        </div>
                        <div>
                            <span className="text-lg font-bold">School</span>
                            <span className="ml-1 text-xs text-muted-foreground">Admin</span>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1 p-4">
                    {navItems.map((item) => (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${activePage === item.key
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </Link>
                    ))}
                </nav>

                {/* User */}
                <div className="border-t p-4">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="bg-[#171717] text-white">
                                {user.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.full_name || 'Admin'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={handleLogout}>
                            <LogOut className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </aside>
    );
}
