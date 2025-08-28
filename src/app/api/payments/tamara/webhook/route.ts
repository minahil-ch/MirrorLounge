import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { tamaraService } from '@/lib/tamaraService';
import { TamaraWebhookEvent } from '@/types/payment';

export async function POST(request: NextRequest) {
  try {
    // Check if Tamara is configured
    if (!tamaraService.isTamaraConfigured()) {
      return NextResponse.json(
        { error: 'Tamara is not configured' },
        { status: 503 }
      );
    }

    const body = await request.text();
    const headersList = headers();
    const signature = headersList.get('x-tamara-signature') || headersList.get('tamara-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Tamara signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const isValidSignature = tamaraService.verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      console.error('Tamara webhook signature verification failed');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Parse webhook event
    let event: TamaraWebhookEvent;
    try {
      event = JSON.parse(body) as TamaraWebhookEvent;
    } catch (error) {
      console.error('Failed to parse Tamara webhook payload:', error);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event.event_type) {
      case 'order_approved':
        await handleOrderApproved(event.data);
        break;
      
      case 'order_declined':
        await handleOrderDeclined(event.data);
        break;
      
      case 'order_expired':
        await handleOrderExpired(event.data);
        break;
      
      case 'order_canceled':
        await handleOrderCanceled(event.data);
        break;
      
      case 'order_captured':
        await handleOrderCaptured(event.data);
        break;
      
      case 'order_refunded':
        await handleOrderRefunded(event.data);
        break;
      
      default:
        console.log(`Unhandled Tamara event type: ${event.event_type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Tamara webhook processing failed:', error);
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
async function handleOrderApproved(orderData: any) {
  console.log('Tamara order approved:', orderData.order_id);
  
  // TODO: Update your database with approved order
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'approved');
    // await sendOrderApprovedEmail(orderData.consumer.email);
    console.log(`Order ${orderData.order_id} approved for amount ${orderData.total_amount.amount}`);
  } catch (error) {
    console.error('Failed to process approved order:', error);
  }
}

async function handleOrderDeclined(orderData: any) {
  console.log('Tamara order declined:', orderData.order_id);
  
  // TODO: Update your database with declined order
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'declined');
    // await sendOrderDeclinedEmail(orderData.consumer.email);
    console.log(`Order ${orderData.order_id} was declined`);
  } catch (error) {
    console.error('Failed to process declined order:', error);
  }
}

async function handleOrderExpired(orderData: any) {
  console.log('Tamara order expired:', orderData.order_id);
  
  // TODO: Update your database with expired order
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'expired');
    // await handleExpiredOrderCleanup(orderData.order_reference_id);
    console.log(`Order ${orderData.order_id} has expired`);
  } catch (error) {
    console.error('Failed to process expired order:', error);
  }
}

async function handleOrderCanceled(orderData: any) {
  console.log('Tamara order canceled:', orderData.order_id);
  
  // TODO: Update your database with canceled order
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'canceled');
    // await processOrderCancellation(orderData.order_reference_id);
    console.log(`Order ${orderData.order_id} was canceled`);
  } catch (error) {
    console.error('Failed to process canceled order:', error);
  }
}

async function handleOrderCaptured(orderData: any) {
  console.log('Tamara order captured:', orderData.order_id);
  
  // TODO: Update your database with captured payment
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'captured');
    // await fulfillOrder(orderData.order_reference_id);
    // await sendOrderConfirmationEmail(orderData.consumer.email);
    console.log(`Order ${orderData.order_id} payment captured for amount ${orderData.captured_amount?.amount}`);
  } catch (error) {
    console.error('Failed to process captured order:', error);
  }
}

async function handleOrderRefunded(orderData: any) {
  console.log('Tamara order refunded:', orderData.order_id);
  
  // TODO: Update your database with refunded payment
  try {
    // await updateOrderStatus(orderData.order_reference_id, 'refunded');
    // await processRefund(orderData.order_reference_id, orderData.refunded_amount);
    // await sendRefundConfirmationEmail(orderData.consumer.email);
    console.log(`Order ${orderData.order_id} refunded for amount ${orderData.refunded_amount?.amount}`);
  } catch (error) {
    console.error('Failed to process refunded order:', error);
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Tamara-Signature, Tamara-Signature',
    },
  });
}