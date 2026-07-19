import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from "react-email";
import * as React from "react";

interface WebhookTriggeredEmailProps {
  slug: string;
  name: string;
  method: string;
  clientIp: string;
  timestamp: string;
  headersJson: string;
  bodyJson: string;
}

export const WebhookTriggeredEmail = ({
  slug = "test-webhook",
  name = "Order Received Webhook",
  method = "POST",
  clientIp = "127.0.0.1",
  timestamp = new Date().toISOString(),
  headersJson = "{}",
  bodyJson = "{}",
}: WebhookTriggeredEmailProps) => {
  const previewText = `Webhook [${name}] Triggered Successfully`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-950 my-auto mx-auto font-sans px-2 text-slate-100">
          <Container className="border border-solid border-slate-800 rounded-lg my-[40px] mx-auto p-[30px] max-w-[550px] bg-slate-900">
            <Section className="mt-[20px] text-center">
              <Heading className="text-indigo-400 text-[24px] font-bold p-0 my-[10px] mx-0">
                Webhook Trigger Alert
              </Heading>
              <Text className="text-slate-400 text-[14px]">
                Your dynamic endpoint has successfully received and logged a request.
              </Text>
            </Section>

            <Section className="bg-slate-950 p-4 rounded-lg border border-slate-800 my-4">
              <Text className="text-white text-[14px] leading-[24px] m-0">
                <strong>Webhook Name:</strong> {name}
              </Text>
              <Text className="text-white text-[14px] leading-[24px] m-0">
                <strong>Endpoint URL Path:</strong> <code className="text-indigo-300">/api/webhooks/{slug}</code>
              </Text>
              <Text className="text-white text-[14px] leading-[24px] m-0">
                <strong>HTTP Method:</strong> <span className="bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded text-[12px] font-mono">{method}</span>
              </Text>
              <Text className="text-white text-[14px] leading-[24px] m-0">
                <strong>Client IP Address:</strong> {clientIp}
              </Text>
              <Text className="text-white text-[14px] leading-[24px] m-0">
                <strong>Timestamp:</strong> {timestamp}
              </Text>
            </Section>

            <Section className="my-4">
              <Text className="text-indigo-300 text-[13px] font-semibold uppercase tracking-wider mb-1">
                Headers
              </Text>
              <pre className="bg-black/40 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto m-0">
                {headersJson}
              </pre>
            </Section>

            <Section className="my-4">
              <Text className="text-indigo-300 text-[13px] font-semibold uppercase tracking-wider mb-1">
                Request Payload (Body)
              </Text>
              <pre className="bg-black/40 p-3 rounded border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto m-0">
                {bodyJson || "(empty)"}
              </pre>
            </Section>

            <Hr className="border border-solid border-slate-800 my-[26px] mx-0 w-full" />

            <Text className="text-slate-500 text-[12px] leading-[20px] text-center">
              This automated developer alert was sent via Resend on behalf of your Next.js Webhook Platform. You can disable these email notifications in your Webhook Dashboard configuration.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default WebhookTriggeredEmail;
