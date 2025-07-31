"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { MODEL_CONFIGS } from '@/config/models';

const ModelsShowcase = () => {
  const models = MODEL_CONFIGS.slice(0, 8); // Display first 8 models

  return (
    <section className="py-20 bg-gradient-to-r from-gray-900/50 to-gray-800/50 rounded-2xl border border-gray-700/50">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-white">Meet Our AI Models</h2>
        <p className="text-lg text-gray-300 mt-4 max-w-2xl mx-auto">
          Explore a diverse range of cutting-edge models from the world's leading AI providers.
        </p>
      </div>
      <div className="relative w-full overflow-hidden">
        <motion.div
          className="flex gap-8"
          animate={{
            x: ['-100%', '0%'],
            transition: {
              ease: 'linear',
              duration: 40,
              repeat: Infinity,
            },
          }}
        >
          {[...models, ...models].map((model, index) => {
            const colors = [
              'from-blue-500/20 to-purple-500/20 border-blue-500/30',
              'from-green-500/20 to-teal-500/20 border-green-500/30',
              'from-orange-500/20 to-red-500/20 border-orange-500/30',
              'from-purple-500/20 to-pink-500/20 border-purple-500/30',
              'from-cyan-500/20 to-blue-500/20 border-cyan-500/30',
              'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
              'from-indigo-500/20 to-blue-500/20 border-indigo-500/30',
              'from-pink-500/20 to-rose-500/20 border-pink-500/30',
            ];
            const colorClass = colors[index % colors.length];
            
            return (
              <div key={index} className={`flex-shrink-0 w-64 p-6 rounded-xl bg-gradient-to-br ${colorClass} backdrop-blur-sm border shadow-lg`}>
                <h3 className="text-lg font-semibold text-white truncate">{model.displayName}</h3>
                <p className="text-sm text-gray-300 mb-2">by {model.ownedBy}</p>
                <p className="text-sm text-gray-400 h-20 overflow-hidden">{model.description}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
};

export default ModelsShowcase;
