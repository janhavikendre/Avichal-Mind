"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { PhoneInput } from "@/components/PhoneInput";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Shield, Clock, Globe, CheckCircle, Star, Users, Heart, Brain } from "lucide-react";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  const handleStartJourney = () => {
    if (isSignedIn) {
      router.push('/dashboard');
    } else {
      router.push('/sign-up');
    }
  };

  return (
    <div className={cn("relative min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 dark:from-gray-900 dark:via-slate-900 dark:to-blue-900/20", className)}>
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-indigo-100/20 via-transparent to-transparent"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 pt-28 lg:pt-36 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-20">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold border border-blue-200 dark:border-blue-800">
                  <Brain className="w-4 h-4 mr-2" />
                  AI-Powered Mental Wellness Platform
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white leading-tight">
                  Professional Mental Health
                  <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mt-2">
                    Support Platform
                  </span>
                </h1>
                
                <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl">
                  Evidence-based AI mental wellness support with licensed professional oversight. 
                  Get immediate help for anxiety, depression, and life challenges.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleStartJourney}
                  disabled={!isLoaded}
                  className="group px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  {!isLoaded ? (
                    "Loading..."
                  ) : isSignedIn ? (
                    "Access Dashboard"
                  ) : (
                    "Start Your Journey"
                  )}
                </Button>
                <Button 
                  onClick={() => document.getElementById('phone-input')?.scrollIntoView({ behavior: 'smooth' })}
                  variant="outline"
                  className="px-8 py-4 bg-white dark:bg-gray-800 text-blue-600 border-2 border-blue-200 hover:border-blue-300 dark:border-blue-700 dark:hover:border-blue-600 text-lg font-semibold rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300"
                >
                  <Globe className="w-5 h-5 mr-2" />
                  Voice Support
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                  <Shield className="w-4 h-4 mr-2" />
                  HIPAA Compliant
                </div>
                <div className="flex items-center px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Evidence-Based
                </div>
                <div className="flex items-center px-3 py-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium">
                  <Clock className="w-4 h-4 mr-2" />
                  24/7 Available
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative">
              {/* Main Card with Wellness Image */}
              <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Decorative elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl opacity-20"></div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl opacity-20"></div>
                
                {/* Wellness Hero Image */}
                <div className="mb-6 relative">
                  <div className="w-full h-48 bg-gradient-to-br from-blue-100 via-purple-50 to-green-100 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-green-900/20 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    {/* Placeholder wellness illustration */}
                    <div className="absolute inset-0 opacity-10">
                      <svg viewBox="0 0 400 200" className="w-full h-full">
                        {/* Meditation figure */}
                        <circle cx="120" cy="100" r="20" fill="#6366f1" opacity="0.3"/>
                        <rect x="110" y="120" width="20" height="40" rx="10" fill="#6366f1" opacity="0.3"/>
                        <circle cx="100" cy="140" r="8" fill="#10b981" opacity="0.4"/>
                        <circle cx="140" cy="140" r="8" fill="#10b981" opacity="0.4"/>
                        
                        {/* Hearts and wellness symbols */}
                        <path d="M200 80 C200 75, 205 70, 210 75 C215 70, 220 75, 220 80 C220 85, 210 95, 210 95 C210 95, 200 85, 200 80 Z" fill="#ef4444" opacity="0.4"/>
                        <path d="M250 120 C250 115, 255 110, 260 115 C265 110, 270 115, 270 120 C270 125, 260 135, 260 135 C260 135, 250 125, 250 120 Z" fill="#ef4444" opacity="0.3"/>
                        
                        {/* Brain waves */}
                        <path d="M300 80 Q320 70, 340 80 Q360 90, 380 80" stroke="#8b5cf6" strokeWidth="3" fill="none" opacity="0.4"/>
                        <path d="M300 100 Q320 90, 340 100 Q360 110, 380 100" stroke="#8b5cf6" strokeWidth="3" fill="none" opacity="0.3"/>
                        <path d="M300 120 Q320 110, 340 120 Q360 130, 380 120" stroke="#8b5cf6" strokeWidth="3" fill="none" opacity="0.2"/>
                      </svg>
                    </div>
                    
                    {/* Central wellness icon */}
                    <div className="relative z-10 inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                      <Brain className="w-12 h-12 text-white" />
                    </div>
                  </div>
                </div>
                
                {/* Content */}
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Your Mental Wellness Journey
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Professional support, personalized guidance, and evidence-based interventions
                  </p>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center">
                    <Users className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Professional Support</div>
                  </div>
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center">
                    <Star className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Personalized Care</div>
                  </div>
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl text-center">
                    <Shield className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Secure & Private</div>
                  </div>
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-center">
                    <Clock className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">Always Available</div>
                  </div>
                </div>
              </div>
              
              {/* Floating wellness elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-green-600" />
              </div>
              <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Phone Input Section */}
          <div id="phone-input" className="mb-20">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Get Immediate Support
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                  Professional voice support available 24/7. Our AI assistant provides evidence-based guidance with licensed professional oversight.
                </p>
              </div>
              
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                {/* Phone Input Form */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-xl">
                  <PhoneInput />
                </div>
                
                {/* Wellness Support Visual */}
                <div className="relative">
                  <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 dark:from-blue-900/20 dark:via-purple-900/20 dark:to-green-900/20 rounded-2xl p-8 h-full min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-10">
                      <svg viewBox="0 0 400 400" className="w-full h-full">
                        {/* Support network visualization */}
                        <circle cx="200" cy="200" r="60" fill="#6366f1" opacity="0.3"/>
                        <circle cx="200" cy="200" r="40" fill="#8b5cf6" opacity="0.4"/>
                        <circle cx="200" cy="200" r="20" fill="#ec4899" opacity="0.5"/>
                        
                        {/* Connection nodes */}
                        <circle cx="120" cy="120" r="15" fill="#10b981" opacity="0.4"/>
                        <circle cx="280" cy="120" r="15" fill="#f59e0b" opacity="0.4"/>
                        <circle cx="120" cy="280" r="15" fill="#ef4444" opacity="0.4"/>
                        <circle cx="280" cy="280" r="15" fill="#3b82f6" opacity="0.4"/>
                        
                        {/* Connection lines */}
                        <line x1="200" y1="200" x2="120" y2="120" stroke="#6366f1" strokeWidth="2" opacity="0.3"/>
                        <line x1="200" y1="200" x2="280" y2="120" stroke="#6366f1" strokeWidth="2" opacity="0.3"/>
                        <line x1="200" y1="200" x2="120" y2="280" stroke="#6366f1" strokeWidth="2" opacity="0.3"/>
                        <line x1="200" y1="200" x2="280" y2="280" stroke="#6366f1" strokeWidth="2" opacity="0.3"/>
                        
                        {/* Floating hearts */}
                        <path d="M50 50 C50 45, 55 40, 60 45 C65 40, 70 45, 70 50 C70 55, 60 65, 60 65 C60 65, 50 55, 50 50 Z" fill="#ef4444" opacity="0.3"/>
                        <path d="M320 60 C320 55, 325 50, 330 55 C335 50, 340 55, 340 60 C340 65, 330 75, 330 75 C330 75, 320 65, 320 60 Z" fill="#ef4444" opacity="0.2"/>
                        <path d="M350 320 C350 315, 355 310, 360 315 C365 310, 370 315, 370 320 C370 325, 360 335, 360 335 C360 335, 350 325, 350 320 Z" fill="#ef4444" opacity="0.4"/>
                      </svg>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 text-center space-y-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl mb-4">
                        <Globe className="w-10 h-10 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        24/7 Professional Support
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-300 max-w-md">
                        Connect instantly with our AI-powered mental health support system, designed by licensed professionals.
                      </p>
                      
                      {/* Support features */}
                      <div className="grid grid-cols-2 gap-4 mt-8">
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-2">
                            <Clock className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Instant Access</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg mb-2">
                            <Shield className="w-5 h-5 text-green-600" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Confidential</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-2">
                            <Heart className="w-5 h-5 text-purple-600" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Compassionate</div>
                        </div>
                        <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4 text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mb-2">
                            <Star className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">Expert Care</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-8 sm:p-12 text-white">
            <div className="text-center mb-10">
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Trusted by Thousands
              </h2>
              <p className="text-xl opacity-90 max-w-2xl mx-auto">
                Professional mental health support powered by evidence-based AI technology
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">24/7</div>
                <div className="text-lg opacity-90">Always Available</div>
                <div className="text-sm opacity-75 mt-1">Round-the-clock support</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">100%</div>
                <div className="text-lg opacity-90">Private & Secure</div>
                <div className="text-sm opacity-75 mt-1">HIPAA compliant platform</div>
              </div>
              <div className="text-center">
                <div className="text-4xl sm:text-5xl font-bold mb-2">3</div>
                <div className="text-lg opacity-90">Languages</div>
                <div className="text-sm opacity-75 mt-1">Multilingual support</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
