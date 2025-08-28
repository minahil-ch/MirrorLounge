import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { stripeService } from '@/lib/stripeService';
import { StripePaymentIntentRequest } from '@/types/payment';

// Validation schema for Stripe payment intent request
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().min(3).max(3),
  customer_email: z.string().email(),
  customer_name: z.string().optional(),
  metadata: z.record(z.string()).optional(),
  automatic_payment_methods: z.object({
    enabled: z.boolean(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    
    // Validate request body
    const validationResult = createPaymentIntentSchema.safeParse(body);
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

    // Create Stripe payment intent request
    const stripeRequest: StripePaymentIntentRequest = {
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency.toLowerCase(),
      customer_email: data.customer_email,
      customer_name: data.customer_name,
      metadata: {
        ...data.metadata,
        created_at: new Date().toISOString(),
      },
      automatic_payment_methods: data.automatic_payment_methods || {
        enabled: true,
      },
    };

    // Create payment intent using Stripe service
    const paymentIntent = await stripeService.createPaymentIntent(stripeRequest);

    return NextResponse.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });

  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create payment intent',
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