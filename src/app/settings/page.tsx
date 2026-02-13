"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [user, setUser] = useState<any>(null);
    const [hashError, setHashError] = useState<string | null>(null);

    useEffect(() => {
        // Parse error from hash if present (Supabase redirects errors in hash)
        const hash = window.location.hash;
        if (hash && hash.includes("error_description")) {
            const params = new URLSearchParams(hash.substring(1));
            const errorDesc = params.get("error_description");
            if (errorDesc) {
                setHashError(decodeURIComponent(errorDesc.replace(/\+/g, " ")));
            }
        }

        const checkSession = async () => {
            const supabase = createClient();
            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            }
            setIsLoading(false);
        };
        checkSession();
    }, []);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        setIsUpdating(true);
        const supabase = createClient();

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success("Password updated successfully");
            setPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error("Update password error:", error);
            toast.error(error.message || "Failed to update password");
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-2">
                            <AlertCircle className="h-10 w-10 text-destructive" />
                        </div>
                        <CardTitle>Authentication Issue</CardTitle>
                        <CardDescription>
                            {hashError ? (
                                <span className="text-destructive font-medium">{hashError}</span>
                            ) : (
                                "You must be logged in to access this page."
                            )}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-xs text-muted-foreground text-center">
                            This usually happens if the link has expired, was already used, or if you are opening it in a different browser than where you are logged in.
                        </p>
                        <Button asChild className="w-full">
                            <Link href="/login">Go to Login</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container max-w-2xl py-10 px-4 mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/dashboard">
                        <Loader2 className="h-4 w-4 rotate-90" /> {/* Back arrow placeholder */}
                    </Link>
                </Button>
                <h1 className="text-3xl font-bold">Account Settings</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Security</CardTitle>
                    <CardDescription>
                        Update your password to keep your account secure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdatePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                        <div className="flex justify-end pt-2">
                            <Button type="submit" disabled={isUpdating} className="w-full sm:w-auto">
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
