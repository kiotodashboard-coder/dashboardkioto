import React, { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { dbClient, customFetch } from '../utils/api';
import { 
  MessageSquare, 
  Send, 
  X, 
  Check, 
  Clock, 
  RefreshCw, 
  Bell, 
  Trash2, 
  Sparkles, 
  User, 
  Phone,
  Smartphone,
  Bot
} from 'lucide-react';
import { ChatMessage, ChatSession, SimulatedNotification } from '../types';
import KiotoLogo from './KiotoLogo';

// Keep cached chatbot state to persist conversation history across page refreshes

interface FloatingChatbotProps {
  onAppointmentBooked: () => void;
}

export default function FloatingChatbot({ onAppointmentBooked }: FloatingChatbotProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return localStorage.getItem('kioto_chat_open') === 'true';
  });
  const [activeTab, setActiveTab] = useState<'chat' | 'alerts'>('chat');
  const [platform, setPlatform] = useState<'whatsapp' | 'facebook'>('whatsapp');
  const [clientName, setClientName] = useState<string>(() => localStorage.getItem('kioto_chat_name') || 'Invitado Taller');
  const [clientPhone, setClientPhone] = useState<string>(() => {
    let p = localStorage.getItem('kioto_chat_phone');
    if (!p) {
      p = 'cli-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kioto_chat_phone', p);
    }
    return p;
  });
  const [messageText, setMessageText] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [notifications, setNotifications] = useState<SimulatedNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isWebChatbotEnabled, setIsWebChatbotEnabled] = useState<boolean>(() => localStorage.getItem('kioto_chatbot_web') !== 'false');

  useEffect(() => {
    const unsub = onSnapshot(doc(dbClient, "config", "chatbot"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsWebChatbotEnabled(data.web !== false);
        localStorage.setItem('kioto_chatbot_web', String(data.web !== false));
      }
    }, (err) => {
      console.error("Error subscribing to chatbot dynamic config:", err);
    });
    return () => unsub();
  }, []);

  // Maintain focus on chatbot input when loading finishes, or when messages or state changes
  useEffect(() => {
    if (!loading && isOpen && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [loading, isOpen, activeSession?.messages?.length]);


  const handleClearHistory = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('kioto_chat_phone');
      localStorage.removeItem('kioto_chat_session');
      const newPhone = 'cli-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kioto_chat_phone', newPhone);
      setClientPhone(newPhone);
      
      const res = await customFetch(`/api/chats/session?platform=chatbot&clientPhoneOrId=${encodeURIComponent(newPhone)}&clientName=${encodeURIComponent(clientName)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
      }
    } catch (err) {
      console.error("Failed to clear chat history:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync state with localStorage
  useEffect(() => {
    localStorage.setItem('kioto_chat_open', String(isOpen));
  }, [isOpen]);

  useEffect(() => {
    if (activeSession) {
      localStorage.setItem('kioto_chat_session', JSON.stringify(activeSession));
    } else {
      localStorage.removeItem('kioto_chat_session');
    }
  }, [activeSession]);

  // Auto-start or sync chatbot session on mount / open
  useEffect(() => {
    if (isOpen && !loading) {
      loadOrCreateSession();
    }
  }, [isOpen]);

  // Fetch simulated WhatsApp notifications sent from the server
  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await customFetch('/api/notifications');
      const data = await res.json();
      setNotifications(data);
    } catch (err) {
      console.error("Failed to load mock notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Load or start session from the database
  const loadOrCreateSession = async () => {
    setLoading(true);
    try {
      const res = await customFetch(`/api/chats/session?platform=chatbot&clientPhoneOrId=${encodeURIComponent(clientPhone)}&clientName=${encodeURIComponent(clientName)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        if (data.session.clientName) {
          setClientName(data.session.clientName);
          localStorage.setItem('kioto_chat_name', data.session.clientName);
        }
      }
    } catch (err) {
      console.error("Failed to load or start chatbot session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Inactivity timer: check every 5 seconds if >5 minutes passed since last message
  useEffect(() => {
    if (!activeSession || !activeSession.messages || activeSession.messages.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const lastMsg = activeSession.messages[activeSession.messages.length - 1];
      if (lastMsg) {
        const lastTime = new Date(lastMsg.timestamp).getTime();
        const diffMs = Date.now() - lastTime;
        if (diffMs > 5 * 60 * 1000) {
          console.log("Chatbot session expired due to 5-minute inactivity. Restarting...");
          loadOrCreateSession();
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSession]);

  // Send message to chatbot
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWebChatbotEnabled) return;
    if (!messageText.trim() || !activeSession) return;
    
    const textToSend = messageText;
    setMessageText('');
    setLoading(true);

    // Optimistically update UI
    const optimisticUserMsg: ChatMessage = {
      id: `msg-opt-${Date.now()}`,
      sender: 'client',
      text: textToSend,
      timestamp: new Date().toISOString()
    };
    
    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, optimisticUserMsg]
    } : null);

    try {
      const res = await customFetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'chatbot',
          clientPhoneOrId: clientPhone,
          clientName: clientName,
          message: textToSend
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        if (data.session.clientName) {
          setClientName(data.session.clientName);
          localStorage.setItem('kioto_chat_name', data.session.clientName);
        }
        if (data.bookingOutcome) {
          onAppointmentBooked();
        }
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Chat message send error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Clear simulated notifications/logs in backend
  const handleClearNotifications = async () => {
    try {
      await customFetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  // Scroll to bottom on updates
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages, isOpen, activeTab]);

  // Sync notifications periodically
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="floating-chatbot-root" className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Expandable Chat Box */}
      {isOpen && (
        <div 
          id="floating-chat-container" 
          className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-80 md:w-96 h-[510px] flex flex-col overflow-hidden mb-4 transition-all duration-300"
        >
          {/* Header */}
          <div className="bg-gray-950 text-white px-4 py-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg border border-white/10 flex items-center justify-center">
                <KiotoLogo className="h-4 w-auto" fill="#FFFFFF" />
              </div>
              <div>
                <h4 className="text-[11px] font-black tracking-wider uppercase">Asistente Kioto</h4>
              </div>
            </div>
            
            <div className="flex items-center space-x-1.5 select-none">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body contents */}
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50">
            {!isWebChatbotEnabled ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-400 mb-3 animate-pulse">
                  <Bot className="w-6 h-6" />
                </div>
                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1.5">Asistente Virtual</h5>
                <p className="text-xs font-bold text-slate-800 mb-1 leading-snug">
                  Servicio temporalmente inactivo
                </p>
                <p className="text-[10px] text-slate-500 max-w-[220px] leading-relaxed">
                  Servicio temporalmente inactivo: seguimos mejorando nuestro servicio para ti, enseguida volvemos.
                </p>
              </div>
            ) : activeSession ? (
              /* ACTIVE CHAT AREA */
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="text-[10px] text-center text-gray-500 bg-white/80 p-2 rounded-lg border border-gray-100 max-w-xs mx-auto">
                    Platica con el Asistente de Citas para agendar el servicio técnico de tu vehículo de manera interactiva.
                  </div>

                  {activeSession.messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-2xs ${
                        msg.sender === 'client'
                          ? 'bg-neutral-900 border border-neutral-950 text-white rounded-tr-none' 
                          : 'bg-white border border-gray-200 text-gray-950 rounded-tl-none'
                      }`}>
                        <div className="whitespace-pre-line leading-relaxed">
                          {(() => {
                            const cleanText = msg.text.replace(/```json[\s\S]*?```/g, '').trim();
                            return cleanText.split('**').map((part, idx) => 
                              idx % 2 === 1 ? <strong key={idx} className="font-bold">{part}</strong> : part
                            );
                          })()}
                        </div>
                        <div className="text-[8px] text-right mt-1 opacity-70 flex items-center justify-end">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.sender === 'client' && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
                        </div>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-gray-200 text-gray-500 rounded-xl rounded-tl-none px-3 py-2 text-xs shadow-2xs flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Form */}
                <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-2 flex items-center space-x-2 shrink-0">
                  <input
                    ref={inputRef}
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Escribe tu respuesta..."
                    className="flex-1 bg-gray-150 border-0 rounded-full py-2 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-950"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !messageText.trim()}
                    className="p-2 rounded-full bg-neutral-950 text-white transition-opacity disabled:opacity-40 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </>
            ) : (
              /* START CHAT FORM */
              <div className="p-5 flex-1 overflow-y-auto space-y-4 flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-150 flex items-center justify-center text-emerald-600 animate-spin bg-emerald-50 mb-4">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-extrabold text-gray-800 uppercase tracking-widest">Iniciando Chatbot IA...</h4>
                <p className="text-[11px] text-gray-500 max-w-xs border-zinc-200">Enlazando con el asesor virtual para recopilar los datos y agendar tu servicio de inmediato.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Round Toggle Bubble Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) { 
            setActiveTab('chat');
            fetchNotifications(); 
          }
        }}
        id="btn-toggle-floating-chat"
        className="w-14 h-14 bg-black hover:bg-zinc-900 border border-zinc-800 text-white rounded-full flex items-center justify-center shadow-2xl transition-all hover:scale-105 active:scale-95 duration-200 cursor-pointer relative group"
        title="Agendar por Chatbot IA"
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <>
            <Bot className="w-6 h-6" />
            <span className="flex h-3 w-3 absolute top-0.5 right-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-zinc-500"></span>
            </span>
          </>
        )}
        <div className="absolute right-16 bg-gray-905 bg-zinc-900 text-white text-[10px] px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none shadow-md font-bold tracking-wider">
          ¿Agendar Cita de Taller? ¡Chatea aquí!
        </div>
      </button>
    </div>
  );
}
