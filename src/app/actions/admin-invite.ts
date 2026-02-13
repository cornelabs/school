"use server";

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import InviteEmail from "@/emails/invite-template";
import { revalidatePath } from "next/cache";
import { createClient as createNextClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// We use the supabase-js client directly for Admin operations because
// the Next.js helper is bound to the request context (user session),
// whereas inviteUser requires Service Role privileges to create users.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    let actionLink = `${process.env.NEXT_PUBLIC_SITE_URL}/learn/${courseId}`;

    // Check if user exists
    const { data: existingUsers, error: listUserError } = await supabaseAdmin.auth.admin.listUsers();
    // Note: listUsers isn't efficient for large bases, but for now it's fine. 
    // Ideally we'd use getUserById but we only have email.
    // Actually, createClient with service role allow admin.getUserByEmail? No.
    // We can try to get user by email directly via admin api? 
    // No, but we can try to create and catch error, or just use listUsers filtering if supported?
    // Let's use createUser and handle "User already registered" error.

    // Better approach: Try to create user.
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        email_confirm: true,
        user_metadata: { full_name: fullName }
    });

    if (createError) {
        // logic if user already exists
        // Error message for existing user usually contains "User already registered"
        // But let's check exact behavior or error code?
        // Actually, we can just search profile table first.
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingProfile) {
            userId = existingProfile.id;
            isNewUser = false;
        } else {
            // This is weird state (auth user exists but profile doesnt?), but assume existing.
            return { error: "User exists but profile not found. Contact support." };
        }
    } else {
        userId = userData.user.id;
        isNewUser = true;

        // Generate Invite Link for new users
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'invite',
            email: email,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/settings`
            }
        });

        if (linkData && linkData.properties?.action_link) {
            actionLink = linkData.properties.action_link;
        }

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

    return { success: true, message: isNewUser ? "User created and invited!" : "User enrolled successfully!" };
}
