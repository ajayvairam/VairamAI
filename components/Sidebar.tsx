import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, User } from '../types';
import { Plus, MessageSquare, LogOut, X, Sparkles, Sun, Moon, Pencil, Trash2, Check } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onDeleteChat: (id: string) => void;
  onLogout: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onRenameChat,
  onDeleteChat,
  onLogout,
  isDarkMode,
  toggleTheme,
}) => {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingSessionId]);

  const startRename = (session: ChatSession) => {
    setEditingSessionId(session.id);
    setEditTitle(session.title);
    setDeleteConfirmId(null); // Cancel any pending delete
  };

  const saveRename = (sessionId: string) => {
    if (editTitle.trim()) {
      onRenameChat(sessionId, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const cancelRename = () => {
    setEditingSessionId(null);
    setEditTitle('');
  };

  const startDelete = (sessionId: string) => {
    setDeleteConfirmId(sessionId);
    setEditingSessionId(null); // Cancel any pending edit
  };

  const confirmDelete = (sessionId: string) => {
    onDeleteChat(sessionId);
    setDeleteConfirmId(null);
    if (window.innerWidth < 768) onClose();
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-gray-50 dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / New Chat */}
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-6 px-1 md:hidden">
             <span className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-500"/> VAIRAM AI
             </span>
             <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
               <X size={24} />
             </button>
          </div>

          <button
            onClick={() => {
              onNewChat();
              if(window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-lg shadow-emerald-900/10 dark:shadow-emerald-900/20 group"
          >
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="font-medium text-sm">New Chat</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800">
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
            Recent Activity
          </div>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`group relative flex items-center gap-3 px-3 py-3 text-sm rounded-lg transition-colors cursor-pointer ${
                currentSessionId === session.id
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
                {editingSessionId === session.id ? (
                    // Edit Mode
                    <div className="flex items-center w-full gap-1 animate-in fade-in duration-200">
                        <input 
                            ref={editInputRef}
                            type="text" 
                            value={editTitle} 
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="flex-1 bg-white dark:bg-gray-950 border border-emerald-500 rounded px-2 py-1 text-xs outline-none text-gray-900 dark:text-white shadow-sm"
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') saveRename(session.id);
                                if(e.key === 'Escape') cancelRename();
                            }}
                            onClick={(e) => e.stopPropagation()} 
                        />
                        <button onClick={(e) => { e.stopPropagation(); saveRename(session.id); }} className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded"><Check size={14}/></button>
                        <button onClick={(e) => { e.stopPropagation(); cancelRename(); }} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"><X size={14}/></button>
                    </div>
                ) : deleteConfirmId === session.id ? (
                    // Delete Confirmation Mode
                    <div className="flex items-center justify-between w-full animate-in fade-in duration-200">
                        <span className="text-xs text-red-500 font-medium truncate mr-2 flex-1">Delete chat?</span>
                        <div className="flex items-center gap-1">
                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(session.id); }} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors" title="Confirm Delete"><Check size={14}/></button>
                            <button onClick={(e) => { e.stopPropagation(); cancelDelete(); }} className="p-1 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors" title="Cancel"><X size={14}/></button>
                        </div>
                    </div>
                ) : (
                    // Default Mode
                    <>
                        <button 
                            className="flex-1 flex items-center gap-3 min-w-0 text-left bg-transparent border-none p-0 cursor-pointer outline-none"
                            onClick={() => {
                                onSelectSession(session.id);
                                if(window.innerWidth < 768) onClose();
                            }}
                        >
                            <MessageSquare size={16} className={`flex-shrink-0 ${currentSessionId === session.id ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400'}`} />
                            <span className="truncate pr-12 relative w-full block">
                                {session.title}
                            </span>
                        </button>
                        
                        {/* Actions - Visible on hover or if active (with reduced opacity if active) */}
                        <div className={`absolute right-2 flex items-center gap-1 pl-2 bg-gradient-to-l ${
                            currentSessionId === session.id 
                            ? 'from-gray-200 via-gray-200 dark:from-gray-800 dark:via-gray-800' 
                            : 'from-gray-100 via-gray-100 dark:from-gray-900 dark:via-gray-900 opacity-0 group-hover:opacity-100'
                        } to-transparent transition-all duration-200`}>
                            <button 
                                onClick={(e) => { e.stopPropagation(); startRename(session); }} 
                                className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded-md transition-colors" 
                                title="Rename"
                            >
                                <Pencil size={14} />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); startDelete(session.id); }} 
                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-gray-300/50 dark:hover:bg-gray-700/50 rounded-md transition-colors" 
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </>
                )}
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center text-gray-400 dark:text-gray-600 text-sm py-10 italic">
                No chat history yet.
            </div>
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-900 transition-colors cursor-default group">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/20 group-hover:border-emerald-500 transition-colors">
                {user.avatarUrl ? (
                    <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Sparkles className="text-emerald-600 dark:text-emerald-400" size={20} />
                )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 truncate font-medium">Beta Version</p>
            </div>
            <div className="flex gap-1">
                <button 
                    onClick={toggleTheme}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Toggle Theme"
                >
                    {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                </button>
                <button 
                    onClick={onLogout}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                    title="Sign out"
                >
                    <LogOut size={18} />
                </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;