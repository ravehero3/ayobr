const nodemailer = require('nodemailer');

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });
}

const FROM    = process.env.EMAIL_FROM || 'TypeBeatz <typebeatz@voodoo808.com>';
const APP_URL = process.env.APP_URL
  || (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'https://typebeatz.voodoo808.com');

/* ═══════════════════════════════════════════════════════════
   TRANSLATIONS  (cs = Czech, en = English)
   - Professional tone, no emojis
═══════════════════════════════════════════════════════════ */
const T = {
  cs: {
    footerNote:       'Obdržel jsi tento e-mail, protože jsi se zaregistroval na TypeBeatz.',
    footerCopyright:  `© ${new Date().getFullYear()} TypeBeatz`,
    tagline:          'Type Beat Generator',
    // Welcome
    welcomeBadge:     'NOVÝ ČLEN',
    welcomeTitle:     name => `Vítej v TypeBeatz, ${name}`,
    welcomeSub:       'Jsi nastavený a připravený generovat type beat videa přímo v prohlížeči — bez instalace, bez serveru.',
    welcomePlanHdr:   'CO MÁŠ K DISPOZICI ZDARMA:',
    welcomeFeatures:  [
      '5 videí každý měsíc',
      'Kredity se resetují 1. každého měsíce',
      'Všechny základní funkce',
      'Černobílé pozadí',
      '720p kvalita výstupu',
    ],
    welcomeCTA:       'Začít generovat →',
    welcomeSubject:   'Vítej v TypeBeatz',
    // PRO purchase
    proBadge:         'PLATBA POTVRZENA',
    proTitle:         'Tvůj PRO plán je aktivní',
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
    proCTA:           'Přejít do aplikace →',
    proSubject:       'Tvůj TypeBeatz PRO je aktivní',
    // UNLIMITED purchase
    unlimitedBadge:   'PLATBA POTVRZENA',
    unlimitedTitle:   'Tvůj UNLIMITED plán je aktivní',
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
    unlimitedCTA:     'Přejít do aplikace →',
    unlimitedSubject: 'Tvůj TypeBeatz UNLIMITED je aktivní',
    // Credit limit
    creditBadge:      'LIMIT DOSAŽEN',
    creditTitle:      'Tvoje bezplatné kredity jsou vyčerpány',
    creditSub:        name => `Skvělá práce, ${name}! Tento měsíc jsi využil všechny své bezplatné kredity.`,
    creditUpgrade:    'Upgraduj svůj účet a pokračuj v tvorbě videí bez omezení.',
    creditCompHdr:    'DOPORUČENÉ PLÁNY:',
    creditProLabel:   'PRO',
    creditProDesc:    '31 videí/měsíc · HD 1080p · YouTube ready',
    creditProPrice:   'od $9/měsíc',
    creditUlLabel:    'UNLIMITED',
    creditUlDesc:     'Neomezená videa · 4K kvalita · vlastní pozadí',
    creditUlPrice:    'od $19/měsíc',
    creditCTA:        'Upgradovat plán →',
    creditSubject:    'Tvoje kredity TypeBeatz jsou vyčerpány',
  },
  en: {
    footerNote:       'You received this email because you registered at TypeBeatz.',
    footerCopyright:  `© ${new Date().getFullYear()} TypeBeatz`,
    tagline:          'Type Beat Generator',
    // Welcome
    welcomeBadge:     'NEW MEMBER',
    welcomeTitle:     name => `Welcome to TypeBeatz, ${name}`,
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
    welcomeSubject:   'Welcome to TypeBeatz',
    // PRO purchase
    proBadge:         'PAYMENT CONFIRMED',
    proTitle:         'Your PRO plan is active',
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
    proSubject:       'Your TypeBeatz PRO is active',
    // UNLIMITED purchase
    unlimitedBadge:   'PAYMENT CONFIRMED',
    unlimitedTitle:   'Your UNLIMITED plan is active',
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
    unlimitedSubject: 'Your TypeBeatz UNLIMITED is active',
    // Credit limit
    creditBadge:      'LIMIT REACHED',
    creditTitle:      'Your credits are used up',
    creditSub:        name => `Great work, ${name}! You've used all your free credits this month.`,
    creditUpgrade:    'Upgrade now and keep creating without limits.',
    creditCompHdr:    'RECOMMENDED PLANS:',
    creditProLabel:   'PRO',
    creditProDesc:    '31 videos/month · HD 1080p · YouTube ready',
    creditProPrice:   'from $9/month',
    creditUlLabel:    'UNLIMITED',
    creditUlDesc:     'Unlimited videos · 4K quality · custom background',
    creditUlPrice:    'from $19/month',
    creditCTA:        'Upgrade now →',
    creditSubject:    'Your TypeBeatz credits are used up',
  },
};

