const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

const FROM    = process.env.EMAIL_FROM || 'TypeBeatz <noreply@typebeatz.com>';
const APP_URL = process.env.APP_URL
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://typebeatz.com');

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS  (cs = Czech, en = English)
═══════════════════════════════════════════════════════════ */
const T = {
  cs: {
    footerNote:       'Obdržel jsi tento e-mail, protože jsi se zaregistroval na TypeBeatz.',
    footerCopyright:  `© ${new Date().getFullYear()} TypeBeatz`,
    tagline:          'Type Beat Generator',
    // Welcome
    welcomeBadge:     'NOVÝ ČLEN',
    welcomeTitle:     name => `Vítej v TypeBeatz, ${name} 👋`,
    welcomeSub:       'Jsi nastavený a připravený generovat type beat videa přímo v prohlížeči — bez instalace, bez serveru.',
    welcomePlanHdr:   'CO UMÍŠ ZDARMA:',
    welcomeFeatures:  [
      '5 videí každý měsíc',
      'Kredity se resetují 1. každého měsíce',
      'Všechny základní funkce',
      'Černobílé pozadí',
      '720p kvalita výstupu',
    ],
    welcomeCTA:       'Začít generovat →',
    welcomeSubject:   'Vítej v TypeBeatz 🎵',
    // PRO purchase
    proBadge:         'PLATBA POTVRZENA',
    proTitle:         'Tvůj PRO plán je aktivní! 🎉',
    proSub:           name => `Díky za podporu TypeBeatz, ${name}. Máš plný přístup ke všemu, co PRO nabízí.`,
    proPlanHdr:       'VÝHODY TVÉHO PRO PLÁNU:',
    proFeatures:      [
      'Až 31 videí každý měsíc',
      'HD 1080p — připraveno pro YouTube',
      'Vlastní fotopozadí pro tvůj branding',
      'Párování audia a vizuálu jedním klikem',
      'Zrušení kdykoliv',
    ],
    proPrice:         '$9 / měsíc',
    proCTA:           'Jít do aplikace →',
    proSubject:       'Tvůj TypeBeatz PRO je aktivní 🎉',
    // UNLIMITED purchase
    unlimitedBadge:   'PLATBA POTVRZENA',
    unlimitedTitle:   'Tvůj UNLIMITED plán je aktivní! 🚀',
    unlimitedSub:     name => `Díky za podporu TypeBeatz, ${name}. Máš neomezený přístup ke všemu, co TypeBeatz nabízí.`,
    unlimitedPlanHdr: 'VÝHODY TVÉHO UNLIMITED PLÁNU:',
    unlimitedFeatures:[
      'Neomezená videa — žádné limity, nikdy',
      'Až 4K kvalita — vynikni na YouTube',
      'Vlastní fotopozadí pro tvůj branding',
      'Párování audia a vizuálu jedním klikem',
      'Zrušení kdykoliv',
    ],
    unlimitedPrice:   '$19 / měsíc',
    unlimitedCTA:     'Jít do aplikace →',
    unlimitedSubject: 'Tvůj TypeBeatz UNLIMITED je aktivní 🚀',
    // Credit limit
    creditBadge:      'LIMIT DOSAŽEN',
    creditTitle:      'Tvoje kredity jsou vyčerpány ⚡',
    creditSub:        name => `Skvělá práce, ${name}! Tento měsíc jsi využil všechny své bezplatné kredity.`,
    creditUpgrade:    'Upgraduj a pokračuj v tvorbě bez omezení.',
    creditCompHdr:    'POROVNÁNÍ PLÁNŮ:',
    creditProLabel:   'PRO',
    creditProDesc:    '31 videí/měsíc · HD 1080p · YouTube ready',
    creditProPrice:   'od $9/měsíc',
    creditUlLabel:    'UNLIMITED',
    creditUlDesc:     'Neomezená videa · 4K kvalita · vlastní pozadí',
    creditUlPrice:    'od $19/měsíc',
    creditCTA:        'Upgradovat teď →',
    creditSubject:    'Tvoje kredity TypeBeatz jsou vyčerpány ⚡',
  },
  en: {
    footerNote:       'You received this email because you registered at TypeBeatz.',
    footerCopyright:  `© ${new Date().getFullYear()} TypeBeatz`,
    tagline:          'Type Beat Generator',
    // Welcome
    welcomeBadge:     'NEW MEMBER',
    welcomeTitle:     name => `Welcome to TypeBeatz, ${name} 👋`,
    welcomeSub:       "You're all set and ready to generate type beat videos right in your browser — no install, no server needed.",
    welcomePlanHdr:   'WHAT YOU GET FOR FREE:',
    welcomeFeatures:  [
      '5 videos every month',
      'Credits reset on the 1st of each month',
      'All core features',
      'Black & white backgrounds',
      '720p output quality',
    ],
    welcomeCTA:       'Start generating →',
    welcomeSubject:   'Welcome to TypeBeatz 🎵',
    // PRO purchase
    proBadge:         'PAYMENT CONFIRMED',
    proTitle:         'Your PRO plan is active! 🎉',
    proSub:           name => `Thanks for supporting TypeBeatz, ${name}. You now have full access to everything PRO offers.`,
    proPlanHdr:       'YOUR PRO PLAN BENEFITS:',
    proFeatures:      [
      'Batch generate up to 31 videos per month',
      'HD 1080p — YouTube ready',
      'Custom photo background for your branding',
      'One-click audio & visual pairing',
      'Cancel anytime',
    ],
    proPrice:         '$9 / month',
    proCTA:           'Go to app →',
    proSubject:       'Your TypeBeatz PRO is active 🎉',
    // UNLIMITED purchase
    unlimitedBadge:   'PAYMENT CONFIRMED',
    unlimitedTitle:   'Your UNLIMITED plan is active! 🚀',
    unlimitedSub:     name => `Thanks for supporting TypeBeatz, ${name}. You now have unlimited access to everything TypeBeatz offers.`,
    unlimitedPlanHdr: 'YOUR UNLIMITED PLAN BENEFITS:',
    unlimitedFeatures:[
      'Unlimited video generation — no caps, ever',
      'Up to 4K quality — stand out on YouTube',
      'Custom photo background for your branding',
      'One-click audio & visual pairing',
      'Cancel anytime',
    ],
    unlimitedPrice:   '$19 / month',
    unlimitedCTA:     'Go to app →',
    unlimitedSubject: 'Your TypeBeatz UNLIMITED is active 🚀',
    // Credit limit
    creditBadge:      'LIMIT REACHED',
    creditTitle:      'Your credits are used up ⚡',
    creditSub:        name => `Great work, ${name}! You've used all your free credits this month.`,
    creditUpgrade:    'Upgrade now and keep creating without limits.',
    creditCompHdr:    'PLAN COMPARISON:',
    creditProLabel:   'PRO',
    creditProDesc:    '31 videos/month · HD 1080p · YouTube ready',
    creditProPrice:   'from $9/month',
    creditUlLabel:    'UNLIMITED',
    creditUlDesc:     'Unlimited videos · 4K quality · custom background',
    creditUlPrice:    'from $19/month',
    creditCTA:        'Upgrade now →',
    creditSubject:    'Your TypeBeatz credits are used up ⚡',
  },
};

