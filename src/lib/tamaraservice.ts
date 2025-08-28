import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { TamaraCheckoutRequest, PaymentStatus } from '@/types/payment';

interface TamaraCheckoutResponse {
  checkout_id: string;
  checkout_url: string;
  order_id: string;
}

interface TamaraOrderResponse {
  order_id: string;
  status: string;
  total_amount: {
    amount: number;
    currency: string;
  };
  consumer: {
    first_name: string;
    last_name: string;
    phone_number: string;
    email: string;
  };
}

class TamaraService {
  private client: AxiosInstance | null = null;
  private apiToken: string | null = null;
  private notificationKey: string | null = null;
  private baseUrl: string;

  constructor() {
    this.apiToken = process.env.TAMARA_API_TOKEN || null;
    this.notificationKey = process.env.TAMARA_NOTIFICATION_KEY || null;
    this.baseUrl = process.env.TAMARA_API_URL || 'https://api.tamara.co';

    if (this.apiToken) {
      this.client = axios.create({
        baseURL: this.baseUrl,
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });
    }
  }

  private ensureClientInitialized(): AxiosInstance {
    if (!this.client) {
      throw new Error('Tamara is not configured. Please check your environment variables.');
    }
    return this.client;
  }

  async createCheckout(request: TamaraCheckoutRequest): Promise<TamaraCheckoutResponse> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post('/checkout', request);
      return response.data;
    } catch (error) {
      console.error('Tamara checkout creation failed:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to create Tamara checkout: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to create Tamara checkout: Unknown error');
    }
  }

  async getOrder(orderId: string): Promise<TamaraOrderResponse> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get Tamara order:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to get Tamara order: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to get Tamara order: Unknown error');
    }
  }

  async capturePayment(orderId: string, totalAmount: { amount: number; currency: string }): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/orders/${orderId}/capture`, {
        total_amount: totalAmount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to capture Tamara payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to capture Tamara payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to capture Tamara payment: Unknown error');
    }
  }

  async cancelOrder(orderId: string, totalAmount: { amount: number; currency: string }): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/orders/${orderId}/cancel`, {
        total_amount: totalAmount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to cancel Tamara order:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to cancel Tamara order: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to cancel Tamara order: Unknown error');
    }
  }

  async refundPayment(orderId: string, refundAmount: { amount: number; currency: string }): Promise<Record<string, unknown>> {
    const client = this.ensureClientInitialized();

    try {
      const response = await client.post(`/orders/${orderId}/refund`, {
        total_amount: refundAmount,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to refund Tamara payment:', error);
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to refund Tamara payment: ${error.response?.data?.message || error.message}`);
      }
      throw new Error('Failed to refund Tamara payment: Unknown error');
    }
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<Record<string, unknown>> {
    // Tamara webhook signature verification
    const expectedSignature = crypto
      .createHmac('sha256', process.env.TAMARA_WEBHOOK_SECRET || '')
      .update(payload)
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    return JSON.parse(payload) as Record<string, unknown>;
  }

  mapTamaraStatusToPaymentStatus(tamaraStatus: string): PaymentStatus {
    switch (tamaraStatus.toLowerCase()) {
      case 'new':
      case 'processing':
        return 'processing';
      case 'approved':
      case 'captured':
        return 'completed';
      case 'canceled':
      case 'cancelled':
        return 'cancelled';
      case 'declined':
      case 'expired':
        return 'failed';
      case 'refunded':
        return 'refunded';
      default:
        return 'pending';
    }
  }

  async getPaymentStatus(orderId: string): Promise<PaymentStatus> {
    try {
      const order = await this.getOrder(orderId);
      return this.mapTamaraStatusToPaymentStatus(order.status);
    } catch (error) {
      console.error('Failed to get Tamara payment status:', error);
      return 'failed';
    }
  }

  isConfigured(): boolean {
    return !!this.apiToken && !!this.notificationKey;
  }

  // Helper method to validate checkout request
  validateCheckoutRequest(request: TamaraCheckoutRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.total_amount || request.total_amount.amount <= 0) {
      errors.push('Total amount must be greater than 0');
    }

    if (!request.consumer.email || !request.consumer.phone_number) {
      errors.push('Consumer email and phone number are required');
    }

    if (!request.items || request.items.length === 0) {
      errors.push('At least one item is required');
    }

    if (!request.shipping_address || !request.shipping_address.country_code) {
      errors.push('Shipping address with country code is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const tamaraService = new TamaraService();
export default tamaraService;