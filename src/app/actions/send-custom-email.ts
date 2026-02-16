"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite-template";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendManualInvite(email: string, name: string, courseTitle: string, tempPassword?: string) {
    const supabase = await createClient();

    // 1. Verify Admin Permissions
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') return { error: "Unauthorized" };

    // 2. Validate Input
    if (!email || !courseTitle) {
        return { error: "Missing required fields" };
    }

    // 3. Send Email
    if (process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from: 'Corne Labs School <admin@school.cornelabs.com>',
                to: email,
                subject: `Welcome to Corne Labs School — ${courseTitle}`,
                react: InviteEmail({
                    courseTitle: courseTitle,
                    actionLink: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
                    isNewUser: true, // Force "Credentials" view
                    userEmail: email,
                    tempPassword: tempPassword || "Set your own password",
                    userName: name,
                }),
            });
            console.log(`Manual invite sent to ${email}`);
            return { success: true, message: "Invite email sent successfully" };
        } catch (emailError: any) {
            console.error("Failed to send invite email:", emailError);
            return { error: emailError.message || "Failed to send email" };
        }
    } else {
        return { error: "Email service not configured" };
    }
}