function t(user) {
  const lang = user?.language || 'cs';
  return T[lang] || T.cs;
}

/* ═══════════════════════════════════════════════════════════
   HTML HELPERS
═══════════════════════════════════════════════════════════ */
function accentBar(gradient) {
  return `<tr><td height="4" style="background:${gradient};font-size:0;line-height:0;border-radius:18px 18px 0 0">&nbsp;</td></tr>`;
}

function badge(text, color, bg, border) {
  return `<div style="display:inline-block;padding:5px 14px;border-radius:9999px;font-size:9px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:22px;color:${color};background:${bg};border:1px solid ${border};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${text}</div>`;
}

function heading(text) {
  return `<h1 style="margin:0 0 14px;font-size:27px;font-weight:800;letter-spacing:-0.03em;line-height:1.2;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${text}</h1>`;
}

function subtext(text) {
  return `<p style="margin:0 0 4px;font-size:14px;color:rgba(255,255,255,0.5);line-height:1.8;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${text}</p>`;
}

function divider() {
  return `<div style="height:1px;background:rgba(255,255,255,0.07);margin:24px 0"></div>`;
}

function sectionLabel(text) {
  return `<div style="font-size:9px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:rgba(255,255,255,0.28);margin-bottom:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${text}</div>`;
}

function featureList(items, checkColor) {
  const rows = items.map((item, i) => {
    const border = i < items.length - 1 ? 'border-bottom:1px solid rgba(255,255,255,0.05)' : '';
    return `<tr><td style="padding:9px 0;${border}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="22" style="vertical-align:top;padding-top:1px;color:${checkColor};font-size:13px;font-weight:800;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">✓</td>
        <td style="font-size:13px;color:rgba(255,255,255,0.72);line-height:1.55;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${item}</td>
      </tr></table>
    </td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 4px">${rows}</table>`;
}

function ctaButton(text, url) {
  return `<div style="text-align:center;padding-top:10px">
    <a href="${url}" style="display:inline-block;padding:14px 40px;border-radius:9999px;font-weight:800;font-size:14px;text-decoration:none;letter-spacing:0.02em;background:#ffffff;color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${text}</a>
  </div>`;
}

function priceTag(label, price, color) {
  return `<div style="display:inline-block;padding:6px 16px;border-radius:9999px;font-size:11px;font-weight:800;letter-spacing:0.06em;color:${color};background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);margin-bottom:20px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${label} &nbsp;·&nbsp; ${price}</div>`;
}

/* ═══════════════════════════════════════════════════════════
   BASE TEMPLATE  — pure black outer, dark-navy card
═══════════════════════════════════════════════════════════ */
function base(cardContent, strings, preheader = '') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>TypeBeatz</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%">

${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#000000;line-height:1px">${preheader}</div>` : ''}

<!-- Outer black wrapper -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000">
  <tr>
    <td align="center" style="padding:48px 16px 40px">

      <!-- Content column (max 560px) -->
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px">

        <!-- ── Header row: logo + tagline ── -->
        <tr>
          <td style="padding:0 4px 32px">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td>
                  <span style="font-size:15px;font-weight:900;letter-spacing:0.22em;color:#ffffff;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">TYPEBEATZ</span>
                </td>
                <td align="right" style="vertical-align:middle">
                  <span style="font-size:8px;color:rgba(255,255,255,0.25);letter-spacing:0.14em;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${strings.tagline}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ── Card ── -->
        <tr>
          <td>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080c18;border:1px solid rgba(59,130,246,0.18);border-radius:20px">
              ${cardContent}
              <!-- Card content padding row -->
            </table>
          </td>
        </tr>

        <!-- ── Footer ── -->
        <tr>
          <td style="padding:28px 4px 0;text-align:center;font-size:11px;color:rgba(255,255,255,0.2);line-height:2.2;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">
            ${strings.footerCopyright} &nbsp;·&nbsp;
            <a href="${APP_URL}" style="color:rgba(255,255,255,0.28);text-decoration:none">typebeatz.com</a><br>
            ${strings.footerNote}
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>

</body>
</html>`;
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Welcome
═══════════════════════════════════════════════════════════ */
function welcomeHTML(user) {
  const s    = t(user);
  const name = user.first_name || (user.language === 'en' ? 'producer' : 'producente');
  const card = `
    ${accentBar('linear-gradient(90deg,#3b82f6 0%,#0ea5e9 100%)')}
    <tr><td style="padding:36px 40px 40px">
      ${badge(s.welcomeBadge, '#60a5fa', 'rgba(59,130,246,0.12)', 'rgba(59,130,246,0.35)')}
      ${heading(s.welcomeTitle(name))}
      ${subtext(s.welcomeSub)}
      ${divider()}
      ${sectionLabel(s.welcomePlanHdr)}
      ${featureList(s.welcomeFeatures, '#3b82f6')}
      ${divider()}
      ${ctaButton(s.welcomeCTA, `${APP_URL}/app`)}
    </td></tr>`;
  return base(card, s, s.welcomeTitle(name));
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Purchase (PRO)
═══════════════════════════════════════════════════════════ */
function purchaseProHTML(user) {
  const s    = t(user);
  const name = user.first_name || (user.language === 'en' ? 'producer' : 'producente');
  const card = `
    ${accentBar('linear-gradient(90deg,#3b82f6 0%,#0ea5e9 100%)')}
    <tr><td style="padding:36px 40px 40px">
      ${badge(s.proBadge, '#34d399', 'rgba(16,185,129,0.12)', 'rgba(16,185,129,0.35)')}
      ${heading(s.proTitle)}
      ${subtext(s.proSub(name))}
      ${priceTag('PRO', s.proPrice, '#60a5fa')}
      ${divider()}
      ${sectionLabel(s.proPlanHdr)}
      ${featureList(s.proFeatures, '#3b82f6')}
      ${divider()}
      ${ctaButton(s.proCTA, `${APP_URL}/app`)}
    </td></tr>`;
  return base(card, s, s.proTitle);
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Purchase (UNLIMITED)
═══════════════════════════════════════════════════════════ */
function purchaseUnlimitedHTML(user) {
  const s    = t(user);
  const name = user.first_name || (user.language === 'en' ? 'producer' : 'producente');
  const card = `
    ${accentBar('linear-gradient(90deg,#8b5cf6 0%,#a78bfa 50%,#6366f1 100%)')}
    <tr><td style="padding:36px 40px 40px">
      ${badge(s.unlimitedBadge, '#34d399', 'rgba(16,185,129,0.12)', 'rgba(16,185,129,0.35)')}
      ${heading(s.unlimitedTitle)}
      ${subtext(s.unlimitedSub(name))}
      ${priceTag('UNLIMITED', s.unlimitedPrice, '#a78bfa')}
      ${divider()}
      ${sectionLabel(s.unlimitedPlanHdr)}
      ${featureList(s.unlimitedFeatures, '#a78bfa')}
      ${divider()}
      ${ctaButton(s.unlimitedCTA, `${APP_URL}/app`)}
    </td></tr>`;
  return base(card, s, s.unlimitedTitle);
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Credit Limit
═══════════════════════════════════════════════════════════ */
function creditLimitHTML(user) {
  const s    = t(user);
  const name = user.first_name || (user.language === 'en' ? 'producer' : 'producente');
  const card = `
    ${accentBar('linear-gradient(90deg,#f59e0b 0%,#fbbf24 100%)')}
    <tr><td style="padding:36px 40px 40px">
      ${badge(s.creditBadge, '#fbbf24', 'rgba(245,158,11,0.12)', 'rgba(245,158,11,0.35)')}
      ${heading(s.creditTitle)}
      ${subtext(s.creditSub(name))}
      ${subtext(s.creditUpgrade)}
      ${divider()}
      ${sectionLabel(s.creditCompHdr)}

      <!-- PRO row -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.2);border-radius:12px;margin-bottom:10px">
        <tr><td style="padding:14px 18px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size:10px;font-weight:900;letter-spacing:0.12em;color:#60a5fa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:4px">${s.creditProLabel}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${s.creditProDesc}</div>
              </td>
              <td align="right" style="vertical-align:middle">
                <span style="font-size:11px;font-weight:800;color:#60a5fa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;white-space:nowrap">${s.creditProPrice}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      <!-- UNLIMITED row -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
        style="background:rgba(139,92,246,0.06);border:1px solid rgba(139,92,246,0.2);border-radius:12px;margin-bottom:8px">
        <tr><td style="padding:14px 18px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <div style="font-size:10px;font-weight:900;letter-spacing:0.12em;color:#a78bfa;text-transform:uppercase;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:4px">${s.creditUlLabel}</div>
                <div style="font-size:12px;color:rgba(255,255,255,0.55);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">${s.creditUlDesc}</div>
              </td>
              <td align="right" style="vertical-align:middle">
                <span style="font-size:11px;font-weight:800;color:#a78bfa;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;white-space:nowrap">${s.creditUlPrice}</span>
              </td>
            </tr>
          </table>
        </td></tr>
      </table>

      ${divider()}
      ${ctaButton(s.creditCTA, `${APP_URL}/upgrade`)}
    </td></tr>`;
  return base(card, s, s.creditTitle);
}

/* ═══════════════════════════════════════════════════════════
   purchaseHTML — route by plan
═══════════════════════════════════════════════════════════ */
function purchaseHTML(user, plan) {
  return plan === 'unlimited' ? purchaseUnlimitedHTML(user) : purchaseProHTML(user);
}

/* ═══════════════════════════════════════════════════════════
   SEND HELPERS
═══════════════════════════════════════════════════════════ */
async function sendEmail({ to, subject, html }) {
  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email] SMTP not configured — skipping: "${subject}" → ${to}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: FROM, to, subject, html });
    console.log(`[email] Sent "${subject}" → ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] Failed "${subject}" → ${to}:`, err.message);
    return false;
  }
}

async function sendWelcomeEmail(user) {
  if (!user?.email) return false;
  const s = t(user);
  return sendEmail({ to: user.email, subject: s.welcomeSubject, html: welcomeHTML(user) });
}

async function sendPurchaseEmail(user, plan) {
  if (!user?.email) return false;
  const s = t(user);
  const subject = plan === 'unlimited' ? s.unlimitedSubject : s.proSubject;
  return sendEmail({ to: user.email, subject, html: purchaseHTML(user, plan) });
}

async function sendCreditLimitEmail(user) {
  if (!user?.email) return false;
  const s = t(user);
  return sendEmail({ to: user.email, subject: s.creditSubject, html: creditLimitHTML(user) });
}

/* ═══════════════════════════════════════════════════════════
   EMAIL_TEMPLATES  (for admin preview panel)
═══════════════════════════════════════════════════════════ */
const EMAIL_TEMPLATES = [
  {
    id:      'welcome',
    name:    'Uvítací e-mail',
    trigger: 'Při registraci nového uživatele',
    subject: 'Vítej v TypeBeatz 🎵',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => welcomeHTML(u),
  },
  {
    id:      'purchase_pro',
    name:    'Potvrzení nákupu PRO',
    trigger: 'Při aktivaci PRO předplatného',
    subject: 'Tvůj TypeBeatz PRO je aktivní 🎉',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => purchaseProHTML(u),
  },
  {
    id:      'purchase_unlimited',
    name:    'Potvrzení nákupu UNLIMITED',
    trigger: 'Při aktivaci UNLIMITED předplatného',
    subject: 'Tvůj TypeBeatz UNLIMITED je aktivní 🚀',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => purchaseUnlimitedHTML(u),
  },
  {
    id:      'credit_limit',
    name:    'Dosažení limitu kreditů',
    trigger: 'Kdy FREE uživatel vyčerpá všechny kredity',
    subject: 'Tvoje kredity TypeBeatz jsou vyčerpány ⚡',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => creditLimitHTML(u),
  },
];

function isSmtpConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendPurchaseEmail,
  sendCreditLimitEmail,
  EMAIL_TEMPLATES,
  isSmtpConfigured,
};
