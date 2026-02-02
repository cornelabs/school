"use server";

import { updateUserRole } from "@/lib/supabase/queries";
import { revalidatePath } from "next/cache";

export async function updateUserRoleAction(userId: string, role: 'admin' | 'student') {
    try {
        await updateUserRole(userId, role);
        revalidatePath('/admin/users');
        return { success: true };
    } catch (error) {
        console.error('Error updating user role:', error);
        return { success: false, error: 'Failed to update user role' };
    }
}
