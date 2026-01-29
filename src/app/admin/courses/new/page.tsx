"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
    BookOpen,
    Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { extractYouTubeId, getYouTubeThumbnail } from "@/lib/youtube";

interface LessonData {
    id: string;
    title: string;
    description: string;
    type: 'video' | 'reading' | 'youtube';
    videoFile: File | null;
    youtube_url: string;
    content: string;
}

interface ModuleData {
    id: string;
    title: string;
    lessons: LessonData[];
}

export default function NewCoursePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
    const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        difficulty: "",
        category: "",
    });
    const [modules, setModules] = useState<ModuleData[]>([
        { id: "1", title: "Module 1", lessons: [{ id: "1", title: "", description: "", type: 'video', videoFile: null, youtube_url: "", content: "" }] }
    ]);

    const handleSubmit = async (e: React.FormEvent, publish = false) => {
        e.preventDefault();

        if (!formData.title || !formData.difficulty) {
            toast.error("Please fill in required fields");
            return;
        }

        setIsLoading(true);
        const supabase = createClient();

        try {
            // Get current user
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            // Upload thumbnail if exists
            let thumbnailUrl = null;
            if (thumbnailFile) {
                toast.info('Uploading thumbnail...');
                const fileName = `${Date.now()}-${thumbnailFile.name}`;
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

            // Create course
            const { data: course, error: courseError } = await supabase
                .from('courses')
                .insert({
                    title: formData.title,
                    description: formData.description,
                    difficulty: formData.difficulty,
                    category: formData.category,
                    thumbnail_url: thumbnailUrl,
                    status: publish ? 'published' : 'draft',
                    published_at: publish ? new Date().toISOString() : null,
                    created_by: user.id,
                })
                .select()
                .single();

            if (courseError) throw courseError;

            // Create modules and lessons
            for (let mi = 0; mi < modules.length; mi++) {
                const module = modules[mi];

                const { data: createdModule, error: moduleError } = await supabase
                    .from('modules')
                    .insert({
                        course_id: course.id,
                        title: module.title,
                        order_index: mi,
                    })
                    .select()
                    .single();

                if (moduleError) throw moduleError;

                // Create lessons for this module
                for (let li = 0; li < module.lessons.length; li++) {
                    const lesson = module.lessons[li];
                    if (!lesson.title) continue;

                    // Upload video if exists
                    let videoUrl = null;
                    if (lesson.videoFile) {
                        toast.info(`Uploading video: ${lesson.videoFile.name}...`);
                        const fileName = `${course.id}/${Date.now()}-${lesson.videoFile.name}`;
                        const { data: videoData, error: videoError } = await supabase.storage
                            .from('course-videos')
                            .upload(fileName, lesson.videoFile);

                        if (videoError) {
                            console.error('Video upload error:', videoError);
                            toast.error(`Video upload failed: ${videoError.message}`);
                        } else if (videoData) {
                            const { data: { publicUrl } } = supabase.storage
                                .from('course-videos')
                                .getPublicUrl(videoData.path);
                            videoUrl = publicUrl;
                            toast.success('Video uploaded!');
                            console.log('Video URL:', videoUrl);
                        }
                    }

                    const { error: lessonError } = await supabase.from('lessons').insert({
                        module_id: createdModule.id,
                        title: lesson.title,
                        description: lesson.description,
                        video_url: videoUrl,
                        youtube_url: lesson.youtube_url || null,
                        content: lesson.content || null,
                        order_index: li,
                        type: lesson.type,
                    });

                    if (lessonError) {
                        console.error('Lesson insert error:', lessonError);
                        toast.error(`Failed to create lesson: ${lessonError.message}`);
                    } else {
                        console.log(`Lesson created with video_url: ${videoUrl}`);
                    }
                }
            }

            toast.success(publish ? "Course published!" : "Course saved as draft!");
            router.push("/admin/courses");
        } catch (error: any) {
            toast.error(error.message || "Failed to create course");
        } finally {
            setIsLoading(false);
        }
    };

    const addModule = () => {
        setModules([
            ...modules,
            {
                id: Date.now().toString(),
                title: `Module ${modules.length + 1}`,
                lessons: [{ id: Date.now().toString(), title: "", description: "", type: 'video' as const, videoFile: null, youtube_url: "", content: "" }]
            }
        ]);
    };

    const addLesson = (moduleId: string) => {
        setModules(modules.map(m =>
            m.id === moduleId
                ? { ...m, lessons: [...m.lessons, { id: Date.now().toString(), title: "", description: "", type: 'video' as const, videoFile: null, youtube_url: "", content: "" }] }
                : m
        ));
    };

    const removeModule = (moduleId: string) => {
        if (modules.length > 1) {
            setModules(modules.filter(m => m.id !== moduleId));
        }
    };

    const removeLesson = (moduleId: string, lessonId: string) => {
        setModules(modules.map(m =>
            m.id === moduleId
                ? { ...m, lessons: m.lessons.filter(l => l.id !== lessonId) }
                : m
        ));
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Main Content - Full width for this page */}
            <main className="p-8 max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href="/admin/courses">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">New Course</h1>
                        <p className="text-muted-foreground">Create a new course with modules and lessons</p>
                    </div>
                </div>

                <form onSubmit={(e) => handleSubmit(e, false)}>
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Course Details */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
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
                                            value={formData.title}
                                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe what students will learn..."
                                            rows={4}
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Difficulty *</Label>
                                            <Select onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
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
                                            <Select onValueChange={(value) => setFormData({ ...formData, category: value })}>
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
                            <Card>
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
                                                <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
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
                                                                    <Label
                                                                        htmlFor={`video-${lesson.id}`}
                                                                        className="flex items-center gap-2 px-3 py-2 border rounded-md cursor-pointer hover:bg-muted"
                                                                    >
                                                                        <Upload className="h-4 w-4" />
                                                                        <span className="text-sm">
                                                                            {lesson.videoFile ? lesson.videoFile.name : "Upload Video"}
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
                                                                        value={lesson.youtube_url}
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
                                                                    value={lesson.content}
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
                                                                value={lesson.description}
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
                                                            {module.lessons.length > 1 && (
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
                                                            )}
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thumbnail</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {thumbnailPreview ? (
                                        <div className="space-y-3">
                                            <div className="relative aspect-video rounded-lg overflow-hidden border">
                                                <img
                                                    src={thumbnailPreview}
                                                    alt="Thumbnail preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Label htmlFor="thumbnail" className="cursor-pointer flex-1">
                                                    <div className="text-center py-2 px-3 border rounded-md hover:bg-muted/50 transition-colors text-sm">
                                                        Change
                                                    </div>
                                                </Label>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setThumbnailFile(null);
                                                        setThumbnailPreview(null);
                                                        toast.info('Thumbnail removed');
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <Label htmlFor="thumbnail" className="cursor-pointer">
                                            <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors">
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
                            <Card>
                                <CardHeader>
                                    <CardTitle>Publish</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button type="submit" className="w-full" disabled={isLoading}>
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save as Draft"
                                        )}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={isLoading}
                                        onClick={(e) => handleSubmit(e as any, true)}
                                    >
                                        Publish Now
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    );
}
