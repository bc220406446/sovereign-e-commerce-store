import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

const FROM = process.env.EMAIL_FROM || "Sovereign Watches <noreply@sovereignwatches.com>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] || c));
const htmlToText = (value: string) => value.replace(/<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/gi, "").replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div|h[1-6]|li|tr)>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\n\s*\n\s*\n/g, "\n\n").trim();
const brandedEmail = (content: string) => `<!doctype html><html><body style="margin:0;background:#f5f3ef;font-family:Arial,sans-serif;color:#29231d"><div style="max-width:600px;margin:32px auto;background:#fff;border-radius:18px;overflow:hidden"><div style="background:#171717;padding:24px;text-align:center"><img src="${SITE_URL}/sovereign-logo.png" alt="Sovereign" style="height:52px;max-width:180px;object-fit:contain"><div style="color:#d1a15b;font-size:11px;letter-spacing:3px;margin-top:8px">SOVEREIGN WATCHES</div></div><div style="padding:36px">${content}</div><div style="border-top:1px solid #eee;padding:20px;text-align:center;color:#8b8175;font-size:12px">Crafted with restraint · Sovereign Watches<br><a href="${SITE_URL}" style="color:#9a6b2f">Visit our store</a></div></div></body></html>`;

export async function sendCampaignEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) throw new Error("Gmail credentials are not configured.");
  const looksLikeHtml = /<\/?[a-z][^>]*>/i.test(body);
  const content = looksLikeHtml ? body : `<p style="white-space:pre-wrap;line-height:1.7">${escapeHtml(body)}</p>`;
  await transporter.sendMail({ from: FROM, to, subject, text: looksLikeHtml ? htmlToText(body) : body, html: brandedEmail(content) });
}

export async function sendOrderConfirmation({
  to,
  customerName,
  orderNumber,
  total,
  items,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  total: number;
  items: { name: string; qty: number; price: number }[];
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn("[email] Gmail credentials not set - skipping order confirmation email");
    return;
  }
  const itemsHtml = items
    .map(
      (i) => `<tr>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;">${i.name}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#6b7280;text-align:center;">${i.qty}</td>
        <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;font-size:14px;color:#374151;text-align:right;">Rs ${i.price.toLocaleString()}</td>
      </tr>`
    )
    .join("");

  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order confirmed - ${orderNumber}`,
    html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="width:56px;height:56px;background:#dcfce7;border-radius:50%;margin:0 auto 16px;line-height:56px;font-size:28px;">✓</div>
      <h1 style="margin:0;font-size:22px;color:#1a1a2e;">Order Confirmed</h1>
      <p style="margin:8px 0 0;font-size:14px;color:#6b7280;">${orderNumber}</p>
    </div>
    <p style="font-size:15px;color:#374151;margin:0 0 24px;">Hi ${customerName},</p>
    <p style="font-size:15px;color:#374151;margin:0 0 24px;">Thank you for your order! Here's a summary:</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr>
          <th style="text-align:left;padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#9ca3af;">Item</th>
          <th style="text-align:center;padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#9ca3af;">Qty</th>
          <th style="text-align:right;padding:8px 0;border-bottom:2px solid #e5e7eb;font-size:12px;text-transform:uppercase;color:#9ca3af;">Price</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>
    <div style="border-top:2px solid #e5e7eb;padding-top:16px;margin-top:8px;">
      <table style="width:100%;"><tr>
        <td style="font-size:16px;font-weight:700;color:#1a1a2e;">Total</td>
        <td style="text-align:right;font-size:18px;font-weight:700;color:#1a1a2e;">Rs ${total.toLocaleString()}</td>
      </tr></table>
    </div>
    <p style="font-size:13px;color:#9ca3af;margin:32px 0 0;text-align:center;">You can track your order status anytime on our website.</p>
  </div>
</body>
</html>`,
  });
}

export async function sendStatusUpdateEmail({
  to,
  customerName,
  orderNumber,
  status,
  note,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  status: string;
  note?: string;
}) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) return;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Order ${orderNumber} update - ${status}`,
    html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
    <h1 style="margin:0 0 16px;font-size:20px;color:#1a1a2e;">Sovereign Watches</h1>
    <p style="font-size:15px;color:#374151;margin:0 0 16px;">Hi ${customerName},</p>
    <p style="font-size:15px;color:#374151;margin:0 0 16px;">Your order <strong>${orderNumber}</strong> has been updated to: <strong>${status}</strong>.</p>
    ${note ? `<p style="font-size:14px;color:#6b7280;margin:0 0 16px;">${note}</p>` : ""}
    <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;">Track your order anytime on our website.</p>
  </div>
</body></html>`,
  });
}
