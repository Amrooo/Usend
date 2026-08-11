import React from 'react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8"
    >
      <h1 className="text-2xl font-bold text-zinc-900 mb-6">Platform Settings</h1>
      <p className="text-zinc-500">This module is under construction.</p>
    </motion.div>
  );
}
