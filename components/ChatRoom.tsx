

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { User, ChatMessage, ChatUser } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { toast } from './Toast';

interface ChatRoomProps {
  currentUser: User | null;
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

const SOCKET_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app';

export const ChatRoom: React.FC<ChatRoomProps> = ({ currentUser }) => {
  const { t } = useTranslation();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, ChatUser>>({});
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [privateReceiver, setPrivateReceiver] = useState<string | null>(null); // Name of private receiver
  const [connectionStatus, setConnectionStatus] = useState<string>(t.chat.connecting);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!currentUser) return;

    // Initialize Socket
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // 1. Connection Event
    newSocket.on('connect', () => {
      setConnectionStatus("Connected");
      
      // 2. Identify User
      newSocket.emit(EVENTS.CONFIRM_USER, currentUser.displayName, ({ isUser }: { isUser: boolean }) => {
          // If backend says user doesn't exist in temp memory, connect them
          // Even if they exist, we re-announce to ensure socket ID is fresh
          const userPayload = {
              name: currentUser.displayName,
              id: currentUser._id, // Pass DB ID for persistence
              // can add avatar here if backend supported it fully
          };
          newSocket.emit(EVENTS.USER_CONNECTED, userPayload);
      });
    });

    // 3. Listen for Global/Room Welcome
    newSocket.on(EVENTS.ROOM_WELCOME, (data: { user: string, message: string }) => {
       setMessages(prev => [...prev, {
         author: data.user,
         message: data.message,
         isSystem: true,
         timestamp: new Date().toISOString()
       }]);
    });

    // 4. Update Online Users List
    newSocket.on(EVENTS.USER_CONNECTED, (users: Record<string, ChatUser>) => {
      setOnlineUsers(users);
    });

    // 5. Receive Public Messages
    newSocket.on(EVENTS.MESSAGE_RECEIVED, (msg: ChatMessage) => {
      // Dedup logic: Check if we already have this message (by timestamp similarity or exact content/author match if recently added)
      // Since we use optimistic UI, we might get our own message back.
      // However, for simplicity and ensuring we don't miss messages from others, we just append.
      // Ideally, the message should have a unique ID.
      setMessages(prev => {
        // Simple dedup: if the last message has same content and author and is very recent, skip
        const lastMsg = prev[prev.length - 1];
        const isDuplicate = lastMsg && 
            lastMsg.author === msg.author && 
            lastMsg.message === msg.message && 
            (new Date().getTime() - new Date(lastMsg.timestamp || 0).getTime() < 2000); // 2 sec threshold

        if (isDuplicate) return prev;
        return [...prev, { ...msg, timestamp: new Date().toISOString() }];
      });
    });

    // 6. Receive Private Messages
    newSocket.on(EVENTS.PRIVATE_MESSAGE, (msg: ChatMessage) => {
       setMessages(prev => [...prev, { ...msg, isPrivate: true, timestamp: new Date().toISOString() }]);
       if (msg.author !== currentUser.displayName) {
          toast.info(`Private message from ${msg.author}`);
       }
    });

    // 7. Typing Indicators
    newSocket.on(EVENTS.TYPING, ({ user, isTyping }: { user: string, isTyping: boolean }) => {
       setTypingUsers(prev => {
         const next = new Set(prev);
         if (isTyping) next.add(user);
         else next.delete(user);
         return next;
       });
    });

    newSocket.on(EVENTS.STOP_TYPING, ({ user }: { user: string }) => {
      setTypingUsers(prev => {
        const next = new Set(prev);
        next.delete(user);
        return next;
      });
    });

    return () => {
      newSocket.emit(EVENTS.LOGOUT);
      newSocket.disconnect();
    };
  }, [currentUser]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !currentUser) return;

    if (privateReceiver) {
      // Send Private
      socket.emit(EVENTS.PRIVATE_MESSAGE, {
        receiverName: privateReceiver,
        message: inputText
      });
      // Backend echoes private messages back to sender usually, so no optimistic needed or it's handled by event
    } else {
      // Send Public
      socket.emit(EVENTS.MESSAGE_SENT, {
        message: inputText,
        author: currentUser.displayName,
        userId: currentUser._id,
        room: "public"
      });
      
      // OPTIMISTIC UPDATE:
      // Since the backend might not be echoing back correctly if the user isn't in the room, 
      // or to ensure immediate feedback, we add it to local state.
      const optimisticMsg: ChatMessage = {
          message: inputText,
          author: currentUser.displayName,
          userId: currentUser._id,
          room: "public",
          timestamp: new Date().toISOString(),
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

  // --- UI RENDER ---
  const userList = Object.values(onlineUsers) as ChatUser[];
  
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
                onClick={() => setPrivateReceiver(null)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${!privateReceiver ? 'bg-cyan-900/30 border border-cyan-500/30 text-cyan-300' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                 <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                    <i className="fas fa-satellite-dish text-xs"></i>
                 </div>
                 <div className="flex-1">
                    <div className="text-sm font-bold">{t.chat.publicChannel}</div>
                    <div className="text-[10px] opacity-60">Global Broadcast</div>
                 </div>
                 {!privateReceiver && <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>}
              </button>

              <div className="my-2 h-px bg-slate-700/50 mx-2"></div>

              {/* Users List */}
              {userList.map(u => {
                 const isMe = u.name === currentUser.displayName;
                 const isActive = privateReceiver === u.name;
                 return (
                   <button 
                     key={u.id || u.name} // fallback to name if id missing in socket list
                     onClick={() => !isMe && setPrivateReceiver(u.name)}
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
                 <div className={`w-3 h-3 rounded-full ${privateReceiver ? 'bg-amber-500' : 'bg-cyan-500'} animate-pulse`}></div>
                 <div>
                    <h2 className="font-bold text-white tracking-wide">
                       {privateReceiver ? `@ ${privateReceiver}` : t.chat.publicChannel}
                    </h2>
                    <p className="text-[10px] font-mono text-slate-400 uppercase">
                       {privateReceiver ? t.chat.privateChannel : t.chat.subtitle}
                    </p>
                 </div>
              </div>
              <div className="text-[10px] font-mono text-slate-500 border border-slate-700 px-2 py-1 rounded">
                 {connectionStatus}
              </div>
           </div>

           {/* Messages Area */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gradient-to-b from-slate-900 to-slate-950">
              {messages.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full text-slate-600">
                    <i className="fas fa-satellite text-4xl mb-4 opacity-50"></i>
                    <p className="font-mono text-sm">{t.chat.connecting}</p>
                 </div>
              )}
              
              {messages.map((msg, idx) => {
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
              <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <div className="p-4 bg-slate-900/90 border-t border-slate-700/50">
              <form onSubmit={handleSendMessage} className="relative flex items-end gap-3">
                 <div className="relative flex-1">
                    <input 
                      type="text" 
                      value={inputText}
                      onChange={handleTyping}
                      placeholder={privateReceiver ? `${t.chat.send} @${privateReceiver}...` : t.chat.placeholder}
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
                      privateReceiver 
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
