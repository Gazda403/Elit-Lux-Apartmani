/**
 * Lux Apartmani — Client-Side Inquiry Handler
 * Submits inquiries to /api/send-email (Resend integration)
 */

// Helper to display status banner
function showFormStatus(statusEl, isSuccess, messageHtml) {
  if (!statusEl) return;
  statusEl.style.display = 'block';
  statusEl.style.marginTop = '14px';
  statusEl.style.padding = '14px 18px';
  statusEl.style.borderRadius = '8px';
  statusEl.style.fontSize = '0.9rem';
  statusEl.style.lineHeight = '1.5';
  statusEl.style.textAlign = 'center';

  if (isSuccess) {
    statusEl.style.background = '#f0fdf4';
    statusEl.style.color = '#166534';
    statusEl.style.border = '1px solid #86efac';
  } else {
    statusEl.style.background = '#fef2f2';
    statusEl.style.color = '#991b1b';
    statusEl.style.border = '1px solid #f87171';
  }
  statusEl.innerHTML = messageHtml;
}

// 1. Main Booking Form (index.html, bs.html, en.html)
async function submitBookingForm(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('bookingFormStatus');
  const isEn = document.documentElement.lang === 'en';

  const guestName = document.getElementById('guestName')?.value || '';
  const guestEmail = document.getElementById('guestEmail')?.value || '';
  const guestPhone = document.getElementById('guestPhone')?.value || '';
  const checkInDate = document.getElementById('checkInDate')?.value || '';
  const checkOutDate = document.getElementById('checkOutDate')?.value || '';
  const apartment = document.getElementById('penthouseSelect')?.value || 'Apartman 1 Elit Lux';
  const specialNotes = document.getElementById('specialNotes')?.value || '';
  const nights = document.getElementById('calcNights')?.textContent || '';
  const calcTotal = document.getElementById('calcTotal')?.textContent || '';
  const totalPrice = calcTotal && calcTotal !== '0' ? `${calcTotal} €` : '';

  if (!guestName || !guestEmail) {
    showFormStatus(
      statusEl,
      false,
      isEn
        ? 'Please provide your full name and email address.'
        : 'Molimo popunite Vaše ime i email adresu.'
    );
    return;
  }

  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';
  submitBtn.innerHTML = isEn ? '<span>⏳ Transmitting...</span>' : '<span>⏳ Slanje upita...</span>';
  if (statusEl) statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName,
        guestEmail,
        guestPhone,
        checkInDate,
        checkOutDate,
        apartment,
        specialNotes,
        nights,
        totalPrice,
        pageSource: document.title || (isEn ? 'Home (EN)' : 'Glavna stranica (BS)')
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showFormStatus(
        statusEl,
        true,
        isEn
          ? `<strong>✓ Thank you, ${guestName}!</strong><br>Your reservation inquiry for <em>${apartment}</em> has been transmitted. Luka / concierge will reply shortly to <strong>${guestEmail}</strong>.`
          : `<strong>✓ Hvala Vam, ${guestName}!</strong><br>Vaš upit za <em>${apartment}</em> je uspješno poslat. Luka / concierge tim će Vam odgovoriti u najkraćem roku na <strong>${guestEmail}</strong>.`
      );
      form.reset();
      const stayDurationInfo = document.getElementById('stayDurationInfo');
      if (stayDurationInfo) stayDurationInfo.style.display = 'none';
      const calcPanel = document.getElementById('priceCalcPanel');
      if (calcPanel) calcPanel.classList.remove('visible');
    } else {
      throw new Error(data.error || 'Greška pri slanju');
    }
  } catch (err) {
    console.error('Inquiry error:', err);
    showFormStatus(
      statusEl,
      false,
      isEn
        ? `<strong>✕ An error occurred.</strong><br>Please contact our concierge directly via phone / Viber: <a href="tel:+38765449068" style="color:inherit;font-weight:700;">+387 65 449 068</a>`
        : `<strong>✕ Došlo je do greške.</strong><br>Molimo kontaktirajte nas direktno na telefon / Viber: <a href="tel:+38765449068" style="color:inherit;font-weight:700;">+387 65 449 068</a>`
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.innerHTML = originalBtnText;
  }
}

