import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { ToastContainer } from './components/ui/Toast';
import { Navbar } from './components/Navbar';
import { Marketplace } from './pages/Marketplace';
import { Staking } from './pages/Staking';
import { Learn } from './pages/Learn';
import { InvestmentDashboard } from './pages/InvestmentDashboard';
import { Portfolio } from './pages/Portfolio';
import { Governance } from './pages/Governance';
import { Blockchain } from './pages/Blockchain';
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

function App() {
  const { initialize } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Navbar />
          <Routes>
            <Route path="/" element={<Marketplace />} />
            <Route path="/staking" element={<Staking />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/governance" element={<Governance />} />
            <Route path="/dashboard" element={<InvestmentDashboard />} />
            <Route path="/blockchain" element={<Blockchain />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
          <Footer />
          <ToastContainer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;