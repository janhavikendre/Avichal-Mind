"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
  selected?: boolean;
}

export function AnimatedCard({ 
  children, 
  className, 
  delay = 0, 
  onClick,
  selected = false 
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: "easeOut"
      }}
      whileHover={{ 
        y: -8,
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { duration: 0.1 }
      }}
      onClick={onClick}
      className={cn(
        "relative group cursor-pointer",
        className
      )}
    >
      {/* Background Glow */}
      <div className={cn(
        "absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 blur-xl transition-all duration-300",
        selected && "from-purple-600/20 to-blue-600/20",
        "group-hover:from-purple-600/20 group-hover:to-blue-600/20 group-hover:blur-2xl"
      )} />
      
      {/* Card Content */}
      <div className={cn(
        "relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 transition-all duration-300",
        selected && "ring-2 ring-purple-500 bg-purple-50/80 dark:bg-purple-950/20",
        "group-hover:shadow-2xl group-hover:border-purple-300/50 dark:group-hover:border-purple-700/50"
      )}>
        {children}
      </div>
    </motion.div>
  );
}
