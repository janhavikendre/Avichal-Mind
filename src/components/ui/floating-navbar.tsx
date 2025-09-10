"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import { usePhoneUser } from '@/hooks/usePhoneUser';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

interface FloatingNavbarProps {
  className?: string;
}

export function FloatingNavbar({ className }: FloatingNavbarProps) {
  const { phoneUser, isPhoneUser, clearPhoneUser } = usePhoneUser();
  const router = useRouter();

  const handlePhoneUserLogout = () => {
    clearPhoneUser();
    router.push('/');
  };

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-6 right-6 z-50",
        className
      )}
    >
      <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/90 backdrop-blur-xl px-4 sm:px-6 py-3 shadow-2xl dark:border-gray-700/50 dark:bg-gray-900/90">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm sm:text-base">AM</span>
          </div>
          <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Avichal Mind
          </span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 ml-3 sm:ml-6">
          <ThemeToggle />
          
          {/* Show sign in/up buttons only if neither Clerk user nor phone user is logged in */}
          <SignedOut>
            {!isPhoneUser && (
              <>
                <SignInButton mode="modal">
                  <Button variant="ghost" size="sm" className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium">
                    Sign In
                  </Button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <Button size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl text-sm font-medium px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300">
                    <span className="hidden sm:inline">Get Started</span>
                    <span className="sm:hidden">Start</span>
                  </Button>
                </SignUpButton>
              </>
            )}
          </SignedOut>
          
          {/* Show Clerk UserButton if Clerk user is signed in */}
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
          
          {/* Show phone user info if phone user is logged in */}
          {isPhoneUser && phoneUser && (
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">
                  {phoneUser.firstName?.charAt(0) || 'P'}
                </span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {phoneUser.firstName} {phoneUser.lastName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePhoneUserLogout}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
