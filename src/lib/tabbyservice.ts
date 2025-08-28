import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { TabbyPaymentRequest, PaymentStatus } from '@/types/payment';

interface TabbyPaymentResponse {
  payment: {
    id: string;
    status: string;
  };
  configuration: {
    available_products: {
      installments: Array<{
        web_url: string;
      }>;
    };
  };
}

interface TabbyPaymentDetails {
  id: string;
  status: string;
  amount: string;
  currency: string;
  order: {
    reference_id: string;
  };
  buyer: {
    phone: string;
    email: string;
    name: string;
  };
}

class TabbyService {
  private client: AxiosInstance | null = null;
  private secretKey: string | null = null;
  private publicKey: string | null = null;
  private baseUrl: string;

  constructor() {
    this.secretKey = process.env.TABBY_SECRET_KEY || null;
    this.publicKey = process.env.TABBY_PUBLIC_KEY || null;
    this.baseUrl = process.env.TABBY_API_URL || 'https://api.tabby.ai';

    if (this.secretKey) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  private ensureClientInitialized(): AxiosInstance {
    if (!this.client) {
      throw new Error('Tabby is not configured. Please check your environment variables.');
    }
    return this.client;
  }

  async createPayment(request: TabbyPaymentRequest): Promise<TabbyPaymentResponse> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post('/api/v2/checkout', {
        payment: {
          amount: request.amount,
          currency: request.currency,
          buyer: request.buyer,
          shipping_address: {
            city: 'Default City',
            address: 'Default Address',
            zip: '00000',
          },
          order: request.order,
          order_history: [],
          meta: {
            order_id: request.order.reference_id,
          },
        },
        lang: 'en',
        merchant_code: request.merchant_code,
        merchant_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/payments/success`,
          cancel: `${process.env.NEXT_PUBLIC_APP_URL}/payments/cancel`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/payments/failure`,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Tabby payment creation failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create Tabby payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to create Tabby payment: Unknown error');
    }
  }

  async getPayment(paymentId: string): Promise<TabbyPaymentDetails> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.get(`/api/v2/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Tabby payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get Tabby payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to get Tabby payment: Unknown error');
    }
  }

  async capturePayment(paymentId: string, amount: string): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/api/v2/payments/${paymentId}/captures`, {
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to capture Tabby payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to capture Tabby payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to capture Tabby payment: Unknown error');
    }
  }

  async refundPayment(paymentId: string, amount: number): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/api/v2/payments/${paymentId}/refunds`, {
        amount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to refund Tabby payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to refund Tabby payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to refund Tabby payment: Unknown error');
    }
  }

  async closePayment(paymentId: string): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/api/v2/payments/${paymentId}/close`);
      return response.data;
    } catch (error) {
      console.error('Failed to close Tabby payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to close Tabby payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to close Tabby payment: Unknown error');
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<Record<string, unknown>> {
    // Tabby webhook signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.TABBY_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    return JSON.parse(payload) as Record<string, unknown>;
  }

  mapTabbyStatusToPaymentStatus(tabbyStatus: string): PaymentStatus {
    switch (tabbyStatus.toLowerCase()) {
      case 'created':
      case 'authorized':
        return 'pending';
      case 'captured':
        return 'completed';
      case 'closed':
        return 'cancelled';
      case 'expired':
      case 'rejected':
        return 'failed';
      case 'refunded':
        return 'refunded';
      default:
        return 'processing';
    }
  }

  async getPaymentStatus(paymentId: string): Promise<Record<string, unknown>> {
    try {
      const payment = await this.getPayment(paymentId);
      return this.mapTabbyStatusToPaymentStatus(payment.status);
    } catch (error) {
      console.error('Failed to get Tabby payment status:', error);
      return 'failed';
    }
  }

  isConfigured(): boolean {
    return !!this.secretKey && !!this.publicKey;
  }

  // Helper method to validate payment request
  validatePaymentRequest(request: TabbyPaymentRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.amount || parseFloat(request.amount) <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (!request.currency) {
      errors.push('Currency is required');
    }

    if (!request.buyer.email || !request.buyer.phone || !request.buyer.name) {
      errors.push('Buyer email, phone, and name are required');
    }

    if (!request.order.reference_id) {
      errors.push('Order reference ID is required');
    }

    if (!request.order.items || request.order.items.length === 0) {
      errors.push('At least one order item is required');
    }

    if (!request.merchant_code) {
      errors.push('Merchant code is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Helper method to calculate total amount from items
  calculateTotalAmount(items: Array<{ quantity: number; unit_price: string }>): string {
    const total = items.reduce((sum, item) => {
      return sum + (item.quantity * parseFloat(item.unit_price));
    }, 0);
    return total.toFixed(2);
  }
}

export const tabbyService = new TabbyService();
export default tabbyService;