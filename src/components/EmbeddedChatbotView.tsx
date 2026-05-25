import React, { useState, useEffect, useRef } from 'react';
import { customFetch } from '../utils/api';
import { 
  Bot, 
  Send, 
  Check, 
  RefreshCw, 
  AlertCircle,
  Clock,
  Sparkles,
  Smartphone,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { ChatMessage, ChatSession, SimulatedNotification } from '../types';

export default function EmbeddedChatbotView() {
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
  const [errorMsg, setErrorMsg] = useState<string>('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input automatically
  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.focus();
    }
  }, [loading, activeSession?.messages?.length]);

  // Load active session from Firestore backend proxy
  const loadOrCreateSession = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await customFetch(`/api/chats/session?platform=chatbot&clientPhoneOrId=${encodeURIComponent(clientPhone)}&clientName=${encodeURIComponent(clientName)}`);
      if (!res.ok) {
        throw new Error("No se pudo conectar con el servidor Kioto");
      }
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        if (data.session.clientName) {
          setClientName(data.session.clientName);
          localStorage.setItem('kioto_chat_name', data.session.clientName);
        }
      }
    } catch (err: any) {
      console.error("Failed to load session:", err);
      setErrorMsg("Error al contactar al servidor. Comprueba tu conexión de red.");
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('kioto_chat_phone');
      localStorage.removeItem('kioto_chat_name');
      const newPhone = 'cli-' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('kioto_chat_phone', newPhone);
      setClientPhone(newPhone);
      setClientName('Invitado Taller');

      const res = await customFetch(`/api/chats/session?platform=chatbot&clientPhoneOrId=${encodeURIComponent(newPhone)}&clientName=Invitado Taller`);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeSession) return;

    const textToSend = messageText;
    setMessageText('');
    setLoading(true);

    // Optimistically update standard UI
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

      if (!res.ok) {
        throw new Error("No se pudo enviar el mensaje");
      }

      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
        if (data.session.clientName) {
          setClientName(data.session.clientName);
          localStorage.setItem('kioto_chat_name', data.session.clientName);
        }
        await fetchNotifications();
      }
    } catch (err) {
      console.error("Chat message send error:", err);
      setErrorMsg("Error al enviar el mensaje. Comprueba tu conexión de red.");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await customFetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  // Scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages]);

  // Initial load
  useEffect(() => {
    loadOrCreateSession();
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 font-sans antialiased text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-none sm:rounded-2xl shadow-2xl border border-gray-200 h-screen sm:h-[620px] flex flex-col overflow-hidden relative">
        
        {/* Header Block exactly styled like original chat layout */}
        <div className="bg-neutral-950 text-white px-4 py-4 flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-gray-100">Asistente Kioto</h1>
              <p className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                <span>Agenda de citas en fosa</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearHistory}
              title="Reiniciar conversación"
              className="text-gray-400 hover:text-rose-400 p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Connection Error State with error text requested */}
        {errorMsg && (
          <div className="bg-rose-50 border-b border-rose-200 text-rose-900 p-3 text-xs flex items-center space-x-2 shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold">{errorMsg}</p>
              <button 
                onClick={loadOrCreateSession} 
                className="underline mt-1 block font-bold text-rose-700 hover:text-rose-900"
              >
                Reintentar conexión
              </button>
            </div>
          </div>
        )}

        {/* Scrollable messages viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {activeSession ? (
            <>
              {/* Intro note */}
              <div className="text-[10px] text-center text-gray-500 bg-white/80 p-3 rounded-xl border border-gray-200/50 shadow-2xs max-w-xs mx-auto mb-2">
                🤖 Platica con nuestro Asistente Virtual para agendar tu servicio mecánico de manera automática y paso a paso.
              </div>

              {activeSession.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed ${
                    msg.sender === 'client'
                      ? 'bg-neutral-900 border border-neutral-950 text-white rounded-tr-none' 
                      : 'bg-white border border-gray-200 text-gray-950 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-line">
                      {msg.text.split('**').map((part, idx) => 
                        idx % 2 === 1 ? <strong key={idx} className="font-extrabold text-blue-900">{part}</strong> : part
                      ).map((partText, idx) => {
                        // Apply additional markdown-style bold for variables
                        if (typeof partText === 'string') {
                          return partText.split('*').map((subpart, subidx) => 
                            subidx % 2 === 1 ? <strong key={subidx} className="font-bold">{subpart}</strong> : subpart
                          );
                        }
                        return partText;
                      })}
                    </div>
                    <div className="text-[8px] text-right mt-1.5 opacity-60 flex items-center justify-end">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender === 'client' && <Check className="w-3 h-3 text-emerald-400 ml-1" />}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-500 rounded-2xl rounded-tl-none px-4 py-2.5 text-xs shadow-2xs flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-gray-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-gray-300" />
              <span>Cargando asistente virtual...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input box */}
        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-3 flex items-center space-x-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Escribe tu respuesta..."
            className="flex-1 bg-gray-100 border border-gray-200 focus:bg-white rounded-full py-2.5 px-4 text-xs focus:outline-none focus:ring-1 focus:ring-slate-400 text-gray-950 transition-colors"
            disabled={loading || !activeSession}
          />
          <button
            type="submit"
            disabled={loading || !activeSession || !messageText.trim()}
            className="p-2.5 rounded-full bg-neutral-950 text-white transition-opacity disabled:opacity-45 shrink-0 cursor-pointer hover:bg-neutral-800"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* WhatsApp confirmation simulation helper alert link */}
        {notifications.length > 0 && (
          <div className="absolute top-18 left-4 right-4 bg-emerald-600 text-white text-[11px] p-2.5 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-white inline-block animate-ping"></span>
              <span>📱 ¡Notificación de Confirmación WhatsApp generada!</span>
            </div>
            <button 
              onClick={() => {
                alert(`📱 WHATSAPP SIMULADOR:\n\n${notifications[notifications.length - 1].loggedText}`);
              }}
              className="bg-white text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px] uppercase cursor-pointer"
            >
              Ver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
