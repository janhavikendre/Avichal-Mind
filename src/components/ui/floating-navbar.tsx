"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';

interface FloatingNavbarProps {
  className?: string;
}

export function FloatingNavbar({ className }: FloatingNavbarProps) {
  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-4 right-4 z-50",
        className
      )}
    >
      <div className="flex items-center gap-2 rounded-full border border-gray-200/50 bg-white/80 backdrop-blur-md px-3 sm:px-4 py-2 shadow-lg dark:border-gray-800/50 dark:bg-gray-950/80">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xs sm:text-sm">AM</span>
          </div>
          <span className="hidden sm:block text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Avichal Mind
          </span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2 ml-2 sm:ml-4">
          <ThemeToggle />
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="hidden sm:block text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-xs sm:text-sm">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs sm:text-sm px-2 sm:px-3">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Start</span>
              </Button>
            </SignUpButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  userButtonAvatarBox: "w-6 h-6 sm:w-8 sm:h-8",
                  userButtonTrigger: "focus:shadow-none"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </motion.div>
  );
}