// 2. Pale Booking Form (smjestaj-pale.html)
async function handlePaleBooking(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('paleStatus');

  const apt = document.getElementById('selectedApartment')?.value || '';
  const inDate = document.getElementById('checkInDate')?.value || '';
  const outDate = document.getElementById('checkOutDate')?.value || '';
  const name = document.getElementById('guestName')?.value || '';
  const phone = document.getElementById('guestPhone')?.value || '';
  const email = document.getElementById('guestEmail')?.value || '';
  const nightsCount = document.getElementById('nightsCount')?.textContent || '';

  if (!name || (!phone && !email)) {
    showFormStatus(statusEl, false, 'Molimo unesite Vaše ime i kontakt telefon ili email.');
    return;
  }

  const origBtn = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';
  submitBtn.innerHTML = '⏳ Slanje upita...';
  if (statusEl) statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        apartment: apt,
        checkInDate: inDate,
        checkOutDate: outDate,
        nights: nightsCount,
        pageSource: 'Smještaj Pale (smjestaj-pale.html)'
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showFormStatus(
        statusEl,
        true,
        `<strong>✓ Hvala Vam, ${name}!</strong><br>Vaš upit za <em>${apt}</em> (${inDate} — ${outDate}) je uspješno poslat. Luka će Vas kontaktirati u najkraćem roku na ${phone || email}.`
      );
      form.reset();
      const badge = document.getElementById('nightsBadge');
      if (badge) badge.style.display = 'none';
    } else {
      throw new Error(data.error || 'Greška pri slanju');
    }
  } catch (err) {
    console.error('Pale inquiry error:', err);
    showFormStatus(
      statusEl,
      false,
      `<strong>✕ Došlo je do greške.</strong><br>Molimo kontaktirajte nas direktno na telefon / Viber: <a href="tel:+38765449068" style="color:inherit;font-weight:700;">+387 65 449 068</a>`
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.innerHTML = origBtn;
  }
}

// 3. Jahorina Booking Form (smjestaj-jahorina.html)
async function handleJahorinaBooking(e) {
  e.preventDefault();
  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const statusEl = document.getElementById('jahorinaStatus');

  const apt = document.getElementById('selectedPenthouse')?.value || '';
  const inDate = document.getElementById('checkInDate')?.value || '';
  const outDate = document.getElementById('checkOutDate')?.value || '';
  const name = document.getElementById('guestName')?.value || '';
  const phone = document.getElementById('guestPhone')?.value || '';
  const email = document.getElementById('guestEmail')?.value || '';
  const nightsCount = document.getElementById('nightsCount')?.textContent || '';

  if (!name || (!phone && !email)) {
    showFormStatus(statusEl, false, 'Molimo unesite Vaše ime i kontakt telefon ili email.');
    return;
  }

  const origBtn = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.style.opacity = '0.7';
  submitBtn.innerHTML = '⏳ Slanje upita...';
  if (statusEl) statusEl.style.display = 'none';

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guestName: name,
        guestPhone: phone,
        guestEmail: email,
        apartment: apt,
        checkInDate: inDate,
        checkOutDate: outDate,
        nights: nightsCount,
        pageSource: 'Smještaj Jahorina (smjestaj-jahorina.html)'
      })
    });

    const data = await res.json();

    if (res.ok && data.success) {
      showFormStatus(
        statusEl,
        true,
        `<strong>✓ Hvala Vam, ${name}!</strong><br>Vaš upit za <em>${apt}</em> (${inDate} — ${outDate}) na Jahorini je uspješno poslat. Luka će Vas kontaktirati u najkraćem roku na ${phone || email}.`
      );
      form.reset();
      const badge = document.getElementById('nightsBadge');
      if (badge) badge.style.display = 'none';
    } else {
      throw new Error(data.error || 'Greška pri slanju');
    }
  } catch (err) {
    console.error('Jahorina inquiry error:', err);
    showFormStatus(
      statusEl,
      false,
      `<strong>✕ Došlo je do greške.</strong><br>Molimo kontaktirajte nas direktno na telefon / Viber: <a href="tel:+38765449068" style="color:inherit;font-weight:700;">+387 65 449 068</a>`
    );
  } finally {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.innerHTML = origBtn;
  }
}
