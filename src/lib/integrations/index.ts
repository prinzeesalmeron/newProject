/**
 * Third-Party Integrations
 * Centralized exports for all external service integrations
 */

// KYC & Identity Verification
export { PersonaKYCService } from './personaKYC';
export type {
  PersonaInquiryConfig,
  PersonaVerificationResult
} from './personaKYC';

// Payment Processing
export { StripePaymentService } from './stripePayments';
export type {
  PaymentMethodDetails,
  PaymentIntentResult,
  SubscriptionPlan
} from './stripePayments';

// Email Communications
export { ResendEmailService } from './resendEmail';
export type {
  EmailTemplate,
  EmailOptions,
  EmailResult
} from './resendEmail';

// Property Data
export { PropertyDataService } from './propertyDataAPI';
export type {
  PropertyDetails,
  RentalMarketData
} from './propertyDataAPI';

// Market Data
export { MarketDataService } from './marketDataService';
export type {
  CryptoMarketData,
  RealEstateMarketData,
  TokenizedREMarketData
} from './marketDataService';

// Integration Monitoring
export {
  IntegrationMonitorService,
  monitoredAPICall
} from './integrationMonitor';
export type {
  IntegrationHealth,
  IntegrationMetrics
} from './integrationMonitor';

/**
 * Initialize all integrations
 */
export async function initializeIntegrations(): Promise<void> {
  try {
    // Start integration monitoring
    IntegrationMonitorService.startMonitoring();

    // Initialize Stripe
    await StripePaymentService.initialize();

    console.log('✅ All integrations initialized successfully');
  } catch (error) {
    console.error('❌ Integration initialization failed:', error);
    throw error;
  }
}

/**
 * Shutdown all integrations gracefully
 */
export function shutdownIntegrations(): void {
  IntegrationMonitorService.stopMonitoring();
  console.log('🛑 All integrations shut down');
}

/**
 * Health check for all integrations
 */
export async function checkIntegrationHealth() {
  return IntegrationMonitorService.checkAllIntegrations();
}

/**
 * Get integration dashboard metrics
 */
export async function getIntegrationDashboard() {
  return IntegrationMonitorService.getDashboardData();
}
