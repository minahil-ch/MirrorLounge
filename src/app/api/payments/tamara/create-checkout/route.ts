import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { tamaraService } from '@/lib/tamaraService';
import { TamaraCheckoutRequest } from '@/types/payment';

// Validation schema for Tamara checkout request
const createCheckoutSchema = z.object({
  order_reference_id: z.string().min(1),
  total_amount: z.object({
    amount: z.number().positive(),
    currency: z.string().min(3).max(3),
  }),
  description: z.string().optional(),
  country_code: z.string().length(2).default('SA'),
  payment_type: z.enum(['PAY_BY_INSTALMENTS', 'PAY_BY_LATER', 'PAY_BY_NEXT_MONTH']).default('PAY_BY_INSTALMENTS'),
  instalments: z.number().min(2).max(12).optional(),
  locale: z.string().default('ar_SA'),
  items: z.array(z.object({
    name: z.string(),
    type: z.string(),
    reference_id: z.string(),
    sku: z.string().optional(),
    image_url: z.string().url().optional(),
    item_url: z.string().url().optional(),
    unit_price: z.object({
      amount: z.number().positive(),
      currency: z.string().min(3).max(3),
    }),
    tax_amount: z.object({
      amount: z.number().min(0),
      currency: z.string().min(3).max(3),
    }).optional(),
    discount_amount: z.object({
      amount: z.number().min(0),
      currency: z.string().min(3).max(3),
    }).optional(),
    quantity: z.number().positive(),
  })).min(1),
  consumer: z.object({
    first_name: z.string(),
    last_name: z.string(),
    phone_number: z.string(),
    email: z.string().email(),
    date_of_birth: z.string().optional(),
    national_id: z.string().optional(),
  }),
  shipping_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string(),
    postal_code: z.string().optional(),
    country_code: z.string().length(2),
    phone_number: z.string().optional(),
  }),
  billing_address: z.object({
    first_name: z.string(),
    last_name: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    region: z.string(),
    postal_code: z.string().optional(),
    country_code: z.string().length(2),
    phone_number: z.string().optional(),
  }).optional(),
  discount: z.object({
    name: z.string(),
    amount: z.object({
      amount: z.number().min(0),
      currency: z.string().min(3).max(3),
    }),
  }).optional(),
  shipping_amount: z.object({
    amount: z.number().min(0),
    currency: z.string().min(3).max(3),
  }).optional(),
  tax_amount: z.object({
    amount: z.number().min(0),
    currency: z.string().min(3).max(3),
  }).optional(),
  merchant_url: z.object({
    success: z.string().url(),
    failure: z.string().url(),
    cancel: z.string().url(),
    notification: z.string().url(),
  }),
  platform: z.string().default('web'),
  is_mobile: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Tamara is configured
    if (!tamaraService.isTamaraConfigured()) {
      return NextResponse.json(
        { error: 'Tamara is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createCheckoutSchema.safeParse(body);
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

    // Create Tamara checkout request
    const tamaraRequest: TamaraCheckoutRequest = {
      order_reference_id: data.order_reference_id,
      total_amount: data.total_amount,
      description: data.description,
      country_code: data.country_code,
      payment_type: data.payment_type,
      instalments: data.instalments,
      locale: data.locale,
      items: data.items,
      consumer: data.consumer,
      shipping_address: data.shipping_address,
      billing_address: data.billing_address || data.shipping_address,
      discount: data.discount,
      shipping_amount: data.shipping_amount,
      tax_amount: data.tax_amount,
      merchant_url: data.merchant_url,
      platform: data.platform,
      is_mobile: data.is_mobile,
    };

    // Create checkout using Tamara service
    const checkout = await tamaraService.createCheckout(tamaraRequest);

    return NextResponse.json({
      success: true,
      data: {
        checkout_id: checkout.checkout_id,
        checkout_url: checkout.checkout_url,
        order_id: checkout.order_id,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('Tamara checkout creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout',
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