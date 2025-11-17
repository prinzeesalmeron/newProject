import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer, ToastProvider, useToast } from './components/ui/Toast';
import { PaymentProvider } from './components/PaymentProvider';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import CookieConsent from './components/CookieConsent';
import { useAuth } from './lib/auth';
import { LoadingSpinner } from './components/ui';

// Lazy load pages for better performance
const Marketplace = lazy(() => import('./pages/Marketplace').then(m => ({ default: m.Marketplace })));
const Blockchain = lazy(() => import('./pages/Blockchain').then(m => ({ default: m.Blockchain })));
const Learn = lazy(() => import('./pages/Learn').then(m => ({ default: m.Learn })));
const InvestmentDashboard = lazy(() => import('./pages/InvestmentDashboard').then(m => ({ default: m.InvestmentDashboard })));
const Portfolio = lazy(() => import('./pages/Portfolio').then(m => ({ default: m.Portfolio })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Governance = lazy(() => import('./pages/Governance').then(m => ({ default: m.Governance })));
const Staking = lazy(() => import('./pages/Staking').then(m => ({ default: m.Staking })));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));

const AuthCallback = () => {
  const { initialize } = useAuth();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Redirect to main page after successful confirmation
        window.location.href = '/';
      } else {
        // Re-initialize auth to handle the callback
        await initialize();
        // Redirect to main page
        window.location.href = '/';
      }
    };
    
    handleAuthCallback();
  }, [searchParams, initialize]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Confirming your email...</p>
      </div>
    </div>
  );
};

const AppContent = () => {
  const { initialize } = useAuth();
  const { addToast } = useToast();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    (window as any).__toastAddFunction = addToast;

    const handleToastEvent = (e: any) => {
      addToast(e.detail);
    };

    window.addEventListener('toast', handleToastEvent);

    return () => {
      window.removeEventListener('toast', handleToastEvent);
      delete (window as any).__toastAddFunction;
    };
  }, [addToast]);

  const PageLoader = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" data-toast-context>
        <Navbar />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/blockchain" element={<Blockchain />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/dashboard" element={<InvestmentDashboard />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </Suspense>
        <Footer />
        <CookieConsent />
        <ToastContainer />
      </div>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <PaymentProvider>
          <AppContent />
        </PaymentProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;