function t(user) {
  const lang = user?.language || 'cs';
  return T[lang] || T.cs;
}

/* ═══════════════════════════════════════════════════════════
   HTML HELPERS — Exactly mirrors UpgradePage design language
   - Pure black outer background (#000000)
   - Deep navy glass card: linear-gradient(180deg, rgba(1,5,10,0.98) 0%, rgba(7,30,87,0.92) 100%)
   - White logo inside card header + monochrome badge pill
   - Thin rgba(255,255,255,0.07) dividers
   - Weight 700 with -0.04em tracking on headings
   - Weight 400, rgba(255,255,255,0.5) body
   - White solid pill CTA
═══════════════════════════════════════════════════════════ */
function subtext(text) {
  return `<p style="margin:0 0 20px;font-size:15px;color:rgba(255,255,255,0.5);line-height:1.75;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:400;">${text}</p>`;
}

function divider() {
  return `<div style="height:1px;background:rgba(255,255,255,0.07);margin:28px 0;"></div>`;
}

function sectionLabel(text) {
  return `<div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.35);margin-bottom:16px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${text}</div>`;
}

function featureList(items) {
  const rows = items.map((item, i) => {
    const isLast = i === items.length - 1;
    const border = !isLast ? 'border-bottom:1px solid rgba(255,255,255,0.06);' : '';
    return `<tr><td style="padding:10px 0;${border}">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="22" valign="middle" style="color:#ffffff;font-size:12px;font-weight:700;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">✓</td>
          <td valign="middle" style="font-size:14px;color:rgba(255,255,255,0.65);line-height:1.5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:400;">${item}</td>
        </tr>
      </table>
    </td></tr>`;
  }).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">${rows}</table>`;
}

function priceTag(label, price) {
  return `<div style="margin-bottom:28px;">
    <div style="display:inline-block;padding:6px 16px;border-radius:9999px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.12);">
      <span style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.5);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${label}</span>
      <span style="color:rgba(255,255,255,0.25);margin:0 8px;">·</span>
      <span style="font-size:13px;font-weight:700;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${price}</span>
    </div>
  </div>`;
}

