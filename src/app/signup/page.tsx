"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

import { checkAndPromoteAdmin } from "@/app/actions/auth";

export default function SignupPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        if (formData.password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    full_name: formData.name,
                    role: 'student',
                },
                emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(error.message);
            setIsLoading(false);
            return;
        }

        // Check for admin promotion (fire and forget)
        checkAndPromoteAdmin();

        toast.success("Account created! Please check your email to verify.");
        window.location.href = "/login";

        setIsLoading(false);
    };

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
                    <h1 className="text-lg font-semibold">Create an account</h1>
                    <p className="text-xs text-muted-foreground">
                        Get started with your learning journey
                    </p>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-xs">Full Name</Label>
                        <Input
                            id="name"
                            type="text"
                            placeholder="John Doe"
                            className="h-9 text-sm"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
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
                        <Label htmlFor="password" className="text-xs">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            className="h-9 text-sm"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-xs">Confirm Password</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            className="h-9 text-sm"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full h-9 text-sm rounded-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                Creating account...
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </form>
                <div className="mt-6 text-center text-xs text-muted-foreground">
                    Already have an account?{" "}
                    <Link href="/login" className="text-foreground hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
