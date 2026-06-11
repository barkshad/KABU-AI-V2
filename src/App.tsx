/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from './services/auth';
import { dbService } from './services/database';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import WorkspacePage from './pages/WorkspacePage';
import ChatPage from './pages/ChatPage';
import AnalyzePage from './pages/AnalyzePage';
import TranscribePage from './pages/TranscribePage';
import ResourcesPage from './pages/ResourcesPage';
import BookmarksPage from './pages/BookmarksPage';
import SettingsPage from './pages/SettingsPage';
import LibraryPage from './pages/LibraryPage';
import FlashcardsPage from './pages/FlashcardsPage';
import LecturePage from './pages/LecturePage';
import Layout from './components/Layout';
import AdminDashboard from './pages/admin/AdminDashboard';
import TermsPage from './pages/legal/TermsPage';
import PrivacyPage from './pages/legal/PrivacyPage';
import DataPolicyPage from './pages/legal/DataPolicyPage';
import SetupPage from './pages/SetupPage';

import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import HelpPage from './pages/public/HelpPage';
import FaqPage from './pages/public/FaqPage';
import NotFoundPage from './pages/public/NotFoundPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import InstallPWA from './components/InstallPWA';
import { ThemeProvider } from './lib/theme';

import { Toaster } from 'sonner';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>('student');

  useEffect(() => {
    // Ping setup endpoint to initialize any stored Gemini/Kimi key on the backend
    const storedGemini = localStorage.getItem('SETUP_GEMINI_API_KEY');
    const storedKimi = localStorage.getItem('SETUP_KIMI_API_KEY');

    if (storedGemini || storedKimi) {
      fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey: storedGemini, kimiKey: storedKimi })
      }).catch(e => console.error("Could not sync api keys", e));
    }

    // Initial fetch
    authService.getCurrentUser().then(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkUserRole(currentUser);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const unsubscribe = authService.onAuthStateChange(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await checkUserRole(currentUser);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe.unsubscribe();
    };
  }, []);

  const checkUserRole = async (currentUser: any) => {
    const email = currentUser.email || "";

    if (email === 'admin@kabarak.ac.ke' || email === 'punkpixel42@gmail.com') {
      setRole('admin');
    }

    try {
      try {
        const userDoc = await dbService.getDocument('profiles', currentUser.id);
        if (userDoc) {
          setRole(userDoc.role || 'student');
        }
      } catch (err: any) {
        // Create initial user doc if missing
        const isAdminUser = email === 'admin@kabarak.ac.ke' || email === 'punkpixel42@gmail.com';
        try {
          await dbService.addDocument('profiles', {
            id: currentUser.id,
            name: currentUser.user_metadata?.full_name || email.split('@')[0],
            email: email,
            role: isAdminUser ? 'admin' : 'student',
            created_at: new Date().toISOString()
          });
        } catch (e: any) {
          console.error("Supabase insert error:", e);
        }
        setRole(isAdminUser ? 'admin' : 'student');
      }
    } catch (error: any) {
      console.error("Supabase user sync error:", error.message, error);
    }
  };

  if (loading) {
    return <div className="h-screen w-full flex items-center justify-center bg-black text-white px-4 text-sm font-medium tracking-widest uppercase"><div className="w-4 h-4 rounded-full border-2 border-white/20 border-r-white animate-spin mr-3"/> Loading Workspace...</div>;
  }

  return (
    <ThemeProvider>
      <Toaster theme="dark" position="top-center" />
      <Router>
        <InstallPWA />
        <Routes>
          <Route path="/setup" element={<SetupPage />} />
          <Route path="/admin-login" element={!user ? <AdminLoginPage /> : <Navigate to={role === 'admin' ? '/admin' : '/workspace'} />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/workspace" />} />
          <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/workspace" />} />
          <Route path="/forgot-password" element={!user ? <ForgotPasswordPage /> : <Navigate to="/workspace" />} />
          <Route path="/signup" element={<Navigate to="/register" />} />
          <Route path="/terms-and-conditions" element={<TermsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPage />} />
          <Route path="/data-protection" element={<DataPolicyPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/faq" element={<FaqPage />} />
          
          <Route path="/" element={user ? <Layout user={user} role={role} /> : <Navigate to="/login" />}>
            <Route index element={<Navigate to="/workspace" />} />
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="chat" element={<ChatPage user={user} />} />
            <Route path="chat/:chatId" element={<ChatPage user={user} />} />
            <Route path="analyze" element={<AnalyzePage />} />
            <Route path="transcribe" element={<TranscribePage />} />
            <Route path="resources" element={<ResourcesPage />} />
            <Route path="bookmarks" element={<BookmarksPage />} />
            <Route path="settings" element={<SettingsPage user={user} />} />
            
            <Route path="library" element={<Navigate to="/resources" />} />
            <Route path="flashcards" element={<FlashcardsPage />} />
            <Route path="lecture" element={<Navigate to="/transcribe" />} />
            
            <Route path="admin" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/workspace" />} />
            <Route path="admin/:tab" element={role === 'admin' ? <AdminDashboard /> : <Navigate to="/workspace" />} />
          </Route>
          
          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
