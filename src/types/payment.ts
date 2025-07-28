import { Document, Types } from 'mongoose';

// Payment status enum
export type PaymentStatus = 
  | 'created' 
  | 'authorized' 
  | 'captured' 
  | 'refunded' 
  | 'failed';

// Payment method enum
export type PaymentMethod = 
  | 'card' 
  | 'netbanking' 
  | 'wallet' 
  | 'upi' 
  | 'emi' 
  | 'paylater';

// Payment document interface
export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subscriptionId: Types.ObjectId;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  amount: number; // Amount in paise
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  refundId?: string;
  refundAmount: number;
  refundedAt?: Date;
  refundReason?: string;
  gatewayData: Record<string, any>;
  failureReason?: string;
  notes: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isSuccessful: boolean;
  isRefunded: boolean;
  refundPercentage: number;
}

// Frontend payment data (sanitized)
export interface PaymentData {
  id: string;
  userId: string;
  subscriptionId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  isSuccessful: boolean;
  isRefunded: boolean;
  refundAmount: number;
  refundPercentage: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Payment creation payload
export interface CreatePaymentPayload {
  userId: string;
  subscriptionId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature?: string;
  amount: number;
  currency?: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  gatewayData?: Record<string, any>;
  notes?: Record<string, any>;
}

// Payment update payload
export interface UpdatePaymentPayload {
  status?: PaymentStatus;
  method?: PaymentMethod;
  razorpaySignature?: string;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: Date;
  refundReason?: string;
  failureReason?: string;
  gatewayData?: Record<string, any>;
  notes?: Record<string, any>;
}

// Refund request payload
export interface RefundRequestPayload {
  paymentId: string;
  amount?: number; // Optional for partial refund
  speed?: 'normal' | 'optimum';
  reason?: string;
  notes?: Record<string, any>;
}

// Refund response data
export interface RefundResponseData {
  id: string;
  entity: 'refund';
  amount: number;
  currency: string;
  payment_id: string;
  notes: Record<string, any>;
  receipt?: string;
  acquirer_data: Record<string, any>;
  created_at: number;
  batch_id?: string;
  status: 'pending' | 'processed' | 'failed';
  speed_processed: 'normal' | 'optimum';
  speed_requested: 'normal' | 'optimum';
}

// Payment verification payload (from frontend)
export interface PaymentVerificationPayload {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  razorpay_subscription_id?: string;
}

// Razorpay payment webhook payload
export interface RazorpayPaymentWebhook {
  entity: 'event';
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: {
        id: string;
        entity: 'payment';
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        invoice_id?: string;
        international: boolean;
        method: string;
        amount_refunded: number;
        refund_status?: string;
        captured: boolean;
        description?: string;
        card_id?: string;
        bank?: string;
        wallet?: string;
        vpa?: string;
        email: string;
        contact: string;
        notes: Record<string, any>;
        fee: number;
        tax: number;
        error_code?: string;
        error_description?: string;
        error_source?: string;
        error_step?: string;
        error_reason?: string;
        acquirer_data: Record<string, any>;
        created_at: number;
      };
    };
  };
  created_at: number;
} 