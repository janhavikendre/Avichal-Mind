"use client";


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
    <div
      onClick={onClick}
      className={cn(
        "relative",
        className
      )}
    >
      {/* Card Content */}
      <div className={cn(
        "relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50",
        selected && "ring-2 ring-purple-500 bg-purple-50/80 dark:bg-purple-950/20"
      )}>
        {children}
      </div>
    </div>
  );
}
