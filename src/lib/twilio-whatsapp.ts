/**
 * Normalize phone to E.164.
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

export type SendSmsOptions = {
  to: string;
  body: string;
};

/**
 * Send an SMS via Twilio.
 * Requires: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM (e.g. +16615181820)
 */
export async function sendSms({ to, body }: SendSmsOptions): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;

  if (!accountSid || !authToken) {
    throw new Error("Twilio is not configured (missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN)");
  }
  if (!from) {
    throw new Error("Twilio SMS is not configured (missing TWILIO_SMS_FROM)");
  }

  const toE164Number = to.startsWith("+") ? to : toE164(to);
  const params = new URLSearchParams();
  params.set("To", toE164Number);
  params.set("From", from.trim());
  params.set("Body", body);

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await res.text();
  let data: { sid?: string; message?: string; error_message?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    // non-JSON response, keep raw text
  }
  if (!res.ok) {
    console.error("Twilio SMS error:", res.status, text);
    const msg = data.message || data.error_message || text || res.statusText || "Twilio SMS request failed";
    throw new Error(msg);
  }

  return { sid: data.sid ?? "" };
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

  const twilio = (await import("twilio")).default;
  const client = twilio(accountSid, authToken);
  const toWhatsApp = to.startsWith("whatsapp:") ? to : `whatsapp:${toE164(to)}`;

  const message = await client.messages.create({
    from,
    to: toWhatsApp,
    body,
  });

  return { sid: message.sid };
}
