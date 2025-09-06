"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { Phone, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface PhoneInputProps {
  className?: string;
}

export function PhoneInput({ className }: PhoneInputProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const formatPhoneNumber = (value: string) => {
    // Remove all non-numeric characters
    const cleaned = value.replace(/\D/g, "");
    
    // Handle Indian numbers (10 digits starting with 6-9)
    if (cleaned.length <= 10 && cleaned.match(/^[6-9]/)) {
      if (cleaned.length <= 5) {
        return cleaned;
      } else if (cleaned.length <= 10) {
        return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
      }
    }
    
    // Handle US numbers (10 digits starting with 2-5)
    if (cleaned.length <= 10 && cleaned.match(/^[2-5]/)) {
      if (cleaned.length <= 3) {
        return cleaned;
      } else if (cleaned.length <= 6) {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
      } else {
        return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
      }
    }
    
    // For numbers with country code or other formats
    if (cleaned.length > 10) {
      return `+${cleaned}`;
    }
    
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const validatePhoneNumber = (phone: string) => {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, "");
    
    // Check if it's a valid US number (10 digits) or international (10+ digits)
    return cleaned.length >= 10;
  };

  const validateName = (name: string) => {
    // Check if name has at least 2 characters and contains only letters and spaces
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhoneNumber(phoneNumber)) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (!validateName(userName)) {
      toast.error("Please enter a valid name (at least 2 characters, letters only)");
      return;
    }

    // Skip verification for trial accounts and go directly to call creation
    setIsLoading(true);

    try {
      const response = await fetch("/api/call", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ""), // Send only digits
          userName: userName.trim(), // Send trimmed name
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate call");
      }

      // Check if there's a warning about trial account
      if (data.warning) {
        toast.success("Welcome! " + data.warning, { duration: 6000 });
      } else {
        toast.success("Call initiated! You should receive a call shortly.");
      }

      // Store phone user data in localStorage for session access
      if (data.user) {
        localStorage.setItem('phoneUser', JSON.stringify(data.user));
        console.log('🎯 PhoneInput: Stored phone user in localStorage:', data.user.firstName);
      }

      // Clear any existing Clerk session to prevent conflicts
      try {
        // Clear Clerk session data from localStorage
        localStorage.removeItem('__clerk_client_jwt');
        localStorage.removeItem('__clerk_db_jwt');
        console.log('🎯 PhoneInput: Cleared Clerk session data');
      } catch (error) {
        console.log('Note: Could not clear Clerk session data:', error);
      }

      // Redirect to dashboard like Clerk users
      router.push('/dashboard');
    } catch (error) {
      console.error("Error initiating call:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to initiate call"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto", className)}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Enter your name (e.g., John Doe)"
            className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            disabled={isLoading}
            maxLength={50}
          />
        </div>

        {/* Phone Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-blue-500" />
          </div>
          <input
            type="tel"
            value={phoneNumber}
            onChange={handlePhoneChange}
            placeholder="Enter your mobile number"
            className="w-full pl-12 pr-4 py-4 border-2 border-blue-200 dark:border-blue-800 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
            disabled={isLoading}
            maxLength={20}
          />
        </div>
        
        <Button
          type="submit"
          disabled={isLoading || !phoneNumber.trim() || !userName.trim()}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-3 h-5 w-5 animate-spin" />
              Creating Account...
            </>
          ) : (
            <>
              <Phone className="mr-3 h-5 w-5" />
              Get AI Wellness Call
            </>
          )}
        </Button>
        
        <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Free call • No registration required • Instant support</span>
        </div>
      </form>
    </div>
  );
}
