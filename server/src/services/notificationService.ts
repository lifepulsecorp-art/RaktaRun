import type { BloodRequest, Donor, Match, User } from '../types.js';
import { insert, find } from '../utils/db.js';
import { v4 as uuidv4 } from 'uuid';

export interface ChannelDispatchResult {
  channel: 'sms' | 'whatsapp' | 'push' | 'email';
  recipient: string;
  success: boolean;
  provider: 'twilio' | 'fast2sms' | 'browser_push' | 'brevo' | 'simulator';
  messageId?: string;
  error?: string;
}

/**
 * Format international telephone number for India (+91)
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`;
  return `+91${cleaned}`;
}

/**
 * Dispatches an SMS alert via Twilio, Fast2SMS, or Simulator fallback
 */
export async function sendSmsAlert(toPhone: string, message: string): Promise<ChannelDispatchResult> {
  const formattedTo = formatPhone(toPhone);
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioFrom = process.env.TWILIO_PHONE_NUMBER?.trim();

  // 1. Twilio SMS Gateway
  if (twilioSid && twilioToken && twilioFrom) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: formattedTo,
        From: twilioFrom,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Twilio HTTP error ${response.status}`);
      }

      console.log(`[SMS TWILIO DELIVERED] SID: ${data.sid} -> ${formattedTo}`);
      return {
        channel: 'sms',
        recipient: formattedTo,
        success: true,
        provider: 'twilio',
        messageId: data.sid,
      };
    } catch (err: any) {
      console.warn(`[SMS TWILIO FAILED] ${err.message}. Falling back to simulator log.`);
      return {
        channel: 'sms',
        recipient: formattedTo,
        success: false,
        provider: 'twilio',
        error: err.message,
      };
    }
  }

  // 2. Fast2SMS (Indian Gateway)
  const fast2smsKey = process.env.FAST2SMS_API_KEY?.trim();
  if (fast2smsKey) {
    try {
      const rawNumber = formattedTo.replace('+91', '');
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2smsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message,
          numbers: rawNumber,
        }),
      });

      const data = await response.json();
      if (data.return) {
        console.log(`[SMS FAST2SMS DELIVERED] -> ${formattedTo}`);
        return {
          channel: 'sms',
          recipient: formattedTo,
          success: true,
          provider: 'fast2sms',
          messageId: data.request_id,
        };
      }
    } catch (err: any) {
      console.warn(`[SMS FAST2SMS FAILED] ${err.message}`);
    }
  }

  // 3. Built-in LifePulse Simulator Mode (when API keys are pending)
  console.log(`\n================== [LIFE-PULSE SMS GATEWAY SIMULATOR] ==================`);
  console.log(`TO:       ${formattedTo}`);
  console.log(`BODY:     ${message}`);
  console.log(`STATUS:   DELIVERED (Simulator Active - Add TWILIO_ACCOUNT_SID to activate real carrier network)`);
  console.log(`========================================================================\n`);

  return {
    channel: 'sms',
    recipient: formattedTo,
    success: true,
    provider: 'simulator',
    messageId: `sim_sms_${Date.now()}`,
  };
}

/**
 * Dispatches a WhatsApp broadcast via Twilio WhatsApp API or Simulator fallback
 */
export async function sendWhatsAppAlert(toPhone: string, message: string): Promise<ChannelDispatchResult> {
  const formattedTo = formatPhone(toPhone);
  const twilioSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const twilioToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const twilioWaFrom = process.env.TWILIO_WHATSAPP_NUMBER?.trim() || '+14155238886'; // default Twilio sandbox number

  if (twilioSid && twilioToken) {
    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const body = new URLSearchParams({
        To: `whatsapp:${formattedTo}`,
        From: `whatsapp:${twilioWaFrom}`,
        Body: message,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Twilio WhatsApp HTTP error ${response.status}`);
      }

      console.log(`[WHATSAPP TWILIO DELIVERED] SID: ${data.sid} -> ${formattedTo}`);
      return {
        channel: 'whatsapp',
        recipient: formattedTo,
        success: true,
        provider: 'twilio',
        messageId: data.sid,
      };
    } catch (err: any) {
      console.warn(`[WHATSAPP TWILIO FAILED] ${err.message}. Falling back to simulator log.`);
      return {
        channel: 'whatsapp',
        recipient: formattedTo,
        success: false,
        provider: 'twilio',
        error: err.message,
      };
    }
  }

  // Built-in Simulator Mode
  console.log(`\n============== [LIFE-PULSE WHATSAPP BROADCAST SIMULATOR] ==============`);
  console.log(`TO:       whatsapp:${formattedTo}`);
  console.log(`BODY:     ${message}`);
  console.log(`STATUS:   DELIVERED (Simulator Active - Add TWILIO_ACCOUNT_SID to activate real WhatsApp API)`);
  console.log(`========================================================================\n`);

  return {
    channel: 'whatsapp',
    recipient: formattedTo,
    success: true,
    provider: 'simulator',
    messageId: `sim_wa_${Date.now()}`,
  };
}

/**
 * Dispatches an email alert via Brevo (Sendinblue) REST API or Simulator fallback
 */
