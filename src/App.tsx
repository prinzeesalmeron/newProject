import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer, ToastProvider, useToast } from './components/ui/Toast';
import { PaymentProvider } from './components/PaymentProvider';
import { Navbar } from './components/Navbar';
import { Marketplace } from './pages/Marketplace';
import { Blockchain } from './pages/Blockchain';
import { Learn } from './pages/Learn';
import { InvestmentDashboard } from './pages/InvestmentDashboard';
import { Portfolio } from './pages/Portfolio';
import { Payments } from './pages/Payments';
import { Governance } from './pages/Governance';
import { Footer } from './components/Footer';
import { useAuth } from './lib/auth';

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

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors" data-toast-context>
        <Navbar />
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/blockchain" element={<Blockchain />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/dashboard" element={<InvestmentDashboard />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
        <Footer />
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