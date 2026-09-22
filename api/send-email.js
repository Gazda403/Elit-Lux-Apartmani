/**
 * Vercel Serverless Function & Node Handler: /api/send-email
 * Sends booking inquiries to cicovicluka6@gmail.com using Resend API.
 * Sets reply_to header to the guest's email address so clicking "Reply" answers the guest directly.
 */

// Simple helper to load .env in local development if not already populated
if (!process.env.RESEND_API_KEY) {
  try {
    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.slice(0, idx).trim();
          const val = trimmed.slice(idx + 1).trim();
          if (!process.env[key]) process.env[key] = val;
        }
      });
    }
  } catch (err) {
    // Ignore local .env loading errors
  }
}

module.exports = async function handler(req, res) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO_EMAIL = process.env.TO_EMAIL || 'cicovicluka6@gmail.com';
  const FROM_EMAIL = process.env.FROM_EMAIL || 'Lux Apartmani <onboarding@resend.dev>';

  // Setup CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Method not allowed. Only POST is supported.' }));
  }

  if (!RESEND_API_KEY) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'RESEND_API_KEY is not configured.',
      message: 'Please add RESEND_API_KEY in Vercel Dashboard -> Project Settings -> Environment Variables.'
    }));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        body = {};
      }
    }
    body = body || {};

    const guestName = (body.guestName || body.name || '').trim();
    const guestEmail = (body.guestEmail || body.email || '').trim();
    const guestPhone = (body.guestPhone || body.phone || '').trim();
    const apartment = (body.apartment || body.penthouseSelect || body.selectedApartment || 'Elit Lux Apartman').trim();
    const checkInDate = (body.checkInDate || body.checkIn || 'Nije naznačeno').trim();
    const checkOutDate = (body.checkOutDate || body.checkOut || 'Nije naznačeno').trim();
    const nights = (body.nights || '').trim();
    const totalPrice = (body.totalPrice || '').trim();
    const specialNotes = (body.specialNotes || body.notes || 'Nema posebnih napomena').trim();
    const pageSource = (body.pageSource || 'Glavna stranica').trim();

    if (!guestName) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Molimo unesite Vaše ime i prezime.' }));
    }

    if (!guestEmail && !guestPhone) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ error: 'Molimo unesite email adresu ili broj telefona za kontakt.' }));
    }

    // Clean phone for WhatsApp links
    const cleanPhone = guestPhone.replace(/[^0-9]/g, '');

    // Current date & time for reference
    const timestamp = new Date().toLocaleString('sr-RS', {
      timeZone: 'Europe/Sarajevo',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const subject = `🏨 Novi Upit: ${apartment} — ${guestName}`;

    // Luxury HTML Email Template
    const html = `
<!DOCTYPE html>
<html lang="sr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Novi Upit za Rezervaciju</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f3ef; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1a1a1c;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f4f3ef; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1px solid #e8e4da;">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #0d0d0f; padding: 36px 32px; text-align: center; border-bottom: 2px solid #C2A26F;">
              <span style="letter-spacing: 4px; font-size: 11px; text-transform: uppercase; color: #C2A26F; font-weight: 700; display: block; margin-bottom: 8px;">PALE &bull; JAHORINA</span>
              <h1 style="color: #F6F4EE; font-size: 24px; margin: 0; font-weight: 600; letter-spacing: 0.5px;">ELIT LUX APARTMANI</h1>
              <p style="color: #9c9a92; font-size: 13px; margin: 8px 0 0; letter-spacing: 0.2px;">Novi upit za rezervaciju sa web stranice</p>
            </td>
          </tr>

          <!-- Quick Guest Info Callout -->
          <tr>
            <td style="padding: 28px 32px 10px;">
              <div style="background-color: #faf9f6; border-left: 4px solid #C2A26F; border-radius: 6px; padding: 18px 20px;">
                <p style="margin: 0 0 6px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #8F8C84; font-weight: 600;">Gost</p>
                <h2 style="margin: 0; font-size: 20px; color: #121214;">${guestName}</h2>
                <div style="margin-top: 10px; font-size: 14px; line-height: 1.6;">
                  ${guestEmail ? `<div>✉ <strong>Email:</strong> <a href="mailto:${guestEmail}" style="color: #121214; text-decoration: underline;">${guestEmail}</a></div>` : ''}
                  ${guestPhone ? `<div>📞 <strong>Telefon / WhatsApp:</strong> <a href="tel:${guestPhone}" style="color: #121214; text-decoration: underline;">${guestPhone}</a></div>` : ''}
                </div>
              </div>
            </td>
          </tr>

          <!-- Reservation Details Table -->
          <tr>
            <td style="padding: 10px 32px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse; margin-top: 15px;">
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px; width: 40%;">Izabrani Smještaj</td>
                  <td style="padding: 12px 0; color: #121214; font-size: 14px; font-weight: 600;">${apartment}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px;">Datum Dolaska (Check-In)</td>
                  <td style="padding: 12px 0; color: #121214; font-size: 14px; font-weight: 600;">📅 ${checkInDate}</td>
                </tr>
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px;">Datum Odlaska (Check-Out)</td>
                  <td style="padding: 12px 0; color: #121214; font-size: 14px; font-weight: 600;">📅 ${checkOutDate}</td>
                </tr>
                ${nights ? `
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px;">Broj Noćenja</td>
                  <td style="padding: 12px 0; color: #121214; font-size: 14px; font-weight: 600;">🌙 ${nights} noćenja</td>
                </tr>` : ''}
                ${totalPrice ? `
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px;">Okvirni Iznos</td>
                  <td style="padding: 12px 0; color: #1f382b; font-size: 15px; font-weight: 700;">💶 ${totalPrice}</td>
                </tr>` : ''}
                <tr style="border-bottom: 1px solid #eeece6;">
                  <td style="padding: 12px 0; color: #76736a; font-size: 13px; vertical-align: top;">Posebni Zahtjevi / Poruka</td>
                  <td style="padding: 12px 0; color: #121214; font-size: 14px; line-height: 1.5;">${specialNotes}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; color: #76736a; font-size: 12px;">Izvor</td>
                  <td style="padding: 12px 0; color: #8F8C84; font-size: 12px;">${pageSource} &bull; ${timestamp}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Action Buttons -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  ${guestEmail ? `
                  <td style="padding: 6px 6px 6px 0;">
                    <a href="mailto:${guestEmail}?subject=Re:%20Va%C5%A1%20upit%20za%20Elit%20Lux%20Apartmane%20(${encodeURIComponent(apartment)})" style="display: block; text-align: center; background-color: #0d0d0f; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">
                      ✉ Odgovori Gostu (Email)
                    </a>
                  </td>` : ''}
                  ${cleanPhone ? `
                  <td style="padding: 6px 0 6px 6px;">
                    <a href="https://wa.me/${cleanPhone}" style="display: block; text-align: center; background-color: #25D366; color: #ffffff; text-decoration: none; padding: 14px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; letter-spacing: 0.3px;">
                      💬 WhatsApp Poruka
                    </a>
                  </td>` : ''}
                </tr>
              </table>
              <p style="margin: 16px 0 0; font-size: 11px; color: #8F8C84; text-align: center;">
                💡 <em>Savjet: Dovoljno je da u svom Gmail-u kliknete standardno dugme <strong>Reply</strong>, i Vaš odgovor će automatski otići gostu na <strong>${guestEmail || guestPhone}</strong>.</em>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #faf9f6; padding: 20px 32px; text-align: center; border-top: 1px solid #eeece6; font-size: 11px; color: #9c9a92;">
              Elit Lux Apartmani &bull; Pale &amp; Jahorina &bull; +387 65 449 068 &bull; <a href="https://www.elitlux.ba" style="color: #9c9a92; text-decoration: underline;">elitlux.ba</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // Plaintext fallback
    const text = `
NOVI UPIT ZA REZERVACIJU — ELIT LUX APARTMANI
==============================================
Gost: ${guestName}
Email: ${guestEmail || 'Nije unesen'}
Telefon / WhatsApp: ${guestPhone || 'Nije unesen'}
Apartman: ${apartment}
Check-In: ${checkInDate}
Check-Out: ${checkOutDate}
Noćenja: ${nights || 'Nije naznačeno'}
Okvirna cijena: ${totalPrice || 'Nije naznačeno'}
Posebni zahtjevi: ${specialNotes}
Izvor: ${pageSource} (${timestamp})

* Za odgovor gostu, samo kliknite Reply u Gmail-u (email gosta je postavljen kao Reply-To).
    `.trim();

    // Payload for Resend API
    const resendPayload = {
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      subject: subject,
      html: html,
      text: text
    };

    // If guest provided an email, set reply_to so clicking "Reply" in Gmail answers the guest directly!
    if (guestEmail && guestEmail.includes('@')) {
      resendPayload.reply_to = guestEmail;
    }

    // Call Resend API via native fetch
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(resendPayload)
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', resendData);
      res.statusCode = resendRes.status || 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: resendData.message || 'Greška pri slanju emaila preko Resend servisa.',
        details: resendData
      }));
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      message: 'Upit je uspješno proslijeđen!',
      id: resendData.id
    }));

  } catch (error) {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: 'Došlo je do greške na serveru prilikom obrade upita.',
      message: error.message
    }));
  }
};
