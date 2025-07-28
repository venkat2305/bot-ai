import { Document, Types } from 'mongoose';

// Subscription status enum
export type SubscriptionStatus = 
  | 'created' 
  | 'authenticated' 
  | 'active' 
  | 'cancelled' 
  | 'past_due' 
  | 'unpaid' 
  | 'halted' 
  | 'completed';

// User subscription tier
export type SubscriptionTier = 'free' | 'pro';

// Subscription document interface
export interface ISubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  razorpaySubscriptionId: string;
  razorpayCustomerId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelledAt?: Date;
  gracePeriodEnd?: Date;
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtual properties
  isActive: boolean;
  isInGracePeriod: boolean;
}

// Frontend subscription data (sanitized)
export interface SubscriptionData {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: string; // ISO date string
  currentPeriodEnd: string;   // ISO date string
  cancelledAt?: string;
  isActive: boolean;
  isInGracePeriod: boolean;
}

// Subscription creation payload
export interface CreateSubscriptionPayload {
  planId: string;
  userId: string;
  customerData?: {
    name: string;
    email: string;
    contact?: string;
  };
}

// Subscription update payload
export interface UpdateSubscriptionPayload {
  status?: SubscriptionStatus;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelledAt?: Date;
  gracePeriodEnd?: Date;
  metadata?: Record<string, any>;
}

// Razorpay subscription webhook payload
export interface RazorpaySubscriptionWebhook {
  entity: 'event';
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    subscription: {
      entity: {
        id: string;
        entity: 'subscription';
        plan_id: string;
        customer_id: string;
        status: string;
        current_start: number; // Unix timestamp
        current_end: number;   // Unix timestamp
        ended_at?: number;
        quantity: number;
        notes: Record<string, any>;
        charge_at: number;
        start_at: number;
        end_at?: number;
        auth_attempts: number;
        total_count: number;
        paid_count: number;
        customer_notify: boolean;
        created_at: number;
        expire_by?: number;
        short_url: string;
        has_scheduled_changes: boolean;
        change_scheduled_at?: number;
        source: string;
        offer_id?: string;
        remaining_count: number;
      };
    };
    payment?: {
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