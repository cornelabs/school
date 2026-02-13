"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite-template";
import { revalidatePath } from "next/cache";
import { createClient as createNextClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function generateTempPassword(length = 12) {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
}

export async function adminInviteUser(courseId: string, email: string, fullName: string) {
    // 1. Verify Admin Permissions
    const supabase = await createNextClient();
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    if (!currentUser) return { error: "Not authenticated" };

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();

    if (profile?.role !== 'admin') return { error: "Unauthorized" };

    // 2. Fetch Course Details
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title')
        .eq('id', courseId)
        .single();

    if (courseError || !course) return { error: "Course not found" };

    // 3. User Management
    let userId = "";
    let isNewUser = false;
    let tempPassword = "";
    let actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/login`;

    // Try to create user with a temporary password
    tempPassword = generateTempPassword();
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    if (createError) {
        // User probably exists
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            userId = existingProfile.id;
            isNewUser = false;
            actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/learn/${courseId}`;
            tempPassword = ""; // Clear for existing users
        } else {
            return { error: "User exists in auth but profile not found. Contact support." };
        }
    } else {
        userId = userData.user.id;
        isNewUser = true;

        // Ensure profile exists (it should via triggers, but we can force update name)
        await supabaseAdmin
            .from('profiles')
            .update({ full_name: fullName })
            .eq('id', userId);
    }

    // 4. Enroll User
    const { error: enrollError } = await supabaseAdmin
        .from('enrollments')
        .upsert({
            user_id: userId,
            course_id: courseId,
        }, { onConflict: 'user_id,course_id' });

    if (enrollError) return { error: "Failed to enroll user: " + enrollError.message };

    // 5. Send Email via Resend
    if (process.env.RESEND_API_KEY) {
        try {
            await resend.emails.send({
                from: 'Cornelabs School <admin@school.cornelabs.com>',
                to: email,
                subject: isNewUser ? `Your account for ${course.title}` : `Course Enrollment: ${course.title}`,
                react: InviteEmail({
                    courseTitle: course.title,
                    actionLink: actionLink,
                    isNewUser: isNewUser,
                    userEmail: email,
                    tempPassword: tempPassword,
                    userName: fullName,
                }),
            });
            console.log(`Invite email sent to ${email}`);
        } catch (emailError) {
            console.error("Failed to send invite email:", emailError);
            return { success: true, message: "User enrolled, but email failed to send." };
        }
    }

    // 6. Revalidate
    revalidatePath(`/admin/courses/${courseId}`);

    return {
        success: true,
        message: isNewUser
            ? `User created with temporary password: ${tempPassword}`
            : "User enrolled successfully!"
    };
}
