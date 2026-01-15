import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/logout-button";
import { BookOpen, LayoutDashboard } from "lucide-react";

interface User {
    id: string;
    full_name?: string | null;
    avatar_url?: string | null;
}

interface SharedHeaderProps {
    user?: User | null;
    currentPage?: 'dashboard' | 'courses' | 'learn';
}

export function SharedHeader({ user, currentPage }: SharedHeaderProps) {
    return (
        <header className="sticky top-0 z-50 w-full bg-[#171717]">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <Image
                        src="/icononly_transparent_nobuffer.png"
                        alt="School Logo"
                        width={32}
                        height={32}
                        className="invert"
                    />
                </Link>

                {/* Navigation */}
                <nav className="hidden items-center gap-8 md:flex">
                    <Link
                        href="/dashboard"
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentPage === 'dashboard'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/courses"
                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${currentPage === 'courses'
                            ? 'text-white'
                            : 'text-gray-400 hover:text-white'
                            }`}
                    >
                        Courses
                    </Link>
                </nav>

                {/* Auth Section */}
                <div className="flex items-center gap-3">
                    {user ? (
                        <>
                            <Avatar className="h-8 w-8 border border-gray-700">
                                <AvatarImage src={user.avatar_url || ''} />
                                <AvatarFallback className="bg-gray-700 text-white text-xs">
                                    {user.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <LogoutButton variant="ghost" className="text-gray-400 hover:text-white hover:bg-gray-800" />
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" asChild className="text-gray-400 hover:text-white hover:bg-transparent">
                                <Link href="/login">Sign In</Link>
                            </Button>
                            <Button asChild className="bg-white text-black hover:bg-gray-100">
                                <Link href="/signup">Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
