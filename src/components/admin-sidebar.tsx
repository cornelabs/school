"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    BookOpen,
    Users,
    Settings,
    LayoutDashboard,
    Video,
    LogOut,
    Menu,
    X,
    Mail,
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
    activePage: 'dashboard' | 'courses' | 'users' | 'media' | 'settings' | 'emails';
}

const navItems = [
    { key: 'dashboard', href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'courses', href: '/admin/courses', label: 'Courses', icon: BookOpen },
    { key: 'users', href: '/admin/users', label: 'Users', icon: Users },
    { key: 'media', href: '/admin/media', label: 'Media', icon: Video },
    { key: 'emails', href: '/admin/emails', label: 'Emails', icon: Mail },
    { key: 'settings', href: '/admin/settings', label: 'Settings', icon: Settings },
];

function SidebarContent({ user, activePage, onLogout, onNavClick }: AdminSidebarProps & { onLogout: () => void; onNavClick?: () => void }) {
    return (
        <div className="flex h-full flex-col">
            {/* Logo */}
            <div className="flex h-14 items-center gap-2 border-b border-border/50 px-4">
                <Link href="/admin" className="flex items-center gap-2" onClick={onNavClick}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/50">
                        <img
                            src="/icononly_transparent_nobuffer.png"
                            alt="Logo"
                            className="h-5 w-5"
                        />
                    </div>
                    <div>
                        <span className="text-sm font-semibold">School</span>
                        <span className="ml-1 text-[10px] text-muted-foreground">Admin</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
                {navItems.map((item) => (
                    <Link
                        key={item.key}
                        href={item.href}
                        onClick={onNavClick}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${activePage === item.key
                            ? 'bg-foreground text-background'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            }`}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                ))}
            </nav>

            {/* User */}
            <div className="border-t border-border/50 p-3">
                <div className="flex items-center gap-2">
                    <Avatar className="h-7 w-7">
                        <AvatarImage src={user.avatar_url || ''} />
                        <AvatarFallback className="text-[10px] bg-foreground text-background">
                            {user.full_name?.split(' ').map(n => n[0]).join('') || 'AD'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{user.full_name || 'Admin'}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLogout}>
                        <LogOut className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

export function AdminSidebar({ user, activePage }: AdminSidebarProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block fixed left-0 top-0 z-40 h-screen w-56 border-r border-border/50 bg-card">
                <SidebarContent user={user} activePage={activePage} onLogout={handleLogout} />
            </aside>

            {/* Mobile Header with Menu Button */}
            <header className="lg:hidden fixed top-0 left-0 right-0 z-50 flex h-14 items-center gap-2 border-b border-border/50 bg-card px-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-56 p-0">
                        <SidebarContent
                            user={user}
                            activePage={activePage}
                            onLogout={handleLogout}
                            onNavClick={() => setOpen(false)}
                        />
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                    <img src="/icononly_transparent_nobuffer.png" alt="Logo" className="h-5 w-5" />
                    <span className="text-sm font-semibold">Admin</span>
                </div>
            </header>
        </>
    );
}
