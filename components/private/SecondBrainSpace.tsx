
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { featureService } from '../../services/featureService';
import { User } from '../../types';
import { BlogContent } from '../BlogContent';
import { toast } from '../Toast';

interface SecondBrainSpaceProps {
  user: User | null;
}

interface BrainMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  avatar?: string;
  name?: string;
}

const DEFAULT_AI_AVATAR = "https://cdn-icons-png.flaticon.com/512/4712/4712027.png";

export const SecondBrainSpace: React.FC<SecondBrainSpaceProps> = ({ user }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<BrainMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load History
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const historyData = await featureService.getAiChatHistory();
        
        if (historyData && historyData.length > 0) {
          const mappedMessages: BrainMessage[] = historyData.map((msg: any) => ({
            id: msg._id,
            role: (msg.user && (msg.user.id === 'ai_assistant' || msg.user._id === 'ai_assistant')) ? 'assistant' : 'user',
            content: msg.content || msg.text || '',
            timestamp: new Date(msg.createdDate || Date.now()),
            avatar: msg.user?.photoURL || (msg.user?.id === 'ai_assistant' ? DEFAULT_AI_AVATAR : undefined),
            name: msg.user?.displayName
          }));
          setMessages(mappedMessages);
        } else {
          // If no history, show welcome message
          setMessages([
            {
              id: 'welcome',
              role: 'assistant',
              content: t.privateSpace.secondBrain.welcome || "Hello. I am your Second Brain. I have access to your journal, fitness logs, and project data. How can I assist you?",
              timestamp: new Date(),
              avatar: DEFAULT_AI_AVATAR,
              name: 'Second Brain'
            }
          ]);
        }
      } catch (err) {
        console.error("Failed to load Second Brain history", err);
      } finally {
        setIsInitializing(false);
      }
    };

    fetchHistory();
  }, [t]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userText = input.trim();
    const tempId = Date.now().toString();

    // 1. Add User Message to UI
    const userMsg: BrainMessage = {
      id: tempId,
      role: 'user',
      content: userText,
      timestamp: new Date(),
      avatar: user?.photoURL,
      name: user?.displayName
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      // 2. Save User Message to Backend (Async, don't await blocking UI)
      featureService.saveAiChatMessage(userText, 'user').catch(err => console.error("Failed to save user message", err));

      // 3. Create Placeholder for AI Response
      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        isStreaming: true,
        avatar: DEFAULT_AI_AVATAR,
        name: 'Second Brain'
      }]);

      // 4. Prepare Context & Stream
      // Limit context to last 10 messages for efficiency
      const recentHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      // Add current user message
      recentHistory.push({ role: 'user', content: userText });

      let fullAiResponse = "";

      // Stream with simulated smoothness
      // We'll update the state on every chunk, but React's render cycle usually handles this "typing" feel naturally
      // if the chunks are small. If the API sends large chunks, it might feel jumpy.
      await featureService.askLifeStream(userText, recentHistory, (chunk) => {
        fullAiResponse += chunk;
        setMessages(prev => prev.map(m => {
          if (m.id === aiMsgId) {
            return { ...m, content: m.content + chunk };
          }
          return m;
        }));
      });

      // 5. Stream Complete - Save AI Response
      if (fullAiResponse) {
         await featureService.saveAiChatMessage(fullAiResponse, 'ai');
      }

    } catch (error) {
      console.error(error);
      setMessages(prev => {
        // If last message is the empty AI placeholder, show error
        const last = prev[prev.length - 1];
        if (last.isStreaming && last.role === 'assistant') {
           return prev.map(m => m.id === last.id ? { ...m, content: m.content + "\n\n*[Connection Error: Brain Offline]*", isStreaming: false } : m);
        }
        return prev;
      });
    } finally {
      setMessages(prev => prev.map(m => ({ ...m, isStreaming: false })));
      setIsProcessing(false);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to permanently delete all memory from the database? This cannot be undone.")) return;
    try {
      await featureService.clearAiChatHistory();
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: "Memory wiped from database. Starting fresh tabula rasa.",
          timestamp: new Date(),
          avatar: DEFAULT_AI_AVATAR,
          name: 'Second Brain'
        }
      ]);
      toast.success("Brain memory permanently cleared.");
    } catch (e) {
      toast.error("Failed to clear memory.");
    }
  };

  const handleNewSession = () => {
      setMessages([
        {
          id: 'new-session',
          role: 'assistant',
          content: "Starting a new session context. (Previous history remains in database but is cleared from view).",
          timestamp: new Date(),
          avatar: DEFAULT_AI_AVATAR,
          name: 'Second Brain'
        }
      ]);
      toast.info("New session started.");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full relative max-w-5xl mx-auto w-full">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[2rem] z-0">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Chat Container */}
      <div className="flex-1 bg-white/40 backdrop-blur-xl border border-white/50 rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative z-10 min-h-0">
        
        {/* Header */}
        <div className="p-4 border-b border-indigo-100/50 flex items-center justify-between bg-white/40 shrink-0">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 overflow-hidden border-2 border-white/20">
                 <img src={DEFAULT_AI_AVATAR} alt="Brain" className="w-full h-full object-cover" />
              </div>
              <div>
                 <h2 className="font-display font-bold text-slate-800 text-lg leading-none">{t.privateSpace.secondBrain.title}</h2>
                 <p className="text-[10px] text-indigo-500 font-mono uppercase tracking-widest mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    {t.privateSpace.secondBrain.subtitle}
                 </p>
              </div>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={handleNewSession}
                className="text-xs font-bold text-slate-500 hover:text-indigo-600 uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors border border-transparent hover:border-indigo-100"
                title="Start New Session (Clear View)"
              >
                <i className="fas fa-plus"></i> <span className="hidden sm:inline">New Session</span>
              </button>
              <button 
                onClick={handleClearHistory}
                className="text-xs font-bold text-slate-400 hover:text-red-500 uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors border border-transparent hover:border-red-100"
                title="Permanently Delete History"
              >
                <i className="fas fa-trash-alt"></i> <span className="hidden sm:inline">Wipe Memory</span>
              </button>
           </div>
        </div>

        {/* Messages Area - Ensure this takes up all remaining space and scrolls */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
           {isInitializing ? (
              <div className="flex items-center justify-center h-full text-indigo-300 gap-2">
                 <i className="fas fa-circle-notch fa-spin"></i> Loading memories...
              </div>
           ) : (
             messages.map((msg) => {
               const isUser = msg.role === 'user';
               return (
                 <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in group`}>
                    <div className={`max-w-[90%] md:max-w-[80%] flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                       
                       {/* Avatar */}
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 shadow-sm overflow-hidden border ${isUser ? 'bg-slate-200 border-white' : 'bg-white border-indigo-100'}`}>
                          {isUser ? (
                             <img src={user?.photoURL} alt="Me" className="w-full h-full object-cover" />
                          ) : (
                             <img src={msg.avatar || DEFAULT_AI_AVATAR} alt="AI" className="w-full h-full object-cover" />
                          )}
                       </div>

                       {/* Bubble */}
                       <div className={`
                          relative px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
                          ${isUser 
                             ? 'bg-slate-800 text-white rounded-tr-sm' 
                             : 'bg-white text-slate-800 rounded-tl-sm border border-white/60'
                          }
                       `}>
                          {/* Name Label */}
                          {!isUser && msg.name && msg.name !== 'Second Brain' && (
                             <div className="text-[10px] font-bold text-indigo-500 mb-1 opacity-70 uppercase tracking-wider">{msg.name}</div>
                          )}

                          {isUser ? (
                             <div className="whitespace-pre-wrap">{msg.content}</div>
                          ) : (
                             <div className="markdown-body-chat relative">
                                {msg.content ? (
                                   <>
                                     <BlogContent content={msg.content} shadowClass="shadow-none border-none p-0" forceLight={true} />
                                     {/* Blinking Cursor for Streaming */}
                                     {msg.isStreaming && (
                                        <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 align-middle animate-[blink_1s_step-end_infinite]"></span>
                                     )}
                                   </>
                                ) : msg.isStreaming ? (
                                   <div className="flex gap-1 items-center h-5">
                                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                                      <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                                   </div>
                                ) : null}
                             </div>
                          )}
                          <div className={`text-[9px] mt-1 opacity-50 font-mono ${isUser ? 'text-right text-slate-300' : 'text-left text-slate-400'}`}>
                             {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                       </div>
                    </div>
                 </div>
               )
             })
           )}
        </div>

        {/* Input Area - Fixed at bottom of container */}
        <div className="p-4 bg-white/60 border-t border-indigo-100/50 shrink-0">
           <div className="relative bg-white rounded-3xl border border-indigo-100 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-300 transition-all flex items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t.privateSpace.secondBrain.placeholder}
                className="w-full bg-transparent border-none outline-none py-4 pl-5 pr-14 text-slate-700 placeholder:text-slate-400 resize-none max-h-40 min-h-[56px] text-sm"
                rows={1}
                disabled={isProcessing}
              />
              <button
                onClick={() => handleSubmit()}
                disabled={!input.trim() || isProcessing}
                className="absolute bottom-2 right-2 w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-indigo-500/30 transition-all"
              >
                 {isProcessing ? <i className="fas fa-stop text-xs"></i> : <i className="fas fa-arrow-up text-sm"></i>}
              </button>
           </div>
           <div className="text-center mt-2">
              <span className="text-[10px] text-slate-400 font-mono">
                 AI Access: Journal • Fitness • Projects • Resume
              </span>
           </div>
        </div>

      </div>

      <style>{`
        /* Minimal override to ensure chat markdown fits nicely */
        .markdown-body-chat .prose {
           font-size: 0.925rem;
           line-height: 1.6;
        }
        .markdown-body-chat .prose p {
           margin-bottom: 0.75em;
        }
        .markdown-body-chat .prose pre {
           background-color: #1e293b !important;
           border-radius: 0.5rem;
           padding: 0.75rem;
           margin: 0.75rem 0;
        }
        /* Hide the large decorative blobs from BlogContent in chat mode */
        .markdown-body-chat .absolute.blur-\[100px\] {
           display: none;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};
