/**
 * Snippe Payments API Integration Utility (2026-01-25 API Spec)
 * Docs: https://docs.snippe.sh/docs/2026-01-25
 */

const SNIPPE_BASE_URL = 'https://api.snippe.sh';

/**
 * Normalizes Tanzanian phone numbers to 255XXXXXXXXX format
 * @param {string} phone
 * @returns {string}
 */
export function normalizePhone(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '255' + cleaned.slice(1);
  } else if (cleaned.startsWith('255')) {
    // already 255
  } else if (cleaned.length === 9) {
    cleaned = '255' + cleaned;
  }
  return cleaned;
}

/**
 * Trigger a Mobile Money Payment via Snippe API
 * @param {Object} params
 * @param {string} params.apiKey - Bearer token for Snippe
 * @param {number} params.amount - Amount in TZS (min 500 TZS)
 * @param {string} params.phone - Customer phone number
 * @param {string} params.customerName - Customer full name
 * @param {string} [params.customerEmail] - Customer email (optional)
 * @param {string} params.orderId - Unique order reference ID
 * @returns {Promise<{ success: boolean, reference?: string, message?: string, data?: any }>}
 */
export async function createMobilePayment({ apiKey, amount, phone, customerName, customerEmail, orderId }) {
  if (!apiKey) {
    return { success: false, message: 'Funguo ya Snippe API (API Key) haijawekwa kwenye mipangilio.' };
  }

  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone || normalizedPhone.length !== 12) {
    return { success: false, message: 'Namba ya simu siyo sahihi (Lazima iwe 07XXXXXXXX au 2557XXXXXXXX).' };
  }

  const nameParts = (customerName || 'Mteja Duka').trim().split(' ');
  const firstname = nameParts[0] || 'Mteja';
  const lastname = nameParts.slice(1).join(' ') || 'NyamaFresh';
  const email = customerEmail || `${normalizedPhone}@nyamafresh.co.tz`;

  const payload = {
    payment_type: 'mobile',
    details: {
      amount: Math.max(500, Math.round(amount)),
      currency: 'TZS',
    },
    phone_number: normalizedPhone,
    customer: {
      firstname,
      lastname,
      email,
    },
    metadata: {
      order_id: orderId || `ORD-${Date.now()}`,
      source: 'Nyama Fresh Storefront',
    },
  };

  try {
    const res = await fetch(`${SNIPPE_BASE_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `${orderId}_${Date.now()}`,
      },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errMsg = json?.message || json?.error || `Snippe error ${res.status}`;
      return { success: false, message: `Push ya malipo imefeli: ${errMsg}`, data: json };
    }

    return {
      success: true,
      reference: json?.reference || json?.data?.reference || json?.id || orderId,
      message: 'Ombi la malipo limetumwa kwenye simu ya mteja (USSD Push). Subiri athibitishe PIN.',
      data: json,
    };
  } catch (err) {
    console.error('[Snippe API] Request error:', err);
    return {
      success: false,
      message: `Imeshindwa kuunganisha na Snippe Server (${err.message}). Angalia intaneti au API Key.`,
    };
  }
}

/**
 * Check payment status by Reference
 * @param {Object} params
 * @param {string} params.apiKey
 * @param {string} params.reference
 * @returns {Promise<{ success: boolean, status?: string, message?: string, data?: any }>}
 */
export async function checkPaymentStatus({ apiKey, reference }) {
  if (!apiKey || !reference) {
    return { success: false, message: 'API Key au Reference inakosekana.' };
  }

  try {
    const res = await fetch(`${SNIPPE_BASE_URL}/v1/payments/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return { success: false, message: json?.message || 'Imeshindwa kupata hali ya malipo.', data: json };
    }

    const status = json?.status || json?.data?.status || 'completed';
    return {
      success: true,
      status,
      message: `Hali ya malipo #${reference}: ${status}`,
      data: json,
    };
  } catch (err) {
    return { success: false, message: err.message };
  }
}

/**
 * Test Snippe API Key validity
 * @param {string} apiKey
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function testSnippeConnection(apiKey) {
  if (!apiKey) {
    return { success: false, message: 'Tafadhali ingiza API Key kwanza.' };
  }

  try {
    const res = await fetch(`${SNIPPE_BASE_URL}/v1/payments?limit=1`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { success: false, message: 'API Key siyo sahihi au imezuiwa (401 Unauthorized).' };
    }

    return { success: true, message: 'Uunganishaji wa Snippe API umefanikiwa kikamilifu! (200 OK)' };
  } catch (err) {
    return { success: false, message: `Hitilafu ya mtandao: ${err.message}` };
  }
}
