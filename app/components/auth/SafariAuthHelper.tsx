'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertTriangle, FiSettings, FiRefreshCw, FiX, FiChrome, FiGlobe } from 'react-icons/fi';
import { FaSafari } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

interface SafariAuthHelperProps {
  isVisible: boolean;
  onClose: () => void;
  onRetry: () => void;
  errorType?: 'cookies' | 'tracking' | 'timeout' | 'general';
}

export default function SafariAuthHelper({ 
  isVisible, 
  onClose, 
  onRetry, 
  errorType = 'general' 
}: SafariAuthHelperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = navigator.userAgent;
      setIsIOS(/iPad|iPhone|iPod/.test(userAgent));
    }
  }, []);

  const getErrorContent = () => {
    switch (errorType) {
      case 'cookies':
        return {
          title: 'Cookie Settings Issue',
          description: 'Safari is blocking cookies needed for Google authentication.',
          icon: <FiSettings className="text-2xl text-orange-400" />,
          color: 'orange'
        };
      case 'tracking':
        return {
          title: 'Cross-Site Tracking Prevention',
          description: 'Safari\'s privacy settings are preventing Google login.',
          icon: <FiAlertTriangle className="text-2xl text-yellow-400" />,
          color: 'yellow'
        };
      case 'timeout':
        return {
          title: 'Authentication Timeout',
          description: 'The login process took too long to complete.',
          icon: <FiRefreshCw className="text-2xl text-blue-400" />,
          color: 'blue'
        };
      default:
        return {
          title: 'Safari Authentication Issue',
          description: 'We\'re having trouble with Google login in Safari.',
          icon: <FaSafari className="text-2xl text-blue-400" />,
          color: 'blue'
        };
    }
  };

  const errorContent = getErrorContent();

  const safariSteps = isIOS ? [
    {
      title: 'Open Safari Settings',
      description: 'Go to Settings > Safari on your iPhone',
      icon: <FiSettings className="text-lg" />
    },
    {
      title: 'Disable Tracking Prevention',
      description: 'Turn OFF "Prevent Cross-Site Tracking"',
      icon: <FiAlertTriangle className="text-lg" />
    },
    {
      title: 'Allow All Cookies',
      description: 'Set "Block All Cookies" to OFF',
      icon: <FiGlobe className="text-lg" />
    },
    {
      title: 'Try Again',
      description: 'Return to the app and retry Google login',
      icon: <FiRefreshCw className="text-lg" />
    }
  ] : [
    {
      title: 'Open Safari Preferences',
      description: 'Safari > Preferences > Privacy',
      icon: <FiSettings className="text-lg" />
    },
    {
      title: 'Adjust Privacy Settings',
      description: 'Uncheck "Prevent cross-site tracking"',
      icon: <FiAlertTriangle className="text-lg" />
    },
    {
      title: 'Allow Cookies',
      description: 'Set cookies to "Allow from websites I visit"',
      icon: <FiGlobe className="text-lg" />
    },
    {
      title: 'Refresh and Retry',
      description: 'Refresh this page and try Google login again',
      icon: <FiRefreshCw className="text-lg" />
    }
  ];

  const handleUseChrome = () => {
    toast.success('Opening Chrome download page...', {
      duration: 3000,
      icon: '🌐'
    });
    window.open('https://www.google.com/chrome/', '_blank');
  };

  const handleNextStep = () => {
    if (currentStep < safariSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onRetry();
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[10000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md bg-[#1E1F2E] rounded-2xl overflow-hidden shadow-2xl border border-[#20DDBB]/20"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="relative p-6 pb-4">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-[#818BAC] hover:text-white transition-colors"
              >
                <FiX className="text-xl" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                {errorContent.icon}
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {errorContent.title}
                  </h3>
                  <p className="text-sm text-[#818BAC]">
                    {errorContent.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              {/* Step indicator */}
              <div className="flex items-center justify-between mb-6">
                {safariSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                      index <= currentStep
                        ? 'bg-[#20DDBB] text-white'
                        : 'bg-[#2A2B3F] text-[#818BAC]'
                    }`}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>

              {/* Current step */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="mb-6"
              >
                <div className="flex items-start gap-3 p-4 bg-[#14151F]/60 rounded-xl border border-[#2A2B3F]">
                  <div className="text-[#20DDBB] mt-1">
                    {safariSteps[currentStep].icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">
                      {safariSteps[currentStep].title}
                    </h4>
                    <p className="text-sm text-[#818BAC]">
                      {safariSteps[currentStep].description}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="space-y-3">
                <div className="flex gap-3">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrevStep}
                      className="flex-1 py-3 px-4 border border-[#2A2B3F] text-[#818BAC] rounded-xl hover:bg-[#2A2B3F]/50 hover:text-white transition-all duration-300"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={handleNextStep}
                    className="flex-1 py-3 px-4 bg-gradient-to-r from-[#20DDBB] to-[#8A2BE2] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
                  >
                    {currentStep === safariSteps.length - 1 ? 'Try Again' : 'Next'}
                  </button>
                </div>

                {/* Alternative solution */}
                <div className="pt-3 border-t border-[#2A2B3F]">
                  <p className="text-xs text-[#818BAC] mb-3 text-center">
                    Having trouble? Try using a different browser:
                  </p>
                  <button
                    onClick={handleUseChrome}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-[#14151F]/60 hover:bg-[#14151F]/80 text-[#818BAC] hover:text-white rounded-lg transition-all duration-300 border border-[#2A2B3F] hover:border-[#20DDBB]/50"
                  >
                    <FiChrome className="text-lg" />
                    <span className="text-sm">Download Chrome</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
