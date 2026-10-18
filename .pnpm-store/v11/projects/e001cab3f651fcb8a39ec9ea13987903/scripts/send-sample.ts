import dotenv from 'dotenv';
dotenv.config();
import { sendRegistrationNotification, sendEmailAlert, sendSmsAlert } from '../src/services/notificationService.js';

async function main() {
  const recipientEmail = 'jisonsebastian444@gmail.com';
  const recipientPhone = '+916238525147';
  const recipientName = 'Jison Sebastian';

  console.log('=====================================================');
  console.log(`[TEST DISPATCH] Target: ${recipientName}`);
  console.log(`Email: ${recipientEmail}`);
  console.log(`Phone: ${recipientPhone}`);
  console.log('=====================================================\n');

  // 1. Send Registration Welcome Messages (Email & SMS)
  console.log('[1/2] Sending Registration Welcome Messages...');
  const regResult = await sendRegistrationNotification({
    name: recipientName,
    email: recipientEmail,
    phone: recipientPhone,
    role: 'donor',
    bloodGroup: 'O+',
  });
  console.log('Registration Welcome Dispatch Result:', JSON.stringify(regResult, null, 2));

  // 2. Send Emergency Alert (Code Red) Messages (Email & SMS)
  console.log('\n[2/2] Sending Code Red Emergency Alert Messages...');

  const alertSubject = '🚨 CODE RED: Emergency Blood Donation Match at Kasturba Hospital, Manipal';
  const alertHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #0f172a; color: #f8fafc; border-radius: 12px; border: 1px solid #1e293b;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #f43f5e; margin: 0; font-size: 24px;">RaktaRun Emergency Network</h1>
        <p style="color: #fda4af; font-size: 13px; margin: 4px 0 0 0;">Coastal Karnataka Trauma Response Grid</p>
      </div>

      <p style="font-size: 15px; color: #cbd5e1;">Dear <strong>${recipientName}</strong>,</p>
      <p style="font-size: 14px; color: #cbd5e1; line-height: 1.6;">
        A critical emergency blood request has been broadcasted by <strong>Kasturba Hospital, Manipal</strong>.
        As a medically screened compatible donor, your prompt response is urgently requested.
      </p>

      <div style="background-color: #1e293b; padding: 18px; border-radius: 8px; margin: 20px 0; border: 1px solid #334155;">
        <p style="margin: 6px 0; font-size: 14px;"><strong>Hospital:</strong> Kasturba Hospital, Manipal</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Blood Group Required:</strong> <span style="color: #f43f5e; font-size: 18px; font-weight: bold;">O+</span> (Whole Blood)</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Urgency Priority:</strong> <span style="color: #ef4444; font-weight: bold;">🚨 CODE RED TRAUMA</span></p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Distance from Base:</strong> ~4.5 km (Est. Drive: ~11 mins)</p>
        <p style="margin: 6px 0; font-size: 14px;"><strong>Department:</strong> Emergency Trauma ICU, Bed 4</p>
      </div>

      <div style="text-align: center; margin: 28px 0;">
        <a href="http://localhost:5173/live-tracking/req_emergency_demo" style="background-color: #e11d48; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block;">
          Accept Donation &amp; Open Turn-by-Turn GPS Navigation
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
      <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">RaktaRun Emergency Network • Powered by Brevo</p>
    </div>
  `;

  const emailRes = await sendEmailAlert(
    recipientEmail,
    recipientName,
    alertSubject,
    alertHtml
  );
  console.log('Emergency Email Alert Result:', JSON.stringify(emailRes, null, 2));

  const smsText = '🚨 CODE RED: RaktaRun Match! O+ Whole Blood needed at Kasturba Hospital, Manipal (~4.5km, ETA ~11m). Turn-by-turn navigation ready: https://lifepulse.in/live-tracking/req_emergency_demo';
  const smsRes = await sendSmsAlert(recipientPhone, smsText);
  console.log('Emergency SMS Alert Result:', JSON.stringify(smsRes, null, 2));

  console.log('\n=====================================================');
  console.log('[TEST DISPATCH COMPLETED SUCCESSFULLY]');
  console.log('=====================================================');
}

main().catch(console.error);

