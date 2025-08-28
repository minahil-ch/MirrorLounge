import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripeService } from '@/lib/stripeService';
import { StripeWebhookEvent } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
    if (!stripeService.isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: StripeWebhookEvent;
    try {
      event = stripeService.verifyWebhookSignature(body, signature) as StripeWebhookEvent;
    } catch (error) {
      console.error('Stripe webhook signature verification failed:', error);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentIntentCanceled(event.data.object);
        break;
      
      case 'payment_intent.requires_action':
        await handlePaymentIntentRequiresAction(event.data.object);
        break;
      
      case 'charge.dispute.created':
        await handleChargeDisputeCreated(event.data.object);
        break;
      
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json(
      { 
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Event handlers
async function handlePaymentIntentSucceeded(paymentIntent: any) {
  console.log('Payment succeeded:', paymentIntent.id);
  
  // TODO: Update your database with successful payment
  // Example: Update order status, send confirmation email, etc.
  try {
    // await updateOrderStatus(paymentIntent.metadata.order_id, 'paid');
    // await sendPaymentConfirmationEmail(paymentIntent.receipt_email);
    console.log(`Payment intent ${paymentIntent.id} succeeded for amount ${paymentIntent.amount}`);
  } catch (error) {
    console.error('Failed to process successful payment:', error);
  }
}

async function handlePaymentIntentFailed(paymentIntent: any) {
  console.log('Payment failed:', paymentIntent.id);
  
  // TODO: Update your database with failed payment
  try {
    // await updateOrderStatus(paymentIntent.metadata.order_id, 'failed');
    // await sendPaymentFailedEmail(paymentIntent.receipt_email);
    console.log(`Payment intent ${paymentIntent.id} failed`);
  } catch (error) {
    console.error('Failed to process failed payment:', error);
  }
}

async function handlePaymentIntentCanceled(paymentIntent: any) {
  console.log('Payment canceled:', paymentIntent.id);
  
  // TODO: Update your database with canceled payment
  try {
    // await updateOrderStatus(paymentIntent.metadata.order_id, 'canceled');
    console.log(`Payment intent ${paymentIntent.id} was canceled`);
  } catch (error) {
    console.error('Failed to process canceled payment:', error);
  }
}

async function handlePaymentIntentRequiresAction(paymentIntent: any) {
  console.log('Payment requires action:', paymentIntent.id);
  
  // TODO: Handle payments that require additional authentication
  try {
    // await updateOrderStatus(paymentIntent.metadata.order_id, 'requires_action');
    console.log(`Payment intent ${paymentIntent.id} requires additional action`);
  } catch (error) {
    console.error('Failed to process payment requiring action:', error);
  }
}

async function handleChargeDisputeCreated(dispute: any) {
  console.log('Charge dispute created:', dispute.id);
  
  // TODO: Handle dispute notifications
  try {
    // await notifyAdminOfDispute(dispute);
    // await updateOrderStatus(dispute.charge.metadata.order_id, 'disputed');
    console.log(`Dispute created for charge ${dispute.charge.id}`);
  } catch (error) {
    console.error('Failed to process dispute:', error);
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Stripe-Signature',
    },
  });
}