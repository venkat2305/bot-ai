import React from 'react';

const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-color)]">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            This Privacy Policy describes how your personal information is collected, used, and shared when you use our service.
          </p>
          <h2 className="text-2xl font-semibold mt-6">1. Personal Information We Collect</h2>
          <p>
            When you register for an account, we collect certain information from you, including your name and email address, through Google OAuth. We do not store your password.
          </p>
          <h2 className="text-2xl font-semibold mt-6">2. How Do We Use Your Personal Information?</h2>
          <p>
            We use the information we collect to operate the service, communicate with you, screen for potential risk or fraud, and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.
          </p>
          <h2 className="text-2xl font-semibold mt-6">3. Sharing Your Personal Information</h2>
          <p>
            We do not share your Personal Information with third parties except to comply with applicable laws and regulations, to respond to a subpoena, search warrant or other lawful request for information we receive, or to otherwise protect our rights.
          </p>
           <h2 className="text-2xl font-semibold mt-6">4. Your Rights</h2>
          <p>
            You have the right to access personal information we hold about you and to ask that your personal information be corrected, updated, or deleted. If you would like to exercise this right, please contact us.
          </p>
          <h2 className="text-2xl font-semibold mt-6">5. Contact Us</h2>
          <p>
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by e-mail at heliobvsr2002@gmail.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
