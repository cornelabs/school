"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Check,
    Loader2,
    SkipForward,
    SkipBack,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
    lesson: {
        id: string;
        title: string;
        video_url?: string | null;
        duration_seconds: number;
    };
    isCompleted: boolean;
    onComplete?: () => void;
}

export function VideoPlayer({ lesson, isCompleted, onComplete }: VideoPlayerProps) {
    const router = useRouter();
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isMarking, setIsMarking] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleLoadedMetadata = () => {
            setDuration(video.duration);
            setIsLoading(false);
        };
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleWaiting = () => setIsLoading(true);
        const handleCanPlay = () => setIsLoading(false);

        video.addEventListener("timeupdate", handleTimeUpdate);
        video.addEventListener("loadedmetadata", handleLoadedMetadata);
        video.addEventListener("play", handlePlay);
        video.addEventListener("pause", handlePause);
        video.addEventListener("waiting", handleWaiting);
        video.addEventListener("canplay", handleCanPlay);

        return () => {
            video.removeEventListener("timeupdate", handleTimeUpdate);
            video.removeEventListener("loadedmetadata", handleLoadedMetadata);
            video.removeEventListener("play", handlePlay);
            video.removeEventListener("pause", handlePause);
            video.removeEventListener("waiting", handleWaiting);
            video.removeEventListener("canplay", handleCanPlay);
        };
    }, []);

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
        }
    };

    const handleSeek = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.currentTime = value[0];
            setCurrentTime(value[0]);
        }
    };

    const handleVolumeChange = (value: number[]) => {
        if (videoRef.current) {
            videoRef.current.volume = value[0];
            setVolume(value[0]);
            setIsMuted(value[0] === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
        }
    };

    const toggleFullscreen = () => {
        if (containerRef.current) {
            if (document.fullscreenElement) {
                document.exitFullscreen();
            } else {
                containerRef.current.requestFullscreen();
            }
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const handleMarkComplete = async () => {
        setIsMarking(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            toast.error("Not authenticated");
            setIsMarking(false);
            return;
        }

        const { error } = await supabase
            .from("progress")
            .upsert({
                user_id: user.id,
                lesson_id: lesson.id,
                completed: true,
                last_watched_at: new Date().toISOString(),
            }, {
                onConflict: "user_id,lesson_id",
            });

        if (error) {
            toast.error("Failed to mark as complete");
        } else {
            toast.success("Lesson marked as complete!");
            onComplete?.();
            router.refresh();
        }
        setIsMarking(false);
    };

    // Auto-hide controls
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (isPlaying) {
            timeout = setTimeout(() => setShowControls(false), 3000);
        } else {
            setShowControls(true);
        }
        return () => clearTimeout(timeout);
    }, [isPlaying, currentTime]);

    if (!lesson.video_url) {
        return (
            <div className="bg-[#171717] aspect-video relative flex items-center justify-center">
                <div className="text-center text-white">
                    <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full h-16 w-16 mb-4"
                        disabled
                    >
                        <Play className="h-6 w-6 ml-1" />
                    </Button>
                    <p className="text-sm text-gray-400 mb-4">Video coming soon</p>
                    {!isCompleted && (
                        <Button onClick={handleMarkComplete} disabled={isMarking}>
                            {isMarking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Check className="mr-2 h-4 w-4" />
                            )}
                            Mark as Complete
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="bg-[#171717] aspect-video relative group"
            onMouseEnter={() => setShowControls(true)}
            onMouseMove={() => setShowControls(true)}
        >
            {/* Video Element */}
            <video
                ref={videoRef}
                src={lesson.video_url}
                className="w-full h-full"
                onClick={togglePlay}
                playsInline
            />

            {/* Loading Spinner */}
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <Loader2 className="h-12 w-12 text-white animate-spin" />
                </div>
            )}

            {/* Play/Pause Overlay */}
            {!isPlaying && !isLoading && (
                <div
                    className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
                    onClick={togglePlay}
                >
                    <Button
                        size="lg"
                        variant="secondary"
                        className="rounded-full h-16 w-16"
                    >
                        <Play className="h-6 w-6 ml-1" />
                    </Button>
                </div>
            )}

            {/* Controls */}
            <div
                className={cn(
                    "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 transition-opacity duration-300",
                    showControls ? "opacity-100" : "opacity-0"
                )}
            >
                {/* Progress Bar */}
                <div className="mb-3">
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="cursor-pointer"
                    />
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                        {/* Play/Pause */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={togglePlay}
                        >
                            {isPlaying ? (
                                <Pause className="h-5 w-5" />
                            ) : (
                                <Play className="h-5 w-5" />
                            )}
                        </Button>

                        {/* Skip Back */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={() => skip(-10)}
                        >
                            <SkipBack className="h-4 w-4" />
                        </Button>

                        {/* Skip Forward */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={() => skip(10)}
                        >
                            <SkipForward className="h-4 w-4" />
                        </Button>

                        {/* Volume */}
                        <div className="flex items-center gap-2 ml-2">
                            <Button
                                size="sm"
                                variant="ghost"
                                className="text-white hover:text-white hover:bg-white/20"
                                onClick={toggleMute}
                            >
                                {isMuted ? (
                                    <VolumeX className="h-4 w-4" />
                                ) : (
                                    <Volume2 className="h-4 w-4" />
                                )}
                            </Button>
                            <div className="w-20 hidden sm:block">
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    max={1}
                                    step={0.1}
                                    onValueChange={handleVolumeChange}
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <span className="text-sm ml-2">
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mark Complete */}
                        {!isCompleted && (
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={handleMarkComplete}
                                disabled={isMarking}
                            >
                                {isMarking ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Check className="mr-2 h-4 w-4" />
                                )}
                                Mark Complete
                            </Button>
                        )}

                        {/* Fullscreen */}
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-white hover:text-white hover:bg-white/20"
                            onClick={toggleFullscreen}
                        >
                            <Maximize className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
