import { ethers } from 'ethers';
import { AuditService } from '../services/auditService';

export class ContractValidator {
  /**
   * Validate Ethereum address
   */
  static validateAddress(address: string): { valid: boolean; error?: string } {
    if (!address) {
      return { valid: false, error: 'Address is required' };
    }

    // Basic Ethereum address format check: 0x followed by 40 hex characters
    const addressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!addressRegex.test(address)) {
      return { valid: false, error: 'Invalid Ethereum address format' };
    }

    // Check for zero address
    const zeroAddress = '0x0000000000000000000000000000000000000000';
    if (address.toLowerCase() === zeroAddress) {
      return { valid: false, error: 'Cannot use zero address' };
    }

    // Optionally use ethers.utils.isAddress for checksum validation if available
    try {
      if (ethers && ethers.utils && ethers.utils.isAddress && !ethers.utils.isAddress(address)) {
        return { valid: false, error: 'Invalid address checksum' };
      }
    } catch (e) {
      // If ethers is not available, fallback to regex validation only
    }

    return { valid: true };
  }

  /**
   * Validate token amount
   */
  static validateTokenAmount(
    amount: number | string,
    min: number = 1,
    max: number = 1000000
  ): { valid: boolean; error?: string } {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

    if (isNaN(numAmount)) {
      return { valid: false, error: 'Invalid token amount' };
    }

    if (numAmount < min) {
      return { valid: false, error: `Amount must be at least ${min}` };
    }

    if (numAmount > max) {
      return { valid: false, error: `Amount cannot exceed ${max}` };
    }

    if (!Number.isInteger(numAmount)) {
      return { valid: false, error: 'Amount must be a whole number' };
    }

    return { valid: true };
  }

  /**
   * Validate price (in ETH)
   */
  static validatePrice(
    price: string | number,
    min: string = '0.0001',
    max: string = '10000'
  ): { valid: boolean; error?: string } {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;

    if (isNaN(numPrice)) {
      return { valid: false, error: 'Invalid price' };
    }

    const minPrice = parseFloat(min);
    const maxPrice = parseFloat(max);

    if (numPrice < minPrice) {
      return { valid: false, error: `Price must be at least ${min} ETH` };
    }

    if (numPrice > maxPrice) {
      return { valid: false, error: `Price cannot exceed ${max} ETH` };
    }

    // Validate it can be parsed as ETH
    try {
      ethers.utils.parseEther(price.toString());
    } catch (error) {
      return { valid: false, error: 'Invalid ETH amount format' };
    }

    return { valid: true };
  }

  /**
   * Validate property listing parameters
   */
  static validatePropertyListing(params: {
    title: string;
    location: string;
    totalTokens: number;
    pricePerToken: string;
    metadataURI: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate title
    if (!params.title || params.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    }
    if (params.title.length > 100) {
      errors.push('Title cannot exceed 100 characters');
    }

    // Validate location
    if (!params.location || params.location.trim().length < 3) {
      errors.push('Location must be at least 3 characters');
    }
    if (params.location.length > 200) {
      errors.push('Location cannot exceed 200 characters');
    }

    // Validate total tokens
    const tokenValidation = this.validateTokenAmount(
      params.totalTokens,
      1,
      1000000
    );
    if (!tokenValidation.valid) {
      errors.push(tokenValidation.error!);
    }

    // Validate price per token
    const priceValidation = this.validatePrice(params.pricePerToken);
    if (!priceValidation.valid) {
      errors.push(priceValidation.error!);
    }

    // Validate metadata URI
    if (!params.metadataURI || params.metadataURI.trim().length === 0) {
      errors.push('Metadata URI is required');
    }

    try {
      new URL(params.metadataURI);
    } catch {
      errors.push('Invalid metadata URI format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate token purchase parameters
   */
  static validateTokenPurchase(params: {
    propertyId: number;
    amount: number;
    pricePerToken: string;
    maxTotalCost: string;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate property ID
    if (!Number.isInteger(params.propertyId) || params.propertyId < 0) {
      errors.push('Invalid property ID');
    }

    // Validate amount
    const amountValidation = this.validateTokenAmount(params.amount);
    if (!amountValidation.valid) {
      errors.push(amountValidation.error!);
    }

    // Validate price
    const priceValidation = this.validatePrice(params.pricePerToken);
    if (!priceValidation.valid) {
      errors.push(priceValidation.error!);
    }

    // Calculate total cost and validate against maximum
    try {
      const pricePerToken = ethers.utils.parseEther(params.pricePerToken);
      const totalCost = pricePerToken.mul(params.amount);
      const maxCost = ethers.utils.parseEther(params.maxTotalCost);

      if (totalCost.gt(maxCost)) {
        errors.push(
          `Total cost (${ethers.utils.formatEther(
            totalCost
          )} ETH) exceeds maximum allowed (${params.maxTotalCost} ETH)`
        );
      }
    } catch (error) {
      errors.push('Error calculating total cost');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate token transfer parameters
   */
  static validateTokenTransfer(params: {
    to: string;
    propertyId: number;
    amount: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate recipient address
    const addressValidation = this.validateAddress(params.to);
    if (!addressValidation.valid) {
      errors.push(addressValidation.error!);
    }

    // Validate property ID
    if (!Number.isInteger(params.propertyId) || params.propertyId < 0) {
      errors.push('Invalid property ID');
    }

    // Validate amount
    const amountValidation = this.validateTokenAmount(params.amount);
    if (!amountValidation.valid) {
      errors.push(amountValidation.error!);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize string input to prevent injection attacks
   */
  static sanitizeString(input: string, maxLength: number = 200): string {
    // Remove control characters and limit length
    return input
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .slice(0, maxLength);
  }

  /**
   * Validate and sanitize property listing with audit logging
   */
  static async validateAndLogPropertyListing(params: {
    title: string;
    location: string;
    totalTokens: number;
    pricePerToken: string;
    metadataURI: string;
  }): Promise<{ valid: boolean; errors: string[]; sanitized?: any }> {
    // Validate
    const validation = this.validatePropertyListing(params);

    if (!validation.valid) {
      // Log validation failure
      await AuditService.logSecurityEvent({
        eventType: 'contract_validation_failed',
        severity: 'warning',
        description: `Property listing validation failed: ${validation.errors.join(', ')}`,
        metadata: { params }
      });

      return validation;
    }

    // Sanitize
    const sanitized = {
      title: this.sanitizeString(params.title, 100),
      location: this.sanitizeString(params.location, 200),
      totalTokens: params.totalTokens,
      pricePerToken: params.pricePerToken,
      metadataURI: params.metadataURI
    };

    // Log successful validation
    await AuditService.logAudit({
      action: 'validate_property_listing',
      resourceType: 'contract',
      newData: sanitized,
      success: true
    });

    return {
      valid: true,
      errors: [],
      sanitized
    };
  }

  /**
   * Check for suspicious transaction patterns
   */
  static detectSuspiciousTransaction(params: {
    amount: number;
    totalCost: string;
    recentTransactionCount: number;
  }): { suspicious: boolean; reasons: string[] } {
    const reasons: string[] = [];

    // Check for unusually large amounts
    if (params.amount > 10000) {
      reasons.push('Unusually large token amount');
    }

    // Check for high-value transactions
    try {
      const cost = ethers.utils.parseEther(params.totalCost);
      const threshold = ethers.utils.parseEther('100'); // 100 ETH threshold

      if (cost.gt(threshold)) {
        reasons.push('High-value transaction');
      }
    } catch {
      reasons.push('Invalid transaction value');
    }

    // Check for rapid successive transactions
    if (params.recentTransactionCount > 10) {
      reasons.push('Rapid successive transactions detected');
    }

    return {
      suspicious: reasons.length > 0,
      reasons
    };
  }
}
