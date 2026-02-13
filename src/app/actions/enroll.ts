"use server";

import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";
import WelcomeEmail from "@/emails/welcome-template";
import { revalidatePath } from "next/cache";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function enrollUserAction(courseId: string) {
    const supabase = await createClient();

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: "Not authenticated" };
    }

    // 2. data fetching
    // Check if course exists and get details
    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('title, status')
        .eq('id', courseId)
        .single();

    if (courseError || !course) {
        return { error: "Course not found" };
    }

    if (course.status === 'locked') {
        return { error: "Course is locked" };
    }

    // Check if already enrolled
    const { data: existingEnrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    if (existingEnrollment) {
        return { success: true, message: "Already enrolled" };
    }

    // 3. Insert enrollment
    const { error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
            user_id: user.id,
            course_id: courseId,
        });

    if (enrollmentError) {
        console.error("Enrollment error:", enrollmentError);
        return { error: "Failed to enroll" };
    }

    // 4. Send Email
    if (process.env.RESEND_API_KEY) {
        try {
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, email')
                .eq('id', user.id)
                .single();

            const studentName = profile?.full_name || user.email?.split('@')[0] || "Student";
            const studentEmail = user.email!;
            const courseUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/learn/${courseId}`;

            await resend.emails.send({
                from: 'Cornelabs School <welcome@school.cornelabs.com>',
                to: studentEmail,
                subject: `Welcome to ${course.title}!`,
                react: WelcomeEmail({
                    studentName,
                    courseTitle: course.title,
                    courseUrl,
                }),
            });
            console.log(`Email sent to ${studentEmail}`);
        } catch (emailError) {
            console.error("Failed to send email:", emailError);
            // Don't fail the enrollment if email fails
        }
    } else {
        console.warn("RESEND_API_KEY is missing. Email skipped.");
    }

    // 5. Revalidate
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/learn/${courseId}`);
    revalidatePath('/dashboard');

    return { success: true };
}
