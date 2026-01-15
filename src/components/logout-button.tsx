"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface LogoutButtonProps {
    variant?: "default" | "ghost" | "outline" | "secondary" | "destructive" | "link";
    className?: string;
}

export function LogoutButton({ variant = "ghost", className }: LogoutButtonProps) {
    const router = useRouter();

    const handleLogout = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        router.push("/login");
        router.refresh();
    };

    return (
        <Button variant={variant} size="icon" onClick={handleLogout} className={className}>
            <LogOut className="h-4 w-4" />
        </Button>
    );
}
