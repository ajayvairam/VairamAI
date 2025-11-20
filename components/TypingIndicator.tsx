import React from 'react';

const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700/50 shadow-sm w-fit">
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-[bounce_1s_infinite_400ms]"></div>
    </div>
  );
};

export default TypingIndicator;