"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";

interface EnrollButtonProps {
    courseId: string;
    isLocked?: boolean;
}

export function EnrollButton({ courseId, isLocked }: EnrollButtonProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleEnroll = async () => {
        setIsLoading(true);

        try {
            const { enrollUserAction } = await import("@/app/actions/enroll");
            const result = await enrollUserAction(courseId);

            if (result.error) {
                if (result.error === "Not authenticated") {
                    toast.error("Please sign in to enroll");
                    router.push(`/login?redirect=/courses/${courseId}`);
                } else if (result.error === "Course is locked") {
                    toast.error("Enrollment is currently closed for this course.");
                } else {
                    toast.error(result.error);
                }
            } else {
                toast.success("Enrolled successfully! Check your email.");
                router.push(`/learn/${courseId}`);
            }
        } catch (error) {
            console.error("Enrollment failed:", error);
            toast.error("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLocked) {
        return (
            <Button className="w-full" size="lg" disabled>
                <div className="flex items-center justify-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-2 h-4 w-4"
                    >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Enrollment Closed
                </div>
            </Button>
        );
    }

    return (
        <Button className="w-full" size="lg" onClick={handleEnroll} disabled={isLoading}>
            {isLoading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enrolling...
                </>
            ) : (
                <>
                    <Play className="mr-2 h-4 w-4" />
                    Enroll Now
                </>
            )}
        </Button>
    );
}
