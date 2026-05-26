const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });
}

const FROM = process.env.EMAIL_FROM || 'TypeBeatz <noreply@typebeatz.com>';
const APP_URL = process.env.APP_URL
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://typebeatz.com');

function base(content) {
  return `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#050a13;font-family:'Helvetica Neue',Arial,sans-serif;color:#fff}
.wrap{max-width:560px;margin:0 auto;padding:40px 20px}
.card{background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,rgba(59,130,246,0.07) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:20px;padding:40px}
.logo{font-size:17px;font-weight:900;letter-spacing:.12em;color:#fff;text-transform:uppercase}
.sub{font-size:10px;color:rgba(255,255,255,.3);letter-spacing:.1em;text-transform:uppercase}
.divider{height:1px;background:rgba(255,255,255,.07);margin:24px 0}
.footer{text-align:center;font-size:11px;color:rgba(255,255,255,.22);padding-top:24px;line-height:2}
a.btn{display:inline-block;padding:14px 32px;border-radius:9999px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:.02em}
.btn-w{background:#fff;color:#000}
h1{font-size:26px;font-weight:800;letter-spacing:-.03em;line-height:1.2;margin-bottom:10px}
p{font-size:14px;color:rgba(255,255,255,.6);line-height:1.75;margin-bottom:14px}
.badge{display:inline-block;padding:4px 12px;border-radius:9999px;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;margin-bottom:18px}
.badge-blue{border:1px solid rgba(59,130,246,.4);color:#60a5fa;background:rgba(59,130,246,.1)}
.badge-green{border:1px solid rgba(16,185,129,.4);color:#34d399;background:rgba(16,185,129,.1)}
.badge-amber{border:1px solid rgba(245,158,11,.4);color:#fbbf24;background:rgba(245,158,11,.1)}
ul.fl{list-style:none;margin:16px 0}
ul.fl li{font-size:13px;color:rgba(255,255,255,.7);padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px}
ul.fl li:last-child{border-bottom:none}
.ck{color:#60a5fa;font-weight:bold;font-size:15px}
.highlight-box{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.2);border-radius:12px;padding:18px;margin:16px 0}
</style>
</head>
<body>
<div class="wrap">
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
    <span class="logo">TypeBeatz</span>
    <span class="sub">Type Beat Generator</span>
  </div>
  <div class="card">${content}</div>
  <div class="footer">
    © ${new Date().getFullYear()} TypeBeatz &nbsp;·&nbsp; <a href="${APP_URL}" style="color:rgba(255,255,255,.35);text-decoration:none">typebeatz.com</a><br>
    Obdržel jsi tento e-mail, protože jsi se zaregistroval na TypeBeatz.
  </div>
</div>
</body>
</html>`;
}

function welcomeHTML(user) {
  const name = user.first_name || 'producente';
  return base(`
    <div class="badge badge-blue">NOVÝ ČLEN</div>
    <h1>Vítej v TypeBeatz, ${name} 👋</h1>
    <p>Jsi nastavený a připravený generovat type beat videa přímo v prohlížeči — bez instalace, bez serveru.</p>
    <div class="divider"></div>
    <p style="font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:6px">Co umíš zdarma:</p>
    <ul class="fl">
      <li><span class="ck">✓</span>5 videí každý měsíc</li>
      <li><span class="ck">✓</span>Drag &amp; drop pro audio + obrázky</li>
      <li><span class="ck">✓</span>Automatické párování souborů</li>
      <li><span class="ck">✓</span>Export MP4 přímo v prohlížeči</li>
    </ul>
    <div class="divider"></div>
    <div style="text-align:center;padding-top:8px">
      <a href="${APP_URL}/app" class="btn btn-w">Začít generovat →</a>
    </div>
  `);
}

