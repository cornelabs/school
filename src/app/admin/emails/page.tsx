"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Mail, Send, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { sendManualInvite } from "@/app/actions/send-custom-email";
import { createClient } from "@/lib/supabase/client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminEmailsPage() {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const router = useRouter();

    useEffect(() => {
        const getUser = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            // Check admin role
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }
            setUser(user);
        };
        getUser();
        generateParams();
    }, [router]);

    const generateParams = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let retVal = "";
        for (let i = 0, n = charset.length; i < 12; ++i) {
            retVal += charset.charAt(Math.floor(Math.random() * n));
        }
        setGeneratedPassword(retVal);
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const name = formData.get("name") as string;
        const courseTitle = formData.get("courseTitle") as string;
        const password = formData.get("password") as string;

        try {
            const result = await sendManualInvite(email, name, courseTitle, password);
            if (result.success) {
                toast.success("Invite email sent successfully!");
                (e.target as HTMLFormElement).reset();
                generateParams(); // Reset password for next use
            } else {
                toast.error(result.error || "Failed to send email");
            }
        } catch (error) {
            toast.error("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-background">
            <AdminSidebar user={user} activePage="emails" />

            <main className="lg:ml-56 pt-14 lg:pt-0 min-h-screen flex justify-center">
                <div className="w-full max-w-2xl px-4 md:px-6 py-8 space-y-6">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Send Manual Invite</h1>
                            <p className="text-sm text-muted-foreground">Send an official invitation email with credentials to a specific user.</p>
                        </div>
                    </div>

                    <div className="rounded-xl border border-border/50 bg-card p-6 shadow-sm">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Recipient Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="John Doe"
                                        required
                                        className="bg-background"
                                    />
                                    <p className="text-[10px] text-muted-foreground">Used for "Hello [Name]"</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Recipient Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="student@example.com"
                                        required
                                        className="bg-background"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="courseTitle">Course Title</Label>
                                <Input
                                    id="courseTitle"
                                    name="courseTitle"
                                    placeholder="AI Essentials for Banking"
                                    required
                                    className="bg-background"
                                />
                                <p className="text-[10px] text-muted-foreground">Used for "Welcome to... [Title]"</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password">Temporary Password</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[10px]"
                                        onClick={generateParams}
                                    >
                                        <RefreshCw className="mr-1 h-3 w-3" />
                                        Generate New
                                    </Button>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    value={generatedPassword}
                                    onChange={(e) => setGeneratedPassword(e.target.value)}
                                    required
                                    className="bg-background font-mono"
                                />
                                <p className="text-[10px] text-muted-foreground">This password will be displayed in the email's credential box.</p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending Invite...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Invitation
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
