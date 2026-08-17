require('dotenv').config();
const xlsx = require('xlsx');
const { EmailClient } = require('@azure/communication-email');

const EXCEL_PATH = 'C:\\Users\\wisdo\\Downloads\\Child List.xlsx';
const ACS_CONNECTION_STRING = process.env.AZURE_COMMUNICATION_SERVICES_CONNECTION_STRING;
const SENDER_ADDRESS = process.env.AZURE_EMAIL_SENDER || 'DoNotReply@6e4fe926-0f85-412b-afef-0fb9c4d89667.azurecomm.net';
const CHURCH_NAME = 'Green Valley Alliance';

function cleanPhone(phone) {
  if (!phone) return '';
  return String(phone).replace(/\D/g, '');
}

function formatPhone(digits) {
  if (!digits || digits.length < 10) return digits || '';
  const d = digits.slice(-10);
  return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
}

function excelDateToJSDate(serial) {
  if (!serial) return null;
  if (typeof serial === 'string' && serial.includes('/')) {
    const d = new Date(serial);
    if (!isNaN(d.getTime())) return d;
  }
  if (typeof serial === 'number' || !isNaN(Number(serial))) {
    const num = Number(serial);
    if (num > 1000) {
      const utc_days = Math.floor(num - 25569);
      const utc_value = utc_days * 86400;
      return new Date(utc_value * 1000);
    }
  }
  const parsed = new Date(serial);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateAge(dob) {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildEmailHtml(parentName, phoneFormatted, pin, childrenList) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${CHURCH_NAME} Summer Camp Fast-Pass</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:30px 15px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:580px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.06);border:1px solid #e2e8f0;">
              
              <!-- Royal Blue Gradient Church Header -->
              <tr>
                <td style="background:linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);padding:36px 28px;text-align:center;">
                  <div style="background:rgba(255,255,255,0.18);display:inline-block;padding:6px 16px;border-radius:20px;margin-bottom:12px;">
                    <span style="color:#ffffff;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">Children & Youth Ministry</span>
                  </div>
                  <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:800;letter-spacing:-0.5px;">${CHURCH_NAME}</h1>
                  <p style="color:#bfdbfe;margin:6px 0 0 0;font-size:15px;font-weight:500;">Summer Day Camp 2026</p>
                </td>
              </tr>

              <!-- Main Content Area -->
              <tr>
                <td style="padding:32px 28px;">
                  <h2 style="color:#0f172a;font-size:20px;font-weight:700;margin:0 0 12px 0;">Hello ${parentName},</h2>
                  <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px 0;">
                    We are thrilled to welcome your family tomorrow at <strong>${CHURCH_NAME}</strong>! To ensure child safety and a fast, seamless check-in experience, your family profile has been activated on our check-in kiosks.
                  </p>

                  <!-- Family Fast-Pass Box -->
                  <div style="background-color:#f8fafc;border:2px dashed #93c5fd;border-radius:14px;padding:22px;margin-bottom:26px;">
                    <div style="text-align:center;margin-bottom:16px;">
                      <span style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Your Family Fast-Pass PIN</span>
                      <div style="color:#1e3a8a;font-size:38px;font-weight:800;letter-spacing:6px;margin:6px 0;">${pin}</div>
                      <span style="color:#64748b;font-size:12px;">(Last 4 digits of your registered cell phone: ${phoneFormatted})</span>
                    </div>

                    <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;">

                    <div style="color:#334155;font-size:14px;font-weight:700;margin-bottom:10px;">Registered Campers:</div>
                    ${childrenList.map(c => `
                      <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;margin-bottom:8px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="left" style="color:#1e293b;font-weight:600;font-size:14px;">👦 ${c.name} ${c.age ? `(Age ${c.age})` : ''}</td>
                            <td align="right">
                              <span style="color:${c.hasAllergy ? '#b91c1c' : '#15803d'};font-size:12px;font-weight:600;background:${c.hasAllergy ? '#fee2e2' : '#dcfce7'};padding:3px 8px;border-radius:6px;">
                                ${c.hasAllergy ? '⚠️ ' + c.allergies : '✓ No Allergies'}
                              </span>
                            </td>
                          </tr>
                        </table>
                      </div>
                    `).join('')}
                  </div>

                  <!-- 3-Step Arrival Instructions -->
                  <h3 style="color:#0f172a;font-size:16px;font-weight:700;margin:0 0 14px 0;">How to Check In Tomorrow Morning:</h3>
                  
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom:24px;">
                    <tr>
                      <td width="36" valign="top" style="padding-bottom:14px;">
                        <div style="width:28px;height:28px;background:#3b82f6;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:13px;">1</div>
                      </td>
                      <td style="padding-left:10px;padding-bottom:14px;">
                        <div style="color:#1e293b;font-size:14px;font-weight:600;">Arrive at the Welcome Desk</div>
                        <div style="color:#64748b;font-size:13px;">Walk up to any Check-In tablet station at ${CHURCH_NAME}.</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="36" valign="top" style="padding-bottom:14px;">
                        <div style="width:28px;height:28px;background:#3b82f6;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:13px;">2</div>
                      </td>
                      <td style="padding-left:10px;padding-bottom:14px;">
                        <div style="color:#1e293b;font-size:14px;font-weight:600;">Enter Phone & PIN</div>
                        <div style="color:#64748b;font-size:13px;">Type <strong>${phoneFormatted}</strong> and PIN <strong>${pin}</strong>.</div>
                      </td>
                    </tr>
                    <tr>
                      <td width="36" valign="top;">
                        <div style="width:28px;height:28px;background:#10b981;color:#ffffff;border-radius:50%;text-align:center;line-height:28px;font-weight:700;font-size:13px;">3</div>
                      </td>
                      <td style="padding-left:10px;">
                        <div style="color:#1e293b;font-size:14px;font-weight:600;">Collect Child Name Badge & Guardian Claim Pass</div>
                        <div style="color:#64748b;font-size:13px;">Place the printed name badge on your child and keep your security claim tag for pickup.</div>
                      </td>
                    </tr>
                  </table>

                  <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px 0;">
                    If you need to update authorized pickup guardians or medical info, our camp leaders will be right there to assist you.
                  </p>

                  <p style="color:#334155;font-size:14px;font-weight:600;margin:0;">
                    Blessings & see you tomorrow,<br>
                    <span style="color:#1e3a8a;font-weight:700;">${CHURCH_NAME}</span><br>
                    <span style="color:#64748b;font-weight:normal;font-size:13px;">Children & Youth Ministry Team</span>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:20px;text-align:center;">
                  <p style="color:#94a3b8;font-size:12px;margin:0 0 4px 0;">
                    This official message was sent by <strong>${CHURCH_NAME}</strong> regarding your Summer Day Camp registration.
                  </p>
                  <p style="color:#cbd5e1;font-size:11px;margin:0;">
                    Secure Child Check-In Powered by KiddoChecker
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

async function broadcastPasses() {
  console.log(`\n======================================================`);
  console.log(`BROADCASTING SUMMER CAMP PASSES: ${CHURCH_NAME}`);
  console.log(`======================================================\n`);

  const workbook = xlsx.readFile(EXCEL_PATH);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

  // Group by unique family email
  const families = new Map();

  rows.forEach(r => {
    const rawFirst = String(r['First Name'] || '').trim();
    const rawLast = String(r['Last Name'] || '').trim();
    if (!rawFirst && !rawLast) return;

    const email = String(r['Email'] || '').trim().toLowerCase();
    const rawPhone = String(r['Cell Phone'] || '').trim();
    const phone = cleanPhone(rawPhone);
    const famKey = email || phone;

    const dob = excelDateToJSDate(r['DOB']);
    const age = calculateAge(dob);
    const rawAllergies = String(r['Does your child have any allergies or any dietary restrictions?'] || '').trim();
    const hasAllergy = rawAllergies && !/^none$/i.test(rawAllergies) && !/^n\/a$/i.test(rawAllergies) && !/^no$/i.test(rawAllergies);

    if (!families.has(famKey)) {
      // Extract first name from pickups if available
      let parentName = rawFirst;
      const pickups = String(r['Who has permission to pick up child? Name and phone number.'] || '').trim();
      if (pickups) {
        const firstWord = pickups.split(/[\s,&]/)[0].trim();
        if (firstWord && firstWord.length > 2 && isNaN(firstWord)) {
          parentName = firstWord;
        }
      }

      families.set(famKey, {
        email,
        phone,
        phoneFormatted: formatPhone(phone || rawPhone),
        parentName: `${parentName} ${rawLast}`,
        pin: phone && phone.length >= 4 ? phone.slice(-4) : '1234',
        children: []
      });
    }

    families.get(famKey).children.push({
      name: `${rawFirst} ${rawLast}`,
      age,
      hasAllergy,
      allergies: hasAllergy ? rawAllergies : 'None'
    });
  });

  console.log(`Prepared ${families.size} unique family email broadcasts.\n`);

  const client = new EmailClient(ACS_CONNECTION_STRING);
  const API_URL = 'https://ca-api-kiddo-prod-yotzp.blackpond-a683933c.centralus.azurecontainerapps.io';

  async function logToCloudDb(data) {
    try {
      const https = require('https');
      const url = new URL(`${API_URL}/api/query`);
      const body = JSON.stringify({
        table: 'email_logs',
        action: 'insert',
        data: data
      });
      const req = https.request({
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 4000
      });
      req.on('error', () => {});
      req.write(body);
      req.end();
    } catch(e) {}
  }

  let sentCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (const [key, fam] of families.entries()) {
    if (!fam.email || !fam.email.includes('@')) {
      console.log(`⚠️ Skipped family ${fam.parentName} (No valid email: "${fam.email}")`);
      skippedCount++;
      logToCloudDb({
        recipient: fam.email || 'NO_EMAIL',
        recipient_name: fam.parentName,
        subject: `🎪 ${CHURCH_NAME}: Summer Camp Family Fast-Pass & PIN`,
        template_type: 'summer_camp_fast_pass',
        status: 'failed',
        error_message: 'No valid email in roster',
        metadata: { phone: fam.phone, pin: fam.pin }
      });
      continue;
    }

    console.log(`▶ Sending Fast-Pass to ${fam.parentName} <${fam.email}> (PIN: ${fam.pin})...`);
    
    let delivered = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!delivered && attempts < maxAttempts) {
      attempts++;
      try {
        const html = buildEmailHtml(fam.parentName, fam.phoneFormatted, fam.pin, fam.children);
        const poller = await client.beginSend({
          senderAddress: SENDER_ADDRESS,
          content: {
            subject: `🎪 ${CHURCH_NAME}: Summer Camp Family Fast-Pass & PIN`,
            html: html
          },
          recipients: {
            to: [{ address: fam.email }]
          }
        });

        const res = await poller.pollUntilDone();
        console.log(`  ✓ Delivered! (ID: ${res.id}, Status: ${res.status})`);
        sentCount++;
        delivered = true;

        logToCloudDb({
          recipient: fam.email,
          recipient_name: fam.parentName,
          subject: `🎪 ${CHURCH_NAME}: Summer Camp Family Fast-Pass & PIN`,
          template_type: 'summer_camp_fast_pass',
          status: res.status === 'Succeeded' ? 'delivered' : res.status.toLowerCase(),
          message_id: res.id,
          metadata: { pin: fam.pin, phone: fam.phone, campers: fam.children.map(c => c.name) }
        });

      } catch (err) {
        if (attempts < maxAttempts) {
          console.warn(`  ⏳ Rate limit encountered for ${fam.email}. Retrying in 2.5 seconds (Attempt ${attempts}/${maxAttempts})...`);
          await sleep(2500);
        } else {
          console.error(`  ✕ Failed to send to ${fam.email} after ${maxAttempts} attempts:`, err.message);
          failedCount++;
          logToCloudDb({
            recipient: fam.email,
            recipient_name: fam.parentName,
            subject: `🎪 ${CHURCH_NAME}: Summer Camp Family Fast-Pass & PIN`,
            template_type: 'summer_camp_fast_pass',
            status: 'failed',
            error_message: err.message,
            metadata: { pin: fam.pin, phone: fam.phone }
          });
        }
      }
    }

    // 1.5 second pacing delay between families to respect Azure Communication Services rate limits
    await sleep(1500);
  }

  console.log(`\n======================================================`);
  console.log(`BROADCAST COMPLETE!`);
  console.log(`Successfully Sent: ${sentCount} / ${families.size}`);
  console.log(`Failed:            ${failedCount}`);
  console.log(`Skipped:           ${skippedCount}`);
  console.log(`======================================================\n`);
}

broadcastPasses().catch(console.error);
