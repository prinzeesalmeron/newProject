import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Lazy load monitoring and real-time services after initial render
setTimeout(() => {
  import('./lib/services/monitoringService').then(({ MonitoringService }) => {
    MonitoringService.initialize();
  });
  import('./lib/services/realTimeService').then(({ RealTimeService }) => {
    RealTimeService.initialize();
  });
}, 2000); // Wait 2 seconds after page load

// Remove StrictMode in production for better performance
// StrictMode causes double renders which can make the app feel sluggish
const isDevelopment = import.meta.env.DEV;

createRoot(document.getElementById('root')!).render(
  isDevelopment ? (
    <StrictMode>
      <App />
    </StrictMode>
  ) : (
    <App />
  )
);
