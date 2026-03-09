"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, ExternalLink, Loader2 } from "lucide-react";
import { issueCertificateForCompletion } from "@/app/actions/certificate";

interface CertificateGeneratorProps {
    courseId: string;
    studentName: string;
    studentEmail: string;
    /** Whether a certificate row exists in the DB (from server on load). */
    certificateExists: boolean;
    /** Reference no from DB if present (for View certificate link). */
    existingReferenceNo: string | null;
}

export function CertificateGenerator({
    courseId,
    studentName,
    studentEmail,
    certificateExists: initialCertificateExists,
    existingReferenceNo,
}: CertificateGeneratorProps) {
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [certificateExists, setCertificateExists] = useState(initialCertificateExists);
    const [referenceNo, setReferenceNo] = useState<string | null>(existingReferenceNo);

    async function handleGenerate() {
        setPending(true);
        setError(null);
        const result = await issueCertificateForCompletion(courseId, studentName, studentEmail);
        setPending(false);
        if (result.ok) {
            setCertificateExists(true);
            if (result.certificateReferenceNo) {
                setReferenceNo(result.certificateReferenceNo);
            }
        } else {
            setError(result.error);
        }
    }

    if (certificateExists) {
        return (
            <div className="flex flex-col items-center gap-2 pt-4 text-muted-foreground">
                <p className="flex items-center gap-2 text-base">
                    <Mail className="h-4 w-4 text-amber-500" />
                    Your certificate has been sent to your email — please check your inbox.
                </p>
                {referenceNo && (
                    <Button asChild variant="secondary" size="sm" className="mt-3 rounded-full">
                        <a
                            href={`https://credsverse.com/credentials/${referenceNo}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            View certificate
                        </a>
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-3 pt-4">
            <Button
                onClick={handleGenerate}
                disabled={pending}
                className="rounded-full bg-amber-600 hover:bg-amber-700 text-white"
            >
                {pending ? (
                    <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating…
                    </>
                ) : (
                    "Generate Certificate"
                )}
            </Button>
            {error && (
                <p className="text-sm text-destructive">
                    There was an error generating your certificate, please contact the administrator.
                </p>
            )}
        </div>
    );
}
