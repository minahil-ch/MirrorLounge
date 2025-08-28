import { stripeService } from './stripeService';
import { tamaraService } from './tamaraService';
import { tabbyService } from './tabbyService';
import {
  PaymentMethod,
  PaymentStatus,
  StripePaymentIntentRequest,
  TamaraCheckoutRequest,
  TabbyPaymentRequest,
} from '@/types/payment';

interface UnifiedPaymentRequest {
  provider: 'stripe' | 'tamara' | 'tabby';
  amount: number;
  currency: string;
  customer?: {
    id?: string;
    email: string;
    phone: string;
    name: string;
    first_name?: string;
    last_name?: string;
  };
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    category?: string;
    sku?: string;
    type?: string;
  }>;
  shipping_address?: {
    first_name: string;
    last_name: string;
    line1: string;
    city: string;
    country_code: string;
    phone_number: string;
  };
  metadata?: Record<string, string | number | boolean>;
  order_id: string;
}

interface UnifiedPaymentResponse {
  provider: string;
  payment_id: string;
  checkout_url?: string;
  client_secret?: string;
  status: PaymentStatus;
  metadata?: Record<string, string | number | boolean>;
}

class PaymentService {
  private availableProviders: PaymentMethod[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    this.availableProviders = [
      {
        id: 'stripe',
        type: 'stripe',
        name: 'Stripe',
        enabled: stripeService.isConfigured(),
      },
      {
        id: 'tamara',
        type: 'tamara',
        name: 'Tamara',
        enabled: tamaraService.isConfigured(),
      },
      {
        id: 'tabby',
        type: 'tabby',
        name: 'Tabby',
        enabled: tabbyService.isConfigured(),
      },
    ];
  }

  getAvailableProviders(): PaymentMethod[] {
    return this.availableProviders.filter(provider => provider.enabled);
  }

  isProviderEnabled(provider: string): boolean {
    const providerConfig = this.availableProviders.find(p => p.id === provider);
    return providerConfig?.enabled || false;
  }

  async createPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    if (!this.isProviderEnabled(request.provider)) {
      throw new Error(`Payment provider ${request.provider} is not configured or enabled`);
    }

