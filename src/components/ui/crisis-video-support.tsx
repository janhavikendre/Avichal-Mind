"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, MessageCircle, Heart, Play, ExternalLink } from "lucide-react";
import { CrisisVideo } from "@/lib/crisis-video-service";

interface CrisisVideoSupportProps {
  videos: CrisisVideo[];
  crisisType: string;
  supportMessage: string;
  emergencyResources: {
    helpline: string;
    textLine: string;
    emergency: string;
  };
  language: 'en' | 'hi' | 'mr';
  className?: string;
}

export function CrisisVideoSupport({ 
  videos, 
  crisisType, 
  supportMessage, 
  emergencyResources, 
  language,
  className 
}: CrisisVideoSupportProps) {
  const crisisLabels = {
    en: {
      suicidal: "Crisis Support",
      mental_breakdown: "Mental Breakdown Support",
      panic_attack: "Panic Attack Help",
      severe_distress: "Crisis Support",
      immediateHelp: "Immediate Help Available",
      helpline: "Crisis Helpline",
      helplineDescription: "24/7 confidential support for anyone in emotional distress",
      additionalResources: "Additional Resources",
      disclaimer: "If you're in immediate danger, please call emergency services (112) or go to the nearest emergency room.",
      getHelpNow: "Get Help Now",
      watchVideo: "Watch Video",
      openVideo: "Open Video",
      supportMessage: "Support Message"
    },
    hi: {
      suicidal: "संकट सहायता",
      mental_breakdown: "मानसिक टूटन सहायता",
      panic_attack: "पैनिक अटैक सहायता",
      severe_distress: "संकट सहायता",
      immediateHelp: "तत्काल मदद उपलब्ध",
      helpline: "संकट हेल्पलाइन",
      helplineDescription: "भावनात्मक संकट में किसी के लिए 24/7 गोपनीय सहायता",
      additionalResources: "अतिरिक्त संसाधन",
      disclaimer: "यदि आप तत्काल खतरे में हैं, तो कृपया आपातकालीन सेवाओं (112) को कॉल करें या निकटतम आपातकालीन कक्ष में जाएं।",
      getHelpNow: "अभी मदद लें",
      watchVideo: "वीडियो देखें",
      openVideo: "वीडियो खोलें",
      supportMessage: "सहायता संदेश"
    },
    mr: {
      suicidal: "संकट सहाय्य",
      mental_breakdown: "मानसिक टूटन सहाय्य",
      panic_attack: "पॅनिक अटॅक सहाय्य",
      severe_distress: "संकट सहाय्य",
      immediateHelp: "त्वरित मदत उपलब्ध",
      helpline: "संकट हेल्पलाइन",
      helplineDescription: "भावनिक संकटात असलेल्या कोणासाठीही 24/7 गोपनीय सहाय्य",
      additionalResources: "अतिरिक्त संसाधने",
      disclaimer: "जर तुम्ही त्वरित धोक्यात आहात, तर कृपया आणीबाणी सेवा (112) कॉल करा किंवा जवळच्या आणीबाणी खोलीत जा.",
      getHelpNow: "आता मदत मिळवा",
      watchVideo: "व्हिडिओ बघा",
      openVideo: "व्हिडिओ उघडा",
      supportMessage: "सहाय्य संदेश"
    }
  };

  const labels = crisisLabels[language];
  const crisisLabel = labels[crisisType as keyof typeof labels] || labels.severe_distress;

  const handleVideoClick = (video: CrisisVideo) => {
    // Open video in new tab
    window.open(video.url, '_blank', 'noopener,noreferrer');
  };

  const handleEmergencyCall = () => {
    // For web, we can't directly make calls, but we can show the number
    const phoneNumber = emergencyResources.helpline;
    if (navigator.userAgent.includes('Mobile')) {
      window.location.href = `tel:${phoneNumber}`;
    } else {
      // Copy to clipboard for desktop
      navigator.clipboard.writeText(phoneNumber);
      alert(`${labels.helpline}: ${phoneNumber}`);
    }
  };

  return (
    <div className={cn("bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-4", className)}>
      {/* Crisis Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full mb-3">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-lg font-bold text-red-900 dark:text-red-100 mb-2">
          {crisisLabel}
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300">
          {supportMessage}
        </p>
      </div>

      {/* Emergency Resources */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-3">
            <Phone className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {labels.immediateHelp}
            </h4>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">
              {emergencyResources.helpline}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {labels.helpline}
            </div>
            <Button 
              onClick={handleEmergencyCall}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium w-full"
            >
              {labels.getHelpNow}
            </Button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-3">
            <MessageCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
              {labels.additionalResources}
            </h4>
          </div>
          <ul className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
            <li className="flex items-center">
              <Heart className="w-3 h-3 text-red-500 mr-2" />
              Crisis Text Line: {emergencyResources.textLine}
            </li>
            <li className="flex items-center">
              <Heart className="w-3 h-3 text-red-500 mr-2" />
              Emergency: {emergencyResources.emergency}
            </li>
          </ul>
        </div>
      </div>

      {/* Crisis Support Videos */}
      {videos.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
            <Play className="w-4 h-4 mr-2 text-red-600" />
            {language === 'hi' ? 'तत्काल सहायता वीडियो' : 
             language === 'mr' ? 'त्वरित सहाय्य व्हिडिओ' : 
             'Immediate Support Videos'}
          </h4>
          <div className="grid gap-3">
            {videos.map((video) => (
              <div 
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-red-200 dark:border-red-800 hover:border-red-300 dark:hover:border-red-700 transition-colors cursor-pointer"
                onClick={() => handleVideoClick(video)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-16 h-12 rounded object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/64x48/ef4444/ffffff?text=Video';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2 mb-1">
                      {video.title}
                    </h5>
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                      {video.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {video.channelTitle}
                      </span>
                      <div className="flex items-center space-x-2">
                        {video.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {video.duration}
                          </span>
                        )}
                        <ExternalLink className="w-3 h-3 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center">
        <p className="text-xs text-red-600 dark:text-red-400 max-w-2xl mx-auto">
          {labels.disclaimer}
        </p>
      </div>
    </div>
  );
}