/* ═══════════════════════════════════════════════════════════
   BASE TEMPLATE — UpgradePage Design System
═══════════════════════════════════════════════════════════ */
function base({
  badgeText = 'TYPEBEATZ',
  title = '',
  bodyContent = '',
  ctaText = '',
  ctaUrl = '',
  user = {},
  strings = {},
  preheader = '',
}) {
  const isCzech = (user?.language || 'cs') === 'cs';
  const recipientEmail = user?.email || '';
  const footerNote = strings.footerNote || (isCzech
    ? 'Obdržel jsi tento e-mail, protože jsi se zaregistroval na TypeBeatz.'
    : 'You received this email because you registered at TypeBeatz.');

  return `<!DOCTYPE html>
<html lang="${isCzech ? 'cs' : 'en'}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>TypeBeatz</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#000000;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;color:#000000;line-height:1px;">${preheader}</div>` : ''}

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#000000;">
  <tr>
    <td align="center" style="padding:48px 16px;">

      <!-- Outer card container (max 560px) -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td>
            <div style="position:relative;">

              <!-- Main card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background:linear-gradient(180deg, rgba(1,5,10,0.98) 0%, rgba(7,30,87,0.92) 100%);border:1px solid rgba(255,255,255,0.1);border-radius:20px;overflow:hidden;box-shadow:0 0 80px rgba(59,130,246,0.18), 0 30px 60px rgba(0,0,0,0.9);">

                <tr>
                  <td style="padding:44px 40px 40px;">

                    <!-- Brand Header: Logo + Badge -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
                      <tr>
                        <td valign="middle" align="left">
                          <a href="${APP_URL}" style="text-decoration:none;display:inline-block;" target="_blank">
                            <img src="${APP_URL}/typebeatz-logo.png" alt="TypeBeatz" width="128" height="28" style="display:block;border:0;outline:none;text-decoration:none;height:28px;width:128px;max-width:128px;-ms-interpolation-mode:bicubic;" />
                          </a>
                        </td>
                        <td valign="middle" align="right">
                          <!-- Minimal monochrome badge pill -->
                          <span style="display:inline-block;padding:4px 12px;border-radius:9999px;font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.14);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${badgeText}</span>
                        </td>
                      </tr>
                    </table>

                    <!-- Thin divider -->
                    <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;"></div>

                    <!-- Headline — matches UpgradePage h1: weight 700, -0.04em tracking -->
                    ${title ? `<h1 style="margin:0 0 20px;font-size:26px;font-weight:700;letter-spacing:-0.04em;line-height:1.15;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${title}</h1>` : ''}

                    <!-- Body Content -->
                    ${bodyContent}

                    ${ctaText && ctaUrl ? `
                    <!-- Thin divider -->
                    <div style="height:1px;background:rgba(255,255,255,0.07);margin-bottom:32px;margin-top:32px;"></div>

                    <!-- CTA — matches UpgradePage solid pill button: white bg, black text, border-radius 9999 -->
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" style="border-radius:9999px;background:#ffffff;">
                          <a href="${ctaUrl}"
                            style="display:inline-block;padding:13px 48px;border-radius:9999px;font-weight:600;font-size:14px;text-decoration:none;letter-spacing:-0.01em;background:#ffffff;color:#000000;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                            ${ctaText}
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                  </td>
                </tr>

                <!-- Footer row inside card -->
                <tr>
                  <td style="padding:0 40px 32px;">
                    <div style="height:1px;background:rgba(255,255,255,0.06);margin-bottom:20px;"></div>
                    <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);text-align:center;line-height:1.7;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-weight:400;">
                      © ${new Date().getFullYear()} TypeBeatz · <a href="${APP_URL}" style="color:rgba(255,255,255,0.28);text-decoration:none">typebeatz.com</a><br>
                      ${footerNote}<br>
                      <span style="color:rgba(255,255,255,0.12);">${recipientEmail}</span>
                    </p>
                  </td>
                </tr>

              </table>
            </div>
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
  const name = user?.first_name || (user?.language === 'en' ? 'producer' : 'hudebníku');
  const title = s.welcomeTitle(name);
  const bodyContent = `
    ${subtext(s.welcomeSub)}
    ${divider()}
    ${sectionLabel(s.welcomePlanHdr)}
    ${featureList(s.welcomeFeatures)}
  `;
  return base({
    badgeText: s.welcomeBadge,
    title,
    bodyContent,
    ctaText: s.welcomeCTA,
    ctaUrl: `${APP_URL}/app`,
    user,
    strings: s,
    preheader: title,
  });
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Purchase (PRO)
═══════════════════════════════════════════════════════════ */
function purchaseProHTML(user) {
  const s    = t(user);
  const name = user?.first_name || (user?.language === 'en' ? 'producer' : 'hudebníku');
  const title = s.proTitle;
  const bodyContent = `
    ${subtext(s.proSub(name))}
    ${priceTag('PRO', s.proPrice)}
    ${divider()}
    ${sectionLabel(s.proPlanHdr)}
    ${featureList(s.proFeatures)}
  `;
  return base({
    badgeText: s.proBadge,
    title,
    bodyContent,
    ctaText: s.proCTA,
    ctaUrl: `${APP_URL}/app`,
    user,
    strings: s,
    preheader: title,
  });
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Purchase (UNLIMITED)
═══════════════════════════════════════════════════════════ */
function purchaseUnlimitedHTML(user) {
  const s    = t(user);
  const name = user?.first_name || (user?.language === 'en' ? 'producer' : 'hudebníku');
  const title = s.unlimitedTitle;
  const bodyContent = `
    ${subtext(s.unlimitedSub(name))}
    ${priceTag('UNLIMITED', s.unlimitedPrice)}
    ${divider()}
    ${sectionLabel(s.unlimitedPlanHdr)}
    ${featureList(s.unlimitedFeatures)}
  `;
  return base({
    badgeText: s.unlimitedBadge,
    title,
    bodyContent,
    ctaText: s.unlimitedCTA,
    ctaUrl: `${APP_URL}/app`,
    user,
    strings: s,
    preheader: title,
  });
}

/* ═══════════════════════════════════════════════════════════
   TEMPLATE: Credit Limit
═══════════════════════════════════════════════════════════ */
function creditLimitHTML(user) {
  const s    = t(user);
  const name = user?.first_name || (user?.language === 'en' ? 'producer' : 'hudebníku');
  const title = s.creditTitle;
  const bodyContent = `
    ${subtext(s.creditSub(name))}
    ${subtext(s.creditUpgrade)}
    ${divider()}
    ${sectionLabel(s.creditCompHdr)}

    <!-- PRO row -->
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:14px;padding:16px 20px;margin-bottom:12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:4px;">${s.creditProLabel}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">${s.creditProDesc}</div>
          </td>
          <td valign="middle" align="right" style="white-space:nowrap;padding-left:16px;">
            <span style="font-size:13px;font-weight:700;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${s.creditProPrice}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- UNLIMITED row -->
    <div style="background:linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%);border:1px solid rgba(255,255,255,0.22);border-radius:14px;padding:16px 20px;margin-bottom:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td valign="middle">
            <div style="font-size:13px;font-weight:700;letter-spacing:0.04em;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;margin-bottom:4px;">${s.creditUlLabel}</div>
            <div style="font-size:12px;color:rgba(255,255,255,0.45);font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;line-height:1.5;">${s.creditUlDesc}</div>
          </td>
          <td valign="middle" align="right" style="white-space:nowrap;padding-left:16px;">
            <span style="font-size:13px;font-weight:700;color:#ffffff;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">${s.creditUlPrice}</span>
          </td>
        </tr>
      </table>
    </div>
  `;
  return base({
    badgeText: s.creditBadge,
    title,
    bodyContent,
    ctaText: s.creditCTA,
    ctaUrl: `${APP_URL}/upgrade`,
    user,
    strings: s,
    preheader: title,
  });
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
   EMAIL_TEMPLATES (for admin preview panel and newsletters)
═══════════════════════════════════════════════════════════ */
const EMAIL_TEMPLATES = [
  {
    id:      'welcome',
    name:    'Uvítací e-mail',
    trigger: 'Při registraci nového uživatele',
    subject: 'Vítej v TypeBeatz',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => welcomeHTML(u),
  },
  {
    id:      'purchase_pro',
    name:    'Potvrzení nákupu PRO',
    trigger: 'Při aktivaci PRO předplatného',
    subject: 'Tvůj TypeBeatz PRO je aktivní',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => purchaseProHTML(u),
  },
  {
    id:      'purchase_unlimited',
    name:    'Potvrzení nákupu UNLIMITED',
    trigger: 'Při aktivaci UNLIMITED předplatného',
    subject: 'Tvůj TypeBeatz UNLIMITED je aktivní',
    getHTML: (u = { first_name: 'Jan', email: 'jan@example.com', language: 'cs' }) => purchaseUnlimitedHTML(u),
  },
  {
    id:      'credit_limit',
    name:    'Dosažení limitu kreditů',
    trigger: 'Když FREE uživatel vyčerpá všechny kredity',
    subject: 'Tvoje kredity TypeBeatz jsou vyčerpány',
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
  welcomeHTML,
  purchaseProHTML,
  purchaseUnlimitedHTML,
  creditLimitHTML,
  EMAIL_TEMPLATES,
  isSmtpConfigured,
};
