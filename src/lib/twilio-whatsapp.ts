import twilio from "twilio";

/**
 * Normalize phone to E.164 for WhatsApp.
 * Assumes Indian numbers if no country code.
 */
export function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("6") === false) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  return phone.startsWith("+") ? phone : `+${digits}`;
}

export type SendWhatsAppOptions = {
  to: string;
  body: string;
};

/**
 * Send a WhatsApp message via Twilio.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM (e.g. whatsapp:+14155238886 for sandbox)
 */
export async function sendWhatsApp({ to, body }: SendWhatsAppOptions): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+14155238886";

  if (!accountSid || !authToken) {
    throw new Error("Twilio is not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)");
  }

  const client = twilio(accountSid, authToken);
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${toE164(to)}`;

  const message = await client.messages.create({
    from,
    to: toWhatsApp,
    body,
  });

  return { sid: message.sid };
}
