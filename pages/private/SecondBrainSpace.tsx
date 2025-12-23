import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { featureService } from '../../services/featureService';
import { compressImage } from '../../services/media';
import { User, Conversation } from '../../types';
import { toast } from '../../components/Toast';
import { DeleteModal } from '../../components/DeleteModal';

// --- Types for Web Speech API ---
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

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
  image?: string; // Base64 image
}

const DEFAULT_AI_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4712/4712027.png';

// Helper to generate UUID-like string if crypto.randomUUID is not available in some contexts
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const SecondBrainSpace: React.FC<SecondBrainSpaceProps> = ({ user }) => {
  const { t, language } = useTranslation();

  // Session State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Delete Modal State
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);

  // Chat State
  const [messages, setMessages] = useState<BrainMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Image Upload State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Input State
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const voiceTranscriptRef = useRef<string>(''); // Ref to hold transcript for send-on-release

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // --- 1. Load Conversations List on Mount ---
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        const list = await featureService.getAiConversations();
        setConversations(list);

        if (list.length > 0) {
          // Auto-select first (most recent) session
          handleSwitchSession(list[0].sessionId);
        } else {
          // No history, start fresh (ghost session)
          handleNewChat();
        }
      } catch (err) {
        console.error('Failed to init brain:', err);
        handleNewChat(); // Fallback
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // --- 2. Action: Switch Session ---
  const handleSwitchSession = async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsSidebarOpen(false); // Close mobile sidebar on select
    setMessages([]); // Clear view while loading

    // Fetch History
    try {
      const historyData = await featureService.getAiChatHistory(sessionId, 1, 50);

      if (historyData && historyData.length > 0) {
        const mappedMessages: BrainMessage[] = historyData.map((msg: any) => ({
          id: msg._id,
          role:
            msg.user && (msg.user.id === 'ai_assistant' || msg.user._id === 'ai_assistant')
              ? 'assistant'
              : 'user',
          content: msg.content || msg.text || '',
          timestamp: new Date(msg.createdDate || Date.now()),
          avatar:
            msg.user?.photoURL || (msg.user?.id === 'ai_assistant' ? DEFAULT_AI_AVATAR : undefined),
          name: msg.user?.displayName,
          image: msg.image && msg.image.length > 0 ? msg.image[0] : undefined // Backend stores array, take first
        }));
        setMessages(mappedMessages);
      } else {
        setMessages([]); // Empty session
      }
    } catch (e) {
      console.error('Failed to load session history', e);
    }
  };

  // --- 3. Action: New Chat (Ghost Session) ---
  const handleNewChat = () => {
    const newId = generateUUID();
    setCurrentSessionId(newId);
    setMessages([]); // Clear screen
    setIsSidebarOpen(false);
    // Don't add to `conversations` list yet. Backend creates it on first message.
  };

  // --- 4. Action: Delete Session ---
  const confirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    const sessionId = sessionToDelete;

    try {
      await featureService.deleteAiConversation(sessionId);
      setConversations((prev) => prev.filter((c) => c.sessionId !== sessionId));
      setSessionToDelete(null);

      // If deleted active session, switch to new
      if (currentSessionId === sessionId) {
        const remaining = conversations.filter((c) => c.sessionId !== sessionId);
        if (remaining.length > 0) {
          handleSwitchSession(remaining[0].sessionId);
        } else {
          handleNewChat();
        }
      }
    } catch (e) {
      toast.error('Failed to delete session');
    }
  };

  // --- Auto-scroll & Syntax Highlighting ---
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing, selectedImage]);

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

  // --- Voice Input Logic (Hold to Speak) ---
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Speech recognition not supported.');
      return;
    }

    if (isRecording) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    // Map language
    const langMap: Record<string, string> = {
      zh: 'zh-CN',
      'zh-HK': 'zh-HK',
      en: 'en-US',
      ja: 'ja-JP',
      fr: 'fr-FR',
      ru: 'ru-RU',
      de: 'de-DE',
      es: 'es-ES'
    };
    recognition.lang = langMap[language] || 'en-US';

    voiceTranscriptRef.current = ''; // Clear previous

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      // Accumulate transcript
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      // Update ref, prefer final, append interim for feedback if we were displaying it
      // For simplicity in send-on-release, we just track the total accumulated text
      // Note: `event.results` contains all results from start if continuous=true
      const allText = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join('');

      voiceTranscriptRef.current = allText;
    };

    recognition.onerror = (event: any) => {
      console.error('Speech error', event);
      if (event.error !== 'no-speech') {
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Typically handled in stopAndSend, but safety reset
      if (isRecording) setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const stopAndSend = () => {
    if (!recognitionRef.current) return;

    // Stop listening
    recognitionRef.current.stop();
    setIsRecording(false);

    // Short delay to ensure last 'result' event processes
    setTimeout(() => {
      const textToSend = voiceTranscriptRef.current.trim();
      if (textToSend) {
        // Direct Send
        handleSubmit(undefined, textToSend);
        voiceTranscriptRef.current = '';
      }
    }, 200);
  };

  // --- Image Handling Helpers ---
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported.');
      return;
    }
    try {
      const compressedBase64 = await compressImage(file, { quality: 0.7, maxWidth: 1024 });
      setSelectedImage(compressedBase64);
      inputRef.current?.focus();
    } catch (e) {
      console.error('Image processing failed', e);
      toast.error('Failed to process image.');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
        }
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) processFile(files[0]);
  };

  // --- Submission Logic ---
  // Modified to accept direct text override (for voice)
  const handleSubmit = async (e?: React.FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();

    const textToSend = overrideText !== undefined ? overrideText : input;

    if ((!textToSend.trim() && !selectedImage) || isProcessing) return;

    // Ensure we have a session ID
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = generateUUID();
      setCurrentSessionId(activeSessionId);
    }

    const userText = textToSend.trim();
    const userImage = selectedImage;
    const tempId = Date.now().toString();

    // 1. Optimistic Update (User Msg)
    const userMsg: BrainMessage = {
      id: tempId,
      role: 'user',
      content: userText,
      timestamp: new Date(),
      avatar: user?.photoURL,
      name: user?.displayName || 'User',
      image: userImage || undefined
    };

    setMessages((prev) => [...prev, userMsg]);

    // Clear Input
    if (overrideText === undefined) {
      setInput('');
    }
    setSelectedImage(null);
    setIsProcessing(true);
    if (inputRef.current) inputRef.current.style.height = 'auto';

    try {
      // 2. Save User Message & Create Session in Backend
      await featureService.saveAiChatMessage(
        userText + (userImage ? ' [Image Sent]' : ''),
        'user',
        activeSessionId,
        userImage || undefined
      );

      // 3. AI Placeholder
      const aiMsgId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true,
          avatar: DEFAULT_AI_AVATAR,
          name: 'Second Brain'
        }
      ]);

      // 4. Stream AI Response
      const recentHistory = messages.slice(-10).map((m) => ({
        role: m.role,
        content: m.content
      }));
      recentHistory.push({ role: 'user', content: userText });

      let fullAiResponse = '';

      await featureService.askLifeStream(
        userText,
        recentHistory,
        (chunk) => {
          fullAiResponse += chunk;
          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === aiMsgId) {
                return { ...m, content: m.content + chunk };
              }
              return m;
            })
          );
        },
        userImage
      );

      // 5. Save AI Response to Backend
      if (fullAiResponse) {
        await featureService.saveAiChatMessage(fullAiResponse, 'ai', activeSessionId);
      }

      // 6. Refresh Sidebar if new session
      const knownSession = conversations.find((c) => c.sessionId === activeSessionId);
      if (!knownSession) {
        setTimeout(async () => {
          const updatedList = await featureService.getAiConversations();
          setConversations(updatedList);
        }, 2000);
      } else {
        setConversations((prev) => {
          const others = prev.filter((c) => c.sessionId !== activeSessionId);
          return [{ ...knownSession, lastActiveAt: new Date().toISOString() }, ...others];
        });
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last.isStreaming && last.role === 'assistant') {
          return prev.map((m) =>
            m.id === last.id
              ? {
                  ...m,
                  content: m.content + '\n\n*[Connection Error: Brain Offline]*',
                  isStreaming: false
                }
              : m
          );
        }
        return prev;
      });
    } finally {
      setMessages((prev) => prev.map((m) => ({ ...m, isStreaming: false })));
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

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
    <div className="flex h-[calc(100vh-140px)] md:h-full relative max-w-7xl mx-auto w-full bg-[#171717] rounded-[2rem] border border-[#333] shadow-2xl overflow-hidden">
      <DeleteModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
        title="Delete Conversation?"
        message="This action cannot be undone."
        requireInput={false}
        buttonText="Delete"
      />

      {/* --- LEFT SIDEBAR (History) --- */}
      <div
        className={`
          absolute inset-y-0 left-0 z-30 w-72 bg-[#171717] border-r border-[#333] transform transition-transform duration-300 md:relative md:translate-x-0
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* New Chat Button */}
          <div className="p-4 border-b border-[#333]">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-200 text-black rounded-xl font-bold transition-all text-sm"
            >
              <i className="fas fa-plus"></i> New Chat
            </button>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {conversations.map((conv) => (
              <div
                key={conv.sessionId}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${currentSessionId === conv.sessionId ? 'bg-[#2f2f2f] text-white' : 'text-gray-400 hover:bg-[#212121] hover:text-gray-200'}`}
                onClick={() => handleSwitchSession(conv.sessionId)}
              >
                <div className="flex items-center gap-3 truncate min-w-0">
                  <i className="fas fa-message text-xs"></i>
                  <span className="text-sm truncate">{conv.title || 'New Chat'}</span>
                </div>

                {/* Delete Button */}
                {currentSessionId === conv.sessionId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSessionToDelete(conv.sessionId);
                    }}
                    className="opacity-60 hover:opacity-100 hover:text-red-400 transition-opacity p-1"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
              </div>
            ))}
            {conversations.length === 0 && (
              <div className="text-center text-gray-600 text-xs py-10">No history yet</div>
            )}
          </div>

          {/* Mobile Close */}
          <button
            className="md:hidden absolute top-4 right-4 text-gray-400"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      </div>

      {/* --- RIGHT MAIN CHAT --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#212121] relative">
        {/* Mobile Header Toggle */}
        <div className="md:hidden p-4 border-b border-[#333] flex items-center gap-3 text-gray-200 bg-[#212121] z-10">
          <button onClick={() => setIsSidebarOpen(true)}>
            <i className="fas fa-bars"></i>
          </button>
          <span className="font-bold text-sm">Second Brain 3.0</span>
        </div>

        {/* Messages Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
              <div className="w-8 h-8 border-2 border-gray-600 border-t-gray-300 rounded-full animate-spin"></div>
              <p className="text-xs uppercase tracking-widest">Loading Neural Net...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-4 p-8 text-center">
              <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center text-3xl">
                🧠
              </div>
              <h3 className="text-xl font-bold text-gray-300">Second Brain</h3>
              <p className="text-sm max-w-md">
                I can remember your journals, check your fitness logs, and analyze your projects.
                How can I help today?
              </p>
            </div>
          ) : (
            <div className="flex flex-col pb-4">
              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`w-full py-6 md:py-8 px-4 md:px-12 border-b border-black/5 ${isUser ? 'bg-[#212121]' : 'bg-[#212121]'}`}
                  >
                    <div className="max-w-3xl mx-auto flex gap-4 md:gap-6">
                      {/* Avatar */}
                      <div
                        className={`shrink-0 flex flex-col items-center ${isUser ? 'order-2' : 'order-1'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-sm overflow-hidden flex items-center justify-center ${isUser ? 'bg-transparent' : 'bg-green-500/10'}`}
                        >
                          <img
                            src={msg.avatar}
                            alt={msg.role}
                            className="w-full h-full object-cover rounded-sm"
                            onError={(e) => (e.currentTarget.src = DEFAULT_AI_AVATAR)}
                          />
                        </div>
                      </div>

                      {/* Content */}
                      <div
                        className={`flex-1 min-w-0 ${isUser ? 'order-1 text-right' : 'order-2 text-left'}`}
                      >
                        <div
                          className={`text-xs font-bold mb-2 ${isUser ? 'text-gray-400' : 'text-gray-200'}`}
                        >
                          {msg.name}
                        </div>

                        {msg.image && (
                          <div
                            className={`mb-3 ${isUser ? 'flex justify-end' : 'flex justify-start'}`}
                          >
                            <div className="relative group max-w-[250px] rounded-lg overflow-hidden border border-white/10">
                              <img
                                src={msg.image}
                                alt="Upload"
                                className="w-full h-auto object-contain"
                              />
                            </div>
                          </div>
                        )}

                        {isUser ? (
                          <div className="inline-block bg-[#2f2f2f] text-gray-100 px-4 py-2 md:px-5 md:py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap text-left shadow-sm">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="chat-content text-gray-300 text-sm md:text-[15px] leading-relaxed relative">
                            {msg.content ? (
                              <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                            ) : (
                              <div className="flex items-center gap-1 h-6">
                                <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-500 rounded-full animate-bounce"></span>
                                <span
                                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-500 rounded-full animate-bounce"
                                  style={{ animationDelay: '0.2s' }}
                                ></span>
                                <span
                                  className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gray-500 rounded-full animate-bounce"
                                  style={{ animationDelay: '0.4s' }}
                                ></span>
                              </div>
                            )}
                            {msg.isStreaming && (
                              <span className="inline-block w-2 h-4 bg-gray-400 ml-1 align-middle animate-pulse"></span>
                            )}
                          </div>
                        )}

                        {!isUser && !msg.isStreaming && msg.content && (
                          <div className="flex items-center gap-4 mt-3 pt-2">
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
                            >
                              <i className="fas fa-copy"></i>
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
        <div className="p-3 md:p-6 bg-[#212121] border-t border-white/5 shrink-0">
          <div className="max-w-3xl mx-auto relative">
            {isDragging && (
              <div className="absolute inset-0 -top-12 -left-4 -right-4 -bottom-4 z-50 bg-[#212121]/90 backdrop-blur-sm border-2 border-dashed border-gray-500 rounded-xl flex items-center justify-center pointer-events-none">
                <span className="text-gray-200 font-bold text-lg animate-pulse">
                  Drop Image Here
                </span>
              </div>
            )}

            {selectedImage && (
              <div className="absolute -top-24 left-0 bg-[#2f2f2f] p-2 rounded-xl border border-gray-700 shadow-xl flex items-start gap-2 animate-slide-up z-20">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="h-20 w-auto rounded-lg object-contain"
                />
                <button
                  onClick={() => setSelectedImage(null)}
                  className="w-5 h-5 rounded-full bg-gray-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times text-[10px]"></i>
                </button>
              </div>
            )}

            <div
              className={`relative bg-[#2f2f2f] rounded-xl border transition-colors shadow-lg flex flex-col ${isDragging ? 'border-gray-400 bg-[#3a3a3a]' : 'border-gray-700 focus-within:border-gray-500'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {/* LEFT SIDE: Image Upload & Voice Toggle */}
              <div className="absolute left-2 md:left-3 bottom-2.5 flex items-center gap-2 z-20">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing || isRecording}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <i className="fas fa-paperclip text-sm"></i>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />

                {/* Voice Mode Toggle */}
                <button
                  onClick={() => setIsVoiceMode(!isVoiceMode)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isVoiceMode ? 'text-green-500 hover:bg-green-500/10' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
                  title={isVoiceMode ? 'Switch to Text' : 'Switch to Voice'}
                >
                  <i className={`fas ${isVoiceMode ? 'fa-keyboard' : 'fa-microphone'} text-sm`}></i>
                </button>
              </div>

              {/* CENTER: Text Input OR Voice Button */}
              {isVoiceMode ? (
                <div className="w-full h-14 pl-28 md:pl-32 pr-4 py-2">
                  <button
                    className={`w-full h-full rounded-lg font-bold text-sm uppercase tracking-widest transition-all select-none touch-none flex items-center justify-center gap-2 ${
                      isRecording
                        ? 'bg-emerald-500 text-white animate-pulse shadow-lg shadow-emerald-900/50'
                        : 'bg-[#3a3a3a] text-gray-300 hover:bg-[#444]'
                    }`}
                    onPointerDown={startRecording}
                    onPointerUp={stopAndSend}
                    onPointerLeave={stopAndSend} // Safety catch if finger slides off
                  >
                    {isRecording ? (
                      <>
                        <i className="fas fa-microphone-alt animate-bounce"></i> Listening...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-microphone"></i> Hold to Speak
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder={t.privateSpace.secondBrain.placeholder}
                  className="w-full bg-transparent border-none outline-none py-3 pl-28 md:pl-32 pr-12 text-gray-200 placeholder:text-gray-500 resize-none max-h-32 md:max-h-48 min-h-[52px] text-sm leading-relaxed custom-scrollbar"
                  rows={1}
                  disabled={isProcessing}
                />
              )}

              {/* RIGHT SIDE: Send Button (Only visible in Text Mode) */}
              {!isVoiceMode && (
                <button
                  onClick={(e) => handleSubmit(e)}
                  disabled={(!input.trim() && !selectedImage) || isProcessing}
                  className={`absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${!input.trim() && !selectedImage ? 'bg-transparent text-gray-600 cursor-not-allowed' : 'bg-white text-black hover:bg-gray-200'}`}
                >
                  {isProcessing ? (
                    <i className="fas fa-stop text-xs"></i>
                  ) : (
                    <i className="fas fa-arrow-up text-xs"></i>
                  )}
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-2 hidden md:block">
              AI can make mistakes. Consider checking important information.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .chat-content p { margin-bottom: 1em; }
        .chat-content p:last-child { margin-bottom: 0; }
        .chat-content h1, .chat-content h2, .chat-content h3 { color: #f3f4f6; font-weight: 700; margin-top: 1.5em; margin-bottom: 0.5em; }
        .chat-content ul, .chat-content ol { margin-left: 1.5em; margin-bottom: 1em; list-style-type: disc; }
        .chat-content ol { list-style-type: decimal; }
        .chat-content li { margin-bottom: 0.25em; }
        .chat-content strong { color: #fff; font-weight: 700; }
        .chat-content blockquote { border-left: 3px solid #4b5563; padding-left: 1em; color: #9ca3af; font-style: italic; }
        .chat-content code { background-color: #2f2f2f; padding: 0.2em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.9em; color: #e5e7eb; }
        .chat-content pre { background-color: #0d0d0d; padding: 1em; border-radius: 8px; overflow-x: auto; margin: 1em 0; border: 1px solid #333; }
        .chat-content pre code { background-color: transparent; padding: 0; border-radius: 0; color: inherit; font-size: 0.85em; }
        .chat-content a { color: #60a5fa; text-decoration: underline; }
      `}</style>
    </div>
  );
};

export default SecondBrainSpace;
