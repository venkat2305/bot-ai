"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { BrainCircuit, Bot, Zap, Code, Search, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <BrainCircuit size={24} className="text-purple-400" />,
    title: 'Reasoning Models',
    description: 'Access advanced models like DeepSeek R1 for complex problem-solving.',
    gradient: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/30',
  },
  {
    icon: <Bot size={24} className="text-blue-400" />,
    title: 'Multi-AI Support',
    description: 'Seamlessly switch between 15+ models from 5 top-tier providers.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
  },
  {
    icon: <Zap size={24} className="text-yellow-400" />,
    title: 'Real-time Streaming',
    description: 'Get instant responses with our high-performance streaming infrastructure.',
    gradient: 'from-yellow-500/20 to-orange-500/20',
    borderColor: 'border-yellow-500/30',
  },
  {
    icon: <Code size={24} className="text-green-400" />,
    title: 'GitHub Integration',
    description: 'Import and analyze entire code repositories with our Pro plan.',
    gradient: 'from-green-500/20 to-emerald-500/20',
    borderColor: 'border-green-500/30',
  },
  {
    icon: <Search size={24} className="text-cyan-400" />,
    title: 'Search Grounding',
    description: 'Enhance AI accuracy with models that can access external information.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    borderColor: 'border-cyan-500/30',
  },
  {
    icon: <ShieldCheck size={24} className="text-red-400" />,
    title: 'Secure and Private',
    description: 'Your conversations are encrypted and securely stored.',
    gradient: 'from-red-500/20 to-pink-500/20',
    borderColor: 'border-red-500/30',
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white">Powerful Features, Unified Interface</h2>
        <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto">
          Everything you need to supercharge your productivity, all in one place.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`p-6 rounded-xl bg-gradient-to-br ${feature.gradient} backdrop-blur-sm border ${feature.borderColor} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-2 rounded-lg bg-white/10">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
            </div>
            <p className="text-gray-300">{feature.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default FeaturesSection;
