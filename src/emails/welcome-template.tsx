import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Img,
    Link,
    Preview,
    Section,
    Text,
    Tailwind,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
    studentName: string;
    courseTitle: string;
    courseUrl: string;
}

export const WelcomeEmail = ({
    studentName,
    courseTitle,
    courseUrl,
}: WelcomeEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>Welcome to {courseTitle}!</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            Welcome to <strong>{courseTitle}</strong>!
                        </Heading>
                        <Text className="text-black text-[14px] leading-[24px]">
                            Hello {studentName},
                        </Text>
                        <Text className="text-black text-[14px] leading-[24px]">
                            We're excited to have you on board. You now have full access to all the lessons and materials in this course.
                        </Text>
                        <Section className="text-center mt-[32px] mb-[32px]">
                            <Link
                                className="bg-[#000000] rounded text-white text-[12px] font-semibold no-underline text-center px-5 py-3"
                                href={courseUrl}
                            >
                                Go to Course
                            </Link>
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

export default WelcomeEmail;
