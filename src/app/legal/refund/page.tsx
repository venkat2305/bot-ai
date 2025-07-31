import React from 'react';

const RefundPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-color)]">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Refund and Cancellation Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
           <h2 className="text-2xl font-semibold mt-6">Refund Policy</h2>
           <p>
            We offer a 7-day money-back guarantee for our Pro subscription plan. If you are not satisfied with our service, you can request a full refund within 7 days of your purchase.
           </p>
           <p>
            To request a refund, please contact our support team at heliobvsr2002@gmail.com with your purchase details. Refunds will be processed within 7 business days.
           </p>

           <h2 className="text-2xl font-semibold mt-6">Cancellation Policy</h2>
           <p>
            You can cancel your subscription at any time from your account dashboard. Once you cancel, your subscription will remain active until the end of the current billing period. You will not be charged for the next billing cycle.
           </p>
           <p>
            If you have any questions about our refund and cancellation policy, please contact us.
           </p>
        </div>
      </div>
    </div>
  );
};

export default RefundPage;
