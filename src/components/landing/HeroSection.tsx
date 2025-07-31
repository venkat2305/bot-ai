"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';

const HeroSection = () => {
  return (
    <section className="text-center py-20 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full border border-blue-500/30 mb-6">
          <Sparkles size={16} className="text-blue-400" />
          <span className="text-sm font-medium text-blue-300">15+ Premium AI Models</span>
        </div>
      </motion.div>
      
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 bg-clip-text text-transparent"
      >
        The Most Advanced AI Chat Platform
      </motion.h1>
      
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="text-xl mb-8 text-gray-300 max-w-3xl mx-auto"
      >
        Access 15+ cutting-edge AI models including Llama 4, DeepSeek R1, and Gemini 2.5 Pro in one unified interface.
      </motion.p>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="flex justify-center gap-4"
      >
        <Link href={`/chat/${uuidv4()}`} passHref>
          <button className="px-8 py-4 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 shadow-lg shadow-blue-500/25">
            Start Chatting for Free <ArrowRight size={18} />
          </button>
        </Link>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="mt-8 flex justify-center gap-6 text-gray-400"
      >
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span>Lightning-fast responses</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span>Multi-modal capabilities</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle size={16} className="text-green-400" />
          <span>Advanced code analysis</span>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
