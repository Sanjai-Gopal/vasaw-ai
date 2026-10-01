export function generateBookCallButton(businessName: string, previewUrl: string): string {
  return `
<div id="vasaw-book-call" style="position: fixed; bottom: 24px; right: 24px; z-index: 99999;">
  <button onclick="vasawOpenBooking()" style="background: #0f172a; color: white; border: none; padding: 16px 28px; border-radius: 50px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.3); display: flex; align-items: center; gap: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; transition: transform 0.2s, box-shadow 0.2s;">
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
    </svg>
    Book a Free Strategy Call
  </button>
</div>

<div id="vasaw-booking-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 100000; align-items: center; justify-content: center;">
  <div style="background: white; border-radius: 16px; padding: 40px; max-width: 480px; width: 90%; box-shadow: 0 20px 60px rgba(0,0,0,0.2); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <h3 style="margin: 0 0 8px; font-size: 24px; color: #0f172a;">Book Your Free Strategy Call</h3>
    <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Get personalized advice about ${businessName}'s online presence. No obligation.</p>

    <form onsubmit="vasawSubmitBooking(event)" style="display: flex; flex-direction: column; gap: 16px;">
      <input type="text" name="name" placeholder="Your Name" required style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
      <input type="email" name="email" placeholder="Email Address" required style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
      <input type="tel" name="phone" placeholder="Phone Number" required style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
      <select name="time" required style="padding: 14px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px;">
        <option value="">Preferred Time</option>
        <option value="morning">Morning (9am - 12pm)</option>
        <option value="afternoon">Afternoon (12pm - 4pm)</option>
        <option value="evening">Evening (4pm - 7pm)</option>
      </select>
      <button type="submit" style="background: #0f172a; color: white; border: none; padding: 16px; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer;">
        Confirm Booking
      </button>
    </form>

    <button onclick="vasawCloseBooking()" style="position: absolute; top: 16px; right: 16px; background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8;">&times;</button>
  </div>
</div>

<script>
function vasawOpenBooking() {
  document.getElementById('vasaw-booking-modal').style.display = 'flex';
}

function vasawCloseBooking() {
  document.getElementById('vasaw-booking-modal').style.display = 'none';
}

function vasawSubmitBooking(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);

  fetch('https://your-api-endpoint.com/api/book-call', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: data.get('name'),
      email: data.get('email'),
      phone: data.get('phone'),
      time: data.get('time'),
      business: '${businessName}',
      preview_url: '${previewUrl}',
      source: 'website_widget'
    })
  })
  .then(r => r.json())
  .then(() => {
    document.getElementById('vasaw-booking-modal').innerHTML = '<div style="text-align: center; padding: 40px;"><h3 style="color: #0f172a; margin: 0 0 12px;">Booking Confirmed!</h3><p style="color: #64748b; margin: 0;">We will call you within 2 hours during business hours.</p></div>';
    setTimeout(() => vasawCloseBooking(), 3000);
  })
  .catch(() => {
    alert('Something went wrong. Please try again or email us at strategy@vasawdigital.com');
  });
}
</script>
  `.trim();
}

export function injectBookCallButton(html: string, businessName: string, previewUrl: string): string {
  const button = generateBookCallButton(businessName, previewUrl);
  return html.replace('</body>', `${button}</body>`);
}