import React from 'react';
import { useNavigate } from 'react-router-dom';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

export default function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#050a13] text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4"
        style={{ background: 'rgba(5,10,19,0.9)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <button onClick={() => navigate('/')} className="hover:opacity-80 transition-opacity">
          <img src={typebeatLogo} alt="TypeBeatz" style={{ height: 20 }} />
        </button>
        <button onClick={() => navigate(-1)} className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Back
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. What We Collect</h2>
            <p className="mb-3">When you use TypeBeatz, we collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Account information:</strong> Your name, email address, and profile picture, provided via Google OAuth when you sign in.</li>
              <li><strong className="text-white">Usage data:</strong> Number of videos generated, credits used, and subscription status.</li>
              <li><strong className="text-white">Session data:</strong> A secure session cookie to keep you logged in.</li>
              <li><strong className="text-white">Payment information:</strong> Processed entirely by Paddle — we never see or store your card details.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. What We Do NOT Collect</h2>
            <p className="mb-3">TypeBeatz processes all video files locally in your browser. This means:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your audio files (.mp3, .wav, etc.) are <strong className="text-white">never uploaded</strong> to our servers.</li>
              <li>Your image files (.png, .jpg, etc.) are <strong className="text-white">never uploaded</strong> to our servers.</li>
              <li>Generated video files are <strong className="text-white">never stored</strong> by us — they exist only in your browser memory and are downloaded directly to your device.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To authenticate you and maintain your session.</li>
              <li>To track your monthly credit usage and subscription status.</li>
              <li>To process subscription payments through Paddle.</li>
              <li>To display your profile information within the app.</li>
              <li>To send you referral credits when applicable.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Third-Party Services</h2>
            <p className="mb-3">We use the following third-party services:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Google OAuth:</strong> For authentication. Subject to Google's Privacy Policy.</li>
              <li><strong className="text-white">Paddle:</strong> For payment processing. Paddle acts as the Merchant of Record and handles all payment data. Subject to Paddle's Privacy Policy.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage & Security</h2>
            <p>Your account data is stored in a secure PostgreSQL database. We use HTTPS for all data transmission. Session cookies are HttpOnly and Secure. We do not sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. If you wish to delete your account and all associated data, contact us through the platform and we will process your request within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Your Rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Object to or restrict processing of your data.</li>
              <li>Data portability — receive a copy of your data in a machine-readable format.</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us through the TypeBeatz platform.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Cookies</h2>
            <p>We use a single session cookie to keep you logged in. We do not use tracking cookies, advertising cookies, or third-party analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify users of significant changes by posting a notice within the app. Continued use of the Service after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Contact</h2>
            <p>Questions about this Privacy Policy? Contact us through the TypeBeatz platform.</p>
          </section>
        </div>
      </div>

      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} TypeBeatz. All rights reserved.
      </footer>
    </div>
  );
}
