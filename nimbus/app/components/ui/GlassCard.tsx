"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "purple" | "blue" | "pink" | "none";
  onClick?: () => void;
  onTouchStart?: () => void;
  onTouchEnd?: () => void;
}

export default function GlassCard({ 
  children, 
  className = "", 
  hover = true,
  glow = "none",
  onClick,
  onTouchStart,
  onTouchEnd
}: GlassCardProps) {
  const glowClass = glow !== "none" ? `glow-${glow}` : "";
  
  return (
    <motion.div
      className={`glass-card ${glowClass} ${className}`}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -5,
        transition: { duration: 0.3 }
      } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {children}
    </motion.div>
  );
}