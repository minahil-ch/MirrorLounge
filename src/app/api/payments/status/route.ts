import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { paymentService } from '@/lib/paymentService';
import { PaymentProvider } from '@/types/payment';

// Request validation schema
const PaymentStatusRequestSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  provider: z.enum(['stripe', 'tamara', 'tabby'] as const, {
    errorMap: () => ({ message: 'Provider must be stripe, tamara, or tabby' })
  })
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validationResult = PaymentStatusRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors
        },
        { status: 400 }
      );
    }

    const { paymentId, provider } = validationResult.data;

    // Check if the provider is enabled
    if (!paymentService.isProviderEnabled(provider as PaymentProvider)) {
      return NextResponse.json(
        { error: `${provider} is not configured or enabled` },
        { status: 503 }
      );
    }

    // Get payment status
    const paymentStatus = await paymentService.getPaymentStatus(
      paymentId,
      provider as PaymentProvider
    );

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paymentStatus
    });

  } catch (error: unknown) {
    console.error('Payment status check failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Payment not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return NextResponse.json(
          { error: 'Authentication failed with payment provider' },
          { status: 401 }
        );
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment status',
        message: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// GET method for retrieving payment status via query parameters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const provider = searchParams.get('provider');

    if (!paymentId || !provider) {
      return NextResponse.json(
        { error: 'Missing required parameters: paymentId and provider' },
        { status: 400 }
      );
    }

    // Validate provider
    if (!['stripe', 'tamara', 'tabby'].includes(provider)) {
      return NextResponse.json(
        { error: 'Invalid provider. Must be stripe, tamara, or tabby' },
        { status: 400 }
      );
    }

    // Check if the provider is enabled
    if (!paymentService.isProviderEnabled(provider as PaymentProvider)) {
      return NextResponse.json(
        { error: `${provider} is not configured or enabled` },
        { status: 503 }
      );
    }

    // Get payment status
    const paymentStatus = await paymentService.getPaymentStatus(
      paymentId,
      provider as PaymentProvider
    );

    if (!paymentStatus) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: paymentStatus
    });

  } catch (error) {
    console.error('Payment status check failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to retrieve payment status',
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}