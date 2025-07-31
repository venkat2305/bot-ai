import React from 'react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-[var(--bg-body)] text-[var(--text-color)]">
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Terms and Conditions</h1>
        <div className="prose dark:prose-invert max-w-none">
          <p>
            Welcome to Bot AI. These terms and conditions outline the rules and regulations for the use of our website and services.
          </p>
          <h2 className="text-2xl font-semibold mt-6">1. Introduction</h2>
          <p>
            By accessing this website, we assume you accept these terms and conditions. Do not continue to use Bot AI if you do not agree to all of the terms and conditions stated on this page.
          </p>
          <h2 className="text-2xl font-semibold mt-6">2. Intellectual Property Rights</h2>
          <p>
            Other than the content you own, under these Terms, Bot AI and/or its licensors own all the intellectual property rights and materials contained in this Website.
          </p>
          <h2 className="text-2xl font-semibold mt-6">3. Restrictions</h2>
          <p>
            You are specifically restricted from all of the following:
          </p>
          <ul>
            <li>publishing any Website material in any other media;</li>
            <li>selling, sublicensing and/or otherwise commercializing any Website material;</li>
            <li>publicly performing and/or showing any Website material;</li>
            <li>using this Website in any way that is or may be damaging to this Website;</li>
            <li>using this Website in any way that impacts user access to this Website;</li>
          </ul>
          <h2 className="text-2xl font-semibold mt-6">4. Your Content</h2>
          <p>
            In these Website Standard Terms and Conditions, “Your Content” shall mean any audio, video text, images or other material you choose to display on this Website. By displaying Your Content, you grant Bot AI a non-exclusive, worldwide irrevocable, sub-licensable license to use, reproduce, adapt, publish, translate and distribute it in any and all media.
          </p>
           <h2 className="text-2xl font-semibold mt-6">5. Governing Law & Jurisdiction</h2>
          <p>
            These Terms will be governed by and interpreted in accordance with the laws of India, and you submit to the non-exclusive jurisdiction of the state and federal courts located in India for the resolution of any disputes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
