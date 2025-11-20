
import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import { User, ChatSession, Message, LoadingState, Attachment } from './types';
import { sendMessageToGemini } from './services/geminiService';
import { MOCK_USER } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  
  // Persist theme in localStorage (This is UI preference only, not chat data)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('vairam_theme');
    return savedTheme ? savedTheme === 'dark' : true;
  });
  
  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  // Theme Management
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('vairam_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('vairam_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handle Login
  const handleLogin = async () => {
    setIsAuthLoading(true);
    // Simulate a short delay for realism
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser(MOCK_USER);
    setIsAuthenticated(true);
    setIsAuthLoading(false);
  };

  const handleLogout = async () => {
    setUser(null);
    setIsAuthenticated(false);
    setSessions([]);
    setCurrentSessionId(null);
  };

  // Create New Chat
  const createNewChat = () => {
    if (!user) return;
    
    const newChatId = `chat_${Date.now()}`;
    const newSession: ChatSession = {
      id: newChatId,
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
    };
    
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newChatId);
  };

  // Handle Renaming Chat
  const handleRenameChat = (id: string, newTitle: string) => {
    setSessions(prev => prev.map(session => 
      session.id === id ? { ...session, title: newTitle } : session
    ));
  };

  // Handle Deleting Chat
  const handleDeleteChat = (id: string) => {
    const remaining = sessions.filter(s => s.id !== id);
    
    setSessions(remaining);
    if (currentSessionId === id) {
        setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Handle Sending Message
  const handleSendMessage = async (content: string, attachments: Attachment[] = []) => {
    // If no session selected, create one first
    let activeSessionId = currentSessionId;
    
    if (!activeSessionId) {
        const newChatId = `chat_${Date.now()}`;
        const newSession: ChatSession = {
          id: newChatId,
          title: 'New Conversation',
          messages: [],
          createdAt: Date.now(),
        };
        
        setSessions((prev) => [newSession, ...prev]);
        setCurrentSessionId(newChatId);
        activeSessionId = newChatId;
    }

    const newMessage: Message = {
      id: `msg_${Date.now()}_u`,
      role: 'user',
      content,
      attachments,
      timestamp: Date.now(),
    };

    // 1. Update Local State with User Message
    let history: Message[] = [];

    setSessions((prev) => {
      return prev.map((session) => {
        if (session.id === activeSessionId) {
            const isFirstMessage = session.messages.length === 0;
            const newTitle = isFirstMessage
                ? (content 
                    ? content.slice(0, 30) + (content.length > 30 ? '...' : '') 
                    : (attachments.length > 0 ? 'Image Analysis' : 'New Conversation'))
                : session.title;

            const updatedMessages = [...session.messages, newMessage];
            history = updatedMessages; // Capture for API call

            return { 
              ...session, 
              title: newTitle,
              messages: updatedMessages 
            };
        }
        return session;
      });
    });

    setLoadingState(LoadingState.THINKING);

    try {
      // If history is empty (due to state closure/timing), we can try to fetch from state, but inside setState map is safest to grab it.
      // However, state updates are async. We need the history including the new message we just added.
      // Since setSessions is functional, we can't easily extract the result synchronously to pass to API.
      // Strategy: Reconstruct what the history *will* be.
      const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
      const previousMessages = sessionToUpdate ? sessionToUpdate.messages : [];
      const contextMessages = [...previousMessages, newMessage];
      
      const { text: responseText, attachments: generatedAttachments } = await sendMessageToGemini(contextMessages, content, attachments);

      const botMessage: Message = {
        id: `msg_${Date.now()}_b`,
        role: 'model',
        content: responseText,
        attachments: generatedAttachments,
        timestamp: Date.now(),
      };

      // 2. Update Local State with Bot Message
      setSessions((prev) => {
         return prev.map((session) => {
            if (session.id === activeSessionId) {
                return { ...session, messages: [...session.messages, botMessage] };
            }
            return session;
         });
      });
      
      setLoadingState(LoadingState.IDLE);
    } catch (error) {
      console.error(error);
      handleError();
    }
  };

  // Handle Edit Message
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentSessionId) return;

    const currentSession = sessions.find(s => s.id === currentSessionId);
    if (!currentSession) return;

    const msgIndex = currentSession.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const originalAttachments = currentSession.messages[msgIndex].attachments || [];
    const historyBefore = currentSession.messages.slice(0, msgIndex);

    const updatedUserMessage: Message = {
      ...currentSession.messages[msgIndex],
      content: newContent,
      timestamp: Date.now(),
      attachments: originalAttachments
    };

    // 1. Update UI: Truncate and update user message
    setSessions((prev) => {
        return prev.map((session) => {
            if (session.id === currentSessionId) {
                return { ...session, messages: [...historyBefore, updatedUserMessage] };
            }
            return session;
        });
    });

    setLoadingState(LoadingState.THINKING);

    try {
      const { text: responseText, attachments: generatedAttachments } = await sendMessageToGemini(historyBefore, newContent, originalAttachments);

      const botMessage: Message = {
        id: `msg_${Date.now()}_b`,
        role: 'model',
        content: responseText,
        attachments: generatedAttachments,
        timestamp: Date.now(),
      };

      // 2. Update UI: Add new Bot Response
      setSessions((prev) => {
        return prev.map((session) => {
          if (session.id === currentSessionId) {
             return { ...session, messages: [...session.messages, botMessage] };
          }
          return session;
        });
      });

      setLoadingState(LoadingState.IDLE);
    } catch (error) {
      console.error(error);
      handleError();
    }
  };

  const handleError = async () => {
     setLoadingState(LoadingState.ERROR);
      const errorMessage: Message = {
        id: `msg_${Date.now()}_err`,
        role: 'model',
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        timestamp: Date.now(),
      };
      
      setSessions((prev) => {
        return prev.map((session) => {
          if (session.id === currentSessionId) {
            return { ...session, messages: [...session.messages, errorMessage] };
          }
          return session;
        });
      });

      setLoadingState(LoadingState.IDLE);
  }

  // Get current messages
  const currentMessages = sessions.find((s) => s.id === currentSessionId)?.messages || [];

  if (isAuthLoading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-gray-950">
              <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
      );
  }

  if (!isAuthenticated || !user) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 overflow-hidden transition-colors duration-300">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onNewChat={createNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <ChatWindow
          user={user}
          messages={currentMessages}
          loadingState={loadingState}
          onSendMessage={handleSendMessage}
          onEditMessage={handleEditMessage}
          onSidebarToggle={() => setSidebarOpen(true)}
        />
      </div>
    </div>
  );
};

export default App;
