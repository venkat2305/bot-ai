"use client";
import React from 'react';
import Link from 'next/link';
import { Mail, Phone } from 'lucide-react';

const ContactSection = () => {
  return (
    <footer className="py-12 border-t border-gray-700/50">
      <div className="text-center">
        <h3 className="text-2xl font-semibold text-white">Questions?</h3>
        <p className="text-gray-300 mt-2 mb-6">
          We're here to help. Contact us for any inquiries.
        </p>
        <div className="flex justify-center items-center gap-4 text-gray-300">
           <Mail size={18} className="text-blue-400" />
           <a href="mailto:heliobvsr2002@gmail.com" className="hover:text-blue-400 transition-colors">
            heliobvsr2002@gmail.com
           </a>
        </div>
      </div>
      <div className="mt-10 pt-8 border-t border-gray-700/50 text-center text-sm text-gray-400">
        <div className="flex justify-center gap-6 mb-4">
          <Link href="/legal/terms"><span className="hover:text-blue-400 transition-colors">Terms & Conditions</span></Link>
          <Link href="/legal/privacy"><span className="hover:text-blue-400 transition-colors">Privacy Policy</span></Link>
          <Link href="/legal/refund"><span className="hover:text-blue-400 transition-colors">Refund Policy</span></Link>
        </div>
        <p>© {new Date().getFullYear()} Bot AI. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default ContactSection;
