'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

const variantClasses: Record<string, string> = {
  primary: 'bg-[#D9D9D9] text-[#00183F] border-4 border-[#00183F] shadow-[4px_4px_0_0_#0033A0]',
  secondary: 'bg-[#0033A0] text-white border-4 border-[#00183F] shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]',
  outline: 'bg-transparent border-4 border-white text-white shadow-[4px_4px_0_0_#0033A0]',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-4 py-2 text-sm font-bold uppercase',
  md: 'px-6 py-3 text-base font-black uppercase tracking-wider',
  lg: 'px-8 py-4 text-lg font-black uppercase tracking-widest',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded-none transition-all duration-75
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? 'opacity-40 cursor-not-allowed !shadow-none' : 'cursor-pointer'}
        ${className}
      `}
      whileHover={disabled ? {} : { translateY: -2, translateX: -2, boxShadow: '6px 6px 0 0 #00183F' }}
      whileTap={disabled ? {} : { translateY: 4, translateX: 4, boxShadow: '0px 0px 0 0 #00183F' }}
    >
      {children}
    </motion.button>
  );
}