// Rely on native global fetch available in Node 18+

/**
 * Sends a WhatsApp message using UltraMsg API.
 * @param {Object} options - Sending options
 * @param {string} options.to - Recipient phone number (international format, e.g. 919703040756)
 * @param {string} options.body - Message body content
 */
export const sendWhatsAppMessage = async ({ to, body }) => {
  const apiUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;

  if (!apiUrl || !token) {
    console.warn('WhatsApp API credentials are not configured. Skipping WhatsApp send.');
    return { success: false, error: 'WhatsApp credentials not configured' };
  }

  // Ensure recipient phone is formatted correctly (digits only, e.g., 919703040756)
  let formattedTo = to.replace(/\D/g, '');
  if (formattedTo.length === 10) {
    formattedTo = '91' + formattedTo;
  }

  try {
    const response = await fetch(`${apiUrl}/messages/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        token,
        to: formattedTo,
        body,
        priority: 5 // General priority
      })
    });

    const data = await response.json();
    if (response.ok) {
      console.log(`WhatsApp message sent successfully to ${formattedTo}. Message ID: ${data.id || data.msgId || 'unknown'}`);
      return { success: true, data };
    } else {
      console.error(`UltraMsg API error:`, data);
      return { success: false, error: data.message || 'Failed to send message via UltraMsg' };
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return { success: false, error: error.message };
  }
};
