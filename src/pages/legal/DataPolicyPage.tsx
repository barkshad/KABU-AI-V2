import React from 'react';

export default function DataPolicyPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-white mb-6">Data Protection Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Respecting your rights and isolation boundaries.</p>
        
        <div className="space-y-6 text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Multi-Tenant Architecture</h2>
            <p>Your data is logically separated inside Google Cloud Firestore. Security rules ensure that no cross-tenant or cross-user data leakage can occur. Only you have read/write access to your chat histories and personal lecture notes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Your Rights</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Right to Access:</strong> You can view all your stored resources in the App Library.</li>
              <li><strong>Right to Erasure:</strong> You can delete any chat, document, or lecture recording. If you wish to delete your entire account, you can contact the system administrator.</li>
              <li><strong>Right to Export:</strong> You can copy and export compiled notes from the application.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
