import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#000000] text-gray-200 p-8 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-12">
        <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: June 2026</p>
        
        <div className="space-y-6 text-gray-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Information We Collect</h2>
            <p>We collect your Google Account email address, display name, profile picture, uploaded documents in the Library, and chat interactions with the AI assistant.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. How We Use Your Information</h2>
            <p>Your data is used solely to provide personalized AI assistance, maintain your chat history, and allow you to index documents for Retrieval-Augmented Generation (RAG). Your audio recordings from the Lecture feature are processed ephemerally and not persisted permanently unless manually saved as notes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Data Sharing</h2>
            <p>We do not share your personal information with third parties. Chat prompts and document excerpts are sent to Google Gemini APIs strictly for processing responses. They are not used to train Google's foundation models according to Google Cloud Enterprise privacy terms.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
