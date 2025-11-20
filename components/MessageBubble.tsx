import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../types';
import { Bot, Pencil, Check, X, FileText, Volume2, Pause, Play, User, Image as ImageIcon, Loader2, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { generateSpeech } from '../services/geminiService';

// --- Custom Audio Player Component ---
const CustomAudioPlayer: React.FC<{ src: string, isUser: boolean }> = ({ src, isUser }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      if (audio.duration && isFinite(audio.duration)) {
          setProgress((audio.currentTime / audio.duration) * 100);
      }
    };

    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) {
          setDuration(audio.duration);
      }
      setIsLoading(false);
      setHasError(false);
    };
    
    const onCanPlay = () => {
        setIsLoading(false);
        setHasError(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const onError = (e: any) => {
        console.error("Audio playback error for source:", src, e);
        setHasError(true);
        setIsPlaying(false);
        setIsLoading(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    // Explicitly load to trigger events for blobs sometimes
    if (audio.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
        audio.load();
    }

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current || hasError) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      // Reset if ended
      if (audioRef.current.ended) {
          audioRef.current.currentTime = 0;
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error("Play failed:", error);
            // Don't set error immediately for AbortError (common on rapid toggling)
            if (error.name !== 'AbortError') {
                setHasError(true);
            }
            setIsPlaying(false);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };
  
  const formatTime = (time: number) => {
      if (isNaN(time) || !isFinite(time)) return "0:00";
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Theming Logic ---
  // User Bubble (Right side): Green Theme
  // Light: bg-emerald-100, text-gray-900. Player needs dark accents.
  // Dark: bg-emerald-700, text-white. Player needs light/white accents.

  const containerClass = isUser 
    ? 'bg-emerald-900/5 border-emerald-900/10 dark:bg-black/20 dark:border-black/10' 
    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 shadow-sm';

  const buttonClass = isUser
    ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-white dark:text-emerald-700 dark:hover:bg-emerald-50'
    : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600';

  const trackClass = isUser
    ? 'bg-emerald-900/20 dark:bg-white/30' 
    : 'bg-gray-200 dark:bg-gray-700';

  const fillClass = isUser
    ? 'bg-emerald-600 dark:bg-white'
    : 'bg-emerald-500';
    
  const textClass = isUser
    ? 'text-emerald-900/80 dark:text-white/90'
    : 'text-gray-500 dark:text-gray-400';

  if (hasError) {
      return (
          <div className={`flex items-center gap-2 p-3 rounded-xl border w-full max-w-[280px] ${containerClass}`}>
              <AlertCircle size={20} className={isUser ? "text-emerald-700 dark:text-white/70" : "text-red-500"} />
              <span className={`text-xs font-medium ${textClass}`}>Audio unavailable</span>
          </div>
      );
  }

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-xl border w-full max-w-[280px] transition-all backdrop-blur-sm ${containerClass}`}>
      <button 
        onClick={togglePlay}
        disabled={isLoading}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${buttonClass} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
      >
        {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
        ) : isPlaying ? (
            <Pause size={16} fill="currentColor" /> 
        ) : (
            <Play size={16} fill="currentColor" className="ml-0.5" />
        )}
      </button>
      
      <div className="flex flex-col justify-center flex-1 min-w-0 gap-1.5 mr-1">
         {/* Progress Bar */}
         <div 
            className={`relative h-1 rounded-full overflow-hidden cursor-pointer group ${trackClass}`}
            onClick={(e) => {
               if (isLoading || hasError) return;
               const rect = e.currentTarget.getBoundingClientRect();
               const percent = (e.clientX - rect.left) / rect.width;
               if(audioRef.current && isFinite(audioRef.current.duration)) {
                   audioRef.current.currentTime = percent * audioRef.current.duration;
                   setProgress(percent * 100);
               }
            }}
         >
             <div 
                className={`h-full rounded-full absolute top-0 left-0 transition-all duration-100 ${fillClass}`} 
                style={{ width: `${progress}%` }}
             />
         </div>
         
         {/* Time Labels */}
         <div className={`flex items-center justify-between text-[10px] font-bold tracking-wide ${textClass}`}>
             <span>{formatTime(currentTime)}</span>
             <span>{formatTime(duration)}</span>
         </div>
      </div>
      
      <audio 
          ref={audioRef} 
          src={src} 
          preload="metadata" 
          className="hidden"
          playsInline 
      />
    </div>
  );
};

interface MessageBubbleProps {
  message: Message;
  userAvatar?: string;
  onEdit?: (messageId: string, newContent: string) => void;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, userAvatar, onEdit }) => {
  const isUser = message.role === 'user';
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // TTS State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setEditValue(message.content);
  }, [message.content]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      textareaRef.current.focus();
    }
  }, [isEditing, editValue]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== message.content) {
      onEdit?.(message.id, editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const toggleSpeech = async () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    if (audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
      return;
    }

    setIsLoadingAudio(true);
    try {
      const audioDataUrl = await generateSpeech(message.content);
      const audio = new Audio(audioDataUrl);
      
      audio.onended = () => setIsPlaying(false);
      audio.onpause = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      
      audioRef.current = audio;
      await audio.play();
    } catch (error) {
      console.error("Failed to play audio", error);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  return (
    <div
      className={`group w-full flex ${
        isUser ? 'justify-end' : 'justify-start'
      } mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500`}
    >
      <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden shadow-sm mt-1 ${isUser ? 'bg-emerald-100 dark:bg-emerald-700' : 'bg-gradient-to-tr from-emerald-500 to-emerald-600 shadow-emerald-500/20'}`}>
          {isUser ? (
             userAvatar ? (
                <img src={userAvatar} alt="User" className="w-full h-full object-cover" /> 
             ) : (
                <User size={16} className="text-emerald-700 dark:text-emerald-100" />
             )
          ) : (
             <Sparkles size={16} className="text-white" />
          )}
        </div>

        {/* Message Content Wrapper */}
        <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'} min-w-0 flex-1`}>
            
            <div className="flex flex-col gap-2 w-full">
                <div
                className={`relative px-5 py-3.5 rounded-2xl text-[15px] leading-7 shadow-sm backdrop-blur-sm transition-all duration-300 w-fit max-w-full ${
                    isUser
                    ? 'bg-emerald-100 dark:bg-emerald-700 text-gray-900 dark:text-white rounded-tr-sm shadow-sm'
                    : 'bg-white/80 dark:bg-gray-800/60 text-gray-800 dark:text-gray-100 rounded-tl-sm border border-gray-100 dark:border-gray-700/50'
                }`}
                >
                    {/* Attachments */}
                    {message.attachments && message.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {message.attachments.map((att, i) => {
                               if (att.type === 'image') {
                                   return (
                                        <div key={i} className={`relative rounded-lg overflow-hidden border w-full max-w-sm h-auto shadow-sm group/img ${isUser ? 'border-emerald-900/10 dark:border-black/10' : 'border-white/10'}`}>
                                            <img src={att.content} alt="attachment" className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                                        </div>
                                   );
                               } else if (att.type === 'audio') {
                                   return <CustomAudioPlayer key={i} src={att.content} isUser={isUser} />;
                               } else {
                                   return (
                                        <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${isUser ? 'bg-emerald-900/5 border-emerald-900/10 dark:bg-black/10 dark:border-black/10' : 'bg-white dark:bg-gray-700/30 border-gray-200 dark:border-gray-700'} max-w-[200px]`}>
                                            <FileText size={18} className={isUser ? 'text-emerald-700 dark:text-white/80' : 'text-gray-500 dark:text-gray-400'} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-medium truncate ${isUser ? 'text-emerald-900 dark:text-white' : 'text-gray-700 dark:text-gray-200'}`}>
                                                    {att.name || 'Document'}
                                                </p>
                                            </div>
                                        </div>
                                   );
                               }
                            })}
                        </div>
                    )}

                    {isEditing ? (
                    <div className="flex flex-col gap-3 min-w-[280px]">
                        <textarea
                        ref={textareaRef}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className={`w-full bg-transparent border-b outline-none resize-none text-[15px] leading-relaxed p-0 pb-2 ${isUser ? 'border-emerald-900/20 focus:border-emerald-900/50 dark:border-white/20 dark:focus:border-white/50 placeholder-emerald-900/50 dark:placeholder-white/50' : 'border-gray-300 focus:border-emerald-500'}`}
                        rows={1}
                        />
                        <div className="flex justify-end gap-2">
                        <button 
                            onClick={handleSave} 
                            className={`p-1.5 rounded-lg transition-colors ${isUser ? 'bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-900 dark:bg-white/20 dark:hover:bg-white/30 dark:text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                            <Check size={14} />
                        </button>
                        <button 
                            onClick={handleCancel} 
                            className={`p-1.5 rounded-lg transition-colors ${isUser ? 'hover:bg-emerald-900/10 text-emerald-900/60 hover:text-emerald-900 dark:hover:bg-white/10 dark:text-white/70 dark:hover:text-white' : 'hover:bg-gray-100 text-gray-500'}`}
                        >
                            <X size={14} />
                        </button>
                        </div>
                    </div>
                    ) : (
                    <div className="whitespace-pre-wrap break-words markdown-body font-normal tracking-wide">{message.content}</div>
                    )}
                </div>
                
                {/* Message Toolbar */}
                <div className="flex items-center gap-2 px-1 h-6 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                   {!isUser && !isEditing && message.content && (
                        <button
                            onClick={toggleSpeech}
                            disabled={isLoadingAudio}
                            className={`flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded-full transition-all border ${
                                isPlaying 
                                ? 'bg-emerald-100 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400' 
                                : 'border-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                            }`}
                        >
                            {isLoadingAudio ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : isPlaying ? (
                              <Pause size={12} />
                            ) : (
                              <Volume2 size={12} />
                            )}
                            {isPlaying ? 'Stop' : 'Read Aloud'}
                        </button>
                    )}

                    {!isEditing && isUser && onEdit && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-[11px] font-medium text-gray-400 hover:text-gray-900 dark:hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Pencil size={10} /> Edit
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;