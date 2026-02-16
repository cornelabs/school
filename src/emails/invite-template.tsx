import {
    Body,
    Button,
    Container,
    Head,
    Heading,
    Html,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
    courseTitle: string;
    actionLink: string;
    isNewUser: boolean;
    userEmail?: string;
    tempPassword?: string;
    userName?: string;
}

export const InviteEmail = ({
    courseTitle,
    actionLink,
    isNewUser,
    userEmail,
    tempPassword,
    userName,
}: InviteEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>You have been registered for {courseTitle}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[28px] font-bold text-center p-0 my-[20px] mx-0">
                            {courseTitle}
                            <br />
                            Access Granted
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {userName || "there"},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Welcome to Corne Labs School — and congratulations, you've been enrolled in <strong>{courseTitle}</strong>. We're excited to have you begin this journey with us.
                        </Text>

                        {isNewUser ? (
                            <>
                                <Text className="text-black text-[14px] leading-[24px]">
                                    Your account has been created. You can log in using the credentials below:
                                </Text>
                                <Section className="bg-[#2d2d2d] rounded-[8px] p-[24px] my-[24px]">
                                    <Text className="text-white text-[16px] leading-[24px] m-0 mb-2">
                                        <strong>Email:</strong> <span className="text-[#3b82f6] underline">{userEmail}</span>
                                    </Text>
                                    <Text className="text-white text-[16px] leading-[24px] m-0">
                                        <strong>Temporary Password:</strong> {tempPassword}
                                    </Text>
                                </Section>
                                <Text className="text-black text-[14px] leading-[24px]">
                                    Please keep your temporary password secure and log in to change your password immediately in your <strong>Settings</strong> page.
                                </Text>
                            </>
                        ) : (
                            <Text className="text-black text-[14px] leading-[24px]">
                                You can now access the course materials from your dashboard using your existing account.
                            </Text>
                        )}

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-6 py-3"
                                href={actionLink}
                            >
                                {isNewUser ? "Log In & Access Course" : "Go to Course"}
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            If you need any help with access, content, or scheduling, contact: <a href="mailto:hello@cornelabs.com" className="text-[#10b981] font-medium no-underline">hello@cornelabs.com</a> or reply to this email.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px] my-[16px]">
                            See you in Module 1.
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Happy learning,
                            <br />
                            Corne Labs Learning Team
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default InviteEmail;
