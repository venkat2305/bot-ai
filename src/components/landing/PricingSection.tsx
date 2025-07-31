"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { SUBSCRIPTION_PLANS, DEFAULT_PLAN } from '@/config/subscription-plans';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

const PricingSection = () => {
  const proPlan = SUBSCRIPTION_PLANS.PRO_MONTHLY;
  const freePlan = DEFAULT_PLAN;

  return (
    <section className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white">Choose Your Plan</h2>
        <p className="text-lg text-gray-300 mt-4">
          Start for free, or unlock premium features with our Pro plan.
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="p-8 rounded-xl bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 shadow-lg"
        >
          <h3 className="text-2xl font-semibold text-white">{freePlan.name}</h3>
          <p className="text-4xl font-bold my-4 text-white">₹0</p>
          <p className="text-gray-300 mb-6">{freePlan.description}</p>
          <ul className="space-y-3 mb-8">
            {freePlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check size={18} className="text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href={`/chat/${uuidv4()}`} passHref>
            <button className="w-full px-6 py-3 rounded-lg font-semibold bg-gray-700 hover:bg-gray-600 text-white transition-colors">
              Get Started
            </button>
          </Link>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="p-8 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 shadow-xl relative"
        >
          <div className="absolute top-0 right-8 -mt-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 text-sm font-semibold rounded-full flex items-center gap-1">
            <Star size={14} /> Popular
          </div>
          <h3 className="text-2xl font-semibold text-white">{proPlan.name}</h3>
          <p className="text-4xl font-bold my-4 text-white">₹{proPlan.price / 100} <span className="text-lg text-gray-300">/ month</span></p>
          <p className="text-gray-300 mb-6">{proPlan.description}</p>
          <ul className="space-y-3 mb-8">
            {proPlan.features.map((feature, i) => (
              <li key={i} className="flex items-center gap-3">
                <Check size={18} className="text-green-400" />
                <span className="text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
           <Link href={`/chat/${uuidv4()}`} passHref>
            <button className="w-full px-6 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg">
              Upgrade to Pro
            </button>
          </Link>
        </motion.div>
      </div>
       <p className="text-center text-sm text-gray-400 mt-8">7-day refund guarantee on Pro plan.</p>
    </section>
  );
};

export default PricingSection;
