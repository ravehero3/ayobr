import React from 'react';
import { useNavigate } from 'react-router-dom';
import typebeatLogo from '../assets/typebeatz logo 2 white version_1754509091303.png';

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-12">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        <div className="space-y-10 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using TypeBeatz ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p>TypeBeatz is a browser-based video generation platform that allows music producers to create type beat videos by combining audio files with images. Video processing occurs entirely within your browser using WebAssembly technology — no audio or image files are uploaded to our servers.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Content Ownership & Rights</h2>
            <p className="mb-3">You retain full ownership of all content you upload to TypeBeatz. By using the Service, you represent and warrant that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You own or have a valid license to all audio files, images, and other content you use with the Service.</li>
              <li>Your use of the Service does not infringe the intellectual property rights of any third party.</li>
              <li>You will not use the Service to create content that violates copyright law, including using unlicensed samples or third-party beats.</li>
              <li>You are solely responsible for any content you create, distribute, or publish using the Service.</li>
            </ul>
            <p className="mt-3">TypeBeatz is not responsible for any copyright claims, DMCA takedowns, or legal disputes arising from content you create. We do not monitor or review user-generated content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Subscriptions & Billing</h2>
            <p className="mb-3">TypeBeatz offers a free tier and a paid PRO subscription:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Free tier:</strong> 5 video credits per month, reset on the 1st of each month.</li>
              <li><strong className="text-white">PRO subscription:</strong> Unlimited video generation for $9.99/month, billed monthly through Paddle.</li>
            </ul>
            <p className="mt-3">You may cancel your PRO subscription at any time. Cancellation takes effect at the end of your current billing period, after which you will revert to the free tier. We do not offer refunds for partial billing periods.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Prohibited Uses</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service to violate any applicable law or regulation.</li>
              <li>Attempt to reverse engineer, decompile, or extract the source code of the Service.</li>
              <li>Use automated scripts to generate video content in bulk in violation of rate limits.</li>
              <li>Share account access or credentials with third parties.</li>
              <li>Use the Service to distribute malware, spam, or harmful content.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
            <p>The Service is provided "as is" and "as available" without warranties of any kind. TypeBeatz does not warrant that the Service will be uninterrupted, error-free, or free from bugs. We reserve the right to modify or discontinue the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, TypeBeatz shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to lost profits, data loss, or copyright disputes related to your content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the Service after changes are posted constitutes acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Contact</h2>
            <p>Questions about these terms? Contact us through the TypeBeatz platform.</p>
          </section>
        </div>
      </div>

      <footer className="py-8 px-6 border-t border-white/[0.06] text-center text-gray-600 text-sm">
        © {new Date().getFullYear()} TypeBeatz. All rights reserved.
      </footer>
    </div>
  );
}
