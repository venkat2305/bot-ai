import Razorpay from "razorpay";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";
import { razorpayCircuitBreaker } from "./circuit-breaker";

// Validate environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  throw new Error(
    "Missing required Razorpay environment variables. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set."
  );
}

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

// Export the configured instance
export default razorpay;

// Export environment variables for frontend usage
export const RAZORPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

// Utility functions for common Razorpay operations
export class RazorpayService {
  /**
   * Create a Razorpay customer
   */
  static async createCustomer(customerData: {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, any>;
  }) {
    try {
      const customer = await razorpayCircuitBreaker.execute(async () => {
        return await razorpay.customers.create(customerData);
      });
      return { success: true, data: customer };
    } catch (error) {
      console.error("Error creating Razorpay customer:", error);
      return { success: false, error };
    }
  }

  /**
   * Fetch customers by email (using direct API call since SDK doesn't support email filter)
   */
  static async fetchCustomerByEmail(email: string) {
    try {
      const response = await fetch(`https://api.razorpay.com/v1/customers?email=${encodeURIComponent(email)}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const customerData = await response.json();
        if (customerData.items && customerData.items.length > 0) {
          return { success: true, data: customerData.items[0] };
        } else {
          return { success: false, error: { message: 'No customer found with this email' } };
        }
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData };
      }
    } catch (error) {
      console.error("Error fetching Razorpay customer by email:", error);
      return { success: false, error };
    }
  }

  /**
   * Create or fetch existing customer
   */
  static async createOrFetchCustomer(customerData: {
    name: string;
    email: string;
    contact?: string;
    notes?: Record<string, any>;
  }) {
    // Try to create customer first
    const createResult = await this.createCustomer(customerData);
    
    if (createResult.success) {
      return createResult;
    }

    // If customer already exists, fetch the existing one
    const error = createResult.error as any;
    if (error?.statusCode === 400 && 
        error?.error?.code === 'BAD_REQUEST_ERROR' &&
        error?.error?.description?.includes('Customer already exists')) {
      
      console.log('Customer already exists, fetching existing customer...');
      return await this.fetchCustomerByEmail(customerData.email);
    }

    // If it's a different error, return the original error
    return createResult;
  }

  /**
   * Create a subscription
   */
  static async createSubscription(subscriptionData: {
    plan_id: string;
    customer_id: string;
    total_count: number;
    notes?: Record<string, any>;
  }) {
    try {
      const subscription = await razorpayCircuitBreaker.execute(async () => {
        return await razorpay.subscriptions.create(subscriptionData);
      });
      return { success: true, data: subscription };
    } catch (error) {
      console.error("Error creating Razorpay subscription:", error);
      return { success: false, error };
    }
  }

  /**
   * Fetch subscription details
   */
  static async fetchSubscription(subscriptionId: string) {
    try {
      const subscription = await razorpayCircuitBreaker.execute(async () => {
        return await razorpay.subscriptions.fetch(subscriptionId);
      });
      return { success: true, data: subscription };
    } catch (error) {
      console.error("Error fetching Razorpay subscription:", error);
      return { success: false, error };
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtCycleEnd: boolean = false
  ) {
    try {
      const subscription = await razorpayCircuitBreaker.execute(async () => {
        return await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      });
      return { success: true, data: subscription };
    } catch (error) {
      console.error("Error cancelling Razorpay subscription:", error);
      return { success: false, error };
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(
    paymentId: string,
    refundData: {
      amount?: number;
      speed?: "normal" | "optimum";
      notes?: Record<string, any>;
    }
  ) {
    try {
      const refund = await razorpayCircuitBreaker.execute(async () => {
        return await razorpay.payments.refund(paymentId, refundData);
      });
      return { success: true, data: refund };
    } catch (error) {
      console.error("Error creating refund:", error);
      return { success: false, error };
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(
    webhookBody: string,
    webhookSignature: string,
    webhookSecret: string
  ): boolean {
    try {
      return validateWebhookSignature(
        webhookBody,
        webhookSignature,
        webhookSecret
      );
    } catch (error) {
      console.error("Error verifying webhook signature:", error);
      return false;
    }
  }

  /**
   * Verify payment signature
   */
  static verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
  ): boolean {
    try {
      const generatedSignature = new (Razorpay as any)().utils.generateSignature(
        orderId,
        paymentId
      );
      return generatedSignature === signature;
    } catch (error) {
      console.error("Error verifying payment signature:", error);
      return false;
    }
  }
}

// Error handling utility
export function handleRazorpayError(error: any) {
  if (error.statusCode) {
    // Razorpay API error
    return {
      code: error.error?.code || "RAZORPAY_ERROR",
      description:
        error.error?.description || "An error occurred with Razorpay",
      statusCode: error.statusCode,
    };
  }

  // Generic error
  return {
    code: "UNKNOWN_ERROR",
    description: error.message || "An unknown error occurred",
    statusCode: 500,
  };
}
 