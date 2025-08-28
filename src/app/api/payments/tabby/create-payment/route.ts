import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tabbyService } from '@/lib/tabbyService';
import { TabbyPaymentRequest } from '@/types/payment';

// Validation schema for Tabby payment request
const createPaymentSchema = z.object({
  amount: z.string().regex(/^\d+\.\d{2}$/), // Amount as string with 2 decimal places
  currency: z.string().length(3),
  description: z.string().optional(),
  buyer: z.object({
    phone: z.string(),
    email: z.string().email(),
    name: z.string(),
    dob: z.string().optional(), // Date of birth in YYYY-MM-DD format
  }),
  shipping_address: z.object({
    city: z.string(),
    address: z.string(),
    zip: z.string().optional(),
  }).optional(),
  order: z.object({
    tax_amount: z.string().regex(/^\d+\.\d{2}$/).optional(),
    shipping_amount: z.string().regex(/^\d+\.\d{2}$/).optional(),
    discount_amount: z.string().regex(/^\d+\.\d{2}$/).optional(),
    updated_at: z.string().optional(),
    reference_id: z.string(),
    items: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      quantity: z.number().positive(),
      unit_price: z.string().regex(/^\d+\.\d{2}$/),
      discount_amount: z.string().regex(/^\d+\.\d{2}$/).optional(),
      reference_id: z.string(),
      image_url: z.string().url().optional(),
      product_url: z.string().url().optional(),
      gender: z.enum(['male', 'female', 'unisex']).optional(),
      category: z.string().optional(),
    })).min(1),
  }),
  buyer_history: z.object({
    registered_since: z.string().optional(),
    loyalty_level: z.number().min(0).max(5).optional(),
    wishlist_count: z.number().min(0).optional(),
    is_social_networks_connected: z.boolean().optional(),
    is_phone_number_verified: z.boolean().optional(),
    is_email_verified: z.boolean().optional(),
  }).optional(),
  order_history: z.array(z.object({
    purchased_at: z.string(),
    amount: z.string().regex(/^\d+\.\d{2}$/),
    payment_method: z.enum(['card', 'cod', 'other']),
    status: z.enum(['new', 'processing', 'shipped', 'delivered', 'cancelled']),
  })).optional(),
  meta: z.object({
    order_id: z.string().optional(),
    customer: z.string().optional(),
  }).optional(),
  merchant_code: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Tabby is configured
    if (!tabbyService.isTabbyConfigured()) {
      return NextResponse.json(
        { error: 'Tabby is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createPaymentSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Create Tabby payment request
    const tabbyRequest: TabbyPaymentRequest = {
      amount: data.amount,
      currency: data.currency,
      description: data.description,
      buyer: data.buyer,
      shipping_address: data.shipping_address,
      order: {
        ...data.order,
        updated_at: data.order.updated_at || new Date().toISOString(),
      },
      buyer_history: data.buyer_history,
      order_history: data.order_history,
      meta: data.meta,
      merchant_code: data.merchant_code || process.env.TABBY_MERCHANT_CODE || '',
    };

    // Create payment using Tabby service
    const payment = await tabbyService.createPayment(tabbyRequest);

    return NextResponse.json({
      success: true,
      data: {
        payment_id: payment.payment.id,
        checkout_url: payment.configuration.available_products.installments[0]?.web_url,
        status: payment.payment.status,
        amount: payment.payment.amount,
        currency: payment.payment.currency,
        created_at: payment.payment.created_at,
      },
    });

  } catch (error) {
    console.error('Tabby payment creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}