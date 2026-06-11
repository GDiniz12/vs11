'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Card({
  children,
  className = '',
  hover = false,
}: CardProps) {
  return (
    <motion.div
      className={`
        bg-white border-4 border-[#00183F] rounded-none
        shadow-[6px_6px_0_0_rgba(0,0,0,0.7)]
        p-6
        ${hover ? 'cursor-pointer' : ''}
        ${className}
      `}
      whileHover={
        hover
          ? {
              translateY: -4,
              translateX: -4,
              boxShadow: '10px 10px 0 0 rgba(0,0,0,0.8)',
            }
          : {}
      }
      transition={{ duration: 0.1 }}
    >
      {children}
    </motion.div>
  );
}