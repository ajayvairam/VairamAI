import React, { useState, useRef, useEffect } from 'react';
import { Message, User, LoadingState, Attachment } from '../types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import { Send, Menu, Sparkles, Paperclip, X, FileText, Mic, Square, Music, StopCircle, Image as ImageIcon, ArrowUp, ChevronRight } from 'lucide-react';
import { APP_NAME } from '../constants';

interface ChatWindowProps {
  user: User;
  messages: Message[];
  loadingState: LoadingState;
  onSendMessage: (content: string, attachments: Attachment[]) => void;
  onEditMessage?: (messageId: string, newContent: string) => void;
  onSidebarToggle: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  user,
  messages,
  loadingState,
  onSendMessage,
  onEditMessage,
  onSidebarToggle,
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingState, attachments]);

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if ((!input.trim() && attachments.length === 0) || loadingState !== LoadingState.IDLE) return;
    onSendMessage(input, attachments);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const files: File[] = Array.from(e.target.files);
        const newAttachments: Attachment[] = [];

        for (const file of files) {
            try {
                const base64 = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                
                const isImage = file.type.startsWith('image/');
                const isAudio = file.type.startsWith('audio/');
                
                newAttachments.push({
                    type: isImage ? 'image' : isAudio ? 'audio' : 'file',
                    content: base64,
                    mimeType: file.type || 'application/octet-stream',
                    name: file.name
                });
            } catch (error) {
                console.error("Error reading file", error);
            }
        }
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // Improved Mime Type Detection
  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/aac',
      'audio/ogg'
    ];
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    // Default fallback if nothing else matches (browsers will usually handle one of the above)
    return 'audio/webm';
  };

  // Voice Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) return;
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAttachments(prev => [...prev, {
             type: 'audio',
             content: base64String,
             mimeType: mimeType,
             name: 'Voice Note'
          }]);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Microphone access denied. Please allow microphone permissions in your browser settings.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sampleQuestions = [
    "Explain your Exam Notes",
    "Draft a quarterly business review",
    "Explain quantum computing",
    "Write a Python script for analysis"
  ];

  return (
    <main className="flex-1 flex flex-col h-full relative bg-gray-50 dark:bg-gray-950 transition-colors duration-500 overflow-hidden">
      
      {/* Ambient Background Effects */}
      <div className="absolute top-0 left-0 w-full h-96 bg-emerald-500/5 dark:bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 right-0 w-full h-96 bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />

      {/* Header */}
      <header className="h-16 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <button
            onClick={onSidebarToggle}
            className="p-2 -ml-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl md:hidden transition-all"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-2.5">
             <span className="font-semibold text-lg text-gray-700 dark:text-gray-200 tracking-tight opacity-90">{APP_NAME}</span>
             <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                <Sparkles size={10} /> 2.5 FLASH
             </span>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-0 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700 relative z-10">
        <div className="max-w-3xl mx-auto pt-6 pb-32 min-h-full">
            {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-center px-6 animate-in fade-in duration-700">
                    <div className="w-20 h-20 bg-white dark:bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-xl shadow-gray-200/50 dark:shadow-black/50 mb-8 border border-gray-100 dark:border-gray-800">
                        <Sparkles className="text-emerald-500 dark:text-emerald-400 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">
                        How can I help you today?
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-8">
                        {sampleQuestions.map((hint, i) => (
                            <button 
                                key={i}
                                onClick={() => {
                                    setInput(hint);
                                    if(textareaRef.current) textareaRef.current.focus();
                                }}
                                className="group p-4 text-sm bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all text-left flex items-center justify-between shadow-sm hover:shadow-md"
                            >
                                <span className="text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{hint}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

          {messages.map((msg) => (
            <div key={msg.id} className="px-2 md:px-0">
                <MessageBubble 
                    message={msg} 
                    userAvatar={user.avatarUrl}
                    onEdit={onEditMessage}
                />
            </div>
          ))}

          {loadingState === LoadingState.THINKING && (
            <div className="flex w-full justify-start mb-8 px-2 md:px-0 animate-in fade-in duration-300">
                <div className="flex gap-4 items-end">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md">
                        <Sparkles size={16} className="text-white animate-pulse" />
                     </div>
                     <TypingIndicator />
                </div>
            </div>
          )}
           <div ref={bottomRef} />
        </div>
      </div>

      {/* Input Area - Floating Cockpit */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-950 dark:via-gray-950/90 dark:to-transparent px-4 pb-6 pt-10 z-20 pointer-events-none">
        <div className="max-w-3xl mx-auto relative pointer-events-auto">
            
            {/* Attachments Preview */}
            {attachments.length > 0 && (
                <div className="absolute bottom-full left-0 mb-3 flex gap-3 overflow-x-auto pb-2 w-full scrollbar-none animate-in slide-in-from-bottom-2 fade-in px-1">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative flex-shrink-0 group">
                            <div className="h-16 w-16 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center">
                                {att.type === 'image' ? (
                                    <img src={att.content} alt="preview" className="w-full h-full object-cover" />
                                ) : att.type === 'audio' ? (
                                    <div className="flex flex-col items-center text-emerald-500">
                                        <Music size={20} className="mb-1" />
                                    </div>
                                ) : (
                                    <FileText className="text-gray-400" />
                                )}
                            </div>
                            <button 
                                onClick={() => removeAttachment(i)}
                                className="absolute -top-2 -right-2 bg-gray-900 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-md hover:bg-red-500 scale-90 hover:scale-110"
                            >
                                <X size={10} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

          {/* Main Input Capsule */}
          <div className={`relative flex items-end gap-2 backdrop-blur-xl border rounded-[26px] p-2 shadow-2xl shadow-gray-200/50 dark:shadow-black/50 transition-all duration-300 ${
              isRecording 
              ? 'bg-white dark:bg-gray-900 border-red-500/50 dark:border-red-500/50 ring-4 ring-red-500/10' 
              : 'bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-gray-100 dark:focus-within:ring-gray-800 focus-within:bg-white dark:focus-within:bg-gray-900'
          }`}>
            
            <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                multiple
                accept="image/*,audio/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
            />
            
            {/* File Button */}
            {!isRecording && (
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-1.5 ml-1.5 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full transition-all active:scale-95"
                    title="Add Attachment"
                >
                    <Paperclip size={20} strokeWidth={2} />
                </button>
            )}

            {/* Input / Visualizer */}
            <div className="flex-1 min-h-[52px] flex items-center">
                {isRecording ? (
                    <div className="flex-1 flex items-center justify-between px-3 w-full">
                        {/* Timer */}
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-red-600 dark:text-red-400 font-mono font-bold text-sm">{formatDuration(recordingDuration)}</span>
                        </div>
                        
                        {/* CSS Waveform Animation */}
                        <div className="flex items-center gap-1 h-8 mx-4 flex-1 justify-center opacity-80">
                            {[...Array(12)].map((_, i) => (
                                <div 
                                    key={i} 
                                    className="w-1 bg-red-500 rounded-full animate-wave"
                                    style={{ 
                                        animationDelay: `${Math.random() * 0.5}s`,
                                        animationDuration: `${0.4 + Math.random() * 0.4}s`,
                                        height: '30%'
                                    }} 
                                />
                            ))}
                        </div>

                        <div className="text-xs font-medium text-red-500 uppercase tracking-wider hidden sm:block">Recording</div>
                    </div>
                ) : (
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={attachments.length > 0 ? "Add a message..." : "Message Vairam AI..."}
                        className="w-full max-h-[150px] bg-transparent border-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-500 focus:ring-0 resize-none py-3 px-3 min-h-[24px] leading-relaxed text-[15px]"
                        rows={1}
                    />
                )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-end gap-2 mb-1.5 mr-1.5">
                {isRecording ? (
                     <button
                        onClick={stopRecording}
                        className="group flex items-center justify-center w-10 h-10 rounded-full bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600 hover:scale-105 transition-all duration-200"
                     >
                         <StopCircle size={20} fill="currentColor" className="text-white" />
                     </button>
                ) : (
                    <>
                       {(!input.trim() && attachments.length === 0) ? (
                           <button
                                onClick={startRecording}
                                className="p-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 transition-all active:scale-95"
                                title="Voice Input"
                           >
                               <Mic size={22} strokeWidth={2} />
                           </button>
                       ) : (
                            <button
                            onClick={handleSend}
                            disabled={loadingState !== LoadingState.IDLE}
                            className="p-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md hover:opacity-90 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center"
                            >
                                <ArrowUp size={20} strokeWidth={2.5} />
                            </button>
                       )}
                    </>
                )}
            </div>
          </div>
          
          <div className="text-center mt-3">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-600">
              Vairam can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ChatWindow;