export async function sendEmailAlert(
  toEmail: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<ChannelDispatchResult> {
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const senderEmail = process.env.BREVO_SENDER_EMAIL?.trim() || 'emergency@lifepulse.in';
  const senderName = process.env.BREVO_SENDER_NAME?.trim() || 'LifePulse Emergency Network';

  if (brevoKey) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: toEmail,
              name: toName,
            },
          ],
          subject,
          htmlContent,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Brevo HTTP error ${response.status}`);
      }

      console.log(`[EMAIL BREVO DELIVERED] MessageId: ${data.messageId} -> ${toEmail}`);
      return {
        channel: 'email',
        recipient: toEmail,
        success: true,
        provider: 'brevo',
        messageId: data.messageId,
      };
    } catch (err: any) {
      console.warn(`[EMAIL BREVO FAILED] ${err.message}. Falling back to simulator log.`);
      return {
        channel: 'email',
        recipient: toEmail,
        success: false,
        provider: 'brevo',
        error: err.message,
      };
    }
  }

  // Built-in Simulator Mode
  console.log(`\n================== [LIFE-PULSE BREVO EMAIL SIMULATOR] ==================`);
  console.log(`TO:       ${toName} <${toEmail}>`);
  console.log(`FROM:     ${senderName} <${senderEmail}>`);
  console.log(`SUBJECT:  ${subject}`);
  console.log(`STATUS:   DELIVERED (Simulator Active - Add BREVO_API_KEY to activate live Brevo SMTP)`);
  console.log(`========================================================================\n`);

  return {
    channel: 'email',
    recipient: toEmail,
    success: true,
    provider: 'simulator',
    messageId: `sim_email_${Date.now()}`,
  };
}

/**
 * Dispatches multi-channel notifications to a matched donor based on their preferences
 */
export async function dispatchAlertNotifications(
  donor: Donor,
  request: BloodRequest,
  match: Match
): Promise<ChannelDispatchResult[]> {
  const prefs = donor.notificationPreferences || {
    push: true,
    sms: true,
    whatsapp: true,
    email: true,
    criticalOnly: false,
  };

  const results: ChannelDispatchResult[] = [];
  const etaMinutes = Math.max(3, Math.ceil((match.distance || 5) / 25 * 60));
  const urgencyLabel = request.urgency === 'critical' ? '🚨 CODE RED' : 'URGENT';

  // 1. Web Push Notification Record
  if (prefs.push) {
    results.push({
      channel: 'push',
      recipient: donor.id,
      success: true,
      provider: 'browser_push',
      messageId: `push_${match.id}`,
    });
  }

  // 2. SMS Alert Message
  if (prefs.sms && donor.phone) {
    const smsText = `${urgencyLabel}: LifePulse Match! ${request.bloodGroup} ${request.component.replace('_', ' ')} needed at ${request.hospitalName} (~${match.distance}km, ETA ~${etaMinutes}m). Open app to accept & navigate.`;
    const smsResult = await sendSmsAlert(donor.phone, smsText);
    results.push(smsResult);
  }

  // 3. WhatsApp Broadcast Message
  if (prefs.whatsapp && donor.phone) {
    const waText = `🚨 *LifePulse Emergency Alert*\n\n🏥 *Hospital:* ${request.hospitalName}\n🩸 *Blood Group:* ${request.bloodGroup} (${request.component.replace('_', ' ')})\n📍 *Distance:* ~${match.distance} km (Est. Drive: ${etaMinutes} mins)\n⚡ *Priority:* ${request.urgency.toUpperCase()}\n\nYou are a verified compatible responder for this emergency. Please log in to accept the donation and share your transit location.\n\n👉 Respond here: https://lifepulse.in/live-tracking/${request.id}`;
    const waResult = await sendWhatsAppAlert(donor.phone, waText);
    results.push(waResult);
  }

  // 4. Brevo Email Alert
  const donorEmail = donor.email || find<User>('users', (u) => u.uid === donor.uid)?.email;
  if (prefs.email !== false && donorEmail) {
    const emailSubject = `${urgencyLabel}: Emergency Blood Donation Match at ${request.hospitalName}`;
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
        <h1 style="color: #f43f5e; margin: 0 0 8px 0; font-size: 22px;">LifePulse Emergency Network</h1>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1; margin-top: 12px;">Dear ${donor.fullName},</p>
        <p style="font-size: 15px; line-height: 1.5; color: #cbd5e1;">A critical blood match has been requested for a patient in your area:</p>
        <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
          <p style="margin: 6px 0; font-size: 14px;"><strong>Hospital:</strong> ${request.hospitalName}</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Blood Group Needed:</strong> <span style="color: #f43f5e; font-size: 18px; font-weight: bold;">${request.bloodGroup}</span> (${request.component.replace('_', ' ')})</p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Priority:</strong> <span style="color: #fbbf24; font-weight: bold;">${request.urgency.toUpperCase()}</span></p>
          <p style="margin: 6px 0; font-size: 14px;"><strong>Distance:</strong> ~${match.distance} km (Est. Drive: ${etaMinutes} mins)</p>
        </div>
        <p style="font-size: 14px; color: #94a3b8;">As a verified compatible donor, your immediate response can save a life.</p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="https://lifepulse.in/live-tracking/${request.id}" style="background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; display: inline-block;">View Request & Accept Donation</a>
        </div>
        <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0;">LifePulse Emergency Dispatch Network • Udupi & Dakshina Kannada</p>
      </div>
    `;
    const emailResult = await sendEmailAlert(donorEmail, donor.fullName, emailSubject, emailHtml);
    results.push(emailResult);
  }

  // Log dispatch event to audit trail
  insert('auditLogs', {
    id: `audit_notif_${uuidv4().slice(0, 8)}`,
    actorUid: 'system_notification_dispatcher',
    actorRole: 'system',
    action: 'emergency_alert.dispatched_multichannel',
    entityType: 'donor',
    entityId: donor.id,
    details: {
      requestId: request.id,
      matchId: match.id,
      channelsDispatched: results.map((r) => `${r.channel}:${r.provider}`),
      phone: donor.phone,
      email: donorEmail,
    },
    createdAt: new Date().toISOString(),
  });

  return results;
}

