import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { tabbyService } from '@/lib/tabbyService';
import { TabbyWebhookEvent } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Check if Tabby is configured
    if (!tabbyService.isTabbyConfigured()) {
      return NextResponse.json(
        { error: 'Tabby is not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-tabby-signature') || headersList.get('tabby-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Tabby signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValidSignature = tabbyService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      console.error('Tabby webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook event
    let event: TabbyWebhookEvent;
    try {
      event = JSON.parse(body) as TabbyWebhookEvent;
    } catch (error) {
      console.error('Failed to parse Tabby webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.type) {
      case 'payment.created':
        await handlePaymentCreated(event.data);
        break;
      
      case 'payment.authorized':
        await handlePaymentAuthorized(event.data);
        break;
      
      case 'payment.captured':
        await handlePaymentCaptured(event.data);
        break;
      
      case 'payment.rejected':
        await handlePaymentRejected(event.data);
        break;
      
      case 'payment.canceled':
        await handlePaymentCanceled(event.data);
        break;
      
      case 'payment.expired':
        await handlePaymentExpired(event.data);
        break;
      
      case 'payment.closed':
        await handlePaymentClosed(event.data);
        break;
      
      case 'refund.created':
        await handleRefundCreated(event.data);
        break;
      
      case 'refund.rejected':
        await handleRefundRejected(event.data);
        break;
      
      default:
        console.log(`Unhandled Tabby event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Tabby webhook processing failed:', error);
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
async function handlePaymentCreated(paymentData: any) {
  console.log('Tabby payment created:', paymentData.id);
  
  // TODO: Update your database with created payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'payment_created');
    console.log(`Payment ${paymentData.id} created for amount ${paymentData.amount}`);
  } catch (error) {
    console.error('Failed to process created payment:', error);
  }
}

async function handlePaymentAuthorized(paymentData: any) {
  console.log('Tabby payment authorized:', paymentData.id);
  
  // TODO: Update your database with authorized payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'authorized');
    // await sendPaymentAuthorizedEmail(paymentData.buyer.email);
    console.log(`Payment ${paymentData.id} authorized for amount ${paymentData.amount}`);
  } catch (error) {
    console.error('Failed to process authorized payment:', error);
  }
}

async function handlePaymentCaptured(paymentData: any) {
  console.log('Tabby payment captured:', paymentData.id);
  
  // TODO: Update your database with captured payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'captured');
    // await fulfillOrder(paymentData.order.reference_id);
    // await sendPaymentConfirmationEmail(paymentData.buyer.email);
    console.log(`Payment ${paymentData.id} captured for amount ${paymentData.captures[0]?.amount}`);
  } catch (error) {
    console.error('Failed to process captured payment:', error);
  }
}

async function handlePaymentRejected(paymentData: any) {
  console.log('Tabby payment rejected:', paymentData.id);
  
  // TODO: Update your database with rejected payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'rejected');
    // await sendPaymentRejectedEmail(paymentData.buyer.email);
    console.log(`Payment ${paymentData.id} was rejected`);
  } catch (error) {
    console.error('Failed to process rejected payment:', error);
  }
}

async function handlePaymentCanceled(paymentData: any) {
  console.log('Tabby payment canceled:', paymentData.id);
  
  // TODO: Update your database with canceled payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'canceled');
    // await handlePaymentCancellation(paymentData.order.reference_id);
    console.log(`Payment ${paymentData.id} was canceled`);
  } catch (error) {
    console.error('Failed to process canceled payment:', error);
  }
}

async function handlePaymentExpired(paymentData: any) {
  console.log('Tabby payment expired:', paymentData.id);
  
  // TODO: Update your database with expired payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'expired');
    // await handleExpiredPaymentCleanup(paymentData.order.reference_id);
    console.log(`Payment ${paymentData.id} has expired`);
  } catch (error) {
    console.error('Failed to process expired payment:', error);
  }
}

async function handlePaymentClosed(paymentData: any) {
  console.log('Tabby payment closed:', paymentData.id);
  
  // TODO: Update your database with closed payment
  try {
    // await updateOrderStatus(paymentData.order.reference_id, 'closed');
    console.log(`Payment ${paymentData.id} was closed`);
  } catch (error) {
    console.error('Failed to process closed payment:', error);
  }
}

async function handleRefundCreated(refundData: any) {
  console.log('Tabby refund created:', refundData.id);
  
  // TODO: Update your database with refund information
  try {
    // await processRefund(refundData.payment_id, refundData.amount);
    // await sendRefundConfirmationEmail(refundData.payment.buyer.email);
    console.log(`Refund ${refundData.id} created for payment ${refundData.payment_id} with amount ${refundData.amount}`);
  } catch (error) {
    console.error('Failed to process refund:', error);
  }
}

async function handleRefundRejected(refundData: any) {
  console.log('Tabby refund rejected:', refundData.id);
  
  // TODO: Handle rejected refund
  try {
    // await handleRejectedRefund(refundData.payment_id, refundData.amount);
    // await notifyRefundRejection(refundData.payment.buyer.email);
    console.log(`Refund ${refundData.id} was rejected for payment ${refundData.payment_id}`);
  } catch (error) {
    console.error('Failed to process rejected refund:', error);
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Tabby-Signature, Tabby-Signature',
    },
  });
}