    try {
      switch (request.provider) {
        case 'stripe':
          return await this.createStripePayment(request);
        case 'tamara':
          return await this.createTamaraPayment(request);
        case 'tabby':
          return await this.createTabbyPayment(request);
        default:
          throw new Error(`Unsupported payment provider: ${request.provider}`);
      }
    } catch (error) {
      console.error(`Payment creation failed for ${request.provider}:`, error);
      throw error;
    }
  }

  private async createStripePayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    const stripeRequest: StripePaymentIntentRequest = {
      amount: request.amount,
      currency: request.currency,
      customer_id: request.customer?.id,
      metadata: {
        ...request.metadata,
        order_id: request.order_id,
        customer_email: request.customer?.email,
      },
    };

    const response = await stripeService.createPaymentIntent(stripeRequest);

    return {
      provider: 'stripe',
      payment_id: response.payment_intent_id,
      client_secret: response.client_secret,
      status: stripeService.mapStripeStatusToPaymentStatus(response.status),
      metadata: {
        order_id: request.order_id,
      },
    };
  }

  private async createTamaraPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    if (!request.customer || !request.items || !request.shipping_address) {
      throw new Error('Tamara requires customer, items, and shipping address information');
    }

    const tamaraRequest: TamaraCheckoutRequest = {
      total_amount: {
        amount: request.amount,
        currency: request.currency,
      },
      consumer: {
        first_name: request.customer.first_name || request.customer.name.split(' ')[0] || '',
        last_name: request.customer.last_name || request.customer.name.split(' ').slice(1).join(' ') || '',
        phone_number: request.customer.phone,
        email: request.customer.email,
      },
      items: request.items.map(item => ({
        name: item.name,
        type: item.type || 'product',
        reference_id: item.sku || `item-${Date.now()}`,
        sku: item.sku || `sku-${Date.now()}`,
        quantity: item.quantity,
        unit_price: {
          amount: item.unit_price,
          currency: request.currency,
        },
        total_amount: {
          amount: item.quantity * item.unit_price,
          currency: request.currency,
        },
      })),
      shipping_address: request.shipping_address,
      billing_address: request.shipping_address,
      merchant_url: {
        success: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success?provider=tamara&order_id=${request.order_id}`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failure?provider=tamara&order_id=${request.order_id}`,
        cancel: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel?provider=tamara&order_id=${request.order_id}`,
        notification: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/tamara/webhook`,
      },
    };

    const response = await tamaraService.createCheckout(tamaraRequest);

    return {
      provider: 'tamara',
      payment_id: response.order_id,
      checkout_url: response.checkout_url,
      status: 'pending',
      metadata: {
        order_id: request.order_id,
        checkout_id: response.checkout_id,
      },
    };
  }

  private async createTabbyPayment(request: UnifiedPaymentRequest): Promise<UnifiedPaymentResponse> {
    if (!request.customer || !request.items) {
      throw new Error('Tabby requires customer and items information');
    }

    const tabbyRequest: TabbyPaymentRequest = {
      amount: request.amount.toFixed(2),
      currency: request.currency,
      buyer: {
        phone: request.customer.phone,
        email: request.customer.email,
        name: request.customer.name,
      },
      order: {
        reference_id: request.order_id,
        items: request.items.map(item => ({
          title: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price.toFixed(2),
          category: item.category || 'general',
        })),
      },
      merchant_code: process.env.TABBY_MERCHANT_CODE || '',
    };

    const response = await tabbyService.createPayment(tabbyRequest);

    return {
      provider: 'tabby',
      payment_id: response.payment.id,
      checkout_url: response.configuration.available_products.installments[0]?.web_url,
      status: tabbyService.mapTabbyStatusToPaymentStatus(response.payment.status),
      metadata: {
        order_id: request.order_id,
      },
    };
  }

  async getPaymentStatus(provider: string, paymentId: string): Promise<PaymentStatus> {
    if (!this.isProviderEnabled(provider)) {
      throw new Error(`Payment provider ${provider} is not configured or enabled`);
    }

    try {
      switch (provider) {
        case 'stripe':
          return await stripeService.getPaymentStatus(paymentId);
        case 'tamara':
          return await tamaraService.getPaymentStatus(paymentId);
        case 'tabby':
          return await tabbyService.getPaymentStatus(paymentId);
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Failed to get payment status for ${provider}:`, error);
      return 'failed';
    }
  }

  async capturePayment(provider: string, paymentId: string, amount?: number): Promise<Record<string, unknown>> {
    if (!this.isProviderEnabled(provider)) {
      throw new Error(`Payment provider ${provider} is not configured or enabled`);
    }

    try {
      switch (provider) {
        case 'stripe':
          // Stripe payments are automatically captured by default
          const paymentIntent = await stripeService.retrievePaymentIntent(paymentId);
          return paymentIntent;
        case 'tamara':
          if (!amount) {
            throw new Error('Amount is required for Tamara payment capture');
          }
          return await tamaraService.capturePayment(paymentId, {
            amount,
            currency: 'SAR', // Default currency, should be passed as parameter
          });
        case 'tabby':
          if (!amount) {
            throw new Error('Amount is required for Tabby payment capture');
          }
          return await tabbyService.capturePayment(paymentId, amount.toFixed(2));
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Payment capture failed for ${provider}:`, error);
      throw error;
    }
  }

  async refundPayment(provider: string, paymentId: string, amount?: number): Promise<Record<string, unknown>> {
    if (!this.isProviderEnabled(provider)) {
      throw new Error(`Payment provider ${provider} is not configured or enabled`);
    }

    try {
      switch (provider) {
        case 'stripe':
          return await stripeService.createRefund(paymentId, amount);
        case 'tamara':
          if (!amount) {
            throw new Error('Amount is required for Tamara refund');
          }
          return await tamaraService.refundPayment(paymentId, {
            amount,
            currency: 'SAR', // Default currency, should be passed as parameter
          });
        case 'tabby':
          if (!amount) {
            throw new Error('Amount is required for Tabby refund');
          }
          return await tabbyService.refundPayment(paymentId, amount.toFixed(2));
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Payment refund failed for ${provider}:`, error);
      throw error;
    }
  }

  async cancelPayment(provider: string, paymentId: string): Promise<Record<string, unknown>> {
    if (!this.isProviderEnabled(provider)) {
      throw new Error(`Payment provider ${provider} is not configured or enabled`);
    }

    try {
      switch (provider) {
        case 'stripe':
          return await stripeService.cancelPaymentIntent(paymentId);
        case 'tamara':
          // Tamara requires amount for cancellation
          throw new Error('Tamara cancellation requires amount parameter. Use cancelPayment with amount.');
        case 'tabby':
          return await tabbyService.closePayment(paymentId);
        default:
          throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Payment cancellation failed for ${provider}:`, error);
      throw error;
    }
  }

  verifyWebhookSignature(provider: string, payload: string, signature: string): boolean {
    try {
      switch (provider) {
        case 'stripe':
          stripeService.verifyWebhookSignature(payload, signature);
          return true;
        case 'tamara':
          return tamaraService.verifyWebhookSignature(payload, signature);
        case 'tabby':
          return tabbyService.verifyWebhookSignature(payload, signature);
        default:
          return false;
      }
    } catch (error) {
      console.error(`Webhook verification failed for ${provider}:`, error);
      return false;
    }
  }

  // Helper method to validate payment request
  validatePaymentRequest(request: UnifiedPaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.provider) {
      errors.push('Payment provider is required');
    }

    if (!request.amount || request.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!request.currency) {
      errors.push('Currency is required');
    }

    if (!request.order_id) {
      errors.push('Order ID is required');
    }

    if (!request.customer?.email) {
      errors.push('Customer email is required');
    }

    // Provider-specific validations
    if (request.provider === 'tamara') {
      if (!request.items || request.items.length === 0) {
        errors.push('Items are required for Tamara payments');
      }
      if (!request.shipping_address) {
        errors.push('Shipping address is required for Tamara payments');
      }
    }

    if (request.provider === 'tabby') {
      if (!request.items || request.items.length === 0) {
        errors.push('Items are required for Tabby payments');
      }
      if (!request.customer?.phone) {
        errors.push('Customer phone is required for Tabby payments');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const paymentService = new PaymentService();
export default paymentService;
export type { UnifiedPaymentRequest, UnifiedPaymentResponse };