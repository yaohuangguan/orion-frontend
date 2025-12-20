
import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { featureService } from '../../services/featureService';
import { User } from '../../types';
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

  // Highlight Code blocks when messages update
  useEffect(() => {
    if (window.hljs && scrollRef.current) {
      scrollRef.current.querySelectorAll('pre code').forEach((block) => {
        window.hljs.highlightElement(block as HTMLElement);
      });
    }
  }, [messages]);

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
      name: user?.displayName || 'User'
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);
    
    // Reset textarea height
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      // 2. Save User Message to Backend (Async)
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
      const recentHistory = messages.slice(-10).map(m => ({
        role: m.role,
        content: m.content
      }));
      recentHistory.push({ role: 'user', content: userText });

      let fullAiResponse = "";

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
    if (!confirm("Are you sure you want to permanently delete all memory from the database?")) return;
    try {
      await featureService.clearAiChatHistory();
      setMessages([
        {
          id: 'welcome-reset',
          role: 'assistant',
          content: "Memory wiped. Ready for new input.",
          timestamp: new Date(),
          avatar: DEFAULT_AI_AVATAR,
          name: 'Second Brain'
        }
      ]);
      toast.success("Brain memory cleared.");
    } catch (e) {
      toast.error("Failed to clear memory.");
    }
  };

  const handleNewSession = () => {
      setMessages([
        {
          id: 'new-session',
          role: 'assistant',
          content: "New session started.",
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleFeedback = (type: 'like' | 'dislike') => {
    toast.info(type === 'like' ? "Feedback: Helpful" : "Feedback: Not Helpful");
  };

  // Custom Markdown Rendering logic (replacing BlogContent)
  const renderMarkdown = (content: string) => {
    if (!content) return { __html: '' };
    if (window.marked) {
      try {
        return { __html: window.marked.parse(content) };
      } catch (e) {
        return { __html: content };
      }
    }
    return { __html: content };
  };

  return (
    <div className="flex flex-col h-full relative max-w-6xl mx-auto w-full">
      
      {/* Main Chat Container - ChatGPT Style Dark Theme */}
      <div className="flex-1 bg-[#212121] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative z-10 min-h-0 border border-[#333]">
        
        {/* Header (Minimalist) */}
        <div className="p-4 flex items-center justify-between shrink-0 z-20 border-b border-white/5 bg-[#212121]">
           <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-200">
                 {t.privateSpace.secondBrain.title} <span className="opacity-50 font-normal">3.0</span>
              </span>
           </div>
           
           <div className="flex gap-2">
              <button 
                onClick={handleNewSession}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="New Chat"
              >
                <i className="fas fa-edit text-sm"></i>
              </button>
              <button 
                onClick={handleClearHistory}
                className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Delete Memory"
              >
                <i className="fas fa-trash-alt text-sm"></i>
              </button>
           </div>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
           {isInitializing ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
                 <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
                 <p className="text-xs uppercase tracking-widest">Initializing Neural Net...</p>
              </div>
           ) : (
             <div className="flex flex-col pb-4">
                {messages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div 
                      key={msg.id} 
                      className={`w-full py-8 px-4 md:px-12 border-b border-black/5 ${isUser ? 'bg-[#212121]' : 'bg-[#212121]'}`} // Keep background consistent for "layered" feel via spacing/indent
                    >
                       <div className="max-w-4xl mx-auto flex gap-6">
                          
                          {/* Avatar Column */}
                          <div className={`shrink-0 flex flex-col items-center ${isUser ? 'order-2' : 'order-1'}`}>
                             <div className={`w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center ${isUser ? 'bg-transparent' : 'bg-green-500/10'}`}>
                                <img 
                                  src={msg.avatar} 
                                  alt={msg.role} 
                                  className="w-full h-full object-cover rounded-sm"
                                  onError={(e) => (e.currentTarget.src = DEFAULT_AI_AVATAR)} 
                                />
                             </div>
                          </div>

                          {/* Content Column */}
                          <div className={`flex-1 min-w-0 ${isUser ? 'order-1 text-right' : 'order-2 text-left'}`}>
                             {/* Name Header */}
                             <div className={`text-xs font-bold mb-2 ${isUser ? 'text-gray-400' : 'text-gray-200'}`}>
                                {msg.name}
                             </div>

                             {/* Message Body */}
                             {isUser ? (
                                <div className="inline-block bg-[#2f2f2f] text-gray-100 px-5 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap text-left shadow-sm">
                                   {msg.content}
                                </div>
                             ) : (
                                <div className="chat-content text-gray-300 text-[15px] leading-7 relative">
                                   {msg.content ? (
                                      <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                                   ) : (
                                      <div className="flex items-center gap-1 h-6">
                                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                                         <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                                      </div>
                                   )}
                                   {msg.isStreaming && (
                                      <span className="inline-block w-2 h-4 bg-gray-400 ml-1 align-middle animate-pulse"></span>
                                   )}
                                </div>
                             )}

                             {/* AI Actions Footer */}
                             {!isUser && !msg.isStreaming && msg.content && (
                                <div className="flex items-center gap-4 mt-3 pt-2">
                                   <button 
                                      onClick={() => copyToClipboard(msg.content)} 
                                      className="text-gray-500 hover:text-gray-300 transition-colors text-xs flex items-center gap-1"
                                   >
                                      <i className="fas fa-copy"></i>
                                   </button>
                                   <button 
                                      onClick={() => handleFeedback('like')} 
                                      className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
                                   >
                                      <i className="fas fa-thumbs-up"></i>
                                   </button>
                                   <button 
                                      onClick={() => handleFeedback('dislike')} 
                                      className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
                                   >
                                      <i className="fas fa-thumbs-down"></i>
                                   </button>
                                </div>
                             )}
                          </div>
                       </div>
                    </div>
                  );
                })}
             </div>
           )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-[#212121] border-t border-white/5 shrink-0">
           <div className="max-w-3xl mx-auto relative">
              <div className="relative bg-[#2f2f2f] rounded-xl border border-gray-700 focus-within:border-gray-500 shadow-lg transition-colors">
                 <textarea
                   ref={inputRef}
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder={t.privateSpace.secondBrain.placeholder}
                   className="w-full bg-transparent border-none outline-none py-3 pl-4 pr-12 text-gray-200 placeholder:text-gray-500 resize-none max-h-48 min-h-[52px] text-sm leading-relaxed custom-scrollbar"
                   rows={1}
                   disabled={isProcessing}
                 />
                 <button
                   onClick={() => handleSubmit()}
                   disabled={!input.trim() || isProcessing}
                   className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      !input.trim() 
                      ? 'bg-transparent text-gray-600 cursor-not-allowed' 
                      : 'bg-white text-black hover:bg-gray-200'
                   }`}
                 >
                    {isProcessing ? <i className="fas fa-stop text-xs"></i> : <i className="fas fa-arrow-up text-xs"></i>}
                 </button>
              </div>
              <p className="text-[10px] text-gray-500 text-center mt-2">
                 AI can make mistakes. Consider checking important information.
              </p>
           </div>
        </div>

      </div>

      <style>{`
        /* Chat Content Specific Styles (replacing BlogContent) */
        .chat-content p {
           margin-bottom: 1em;
        }
        .chat-content p:last-child {
           margin-bottom: 0;
        }
        .chat-content h1, .chat-content h2, .chat-content h3 {
           color: #f3f4f6; /* gray-100 */
           font-weight: 700;
           margin-top: 1.5em;
           margin-bottom: 0.5em;
        }
        .chat-content ul, .chat-content ol {
           margin-left: 1.5em;
           margin-bottom: 1em;
           list-style-type: disc;
        }
        .chat-content ol {
           list-style-type: decimal;
        }
        .chat-content li {
           margin-bottom: 0.25em;
        }
        .chat-content strong {
           color: #fff;
           font-weight: 700;
        }
        .chat-content blockquote {
           border-left: 3px solid #4b5563;
           padding-left: 1em;
           color: #9ca3af;
           font-style: italic;
        }
        .chat-content code {
           background-color: #2f2f2f;
           padding: 0.2em 0.4em;
           border-radius: 4px;
           font-family: monospace;
           font-size: 0.9em;
           color: #e5e7eb;
        }
        .chat-content pre {
           background-color: #0d0d0d;
           padding: 1em;
           border-radius: 8px;
           overflow-x: auto;
           margin: 1em 0;
           border: 1px solid #333;
        }
        .chat-content pre code {
           background-color: transparent;
           padding: 0;
           border-radius: 0;
           color: inherit;
           font-size: 0.85em;
        }
        .chat-content a {
           color: #60a5fa;
           text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
