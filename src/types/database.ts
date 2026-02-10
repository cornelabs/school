// Database types for the LMS

export type UserRole = 'student' | 'admin';
export type CourseStatus = 'draft' | 'published';
export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type EnrollmentStatus = 'active' | 'completed' | 'dropped';
export type LessonType = 'video' | 'quiz' | 'reading' | 'youtube' | 'assignment';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url?: string;
  difficulty: CourseDifficulty;
  category?: string;
  status: CourseStatus;
  duration_minutes: number;
  created_by: string;
  created_at: string;
  published_at?: string;
}

export interface Module {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

export interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url?: string;
  youtube_url?: string;
  content?: string;
  duration_seconds: number;
  order_index: number;
  type: LessonType;
  quiz_data?: {
    questions: {
      id: string;
      question: string;
      options: string[];
      correct_index: number;
    }[];
    passing_score: number;
  };
  assignment_data?: {
    prompt: string;
  };
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: EnrollmentStatus;
}

export interface Progress {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  watch_time_seconds: number;
  last_watched_at: string;
  quiz_answers?: number[]; // Array of selected indices
  assignment_submission?: string;
  score?: number;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  questions: QuizQuestion[];
  passing_score: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  answers: number[];
  attempted_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  certificate_number: string;
  issued_at: string;
}

// Extended types with relations
export interface CourseWithModules extends Course {
  modules: ModuleWithLessons[];
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
}

export interface EnrollmentWithCourse extends Enrollment {
  course: Course;
}

export interface CourseWithProgress extends Course {
  enrollment?: Enrollment;
  progress_percentage?: number;
}
