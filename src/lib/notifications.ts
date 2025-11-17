import { DatabaseService } from './database';

// Email notification service (would integrate with SendGrid, AWS SES, etc.)
export class EmailService {
  static async sendWelcomeEmail(userEmail: string, userName: string) {
    // In production, integrate with email service
    console.log(`Sending welcome email to ${userEmail} for ${userName}`);
    
    // Mock email sending
    return {
      success: true,
      messageId: `welcome-${Date.now()}`
    };
  }

  static async sendInvestmentConfirmation(userEmail: string, propertyTitle: string, amount: number) {
    console.log(`Sending investment confirmation to ${userEmail} for ${propertyTitle} - $${amount}`);
    
    return {
      success: true,
      messageId: `investment-${Date.now()}`
    };
  }

  static async sendRentalIncomeNotification(userEmail: string, amount: number, propertyTitle: string) {
    console.log(`Sending rental income notification to ${userEmail} - $${amount} from ${propertyTitle}`);
    
    return {
      success: true,
      messageId: `rental-${Date.now()}`
    };
  }

  static async sendKYCStatusUpdate(userEmail: string, status: string) {
    console.log(`Sending KYC status update to ${userEmail} - Status: ${status}`);
    
    return {
      success: true,
      messageId: `kyc-${Date.now()}`
    };
  }

  static async sendStakingReward(userEmail: string, amount: number, poolName: string) {
    console.log(`Sending staking reward notification to ${userEmail} - $${amount} from ${poolName}`);
    
    return {
      success: true,
      messageId: `staking-${Date.now()}`
    };
  }
}

// Push notification service
export class PushNotificationService {
  static async sendPushNotification(userId: string, title: string, message: string, data?: any) {
    // In production, integrate with Firebase Cloud Messaging, OneSignal, etc.
    console.log(`Sending push notification to ${userId}: ${title} - ${message}`);
    
    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title,
      message,
      type: 'info',
      metadata: data
    });

    return {
      success: true,
      notificationId: `push-${Date.now()}`
    };
  }
}

// Notification orchestrator
export class NotificationService {
  static async sendWelcomeNotifications(userId: string, userEmail: string, userName: string) {
    // Send welcome email
    await EmailService.sendWelcomeEmail(userEmail, userName);
    
    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title: 'Welcome to BlockEstate!',
      message: 'Your account has been created successfully. Complete your KYC verification to start investing.',
      type: 'success',
      action_url: '/profile/kyc'
    });
  }

  static async sendInvestmentNotifications(userId: string, userEmail: string, propertyTitle: string, amount: number, tokenAmount: number) {
    // Send confirmation email
    await EmailService.sendInvestmentConfirmation(userEmail, propertyTitle, amount);
    
    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title: 'Investment Successful!',
      message: `You have successfully invested $${amount} in ${propertyTitle} and received ${tokenAmount} tokens.`,
      type: 'success',
      action_url: '/dashboard'
    });

    // Send push notification
    await PushNotificationService.sendPushNotification(
      userId,
      'Investment Confirmed',
      `Your investment of $${amount} in ${propertyTitle} has been processed.`,
      { property_title: propertyTitle, amount, token_amount: tokenAmount }
    );
  }

  static async sendRentalIncomeNotifications(userId: string, userEmail: string, amount: number, propertyTitle: string, monthYear: string) {
    // Send email notification
    await EmailService.sendRentalIncomeNotification(userEmail, amount, propertyTitle);
    
    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title: 'Rental Income Received',
      message: `You received $${amount.toFixed(2)} in rental income from ${propertyTitle} for ${monthYear}.`,
      type: 'success',
      action_url: '/dashboard?tab=income'
    });
  }

  static async sendKYCStatusNotifications(userId: string, userEmail: string, status: string, reason?: string) {
    // Send email notification
    await EmailService.sendKYCStatusUpdate(userEmail, status);
    
    const message = status === 'approved' 
      ? 'Your KYC verification has been approved. You can now invest in properties.'
      : status === 'rejected'
      ? `Your KYC verification was rejected. ${reason || 'Please resubmit your documents.'}`
      : 'Your KYC verification is under review.';

    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title: `KYC Status: ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message,
      type: status === 'approved' ? 'success' : status === 'rejected' ? 'error' : 'info',
      action_url: '/profile/kyc'
    });
  }

  static async sendStakingRewardNotifications(userId: string, userEmail: string, amount: number, poolName: string) {
    // Send email notification
    await EmailService.sendStakingReward(userEmail, amount, poolName);
    
    // Create in-app notification
    await DatabaseService.createNotification({
      user_id: userId,
      title: 'Staking Rewards Earned',
      message: `You earned ${amount.toFixed(2)} tokens from staking in ${poolName}.`,
      type: 'success',
      action_url: '/staking'
    });
  }

  static async sendSystemAlert(userId: string, title: string, message: string, type: 'info' | 'warning' | 'error' = 'info') {
    await DatabaseService.createNotification({
      user_id: userId,
      title,
      message,
      type
    });

    // For critical alerts, also send push notification
    if (type === 'error' || type === 'warning') {
      await PushNotificationService.sendPushNotification(userId, title, message);
    }
  }
}