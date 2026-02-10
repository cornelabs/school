"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { checkAndPromoteAdmin } from "@/app/actions/auth";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get('redirect') || '/dashboard';

    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const supabase = createClient();

        const { data, error } = await supabase.auth.signInWithPassword({
            email: formData.email,
            password: formData.password,
        });

        if (error) {
            toast.error(error.message);
            setIsLoading(false);
            return;
        }

        // Check for admin promotion (fire and forget)
        checkAndPromoteAdmin();

        toast.success("Welcome back!");

        // Reload page to let middleware handle the redirect based on auth state
        window.location.reload();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="h-9 text-sm"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                />
            </div>
            <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground">
                        Forgot password?
                    </Link>
                </div>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="h-9 text-sm"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                />
            </div>
            <Button type="submit" className="w-full h-9 text-sm rounded-full" disabled={isLoading}>
                {isLoading ? (
                    <>
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                        Signing in...
                    </>
                ) : (
                    "Sign In"
                )}
            </Button>
        </form>
    );
}

function LoginFormSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-1.5">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-9 w-full" />
            </div>
            <div className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
            </div>
            <Skeleton className="h-9 w-full rounded-full" />
        </div>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-sm rounded-xl border border-border/50 bg-card p-6">
                <div className="text-center mb-6">
                    <Link href="/" className="inline-flex items-center justify-center mb-4">
                        <Image
                            src="/print_transparent.svg"
                            alt="Logo"
                            width={140}
                            height={45}
                        />
                    </Link>
                    <h1 className="text-lg font-semibold">Welcome back</h1>
                    <p className="text-xs text-muted-foreground">
                        Sign in to your account to continue learning
                    </p>
                </div>
                <Suspense fallback={<LoginFormSkeleton />}>
                    <LoginForm />
                </Suspense>
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link href="/signup" className="text-foreground hover:underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}