function purchaseHTML(user, plan) {
  const name = user.first_name || 'producente';
  const label = plan === 'unlimited' ? 'UNLIMITED' : 'PRO';
  const feats = plan === 'unlimited'
    ? ['Neomezená videa každý měsíc', '4K výstup (Ultra Quality)', 'Prioritní podpora', 'Žádný watermark', 'Zrušení kdykoliv']
    : ['31 videí každý měsíc', '1080p HD výstup', 'Prioritní podpora', 'Žádný watermark', 'Zrušení kdykoliv'];
  return base(`
    <div class="badge badge-green">PLATBA POTVRZENA</div>
    <h1>Tvůj ${label} plán je aktivní! 🎉</h1>
    <p>Díky za podporu TypeBeatz, ${name}. Máš plný přístup ke všemu, co ${label} nabízí.</p>
    <div class="divider"></div>
    <p style="font-size:11px;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.08em;font-weight:700;margin-bottom:6px">Tvé výhody ${label}:</p>
    <ul class="fl">
      ${feats.map(f => `<li><span class="ck">✓</span>${f}</li>`).join('')}
    </ul>
    <div class="divider"></div>
    <div style="text-align:center;padding-top:8px">
      <a href="${APP_URL}/app" class="btn btn-w">Jít do aplikace →</a>
    </div>
  `);
}

function creditLimitHTML(user) {
  const name = user.first_name || 'producente';
  return base(`
    <div class="badge badge-amber">LIMIT DOSAŽEN</div>
    <h1>Tvoje kredity jsou vyčerpány ⚡</h1>
    <p>Skvělá práce, ${name}! Tento měsíc jsi využil všechny své bezplatné kredity.</p>
    <p>Upgraduj a pokračuj v tvorbě bez omezení.</p>
    <div class="highlight-box">
      <p style="font-size:13px;color:rgba(255,255,255,.8);margin:0"><strong style="color:#60a5fa">PRO:</strong> 31 videí/měsíc · HD 1080p · od 199 Kč/měsíc</p>
      <p style="font-size:13px;color:rgba(255,255,255,.8);margin:8px 0 0"><strong style="color:#a78bfa">UNLIMITED:</strong> Neomezená videa · 4K výstup · od 349 Kč/měsíc</p>
    </div>
    <div style="text-align:center;padding-top:8px">
      <a href="${APP_URL}/upgrade" class="btn btn-w">Upgradovat teď →</a>
    </div>
  `);
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) {
    console.log(`[email] SMTP not configured — skipping: "${subject}" → ${to}`);
    return false;
  }
  try {
    await t.sendMail({ from: FROM, to, subject, html });
    console.log(`[email] Sent "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] Failed "${subject}" → ${to}:`, err.message);
    return false;
  }
}

async function sendWelcomeEmail(user) {
  if (!user?.email) return false;
  return sendEmail({ to: user.email, subject: 'Vítej v TypeBeatz 🎵', html: welcomeHTML(user) });
}

async function sendPurchaseEmail(user, plan) {
  if (!user?.email) return false;
  const label = plan === 'unlimited' ? 'UNLIMITED' : 'PRO';
  return sendEmail({ to: user.email, subject: `Tvůj TypeBeatz ${label} je aktivní 🎉`, html: purchaseHTML(user, plan) });
}

async function sendCreditLimitEmail(user) {
  if (!user?.email) return false;
  return sendEmail({ to: user.email, subject: 'Tvoje kredity TypeBeatz jsou vyčerpány ⚡', html: creditLimitHTML(user) });
}

const EMAIL_TEMPLATES = [
  {
    id: 'welcome',
    name: 'Uvítací e-mail',
    trigger: 'Při registraci nového uživatele',
    subject: 'Vítej v TypeBeatz 🎵',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com' }) => welcomeHTML(u),
  },
  {
    id: 'purchase_pro',
    name: 'Potvrzení nákupu PRO',
    trigger: 'Při aktivaci PRO předplatného',
    subject: 'Tvůj TypeBeatz PRO je aktivní 🎉',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com' }) => purchaseHTML(u, 'pro'),
  },
  {
    id: 'purchase_unlimited',
    name: 'Potvrzení nákupu UNLIMITED',
    trigger: 'Při aktivaci UNLIMITED předplatného',
    subject: 'Tvůj TypeBeatz UNLIMITED je aktivní 🎉',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com' }) => purchaseHTML(u, 'unlimited'),
  },
  {
    id: 'credit_limit',
    name: 'Dosažení limitu kreditů',
    trigger: 'Kdy FREE uživatel vyčerpá všechny kredity',
    subject: 'Tvoje kredity TypeBeatz jsou vyčerpány ⚡',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com' }) => creditLimitHTML(u),
  },
];

module.exports = { sendWelcomeEmail, sendPurchaseEmail, sendCreditLimitEmail, EMAIL_TEMPLATES };
