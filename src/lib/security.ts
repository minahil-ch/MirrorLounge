import crypto from 'crypto';
import { z } from 'zod';

/**
 * Security utilities for payment processing
 */
export class PaymentSecurity {
  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): Record<string, unknown> {
    try {
      const elements = signature.split(',');
      const signatureElements: { [key: string]: string } = {};

      elements.forEach((element) => {
        const [key, value] = element.split('=');
        signatureElements[key] = value;
      });

      const timestamp = signatureElements.t;
      const signatures = [
        signatureElements.v1,
        signatureElements.v0,
      ].filter(Boolean);

      if (!timestamp || signatures.length === 0) {
        return false;
      }

      // Check timestamp (prevent replay attacks)
      const timestampNumber = parseInt(timestamp, 10);
      const currentTime = Math.floor(Date.now() / 1000);
      const tolerance = 300; // 5 minutes

      if (Math.abs(currentTime - timestampNumber) > tolerance) {
        console.error('Stripe webhook timestamp too old');
        return false;
      }

      // Verify signature
      const payloadForSignature = `${timestamp}.${payload}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payloadForSignature)
        .digest('hex');

      return signatures.some((sig) => {
        return crypto.timingSafeEqual(
          Buffer.from(expectedSignature, 'hex'),
          Buffer.from(sig, 'hex')
        );
      });
    } catch (error) {
      console.error('Stripe signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify Tamara webhook signature
   */
  static verifyTamaraSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Tamara signature verification failed:', error);
      return false;
    }
  }

  /**
   * Verify Tabby webhook signature
   */
  static verifyTabbySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('base64');

      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Tabby signature verification failed:', error);
      return false;
    }
  }

  /**
   * Sanitize and validate payment amount
   */
  static validateAmount(amount: number, currency: string): boolean {
    // Check if amount is positive
    if (amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    // Check for reasonable limits
    const maxAmounts: { [key: string]: number } = {
      SAR: 100000, // 100,000 SAR
      AED: 100000, // 100,000 AED
      USD: 25000,  // 25,000 USD
      EUR: 25000,  // 25,000 EUR
    };

    const maxAmount = maxAmounts[currency.toUpperCase()] || 25000;
    if (amount > maxAmount) {
      throw new Error(`Payment amount exceeds maximum limit for ${currency}`);
    }

    // Check for decimal precision (max 2 decimal places)
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 2) {
      throw new Error('Payment amount cannot have more than 2 decimal places');
    }

    return true;
  }

  /**
   * Validate email address
   */
  static validateEmail(email: string): boolean {
    const emailSchema = z.string().email();
    try {
      emailSchema.parse(email);
      return true;
    } catch {
      throw new Error('Invalid email address format');
    }
  }

  /**
   * Validate phone number
   */
  static validatePhone(phone: string, countryCode?: string): boolean {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');

    // Basic validation - should be between 7 and 15 digits
    if (cleanPhone.length < 7 || cleanPhone.length > 15) {
      throw new Error('Invalid phone number length');
    }

    // Country-specific validation
    if (countryCode) {
      const patterns: { [key: string]: RegExp } = {
        SA: /^(\+966|966|0)?[5][0-9]{8}$/, // Saudi Arabia
        AE: /^(\+971|971|0)?[5][0-9]{8}$/, // UAE
        KW: /^(\+965|965)?[569][0-9]{7}$/, // Kuwait
      };

      const pattern = patterns[countryCode.toUpperCase()];
      if (pattern && !pattern.test(phone)) {
        throw new Error(`Invalid phone number format for ${countryCode}`);
      }
    }

    return true;
  }

  /**
   * Sanitize string input to prevent XSS
   */
  static sanitizeString(input: string): string {
    return input
      .replace(/[<>"'&]/g, (match) => {
        const entities: { [key: string]: string } = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;',
        };
        return entities[match] || match;
      })
      .trim();
  }

  /**
   * Generate secure random string for order IDs
   */
  static generateSecureId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomBytes[i] % chars.length];
    }
    
    return result;
  }

  /**
   * Rate limiting helper
   */
  static createRateLimiter(windowMs: number, maxRequests: number) {
    const requests = new Map<string, { count: number; resetTime: number }>();

    return (identifier: string): boolean => {
      const now = Date.now();

      // Clean up old entries
      for (const [key, value] of requests.entries()) {
        if (value.resetTime < now) {
          requests.delete(key);
        }
      }

      const current = requests.get(identifier);
      
      if (!current) {
        requests.set(identifier, { count: 1, resetTime: now + windowMs });
        return true;
      }

      if (current.count >= maxRequests) {
        return false; // Rate limit exceeded
      }

      current.count++;
      return true;
    };
  }

  /**
   * Validate currency code
   */
  static validateCurrency(currency: string): boolean {
    const supportedCurrencies = ['SAR', 'AED', 'USD', 'EUR', 'KWD'];
    
    if (!supportedCurrencies.includes(currency.toUpperCase())) {
      throw new Error(`Unsupported currency: ${currency}`);
    }

    return true;
  }

  /**
   * Validate country code
   */
  static validateCountry(countryCode: string): boolean {
    const supportedCountries = ['SA', 'AE', 'KW', 'US', 'GB'];
    
    if (!supportedCountries.includes(countryCode.toUpperCase())) {
      throw new Error(`Unsupported country: ${countryCode}`);
    }

    return true;
  }

  /**
   * Mask sensitive data for logging
   */
  static maskSensitiveData(data: unknown): unknown {
    const sensitiveFields = [
      'email',
      'phone',
      'phone_number',
      'card_number',
      'cvv',
      'password',
      'token',
      'secret',
      'key',
    ];

    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const masked = { ...data };

    for (const [key, value] of Object.entries(masked)) {
      const lowerKey = key.toLowerCase();
      
      if (sensitiveFields.some(field => lowerKey.includes(field))) {
        if (typeof value === 'string') {
          if (lowerKey.includes('email')) {
            // Mask email: user@example.com -> u***@e***.com
            const [local, domain] = value.split('@');
            if (local && domain) {
              const maskedLocal = local[0] + '*'.repeat(Math.max(0, local.length - 1));
              const maskedDomain = domain[0] + '*'.repeat(Math.max(0, domain.length - 4)) + domain.slice(-3);
              masked[key] = `${maskedLocal}@${maskedDomain}`;
            }
          } else {
            // Mask other sensitive fields
            masked[key] = value.slice(0, 2) + '*'.repeat(Math.max(0, value.length - 4)) + value.slice(-2);
          }
        }
      } else if (typeof value === 'object') {
        masked[key] = this.maskSensitiveData(value);
      }
    }

    return masked;
  }

  /**
   * Log security events
   */
  static logSecurityEvent(
    event: string,
    details: unknown,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      severity,
      details: this.maskSensitiveData(details),
    };

    // In production, send to security monitoring service
    console.log('Security Event:', JSON.stringify(logEntry, null, 2));
  }
}