"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/queries";

const CERTIFIER_API_URL = "https://api.certifier.io/v1/credentials/create-issue-send";

export type IssueCertificateResult =
    | { ok: true; certificateNumber: string; certificateReferenceNo?: string }
    | { ok: false; error: string };

/**
 * Calls Certifier API to create, issue, and send a credential, then saves it to the database.
 * Idempotent: if a certificate already exists for this user+course, returns it without calling the API again.
 */
export async function issueCertificateForCompletion(
    courseId: string,
    studentName: string,
    studentEmail: string
): Promise<IssueCertificateResult> {
    const user = await getCurrentUser();
    if (!user) {
        return { ok: false, error: "Not authenticated" };
    }

    const apiKey = process.env.CERTIFIER_API_KEY;
    const groupId = process.env.CERTIFIER_GROUP_ID;
    if (!apiKey || !groupId) {
        return { ok: false, error: "Certificate service is not configured" };
    }

    const supabase = await createClient();

    // Idempotent: check if certificate already exists for this user + course
    const { data: existing } = await supabase
        .from("certificates")
        .select("certificate_number, certificate_reference_no")
        .eq("user_id", user.id)
        .eq("course_id", courseId)
        .single();

    if (existing) {
        return {
            ok: true,
            certificateNumber: existing.certificate_number,
            certificateReferenceNo: existing.certificate_reference_no ?? undefined,
        };
    }

    const res = await fetch(CERTIFIER_API_URL, {
        method: "POST",
        headers: {
            "Certifier-Version": "2022-10-26",
            accept: "application/json",
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            recipient: {
                name: studentName,
                email: studentEmail,
            },
            groupId,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        return {
            ok: false,
            error: `Certificate service error: ${res.status} ${text}`,
        };
    }

    const data = (await res.json()) as { id?: string; publicId?: string };
    const certificateNumber = data?.id;
    if (!certificateNumber || typeof certificateNumber !== "string") {
        return { ok: false, error: "Invalid response from certificate service" };
    }
    const certificateReferenceNo =
        typeof data?.publicId === "string" ? data.publicId : null;

    const { error: insertError } = await supabase.from("certificates").insert({
        user_id: user.id,
        course_id: courseId,
        certificate_number: certificateNumber,
        certificate_reference_no: certificateReferenceNo,
    });

    if (insertError) {
        return { ok: false, error: insertError.message };
    }

    return {
        ok: true,
        certificateNumber,
        certificateReferenceNo: certificateReferenceNo ?? undefined,
    };
}
