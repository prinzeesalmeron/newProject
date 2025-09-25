import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { MonitoringService } from './lib/services/monitoringService';
import { RealTimeService } from './lib/services/realTimeService';

// Initialize monitoring and real-time services
MonitoringService.initialize();
RealTimeService.initialize();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
