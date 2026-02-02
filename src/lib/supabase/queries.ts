import { createClient } from './server';
import type {
    Course,
    User,
    Module,
    Lesson,
    Enrollment,
    CourseWithModules,
    ModuleWithLessons
} from '@/types/database';

// =============================================
// PROFILE QUERIES
// =============================================

export async function getCurrentUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return profile as User | null;
}

export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.role === 'admin';
}

// =============================================
// COURSE QUERIES (PUBLIC)
// =============================================

export async function getPublishedCourses() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      modules:modules(count),
      lessons:modules(lessons(count))
    `)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to add lesson count
    return data?.map(course => ({
        ...course,
        module_count: course.modules?.[0]?.count || 0,
        lesson_count: course.lessons?.reduce((acc: number, m: { lessons: { count: number }[] }) =>
            acc + (m.lessons?.[0]?.count || 0), 0) || 0,
    })) || [];
}

export async function getCourseById(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as Course;
}

export async function getCourseWithContent(id: string): Promise<CourseWithModules | null> {
    const supabase = await createClient();

    const { data: course, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();

    if (courseError) throw courseError;

    const { data: modules, error: modulesError } = await supabase
        .from('modules')
        .select(`
      *,
      lessons:lessons(*)
    `)
        .eq('course_id', id)
        .order('order_index');

    if (modulesError) throw modulesError;

    // Sort lessons within each module
    const sortedModules = modules?.map(m => ({
        ...m,
        lessons: m.lessons?.sort((a: Lesson, b: Lesson) => a.order_index - b.order_index) || [],
    })) as ModuleWithLessons[];

    return {
        ...course,
        modules: sortedModules || [],
    };
}

// =============================================
// COURSE QUERIES (ADMIN)
// =============================================

export async function getAllCourses() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .select(`
      *,
      enrollments:enrollments(count)
    `)
        .order('updated_at', { ascending: false });

    if (error) throw error;

    return data?.map(course => ({
        ...course,
        student_count: course.enrollments?.[0]?.count || 0,
    })) || [];
}

export async function createCourse(courseData: {
    title: string;
    description: string;
    difficulty: string;
    category: string;
}) {
    const supabase = await createClient();
    const user = await getCurrentUser();

    const { data, error } = await supabase
        .from('courses')
        .insert({
            ...courseData,
            created_by: user?.id,
            status: 'draft',
        })
        .select()
        .single();

    if (error) throw error;
    return data as Course;
}

export async function updateCourse(id: string, updates: Partial<Course>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('courses')
        .update({
            ...updates,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Course;
}

export async function publishCourse(id: string) {
    return updateCourse(id, {
        status: 'published',
        published_at: new Date().toISOString()
    });
}

export async function deleteCourse(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// =============================================
// MODULE QUERIES
// =============================================

export async function createModule(courseId: string, title: string, orderIndex: number) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('modules')
        .insert({
            course_id: courseId,
            title,
            order_index: orderIndex,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Module;
}

export async function updateModule(id: string, updates: Partial<Module>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('modules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Module;
}

export async function deleteModule(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// =============================================
// LESSON QUERIES
// =============================================

export async function createLesson(moduleId: string, lessonData: {
    title: string;
    description?: string;
    video_url?: string;
    duration_seconds?: number;
    order_index: number;
    type?: string;
}) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lessons')
        .insert({
            module_id: moduleId,
            ...lessonData,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Lesson;
}

export async function updateLesson(id: string, updates: Partial<Lesson>) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('lessons')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Lesson;
}

export async function deleteLesson(id: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// =============================================
// ENROLLMENT QUERIES
// =============================================

export async function getUserEnrollments(userId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('enrollments')
        .select(`
      *,
      course:courses(*)
    `)
        .eq('user_id', userId)
        .order('enrolled_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function enrollInCourse(courseId: string) {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('enrollments')
        .insert({
            user_id: user.id,
            course_id: courseId,
        })
        .select()
        .single();

    if (error) throw error;
    return data as Enrollment;
}

export async function isEnrolled(courseId: string) {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) return false;

    const { data } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', courseId)
        .single();

    return !!data;
}

// =============================================
// PROGRESS QUERIES
// =============================================

export async function getUserProgress(userId: string, courseId: string) {
    const supabase = await createClient();

    // Get all lessons for the course
    const { data: modules } = await supabase
        .from('modules')
        .select('lessons:lessons(id)')
        .eq('course_id', courseId);

    const lessonIds = modules?.flatMap(m => m.lessons?.map((l: { id: string }) => l.id) || []) || [];

    // Get progress for those lessons
    const { data: progress } = await supabase
        .from('progress')
        .select('*')
        .eq('user_id', userId)
        .in('lesson_id', lessonIds);

    return progress || [];
}

export async function markLessonComplete(lessonId: string) {
    const supabase = await createClient();
    const user = await getCurrentUser();

    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
        .from('progress')
        .upsert({
            user_id: user.id,
            lesson_id: lessonId,
            completed: true,
            last_watched_at: new Date().toISOString(),
        }, {
            onConflict: 'user_id,lesson_id',
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateWatchTime(lessonId: string, watchTimeSeconds: number) {
    const supabase = await createClient();
    const user = await getCurrentUser();

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

// =============================================
// STATS QUERIES (ADMIN)
// =============================================

export async function getAdminStats() {
    const supabase = await createClient();

    const [
        { count: totalStudents },
        { count: totalCourses },
        { count: totalEnrollments },
        { data: publishedCourses },
    ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('enrollments').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('id').eq('status', 'published'),
    ]);

    return {
        totalStudents: totalStudents || 0,
        totalCourses: totalCourses || 0,
        activeCourses: publishedCourses?.length || 0,
        totalEnrollments: totalEnrollments || 0,
    };
}

export async function getRecentStudents(limit = 5) {
    const supabase = await createClient();

    const { data } = await supabase
        .from('profiles')
        .select(`
      *,
      enrollments:enrollments(count)
    `)
        .eq('role', 'student')
        .order('created_at', { ascending: false })
        .limit(limit);

    return data?.map(student => ({
        ...student,
        enrolled_count: student.enrollments?.[0]?.count || 0,
    })) || [];
}

export async function getAllStudents() {
    const supabase = await createClient();

    const { data } = await supabase
        .from('profiles')
        .select(`
      *,
      enrollments:enrollments(count)
    `)
        .eq('role', 'student')
        .order('created_at', { ascending: false });

    return data?.map(student => ({
        ...student,
        enrolled_count: student.enrollments?.[0]?.count || 0,
    })) || [];
}

export async function getAllProfiles() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('profiles')
        .select(`
      *,
      enrollments:enrollments(count)
    `)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return data?.map(profile => ({
        ...profile,
        enrolled_count: profile.enrollments?.[0]?.count || 0,
    })) || [];
}

export async function updateUserRole(userId: string, role: 'admin' | 'student') {
    const supabase = await createClient();
    const currentUser = await getCurrentUser();

    if (currentUser?.role !== 'admin') {
        throw new Error('Unauthorized');
    }

    const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

    if (error) throw error;
}


// =============================================
// FILE UPLOAD
// =============================================

export async function uploadVideo(file: File, courseId: string) {
    const supabase = await createClient();

    const fileName = `${courseId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
        .from('course-videos')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('course-videos')
        .getPublicUrl(data.path);

    return publicUrl;
}

export async function uploadThumbnail(file: File, courseId: string) {
    const supabase = await createClient();

    const fileName = `${courseId}/${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
        .from('thumbnails')
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
        });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
        .from('thumbnails')
        .getPublicUrl(data.path);

    return publicUrl;
}
