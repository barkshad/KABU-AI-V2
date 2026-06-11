import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-white mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: June 2026</p>
        
        <div className="space-y-6 text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Kabu AI, you accept and agree to be bound by the terms and provision of this agreement. This service is exclusively for the students, faculty, and staff of Kabarak University.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Service Description</h2>
            <p>Kabu AI provides AI-assisted academic research and learning tools. The AI models (powered by Google Gemini) may generate inaccurate or incomplete information. Users are responsible for verifying any AI-generated academic content before use.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Data & Firebase Storage</h2>
            <p>Your session data, documents, and chat histories are securely stored in Firebase Cloud Firestore. Access to your data is restricted by Firebase Security Rules specific to your Kabarak University workspace tenant ID. We do not sell your data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Appropriate Use</h2>
            <p>You agree to use Kabu AI strictly for educational and research purposes. Uploading restricted, copyrighted, or highly sensitive confidential materials without authorization is prohibited.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
