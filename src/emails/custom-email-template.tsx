import {
    Body,
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

interface CustomEmailProps {
    subject: string;
    content: string;
}

export const CustomEmail = ({
    subject,
    content,
}: CustomEmailProps) => {
    return (
        <Html>
            <Head />
            <Preview>{subject}</Preview>
            <Tailwind>
                <Body className="bg-white my-auto mx-auto font-sans">
                    <Container className="border border-solid border-[#eaeaea] rounded my-[40px] mx-auto p-[20px] max-w-[465px]">
                        <Heading className="text-black text-[24px] font-normal text-center p-0 my-[30px] mx-0">
                            <strong>Corne Labs School</strong>
                        </Heading>

                        <Section className="my-[20px]">
                            {content.split('\n').map((line, i) => (
                                <Text key={i} className="text-black text-[14px] leading-[24px] my-[10px]">
                                    {line}
                                </Text>
                            ))}
                        </Section>

                        <Text className="text-black text-[14px] leading-[24px] mt-[32px] border-t border-[#eaeaea] pt-[20px]">
                            Best regards,
                            <br />
                            Corne Labs Learning Team
                        </Text>
                    </Container>
                </Body>
            </Tailwind>
        </Html>
    );
};

export default CustomEmail;
