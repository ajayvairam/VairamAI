import React, { useState } from 'react';
import { APP_NAME } from '../constants';
import { Sparkles } from 'lucide-react';

interface LandingPageProps {
  onLogin: () => Promise<void>;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
        await onLogin();
    } catch(e) {
        console.error("Login Error", e);
        setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-gray-950 flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-300">
      
      {/* Background Ambient Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>

      <div className="z-10 flex flex-col items-center text-center px-6 max-w-md w-full animate-in fade-in zoom-in duration-700">
        {/* Logo */}
        <div className="mb-8 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
          <div className="relative w-20 h-20 bg-white dark:bg-gray-900 rounded-2xl flex items-center justify-center border border-gray-200 dark:border-gray-800 shadow-2xl">
             <Sparkles size={40} className="text-emerald-600 dark:text-emerald-400" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-3 tracking-tight">
          {APP_NAME}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-10 text-lg">
          Experience the next generation of conversation.
        </p>

        {/* Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-100 text-gray-900 font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-gray-200 dark:border-transparent disabled:opacity-70 disabled:cursor-wait"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  style={{ color: "#4285F4" }}
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  style={{ color: "#34A853" }}
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  style={{ color: "#FBBC05" }}
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  style={{ color: "#EA4335" }}
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <div className="mt-8 text-xs text-gray-500 dark:text-gray-600 flex flex-col gap-1">
           <p>By clicking continue, you agree to our Terms of Service</p>
           <p>and Privacy Policy.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;