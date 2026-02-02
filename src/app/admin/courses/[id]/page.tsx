"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ArrowLeft,
    Upload,
    Loader2,
    Plus,
    GripVertical,
    Trash2,
    Video,
    Save,
    Check,
    BookOpen,
    Youtube,
    ChevronUp,
    ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

interface LessonData {
    id: string;
    title: string;
    description: string;
    video_url: string | null;
    youtube_url: string | null;
    content: string | null;
    type: 'video' | 'reading' | 'youtube';
    videoFile: File | null;
    order_index: number;
    isNew?: boolean;
}

interface ModuleData {
    id: string;
    title: string;
    lessons: LessonData[];
    order_index: number;
    isNew?: boolean;
}

interface CourseData {
    id: string;
    title: string;
    description: string;
    difficulty: string;
    category: string;
    thumbnail_url: string | null;
    status: string;
}

export default function EditCoursePage() {
    const router = useRouter();
    const params = useParams();
    const courseId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [course, setCourse] = useState<CourseData | null>(null);
    const [modules, setModules] = useState<ModuleData[]>([]);

    // Load course data
    useEffect(() => {
        async function loadCourse() {
            const supabase = createClient();

            // Check if user is admin
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role !== 'admin') {
                router.push('/dashboard');
                return;
            }

            // Load course
            const { data: courseData, error: courseError } = await supabase
                .from('courses')
                .select('*')
                .eq('id', courseId)
                .single();

            if (courseError || !courseData) {
                toast.error('Course not found');
                router.push('/admin/courses');
                return;
            }

            setCourse(courseData);

            // Load modules with lessons
            const { data: modulesData } = await supabase
                .from('modules')
                .select(`
                    *,
                    lessons:lessons(*)
                `)
                .eq('course_id', courseId)
                .order('order_index');

            if (modulesData) {
                setModules(modulesData.map(m => ({
                    ...m,
                    lessons: m.lessons
                        .sort((a: LessonData, b: LessonData) => a.order_index - b.order_index)
                        .map((l: any) => ({
                            ...l,
                            videoFile: null,
                            type: l.type || 'video',
                            youtube_url: l.youtube_url || null,
                            content: l.content || null,
                        }))
                })));
            }

            setIsLoading(false);
        }

        loadCourse();
    }, [courseId, router]);

    const handleSave = async (publish = false) => {
        if (!course) return;

        setIsSaving(true);
        const supabase = createClient();

        try {
            // Upload new thumbnail if exists
            let thumbnailUrl = course.thumbnail_url;
            if (thumbnailFile) {
                toast.info('Uploading thumbnail...');
                const fileName = `${courseId}/${Date.now()}-${thumbnailFile.name}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('thumbnails')
                    .upload(fileName, thumbnailFile);

                if (uploadError) {
                    toast.error(`Thumbnail upload failed: ${uploadError.message}`);
                } else if (uploadData) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('thumbnails')
                        .getPublicUrl(uploadData.path);
                    thumbnailUrl = publicUrl;
                    toast.success('Thumbnail uploaded!');
                }
            }

            // Update course
            const { error: courseError } = await supabase
                .from('courses')
                .update({
                    title: course.title,
                    description: course.description,
                    difficulty: course.difficulty,
                    category: course.category,
                    thumbnail_url: thumbnailUrl,
                    status: publish ? 'published' : course.status,
                    published_at: publish ? new Date().toISOString() : undefined,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', courseId);

            if (courseError) throw courseError;

            // Process modules
            for (let mi = 0; mi < modules.length; mi++) {
                const module = modules[mi];

                if (module.isNew) {
                    // Create new module
                    const { data: newModule, error: moduleError } = await supabase
                        .from('modules')
                        .insert({
                            course_id: courseId,
                            title: module.title,
                            order_index: mi,
                        })
                        .select()
                        .single();

                    if (moduleError) throw moduleError;
                    module.id = newModule.id;
                    module.isNew = false;
                } else {
                    // Update existing module
                    await supabase
                        .from('modules')
                        .update({
                            title: module.title,
                            order_index: mi,
                        })
                        .eq('id', module.id);
                }

                // Process lessons
                for (let li = 0; li < module.lessons.length; li++) {
                    const lesson = module.lessons[li];
                    if (!lesson.title) continue;

                    // Upload video if new file
                    let videoUrl = lesson.video_url;
                    if (lesson.videoFile) {
                        toast.info(`Uploading video: ${lesson.videoFile.name}...`);
                        const fileName = `${courseId}/${Date.now()}-${lesson.videoFile.name}`;
                        const { data: videoData, error: videoError } = await supabase.storage
                            .from('course-videos')
                            .upload(fileName, lesson.videoFile);

                        if (videoError) {
                            console.error('Video upload error:', videoError);
                            toast.error(`Failed to upload video: ${videoError.message}`);
                        } else if (videoData) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('course-videos')
                                .getPublicUrl(videoData.path);
                            videoUrl = publicUrl;
                            toast.success(`Video uploaded successfully!`);
                            console.log('Video URL:', videoUrl);
                        }
                    }

                    if (lesson.isNew) {
                        // Create new lesson
                        const { data: newLesson, error: lessonError } = await supabase.from('lessons').insert({
                            module_id: module.id,
                            title: lesson.title,
                            description: lesson.description,
                            video_url: videoUrl,
                            youtube_url: lesson.youtube_url,
                            content: lesson.content,
                            order_index: li,
                            type: lesson.type || 'video',
                        })
                            .select()
                            .single();

                        if (lessonError) {
                            console.error('Lesson create error:', lessonError);
                            toast.error(`Failed to create lesson: ${lessonError.message}`);
                        } else if (newLesson) {
                            lesson.id = newLesson.id;
                            lesson.isNew = false;
                        }
                    } else {
                        // Update existing lesson
                        const { error: updateError } = await supabase
                            .from('lessons')
                            .update({
                                title: lesson.title,
                                description: lesson.description,
                                video_url: videoUrl,
                                youtube_url: lesson.youtube_url,
                                content: lesson.content,
                                type: lesson.type || 'video',
                                order_index: li,
                            })
                            .eq('id', lesson.id);

                        if (updateError) {
                            console.error('Lesson update error:', updateError);
                            toast.error(`Failed to update lesson: ${updateError.message}`);
                        } else {
                            console.log(`Lesson ${lesson.id} updated`);
                        }
                    }
                }
            }

            toast.success(publish ? 'Course published!' : 'Course saved!');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save course');
        } finally {
            setIsSaving(false);
        }
    };

    const addModule = () => {
        setModules([
            ...modules,
            {
                id: `new-${Date.now()}`,
                title: `Module ${modules.length + 1}`,
                lessons: [{
                    id: `new-${Date.now()}`,
                    title: '',
                    description: '',
                    video_url: null,
                    youtube_url: null,
                    content: null,
                    type: 'video' as const,
                    videoFile: null,
                    order_index: 0,
                    isNew: true,
                }],
                order_index: modules.length,
                isNew: true,
            }
        ]);
    };

    const addLesson = (moduleId: string) => {
        setModules(modules.map(m =>
            m.id === moduleId
                ? {
                    ...m,
                    lessons: [...m.lessons, {
                        id: `new-${Date.now()}`,
                        title: '',
                        description: '',
                        video_url: null,
                        youtube_url: null,
                        content: null,
                        type: 'video' as const,
                        videoFile: null,
                        order_index: m.lessons.length,
                        isNew: true,
                    }]
                }
                : m
        ));
    };

    const removeModule = async (moduleId: string) => {
        if (modules.length <= 1) return;

        const module = modules.find(m => m.id === moduleId);
        if (!module?.isNew) {
            const supabase = createClient();
            await supabase.from('modules').delete().eq('id', moduleId);
        }

        setModules(modules.filter(m => m.id !== moduleId));
    };

    const removeLesson = async (moduleId: string, lessonId: string) => {
        const module = modules.find(m => m.id === moduleId);
        const lesson = module?.lessons.find(l => l.id === lessonId);

        if (lesson && !lesson.isNew) {
            const supabase = createClient();
            await supabase.from('lessons').delete().eq('id', lessonId);
        }

        setModules(modules.map(m =>
            m.id === moduleId
                ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
                : m
        ));
    };

    const moveModuleUp = (index: number) => {
        if (index === 0) return;
        const newModules = [...modules];
        [newModules[index - 1], newModules[index]] = [newModules[index], newModules[index - 1]];
        setModules(newModules);
    };

    const moveModuleDown = (index: number) => {
        if (index === modules.length - 1) return;
        const newModules = [...modules];
        [newModules[index], newModules[index + 1]] = [newModules[index + 1], newModules[index]];
        setModules(newModules);
    };

    const moveLessonUp = (moduleIndex: number, lessonIndex: number) => {
        if (lessonIndex === 0) return;
        const newModules = [...modules];
        const lessons = [...newModules[moduleIndex].lessons];
        [lessons[lessonIndex - 1], lessons[lessonIndex]] = [lessons[lessonIndex], lessons[lessonIndex - 1]];
        newModules[moduleIndex] = { ...newModules[moduleIndex], lessons };
        setModules(newModules);
    };

    const moveLessonDown = (moduleIndex: number, lessonIndex: number) => {
        const lessons = modules[moduleIndex].lessons;
        if (lessonIndex === lessons.length - 1) return;
        const newModules = [...modules];
        const newLessons = [...lessons];
        [newLessons[lessonIndex], newLessons[lessonIndex + 1]] = [newLessons[lessonIndex + 1], newLessons[lessonIndex]];
        newModules[moduleIndex] = { ...newModules[moduleIndex], lessons: newLessons };
        setModules(newModules);
    };

    if (isLoading || !course) {
        return (
            <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa]">
            <main className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/courses">
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Edit Course</h1>
                            <p className="text-muted-foreground">Update course content and settings</p>
                        </div>
                    </div>
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                        {course.status}
                    </Badge>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Course Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="shadow-premium border-0 bg-white">
                            <CardHeader>
                                <CardTitle>Course Details</CardTitle>
                                <CardDescription>Basic information about your course</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Course Title *</Label>
                                    <Input
                                        id="title"
                                        placeholder="e.g. Introduction to AI"
                                        value={course.title}
                                        onChange={(e) => setCourse({ ...course, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        placeholder="Describe what students will learn..."
                                        rows={4}
                                        value={course.description || ''}
                                        onChange={(e) => setCourse({ ...course, description: e.target.value })}
                                    />
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Difficulty *</Label>
                                        <Select
                                            value={course.difficulty}
                                            onValueChange={(value) => setCourse({ ...course, difficulty: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select difficulty" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="beginner">Beginner</SelectItem>
                                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                                <SelectItem value="advanced">Advanced</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Category</Label>
                                        <Select
                                            value={course.category || ''}
                                            onValueChange={(value) => setCourse({ ...course, category: value })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select category" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="AI Fundamentals">AI Fundamentals</SelectItem>
                                                <SelectItem value="Practical Skills">Practical Skills</SelectItem>
                                                <SelectItem value="AI Ethics">AI Ethics</SelectItem>
                                                <SelectItem value="Business">Business</SelectItem>
                                                <SelectItem value="Technical">Technical</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Modules & Lessons */}
                        <Card className="shadow-premium border-0 bg-white">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>Modules & Lessons</CardTitle>
                                    <CardDescription>Organize your course content</CardDescription>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={addModule}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Module
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {modules.map((module, moduleIndex) => (
                                    <div key={module.id} className="border rounded-lg p-4 space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex flex-col gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => moveModuleUp(moduleIndex)}
                                                    disabled={moduleIndex === 0}
                                                >
                                                    <ChevronUp className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6"
                                                    onClick={() => moveModuleDown(moduleIndex)}
                                                    disabled={moduleIndex === modules.length - 1}
                                                >
                                                    <ChevronDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            <Input
                                                placeholder="Module title"
                                                value={module.title}
                                                onChange={(e) => {
                                                    setModules(modules.map(m =>
                                                        m.id === module.id ? { ...m, title: e.target.value } : m
                                                    ));
                                                }}
                                                className="flex-1 font-medium"
                                            />
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeModule(module.id)}
                                                disabled={modules.length === 1}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>

                                        {/* Lessons */}
                                        <div className="ml-8 space-y-3">
                                            {module.lessons.map((lesson, lessonIndex) => (
                                                <div key={lesson.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                                    <span className="text-sm text-muted-foreground mt-2">
                                                        {moduleIndex + 1}.{lessonIndex + 1}
                                                    </span>
                                                    <div className="flex-1 space-y-3">
                                                        <Input
                                                            placeholder="Lesson title"
                                                            value={lesson.title}
                                                            onChange={(e) => {
                                                                setModules(modules.map(m =>
                                                                    m.id === module.id
                                                                        ? {
                                                                            ...m,
                                                                            lessons: m.lessons.map(l =>
                                                                                l.id === lesson.id ? { ...l, title: e.target.value } : l
                                                                            )
                                                                        }
                                                                        : m
                                                                ));
                                                            }}
                                                        />

                                                        {/* Lesson Type Selector */}
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant={lesson.type === 'video' ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => {
                                                                    setModules(modules.map(m =>
                                                                        m.id === module.id
                                                                            ? {
                                                                                ...m,
                                                                                lessons: m.lessons.map(l =>
                                                                                    l.id === lesson.id ? { ...l, type: 'video' as const } : l
                                                                                )
                                                                            }
                                                                            : m
                                                                    ));
                                                                }}
                                                            >
                                                                <Video className="h-4 w-4 mr-1" />
                                                                Video
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant={lesson.type === 'youtube' ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => {
                                                                    setModules(modules.map(m =>
                                                                        m.id === module.id
                                                                            ? {
                                                                                ...m,
                                                                                lessons: m.lessons.map(l =>
                                                                                    l.id === lesson.id ? { ...l, type: 'youtube' as const } : l
                                                                                )
                                                                            }
                                                                            : m
                                                                    ));
                                                                }}
                                                            >
                                                                <Youtube className="h-4 w-4 mr-1" />
                                                                YouTube
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant={lesson.type === 'reading' ? 'default' : 'outline'}
                                                                size="sm"
                                                                onClick={() => {
                                                                    setModules(modules.map(m =>
                                                                        m.id === module.id
                                                                            ? {
                                                                                ...m,
                                                                                lessons: m.lessons.map(l =>
                                                                                    l.id === lesson.id ? { ...l, type: 'reading' as const } : l
                                                                                )
                                                                            }
                                                                            : m
                                                                    ));
                                                                }}
                                                            >
                                                                <BookOpen className="h-4 w-4 mr-1" />
                                                                Reading
                                                            </Button>
                                                        </div>

                                                        {/* Conditional Content Fields */}
                                                        {lesson.type === 'video' && (
                                                            <div className="flex items-center gap-2">
                                                                {lesson.video_url ? (
                                                                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-md text-sm">
                                                                        <Video className="h-4 w-4" />
                                                                        <span>Video uploaded</span>
                                                                        <Check className="h-4 w-4" />
                                                                    </div>
                                                                ) : null}
                                                                <Label
                                                                    htmlFor={`video-${lesson.id}`}
                                                                    className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted"
                                                                >
                                                                    <Upload className="h-4 w-4" />
                                                                    <span className="text-sm">
                                                                        {lesson.videoFile
                                                                            ? lesson.videoFile.name
                                                                            : lesson.video_url
                                                                                ? 'Replace Video'
                                                                                : 'Upload Video'
                                                                        }
                                                                    </span>
                                                                </Label>
                                                                <input
                                                                    id={`video-${lesson.id}`}
                                                                    type="file"
                                                                    accept="video/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0] || null;
                                                                        setModules(modules.map(m =>
                                                                            m.id === module.id
                                                                                ? {
                                                                                    ...m,
                                                                                    lessons: m.lessons.map(l =>
                                                                                        l.id === lesson.id ? { ...l, videoFile: file } : l
                                                                                    )
                                                                                }
                                                                                : m
                                                                        ));
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {lesson.type === 'youtube' && (
                                                            <div className="space-y-2">
                                                                <Input
                                                                    placeholder="YouTube URL (e.g., https://youtube.com/watch?v=...)"
                                                                    value={lesson.youtube_url || ''}
                                                                    onChange={(e) => {
                                                                        setModules(modules.map(m =>
                                                                            m.id === module.id
                                                                                ? {
                                                                                    ...m,
                                                                                    lessons: m.lessons.map(l =>
                                                                                        l.id === lesson.id ? { ...l, youtube_url: e.target.value } : l
                                                                                    )
                                                                                }
                                                                                : m
                                                                        ));
                                                                    }}
                                                                />
                                                                {lesson.youtube_url && extractYouTubeId(lesson.youtube_url) && (
                                                                    <div className="relative aspect-video w-48 rounded-md overflow-hidden border">
                                                                        <img
                                                                            src={getYouTubeThumbnail(extractYouTubeId(lesson.youtube_url)!)}
                                                                            alt="YouTube thumbnail"
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                                                            <Youtube className="h-8 w-8 text-white" />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {lesson.type === 'reading' && (
                                                            <Textarea
                                                                placeholder="Write in Markdown... (## Heading, **bold**, - bullet)"
                                                                rows={6}
                                                                value={lesson.content || ''}
                                                                onChange={(e) => {
                                                                    setModules(modules.map(m =>
                                                                        m.id === module.id
                                                                            ? {
                                                                                ...m,
                                                                                lessons: m.lessons.map(l =>
                                                                                    l.id === lesson.id ? { ...l, content: e.target.value } : l
                                                                                )
                                                                            }
                                                                            : m
                                                                    ));
                                                                }}
                                                            />
                                                        )}

                                                        <Textarea
                                                            placeholder="Lesson description (optional)"
                                                            rows={2}
                                                            value={lesson.description || ''}
                                                            onChange={(e) => {
                                                                setModules(modules.map(m =>
                                                                    m.id === module.id
                                                                        ? {
                                                                            ...m,
                                                                            lessons: m.lessons.map(l =>
                                                                                l.id === lesson.id ? { ...l, description: e.target.value } : l
                                                                            )
                                                                        }
                                                                        : m
                                                                ));
                                                            }}
                                                        />

                                                        {/* Delete Button */}
                                                        <div className="flex justify-end">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => removeLesson(module.id, lesson.id)}
                                                                className="text-destructive hover:text-destructive"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-1" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full"
                                                onClick={() => addLesson(module.id)}
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Lesson
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Thumbnail */}
                        <Card className="shadow-premium border-0 bg-white">
                            <CardHeader>
                                <CardTitle>Thumbnail</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(thumbnailPreview || (course.thumbnail_url && !thumbnailFile)) ? (
                                    <div className="space-y-3">
                                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                                            <img
                                                src={thumbnailPreview || course.thumbnail_url!}
                                                alt="Course thumbnail"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Label htmlFor="thumbnail" className="cursor-pointer flex-1">
                                                <div className="text-center py-2 px-3 border rounded-md hover:bg-muted/50 transition-colors text-sm">
                                                    Change
                                                </div>
                                            </Label>
                                            {thumbnailPreview && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setThumbnailFile(null);
                                                        setThumbnailPreview(null);
                                                        toast.info('Changed thumbnail reverted');
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <Label htmlFor="thumbnail" className="cursor-pointer">
                                        <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground mb-1">Click to upload</p>
                                            <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                                        </div>
                                    </Label>
                                )}
                                <input
                                    id="thumbnail"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error('Image must be less than 5MB');
                                                return;
                                            }
                                            setThumbnailFile(file);
                                            const reader = new FileReader();
                                            reader.onload = (e) => {
                                                setThumbnailPreview(e.target?.result as string);
                                                toast.success('Thumbnail selected!');
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card className="shadow-premium border-0 bg-white">
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    className="w-full"
                                    disabled={isSaving}
                                    onClick={() => handleSave(false)}
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Save Changes
                                        </>
                                    )}
                                </Button>
                                {course.status !== 'published' && (
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        disabled={isSaving}
                                        onClick={() => handleSave(true)}
                                    >
                                        Publish Now
                                    </Button>
                                )}
                                <Button variant="ghost" className="w-full" asChild>
                                    <Link href={`/courses/${courseId}`}>
                                        Preview Course
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
