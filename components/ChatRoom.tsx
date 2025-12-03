import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Socket } from 'socket.io-client';
import { User, ChatMessage, ChatUser } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { toast } from './Toast';
import { apiService } from '../services/api';

interface ChatRoomProps {
  currentUser: User | null;
  socket: Socket | null;
}

const EVENTS = {
  CONFIRM_USER: "CONFIRM_USER",
  USER_CONNECTED: "USER_CONNECTED",
  MESSAGE_SENT: "MESSAGE_SENT",
  MESSAGE_RECEIVED: "MESSAGE_RECEIVED",
  PRIVATE_MESSAGE: "PRIVATE_MESSAGE",
  TYPING: "TYPING",
  STOP_TYPING: "STOP_TYPING",
  LOGOUT: "LOGOUT",
  ROOM_WELCOME: "ROOM_WELCOME"
};

export const ChatRoom: React.FC<ChatRoomProps> = ({ currentUser, socket }) => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, ChatUser>>({});
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  
  // Replaced string receiver with ChatUser object to better handle IDs for history
  const [activeUser, setActiveUser] = useState<ChatUser | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto scroll to bottom of the chat container ONLY
  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeUser]);

  // Fix Online Users Count: Ensure current user is included if missing
  // User reported count was 0 when it should be at least 1 (themselves)
  const userList = useMemo(() => {
    if (!currentUser) return [];
    
    const usersMap = new Map<string, ChatUser>();
    
    // 1. Add socket users (ensure they have valid structure)
    Object.values(onlineUsers || {}).forEach(u => {
        if (u && u.id && u.name) {
            usersMap.set(u.id, u);
        }
    });

    // 2. Force Add Current User (if not present)
    const myId = currentUser._id || (currentUser as any).id;
    if (myId) {
         // Ensure we use the same ID format. If map already has it, it might be from socket with potentially fresher data (or same).
         // But we ensure at least one entry exists for 'me'.
         if (!usersMap.has(myId)) {
             usersMap.set(myId, { id: myId, name: currentUser.displayName });
         }
    }

    return Array.from(usersMap.values());
  }, [onlineUsers, currentUser]);

  // Fetch History Logic
  useEffect(() => {
    if (!currentUser) return;
    
    const loadHistory = async () => {
      let history: ChatMessage[] = [];
      try {
        if (activeUser) {
           // Private
           const raw = await apiService.getPrivateChatHistory(activeUser.id);
           history = raw.map((m: any) => {
             // For filtering logic in UI:
             // If I sent the message (userId == myId), the receiver must be mapped to the current activeUser's NAME
             // because the UI filters private messages by: (author === activeUser.name) OR (receiver === activeUser.name)
             const isMe = String(m.userId) === String(currentUser._id);
             return {
                ...m,
                // Ensure we set receiver correctly for outgoing messages so they show up
                receiver: isMe ? activeUser.name : undefined 
             };
           });
        } else {
           // Public
           const raw = await apiService.getPublicChatHistory("public");
           history = raw.map((m: any) => ({
             ...m,
             isPrivate: false,
             room: 'public'
           }));
        }
        
        if (history.length > 0) {
            setMessages(prev => {
                // Merge History with existing messages (deduplicating by timestamp + author + content)
                const existingSigs = new Set(prev.map(p => `${p.timestamp}-${p.author}-${p.message}`));
                const newHistory = history.filter(h => !existingSigs.has(`${h.timestamp}-${h.author}-${h.message}`));
                
                // Prepend history, keep existing real-time messages
                const combined = [...newHistory, ...prev];
                // Sort by time just to be safe
                return combined.sort((a,b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime());
            });
        }
      } catch (e) {
        console.error("History load error", e);
      }
    };
    
    // Trigger load whenever active room/user changes
    loadHistory();
  }, [activeUser, currentUser]);

  useEffect(() => {
    if (!currentUser || !socket) return;

    // 1. Listen for Global/Room Welcome
    const handleWelcome = (data: { user: string, message: string }) => {
       setMessages(prev => [...prev, {
         author: data.user,
         message: data.message,
         isSystem: true,
         timestamp: new Date().toISOString()
       }]);
    };

    // 2. Update Online Users List
    const handleUserConnected = (users: Record<string, ChatUser>) => {
      setOnlineUsers(users);
    };

    // 3. Receive Public Messages
    const handleMessageReceived = (msg: ChatMessage) => {
      setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        // Simple dedupe for rapid socket events vs optimistic updates
        const isDuplicate = lastMsg && 
            lastMsg.author === msg.author && 
            lastMsg.message === msg.message && 
            (new Date().getTime() - new Date(lastMsg.timestamp || 0).getTime() < 2000);

        if (isDuplicate) return prev;
        return [...prev, { ...msg, timestamp: new Date().toISOString() }];
      });
    };

    // 4. Receive Private Messages
    const handlePrivateMessage = (msg: ChatMessage) => {
       // Ignore own messages echoed from backend to prefer optimistic version
       if (msg.author === currentUser.displayName) return;

       setMessages(prev => [...prev, { ...msg, isPrivate: true, timestamp: new Date().toISOString() }]);
       if (msg.author !== currentUser.displayName) {
          // If we are not chatting with them, show a toast
          if (activeUser?.name !== msg.author) {
             toast.info(`Private message from ${msg.author}`);
          }
       }
    };

    // 5. Typing Indicators
    const handleTyping = ({ user, isTyping }: { user: string, isTyping: boolean }) => {
       setTypingUsers(prev => {
         const next = new Set(prev);
         if (isTyping) next.add(user);
         else next.delete(user);
         return next;
       });
    };

    const handleStopTyping = ({ user }: { user: string }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(user);
        return next;
      });
    };

    // Attach Listeners
    socket.on(EVENTS.ROOM_WELCOME, handleWelcome);
    socket.on(EVENTS.USER_CONNECTED, handleUserConnected);
    socket.on(EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
    socket.on(EVENTS.TYPING, handleTyping);
    socket.on(EVENTS.STOP_TYPING, handleStopTyping);

    return () => {
      socket.off(EVENTS.ROOM_WELCOME, handleWelcome);
      socket.off(EVENTS.USER_CONNECTED, handleUserConnected);
      socket.off(EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(EVENTS.PRIVATE_MESSAGE, handlePrivateMessage);
      socket.off(EVENTS.TYPING, handleTyping);
      socket.off(EVENTS.STOP_TYPING, handleStopTyping);
    };
  }, [socket, currentUser, activeUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !currentUser) return;

    const timestamp = new Date().toISOString();

    if (activeUser) {
      // Send Private
      socket.emit(EVENTS.PRIVATE_MESSAGE, {
        receiverName: activeUser.name,
        message: inputText,
        room: 'private'
      });
      
      // Optimistic Update for Private
      const optimisticMsg: ChatMessage = {
          message: inputText,
          author: currentUser.displayName,
          userId: currentUser._id,
          timestamp,
          isPrivate: true,
          receiver: activeUser.name // Store receiver for filtering
      };
      setMessages(prev => [...prev, optimisticMsg]);
    } else {
      // Send Public
      socket.emit(EVENTS.MESSAGE_SENT, {
        message: inputText,
        author: currentUser.displayName,
        userId: currentUser._id,
        room: "public"
      });
      
      // OPTIMISTIC UPDATE for Public
      const optimisticMsg: ChatMessage = {
          message: inputText,
          author: currentUser.displayName,
          userId: currentUser._id,
          room: "public",
          timestamp,
          isPrivate: false
      };
      setMessages(prev => [...prev, optimisticMsg]);
    }

    // Stop typing status immediately
    socket.emit(EVENTS.STOP_TYPING, { chatId: 'public' });
    setInputText("");
    setIsTyping(false);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (!socket) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit(EVENTS.TYPING, { chatId: 'public', isTyping: true });
    }

    // Debounce stop typing
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
       setIsTyping(false);
       socket.emit(EVENTS.STOP_TYPING, { chatId: 'public' });
    }, 2000);
  };

  if (!currentUser) {
     return <div className="pt-32 text-center text-white">Access Denied. Please Login.</div>;
  }

  // FILTER MESSAGES BASED ON CHANNEL
  const filteredMessages = messages.filter(msg => {
    if (activeUser) {
      // Private Channel Filtering
      // Show if message is private AND (Sent by Other OR Sent by Me to Other)
      return msg.isPrivate && (
        msg.author === activeUser.name || 
        (msg.author === currentUser.displayName && msg.receiver === activeUser.name)
      );
    } else {
      // Public Channel Filtering
      return !msg.isPrivate;
    }
  });

  const connectionStatus = socket?.connected ? "Connected" : "Connecting...";
  
  return (
    <div className="h-screen pt-24 pb-6 px-4 md:px-6 relative flex flex-col items-center justify-center overflow-hidden">
      
      {/* HUD Background Decorations */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/4 left-10 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl"></div>
         <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl"></div>
         {/* Grid Lines */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
         <div className="absolute top-24 left-0 w-full h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
         <div className="absolute bottom-10 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent"></div>
      </div>

      <div className="w-full max-w-7xl h-full flex flex-col md:flex-row gap-6 relative z-10">
        
        {/* LEFT PANEL: Crew Manifest (Users) */}
        <div className="w-full md:w-80 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
           <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center">
              <h3 className="font-display font-bold text-cyan-400 uppercase tracking-widest text-sm">
                <i className="fas fa-users-cog mr-2"></i> {t.chat.crewManifest}
              </h3>
              <span className="text-xs font-mono text-emerald-400 animate-pulse">● {userList.length} Online</span>
           </div>
           
           <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {/* Public Channel Selector */}
              <button 
                onClick={() => setActiveUser(null)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${!activeUser ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                    <i className="fas fa-satellite-dish text-xs"></i>
                 </div>
                 <div className="flex-1">
                    <div className="text-sm font-bold">{t.chat.publicChannel}</div>
                    <div className="text-[10px] opacity-60">Global Broadcast</div>
                 </div>
                 {!activeUser && <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>}
              </button>

              <div className="my-2 h-px bg-slate-700/50 mx-2"></div>

              {/* Users List */}
              {userList.map(u => {
                 const isMe = u.name === currentUser.displayName;
                 const isActive = activeUser?.id === u.id;
                 return (
                   <button 
                     key={u.id || u.name} 
                     onClick={() => !isMe && setActiveUser(u)}
                     disabled={isMe}
                     className={`w-full text-left p-2 rounded-lg flex items-center gap-3 transition-all border ${
                       isActive 
                         ? 'bg-amber-900/20 border-amber-500/40 text-amber-200' 
                         : isMe 
                           ? 'border-transparent opacity-50 cursor-default'
                           : 'border-transparent text-slate-300 hover:bg-slate-800'
                     }`}
                   >
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-700 ring-1 ring-slate-600">
                         <img src={`https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="text-sm font-bold truncate">
                            {u.name} {isMe && `(${t.chat.me})`}
                         </div>
                         {typingUsers.has(u.name) && (
                            <div className="text-[10px] text-emerald-400 animate-pulse font-mono">
                               {t.chat.typing}
                            </div>
                         )}
                      </div>
                      {isActive && <div className="w-2 h-2 bg-amber-400 rounded-full"></div>}
                   </button>
                 );
              })}
           </div>
        </div>

        {/* RIGHT PANEL: Chat Interface */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative">
           {/* Header */}
           <div className="p-4 border-b border-slate-700/50 bg-slate-800/50 flex justify-between items-center z-10">
              <div className="flex items-center gap-3">
                 <div className={`w-3 h-3 rounded-full ${activeUser ? 'bg-amber-500' : 'bg-cyan-500'} animate-pulse`}></div>
                 <div>
                    <h2 className="font-bold text-white tracking-wide">
                       {activeUser ? `@ ${activeUser.name}` : t.chat.publicChannel}
                    </h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">
                       {activeUser ? t.chat.privateChannel : t.chat.subtitle}
                    </p>
                 </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">
                 {connectionStatus}
              </div>
           </div>

           {/* Messages Area - Uses ScrollTop for stable scrolling */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
              {filteredMessages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <i className="fas fa-satellite text-4xl mb-4 opacity-50"></i>
                    <p className="font-mono text-sm">{activeUser ? 'Start a private conversation...' : t.chat.connecting}</p>
                 </div>
              )}
              
              {filteredMessages.map((msg, idx) => {
                 const isMe = msg.author === currentUser.displayName;
                 const isSystem = msg.isSystem;
                 
                 // System Message
                 if (isSystem) {
                    return (
                       <div key={idx} className="flex justify-center my-4">
                          <span className="px-3 py-1 bg-cyan-900/30 text-cyan-400 text-xs font-mono border border-cyan-500/20 rounded-full">
                             {msg.message}
                          </span>
                       </div>
                    );
                 }

                 return (
                    <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-fade-in`}>
                       <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 mb-1 px-1">
                             <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                {msg.author}
                             </span>
                             <span className="text-[10px] font-mono text-slate-600">
                                {new Date(msg.timestamp || "").toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                             </span>
                          </div>
                          <div className={`
                             relative px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-lg border
                             ${isMe 
                               ? 'bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-tr-sm border-indigo-500/50' 
                               : msg.isPrivate
                                 ? 'bg-gradient-to-br from-amber-900/40 to-orange-900/40 text-amber-100 rounded-tl-sm border-amber-500/30'
                                 : 'bg-slate-800 text-slate-200 rounded-tl-sm border-slate-700'
                             }
                          `}>
                             {msg.isPrivate && (
                                <div className="absolute -top-2 -right-2 text-[10px] bg-black/50 backdrop-blur px-1.5 py-0.5 rounded border border-amber-500/50 text-amber-500 flex items-center gap-1">
                                   <i className="fas fa-lock text-[8px]"></i> {t.chat.encrypted}
                                </div>
                             )}
                             {msg.message}
                          </div>
                       </div>
                    </div>
                 );
              })}
           </div>

           {/* Input Area */}
           <div className="p-4 bg-slate-900/90 border-t border-slate-700/50">
              <form onSubmit={handleSendMessage} className="relative flex items-end gap-3">
                 <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={handleTyping}
                      placeholder={activeUser ? `${t.chat.send} @${activeUser.name}...` : t.chat.placeholder}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-12 py-3 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none text-white placeholder-slate-600 transition-all font-mono text-sm"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                       <i className="fas fa-keyboard"></i>
                    </div>
                 </div>
                 <button 
                   type="submit"
                   disabled={!inputText.trim()}
                   className={`h-11 px-6 rounded-xl font-bold uppercase tracking-widest text-xs transition-all shadow-lg flex items-center gap-2 ${
                      activeUser 
                        ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-900/20' 
                        : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-900/20'
                   } disabled:opacity-50 disabled:cursor-not-allowed`}
                 >
                    <span>{t.chat.send}</span>
                    <i className="fas fa-paper-plane"></i>
                 </button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
};