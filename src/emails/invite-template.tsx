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
}

export const InviteEmail = ({
    courseTitle,
    actionLink,
    isNewUser,
}: InviteEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>You have been registered for {courseTitle}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            <strong>{courseTitle}</strong> Access Granted
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello,
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            You have been registered for the course <strong>{courseTitle}</strong>.
                        </Text>

                        {isNewUser ? (
                            <Text className="text-black text-[14px] leading-[24px]">
                                Your account has been created. Please click the button below to secure your account and set your password.
                            </Text>
                        ) : (
                            <Text className="text-black text-[14px] leading-[24px]">
                                You can now access the course materials from your dashboard.
                            </Text>
                        )}

                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Button
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={actionLink}
                            >
                                {isNewUser ? "Set Password & detailed Login" : "Go to Course"}
                            </Button>
                        </Section>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Happy learning!
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default InviteEmail;
