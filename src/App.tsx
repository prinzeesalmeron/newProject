import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Marketplace } from './pages/Marketplace';
import { Staking } from './pages/Staking';
import { Learn } from './pages/Learn';
import { Dashboard } from './pages/Dashboard';
import { InvestmentDashboard } from './pages/InvestmentDashboard';
import { Footer } from './components/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/staking" element={<Staking />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/dashboard" element={<InvestmentDashboard />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;