"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, Check, Loader2, User } from "lucide-react";
import { updateUserRoleAction } from "./actions";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserRoleToggleProps {
    userId: string;
    currentRole: 'admin' | 'student';
    currentUserId: string;
}

export function UserRoleToggle({ userId, currentRole, currentUserId }: UserRoleToggleProps) {
    const [isLoading, setIsLoading] = useState(false);

    const isSelf = userId === currentUserId;

    const handleRoleChange = async (newRole: 'admin' | 'student') => {
        if (newRole === currentRole) return;

        setIsLoading(true);
        try {
            const result = await updateUserRoleAction(userId, newRole);
            if (result.success) {
                toast.success(`User role updated to ${newRole}`);
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update role");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2" disabled={isLoading || isSelf}>
                    {currentRole === 'admin' ? (
                        <Badge variant="default" className="bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 border-0">
                            <Shield className="mr-1 h-3 w-3" />
                            Admin
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted/80">
                            <User className="mr-1 h-3 w-3" />
                            Student
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleRoleChange('student')} disabled={currentRole === 'student'}>
                    <User className="mr-2 h-4 w-4" />
                    Student
                    {currentRole === 'student' && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange('admin')} disabled={currentRole === 'admin'}>
                    <Shield className="mr-2 h-4 w-4" />
                    Admin
                    {currentRole === 'admin' && <Check className="ml-auto h-4 w-4" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
