import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

const LandingPage   = lazy(() => import('./pages/LandingPage'));
const LoginPage     = lazy(() => import('./pages/LoginPage'));
const AppPage       = lazy(() => import('./pages/AppPage'));
const AdminPage     = lazy(() => import('./pages/AdminPage'));
const TermsPage     = lazy(() => import('./pages/TermsPage'));
const PrivacyPage   = lazy(() => import('./pages/PrivacyPage'));
const RefundPage    = lazy(() => import('./pages/RefundPage'));
const NotFoundPage  = lazy(() => import('./pages/NotFoundPage'));
const AccountPage   = lazy(() => import('./pages/AccountPage'));
const UpgradePage   = lazy(() => import('./pages/UpgradePage'));
const SuccessPage   = lazy(() => import('./pages/SuccessPage'));

function PageLoader() {
  return (
    <div style={{ minHeight: '100vh', background: '#050a13', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 28, height: 28, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.08)', borderTopColor: '#3b82f6', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/"       element={<LandingPage />} />
                <Route path="/login"  element={<LoginPage />} />

                <Route path="/app" element={
                  <ProtectedRoute><AppPage /></ProtectedRoute>
                } />
                <Route path="/upgrade" element={
                  <ProtectedRoute><UpgradePage /></ProtectedRoute>
                } />
                <Route path="/success" element={
                  <ProtectedRoute><SuccessPage /></ProtectedRoute>
                } />
                <Route path="/account" element={
                  <ProtectedRoute><AccountPage /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly={true}><AdminPage /></ProtectedRoute>
                } />

                <Route path="/terms"   element={<TermsPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/refund"  element={<RefundPage />} />
                <Route path="*"        element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
