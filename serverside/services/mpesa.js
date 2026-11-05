const BASE_URL =
  process.env.MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// ---- access token, reused until it is about to expire ----
let cachedToken = null;
let tokenExpiry = 0;

const getAccessToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const credentials = Buffer.from(
    `${process.env.CONSUMER_KEY}:${process.env.CONSUMER_SECRET}`
  ).toString("base64");

  const response = await fetch(
    `${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${credentials}` } }
  );
  if (!response.ok) throw new Error(`Token request failed (status ${response.status})`);

  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (Number(data.expires_in) - 60) * 1000;
  return cachedToken;
};

// ---- helpers ----
const getTimestamp = () =>
  new Date(Date.now() + 3 * 60 * 60 * 1000) // Kenya time (UTC+3)
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

const makePassword = (timestamp) =>
  Buffer.from(`${process.env.SHORTCODE}${process.env.PASSKEY}${timestamp}`).toString("base64");

// accepts 0712345678, 712345678, +254712345678 → returns 254712345678, or null if invalid
const formatPhone = (input) => {
  const digits = String(input || "").replace(/\D/g, "");
  if (/^0[17]\d{8}$/.test(digits)) return "254" + digits.slice(1);
  if (/^254[17]\d{8}$/.test(digits)) return digits;
  if (/^[17]\d{8}$/.test(digits)) return "254" + digits;
  return null;
};

// ---- Daraja calls ----
const sendStkPush = async (phone, amount) => {
  const token = await getAccessToken();
  const timestamp = getTimestamp();

  const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: process.env.SHORTCODE,
      Password: makePassword(timestamp),
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.ceil(amount),
      PartyA: phone,
      PartyB: process.env.SHORTCODE,
      PhoneNumber: phone,
      CallBackURL: process.env.CALLBACK_URL.trim(),
      AccountReference: "BookShop",
      TransactionDesc: "Book payment",
    }),
  });
  return response.json();
};

const queryStkStatus = async (checkoutRequestId) => {
  const token = await getAccessToken();
  const timestamp = getTimestamp();

  const response = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: process.env.SHORTCODE,
      Password: makePassword(timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });
  return response.json();
};

module.exports = { sendStkPush, queryStkStatus, formatPhone };