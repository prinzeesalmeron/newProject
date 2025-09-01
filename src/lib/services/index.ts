// Service layer exports for backend core development
export { TransactionEngine } from './transactionEngine';
export { RoleManager } from './roleManager';
export { EmailService } from './emailService';

// Re-export types
export type { InvestmentRequest, WithdrawalRequest, RentalDistribution } from './transactionEngine';
export type { UserRole, RolePermissions } from './roleManager';
export type { EmailTemplate, EmailData } from './emailService';