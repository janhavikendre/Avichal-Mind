"use client";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, MessageCircle, Heart } from "lucide-react";

interface CrisisSupportProps {
  className?: string;
  language?: 'en' | 'hi' | 'mr';
}

export function CrisisSupport({ className, language = 'en' }: CrisisSupportProps) {
  const crisisResources = {
    en: {
      title: "Crisis Support & Emergency Resources",
      subtitle: "If you're experiencing a mental health crisis, help is available 24/7",
      immediateHelp: "Immediate Help Available",
      helpline: "National Crisis Helpline",
      helplineNumber: "988",
      helplineDescription: "24/7 confidential support for anyone in emotional distress",
      additionalResources: "Additional Resources",
      disclaimer: "If you're in immediate danger, please call emergency services (112) or go to the nearest emergency room.",
      getHelpNow: "Get Help Now",
      learnMore: "Learn More About Crisis Support"
    },
    hi: {
      title: "संकट सहायता और आपातकालीन संसाधन",
      subtitle: "यदि आप मानसिक स्वास्थ्य संकट का अनुभव कर रहे हैं, तो मदद 24/7 उपलब्ध है",
      immediateHelp: "तत्काल मदद उपलब्ध",
      helpline: "राष्ट्रीय संकट हेल्पलाइन",
      helplineNumber: "988",
      helplineDescription: "भावनात्मक संकट में किसी के लिए 24/7 गोपनीय सहायता",
      additionalResources: "अतिरिक्त संसाधन",
      disclaimer: "यदि आप तत्काल खतरे में हैं, तो कृपया आपातकालीन सेवाओं (112) को कॉल करें या निकटतम आपातकालीन कक्ष में जाएं।",
      getHelpNow: "अभी मदद लें",
      learnMore: "संकट सहायता के बारे में और जानें"
    },
    mr: {
      title: "संकट सहाय्य आणि आणीबाणी संसाधने",
      subtitle: "जर तुम्ही मानसिक आरोग्य संकट अनुभवत आहात, तर मदत 24/7 उपलब्ध आहे",
      immediateHelp: "त्वरित मदत उपलब्ध",
      helpline: "राष्ट्रीय संकट हेल्पलाइन",
      helplineNumber: "988",
      helplineDescription: "भावनिक संकटात असलेल्या कोणासाठीही 24/7 गोपनीय सहाय्य",
      additionalResources: "अतिरिक्त संसाधने",
      disclaimer: "जर तुम्ही त्वरित धोक्यात आहात, तर कृपया आणीबाणी सेवा (112) कॉल करा किंवा जवळच्या आणीबाणी खोलीत जा.",
      getHelpNow: "आता मदत मिळवा",
      learnMore: "संकट सहाय्याबद्दल अधिक जाणून घ्या"
    }
  };

  const resources = crisisResources[language];

  return (
    <div className={cn("bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-8", className)}>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h3 className="text-2xl font-bold text-red-900 dark:text-red-100 mb-2">
          {resources.title}
        </h3>
        <p className="text-red-700 dark:text-red-300">
          {resources.subtitle}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-4">
            <Phone className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {resources.immediateHelp}
            </h4>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">
              {resources.helplineNumber}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {resources.helpline}
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {resources.helplineDescription}
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-red-200 dark:border-red-800">
          <div className="flex items-center mb-4">
            <MessageCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
              {resources.additionalResources}
            </h4>
          </div>
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li className="flex items-center">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              Crisis Text Line: Text HOME to 741741
            </li>
            <li className="flex items-center">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              Local mental health professionals
            </li>
            <li className="flex items-center">
              <Heart className="w-4 h-4 text-red-500 mr-2" />
              Emergency services: 112
            </li>
          </ul>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-semibold">
            {resources.getHelpNow}
          </Button>
          <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-8 py-3 rounded-full font-semibold">
            {resources.learnMore}
          </Button>
        </div>
        
        <p className="text-xs text-red-600 dark:text-red-400 max-w-2xl mx-auto">
          {resources.disclaimer}
        </p>
      </div>
    </div>
  );
}
