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
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:bg-gray-900/90 dark:border-gray-800",
        className
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gray-900 rounded-xl flex items-center justify-center shadow-sm dark:bg-gray-800">
            <span className="text-white font-bold text-sm sm:text-base">AM</span>
          </div>
          <span className="hidden sm:block text-xl sm:text-2xl font-semibold text-gray-900 dark:text-gray-100">Avichal Mind</span>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3 ml-3 sm:ml-6">
          <ThemeToggle />
          
          {/* Navigation Links for authenticated users */}
          <SignedIn>
            <Button
              onClick={() => router.push('/dashboard')}
              variant="ghost"
              size="sm"
              className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
            >
              Dashboard
            </Button>
            <Button
              onClick={() => router.push('/sessions')}
              variant="ghost"
              size="sm"
              className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
            >
              Sessions
            </Button>
            <Button
              onClick={() => router.push('/summaries')}
              variant="ghost"
              size="sm"
              className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
            >
              Summaries
            </Button>
          </SignedIn>
          
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
                  <Button size="sm" className="bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-medium px-4 py-2 shadow-sm">
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
                  userButtonAvatarBox: "w-7 h-7 sm:w-9 sm:h-9",
                  userButtonTrigger: "focus:shadow-none"
                }
              }}
            />
          </SignedIn>
          
          {/* Show phone user info if phone user is logged in */}
          {isPhoneUser && phoneUser && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => router.push('/dashboard')}
                variant="ghost"
                size="sm"
                className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
              >
                Dashboard
              </Button>
              <Button
                onClick={() => router.push('/sessions')}
                variant="ghost"
                size="sm"
                className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
              >
                Sessions
              </Button>
              <Button
                onClick={() => router.push('/summaries')}
                variant="ghost"
                size="sm"
                className="hidden sm:block text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 text-sm font-medium"
              >
                Summaries
              </Button>
              <div className="w-7 h-7 sm:w-9 sm:h-9 bg-gray-900 rounded-full flex items-center justify-center dark:bg-gray-800">
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
      </div>
    </motion.div>
  );
}
