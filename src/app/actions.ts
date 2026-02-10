"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markLessonCompleteAction(lessonId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            last_watched_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,lesson_id',
        });

    if (error) throw error;

    // Revalidate the course page to reflect progress updates
    revalidatePath('/courses/[id]', 'page');
    revalidatePath('/learn/[courseId]', 'page');
}

export async function updateWatchTimeAction(lessonId: string, watchTimeSeconds: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
        .from('progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            watch_time_seconds: watchTimeSeconds,
            last_watched_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,lesson_id',
        });

    if (error) throw error;
}
