// Common Payment Types
export interface PaymentMethod {
  id: string;
  type: 'stripe' | 'tamara' | 'tabby';
  name: string;
  enabled: boolean;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  customer_id?: string;
  metadata?: Record<string, string | number | boolean>;
  created_at: Date;
  updated_at: Date;
}

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// Stripe Types
export interface StripePaymentIntentRequest {
  amount: number;
  currency: string;
  customer_id?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface StripePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  status: string;
}

// Tamara Types
export interface TamaraCheckoutRequest {
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
  items: TamaraItem[];
  shipping_address: TamaraAddress;
  billing_address?: TamaraAddress;
  merchant_url: {
    success: string;
    failure: string;
    cancel: string;
    notification: string;
  };
}

export interface TamaraItem {
  name: string;
  type: string;
  reference_id: string;
  sku: string;
  quantity: number;
  unit_price: {
    amount: number;
    currency: string;
  };
  total_amount: {
    amount: number;
    currency: string;
  };
}

export interface TamaraAddress {
  first_name: string;
  last_name: string;
  line1: string;
  city: string;
  country_code: string;
  phone_number: string;
}

// Tabby Types
export interface TabbyPaymentRequest {
  amount: string;
  currency: string;
  buyer: {
    phone: string;
    email: string;
    name: string;
  };
  order: {
    reference_id: string;
    items: TabbyItem[];
  };
  merchant_code: string;
}

export interface TabbyItem {
  title: string;
  quantity: number;
  unit_price: string;
  category: string;
}

// Webhook Types
export interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payment_id: string;
  payload: Record<string, unknown>;
  status: 'received' | 'processed' | 'failed';
  received_at: Date;
  processed_at?: Date;
}

// Dashboard Types
export interface PaymentStats {
  total_revenue: number;
  total_transactions: number;
  success_rate: number;
  active_customers: number;
}

export interface RecentTransaction {
  id: string;
  customer_name: string;
  amount: number;
  currency: string;
  provider: string;
  status: PaymentStatus;
  created_at: Date;
}