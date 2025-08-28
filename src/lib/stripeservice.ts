import Stripe from 'stripe';
import { StripePaymentIntentRequest, StripePaymentIntentResponse, PaymentStatus } from '@/types/payment';

class StripeService {
  private stripe: Stripe | null = null;

  constructor() {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-06-20',
      });
    }
  }

  private ensureStripeInitialized(): Stripe {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Please check your environment variables.');
    }
    return this.stripe;
  }

  async createPaymentIntent(request: StripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    const stripe = this.ensureStripeInitialized();

    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency.toLowerCase(),
        customer: request.customer_id,
        metadata: request.metadata || {},
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return {
        client_secret: paymentIntent.client_secret!,
        payment_intent_id: paymentIntent.id,
        status: paymentIntent.status,
      };
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = this.ensureStripeInitialized();

    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error('Failed to retrieve payment intent:', error);
      throw new Error(`Failed to retrieve payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.PaymentIntent> {
    const stripe = this.ensureStripeInitialized();

    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {};
      if (paymentMethodId) {
        confirmParams.payment_method = paymentMethodId;
      }

      return await stripe.paymentIntents.confirm(paymentIntentId, confirmParams);
    } catch (error) {
      console.error('Failed to confirm payment intent:', error);
      throw new Error(`Failed to confirm payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = this.ensureStripeInitialized();

    try {
      return await stripe.paymentIntents.cancel(paymentIntentId);
    } catch (error) {
      console.error('Failed to cancel payment intent:', error);
      throw new Error(`Failed to cancel payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const stripe = this.ensureStripeInitialized();

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Convert to cents
      }

      return await stripe.refunds.create(refundParams);
    } catch (error) {
      console.error('Failed to create refund:', error);
      throw new Error(`Failed to create refund: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  verifyWebhookSignature(payload: string, signature: string): Record<string, unknown> {
    const stripe = this.ensureStripeInitialized();
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      throw new Error('Stripe webhook secret is not configured');
    }

    try {
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      console.error('Webhook signature verification failed:', error);
      throw new Error(`Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  mapStripeStatusToPaymentStatus(stripeStatus: string): PaymentStatus {
    switch (stripeStatus) {
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
        return 'pending';
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  async getPaymentStatus(paymentIntentId: string): Promise<PaymentStatus> {
    try {
      const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);
      return this.mapStripeStatusToPaymentStatus(paymentIntent.status);
    } catch (error) {
      console.error('Failed to get payment status:', error);
      return 'failed';
    }
  }

  isConfigured(): boolean {
    return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PUBLISHABLE_KEY;
  }
}

export const stripeService = new StripeService();
export default stripeService;