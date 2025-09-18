/**
 * Authentication Conflict Prevention Utilities
 * Prevents users from having multiple authentication sessions simultaneously
 */

import { auth } from '@clerk/nextjs/server';

export interface AuthState {
  isClerkAuthenticated: boolean;
  isPhoneAuthenticated: boolean;
  clerkUserId?: string;
  phoneUser?: any;
}

/**
 * Check if user has conflicting authentication states
 */
export async function checkAuthConflicts(): Promise<AuthState> {
  // Check Clerk authentication
  const { userId } = await auth();
  const isClerkAuthenticated = !!userId;

  // Check phone authentication from localStorage (client-side only)
  let isPhoneAuthenticated = false;
  let phoneUser = null;

  if (typeof window !== 'undefined') {
    try {
      const storedPhoneUser = localStorage.getItem('phoneUser');
      if (storedPhoneUser) {
        phoneUser = JSON.parse(storedPhoneUser);
        isPhoneAuthenticated = phoneUser?.userType === 'phone';
      }
    } catch (error) {
      console.error('Error checking phone authentication:', error);
    }
  }

  return {
    isClerkAuthenticated,
    isPhoneAuthenticated,
    clerkUserId: userId || undefined,
    phoneUser
  };
}

/**
 * Clear phone authentication data
 */
export function clearPhoneAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('phoneUser');
    // Clear any other phone-related data
    localStorage.removeItem('__phone_session');
  }
}

/**
 * Check if authentication conflict exists and resolve it
 */
export async function resolveAuthConflicts(): Promise<{
  hasConflict: boolean;
  preferredAuth: 'clerk' | 'phone' | 'none';
  action: 'clear_phone' | 'clear_clerk' | 'none';
}> {
  const authState = await checkAuthConflicts();

  // If both are authenticated, prefer Clerk (more secure)
  if (authState.isClerkAuthenticated && authState.isPhoneAuthenticated) {
    return {
      hasConflict: true,
      preferredAuth: 'clerk',
      action: 'clear_phone'
    };
  }

  // If only one is authenticated, no conflict
  if (authState.isClerkAuthenticated) {
    return {
      hasConflict: false,
      preferredAuth: 'clerk',
      action: 'none'
    };
  }

  if (authState.isPhoneAuthenticated) {
    return {
      hasConflict: false,
      preferredAuth: 'phone',
      action: 'none'
    };
  }

  // Neither authenticated
  return {
    hasConflict: false,
    preferredAuth: 'none',
    action: 'none'
  };
}
