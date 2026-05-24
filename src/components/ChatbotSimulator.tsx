import React, { useState, useEffect, useRef } from 'react';
import { customFetch } from '../utils/api';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  User, 
  Check, 
  Clock, 
  RotateCcw, 
  AlertCircle,
  Smartphone,
  MessageCircle,
  HelpCircle,
  RefreshCw,
  Bell,
  Trash2
} from 'lucide-react';
import { ChatMessage, ChatSession, SimulatedNotification } from '../types';

interface ChatbotSimulatorProps {
  onAppointmentBooked: () => void; // Reloads main dashboard lists when a booking occurs
}

export default function ChatbotSimulator({ onAppointmentBooked }: ChatbotSimulatorProps) {
  const [platform, setPlatform] = useState<'whatsapp' | 'facebook'>(() => {
    return (localStorage.getItem('kioto_sim_platform') as 'whatsapp' | 'facebook') || 'whatsapp';
  });
  const [clientName, setClientName] = useState<string>(() => {
    return localStorage.getItem('kioto_sim_name') || 'Ignacio Torres';
  });
  const [clientPhone, setClientPhone] = useState<string>(() => {
    return localStorage.getItem('kioto_sim_phone') || '+52 55 4321 8765';
  });
  const [messageText, setMessageText] = useState<string>('');
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [notifications, setNotifications] = useState<SimulatedNotification[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingNotifs, setLoadingNotifs] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync settings with localStorage
  useEffect(() => {
    localStorage.setItem('kioto_sim_platform', platform);
  }, [platform]);

  useEffect(() => {
    localStorage.setItem('kioto_sim_name', clientName);
  }, [clientName]);

  useEffect(() => {
    localStorage.setItem('kioto_sim_phone', clientPhone);
  }, [clientPhone]);

  // Load existing session if there is one on database
  const checkAndLoadSession = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    try {
      const res = await customFetch(`/api/chats/session?platform=${platform}&clientPhoneOrId=${encodeURIComponent(clientPhone)}&clientName=${encodeURIComponent(clientName)}`);
      const data = await res.json();
      if (data.success && data.session) {
        setActiveSession(data.session);
      }
    } catch (err) {
      console.error("Failed to load existing simulator session:", err);
    }
  };

  useEffect(() => {
    checkAndLoadSession();
  }, [platform, clientPhone]);

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

  // Start fresh simulator session
  const startSession = async () => {
    if (!clientName.trim() || !clientPhone.trim()) return;
    setLoading(true);
    try {
      // Send first hello to kickstart conversation
      const res = await customFetch('/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          clientPhoneOrId: clientPhone,
          clientName,
          message: "hola, deseo información o agendar una cita"
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        fetchNotifications();
        onAppointmentBooked();
      }
    } catch (err) {
      console.error("Failed to start chatbot simulator session:", err);
    } finally {
      setLoading(false);
    }
  };

  // Send interactive message to chatbot endpoint
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
          platform,
          clientPhoneOrId: clientPhone,
          clientName,
          message: textToSend
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveSession(data.session);
        if (data.bookingOutcome) {
          // Play visual confirmation alerts or trigger reload
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

  // Clear simulated notifications/logs
  const handleClearNotifications = async () => {
    try {
      await customFetch('/api/notifications', { method: 'DELETE' });
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing logs:", err);
    }
  };

  // Keep chat scrolls to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeSession?.messages]);

  // Initial fetch for notifications list
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000); // pull notifications every 5s
    return () => clearInterval(interval);
  }, []);

  return (
    <div id="chatbot-simulator-card" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Simulation Configuration Column */}
      <div className="lg:col-span-4 space-y-4">
        <div id="simulator-settings-box" className="bg-white rounded-xl shadow-xs border border-gray-200 p-5">
          <h3 className="text-md font-semibold text-gray-950 flex items-center mb-4">
            <Smartphone className="w-5 h-5 text-gray-700 mr-2" />
            Configurar Simulador
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">Canal Digital</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-platform-wa"
                  onClick={() => { setPlatform('whatsapp'); setActiveSession(null); }}
                  className={`flex items-center justify-center py-2.5 px-3 rounded-lg border font-medium text-xs transition-colors ${
                    platform === 'whatsapp' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5 text-emerald-600 fill-emerald-600" />
                  WhatsApp
                </button>
                <button
                  type="button"
                  id="btn-platform-fb"
                  onClick={() => { setPlatform('facebook'); setActiveSession(null); }}
                  className={`flex items-center justify-center py-2.5 px-3 rounded-lg border font-medium text-xs transition-colors ${
                    platform === 'facebook' 
                      ? 'bg-blue-50 border-blue-500 text-blue-800' 
                      : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <MessageCircle className="w-4 h-4 mr-1.5 text-blue-600 fill-blue-600" />
                  Facebook Messenger
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nombre del Cliente</label>
              <input
                type="text"
                id="sim-client-name"
                value={clientName}
                onChange={(e) => { setClientName(e.target.value); setActiveSession(null); }}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 transition-shadow"
                placeholder="Nombre del usuario"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Número de Celular / Id</label>
              <input
                type="text"
                id="sim-client-phone"
                value={clientPhone}
                onChange={(e) => { setClientPhone(e.target.value); setActiveSession(null); }}
                className="w-full bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 transition-shadow"
                placeholder="Ej. +52 55 1122 3344"
              />
            </div>

            <button
              type="button"
              id="btn-start-chat-sim"
              onClick={startSession}
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-xs uppercase tracking-wider py-3 rounded-lg transition-colors flex items-center justify-center"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <MessageSquare className="w-4 h-4 mr-2" />
              )}
              {activeSession ? "Reiniciar Conversación" : "Abrir Chat en Vivo"}
            </button>
          </div>
        </div>

        {/* Dynamic Help hints */}
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 space-y-2">
          <div className="flex items-start">
            <HelpCircle className="w-5 h-5 text-amber-700 shrink-0 mr-2 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-amber-900">¿Cómo funciona?</h4>
              <p className="text-xs text-amber-800 leading-relaxed mt-1">
                Conversa libremente con el chatbot de Gemini. Te guiará paso a paso:
              </p>
              <ul className="list-disc pl-4 text-xs text-amber-800 mt-1 space-y-1">
                <li>Pide una <strong>prueba de manejo / visita</strong> o un <strong>servicio mecánico</strong>.</li>
                <li>Proporciona placas, NIV (para taller) o selecciona el auto que te interesa.</li>
                <li>Al terminar, la cita se registra de forma automática y se enviará la alerta por WhatsApp.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Mobile Simulator Preview */}
      <div className="lg:col-span-4">
        {activeSession ? (
          <div 
            id="mobile-frame-mock" 
            className="border-8 border-gray-800 rounded-[36px] bg-slate-100 shadow-xl overflow-hidden flex flex-col h-[480px] relative"
          >
            {/* Phone Top Speaker/Island */}
            <div className="absolute top-0 inset-x-0 h-5 bg-gray-800 z-30 flex items-center justify-center">
              <div className="w-16 h-3 bg-black rounded-b-xl"></div>
            </div>

            {/* Chat header */}
            <div className={`pt-7 pb-3 px-4 text-white flex items-center justify-between shadow-md z-20 ${
              platform === 'whatsapp' ? 'bg-emerald-700' : 'bg-blue-600'
            }`}>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-md">
                  K
                </div>
                <div>
                  <h4 className="text-xs font-semibold leading-tight">Kioto AI Chatbot</h4>
                  <div className="flex items-center text-[10px] text-emerald-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse mr-1"></span>
                    Gemini activo
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">
                {platform.toUpperCase()}
              </span>
            </div>

            {/* Chat Area */}
            <div 
              className="flex-1 overflow-y-auto p-3 space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-50 to-gray-200"
              style={{ scrollBehavior: 'smooth' }}
            >
              <div className="text-[10px] text-center text-gray-500 bg-white/60 backdrop-blur-xs py-1 px-2.5 rounded-lg max-w-xs mx-auto">
                Los mensajes de WhatsApp reales se simulan en la columna de notificaciones de la derecha.
              </div>

              {activeSession.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.sender === 'client' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs shadow-xs transition-all ${
                    msg.sender === 'client'
                      ? (platform === 'whatsapp' 
                          ? 'bg-emerald-100 border border-emerald-200 text-emerald-950 rounded-tr-none' 
                          : 'bg-blue-500 text-white rounded-tr-none')
                      : 'bg-white border border-gray-200 text-gray-900 rounded-tl-none'
                  }`}>
                    {/* Preserve linebreaks and highlight whatsapp bold tags */}
                    <div className="whitespace-pre-line leading-relaxed">
                      {msg.text.split('\n').map((line, lidx) => (
                        <p key={lidx}>
                          {line.split('**').map((part, pidx) => 
                            pidx % 2 === 1 ? <strong key={pidx} className="font-bold">{part}</strong> : part
                          ).map((part, pidx) => 
                            // Handles WhatsApp style single asterisks *bold*
                            typeof part === 'string' 
                              ? part.split('*').map((subpart, subpidx) => 
                                  subpidx % 2 === 1 ? <strong key={subpidx} className="font-bold">{subpart}</strong> : subpart
                                )
                              : part
                          )}
                        </p>
                      ))}
                    </div>
                    <div className="text-[9px] text-right mt-1 opacity-70 flex items-center justify-end">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {msg.sender === 'client' && <Check className="w-3 h-3 text-emerald-600 ml-1" />}
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 text-gray-500 rounded-xl rounded-tl-none px-3 py-2 text-xs shadow-xs flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input field */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-2 flex items-center space-x-2">
              <input
                type="text"
                id="message-input-sim"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-50 border border-gray-200 text-gray-950 rounded-full py-1.5 px-3.5 text-xs focus:outline-none focus:ring-1 focus:ring-gray-300"
                disabled={loading}
              />
              <button
                type="submit"
                id="btn-send-message-sim"
                disabled={loading || !messageText.trim()}
                className={`p-2 rounded-full text-white transition-opacity ${
                  platform === 'whatsapp' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                } disabled:opacity-50`}
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="border-4 border-dashed border-gray-300 rounded-3xl h-[480px] flex flex-col items-center justify-center p-6 text-center bg-gray-50">
            <Smartphone className="w-12 h-12 text-gray-400 mb-3" />
            <h4 className="text-sm font-semibold text-gray-800">Canal de Chat Apagado</h4>
            <p className="text-xs text-gray-500 max-w-xs mt-1%">
              Selecciona un canal, ingresa un nombre técnico de prueba y presiona "Abrir Chat en Vivo" para interactuar directamente.
            </p>
          </div>
        )}
      </div>

      {/* WhatsApp Logs & Confirmations Stream Column */}
      <div id="whatsapp-notifications-box" className="lg:col-span-4 bg-white rounded-xl shadow-xs border border-gray-200 p-5 flex flex-col h-[480px]">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-emerald-600 animate-swing" />
            <h3 className="text-sm font-semibold text-gray-950">Notificaciones de WhatsApp</h3>
          </div>
          <div className="flex space-x-1.5">
            <button
              onClick={fetchNotifications}
              disabled={loadingNotifs}
              className="p-1 px-2 border border-gray-200 hover:bg-gray-50 rounded text-[10px] text-gray-600 flex items-center"
              title="Refrescar logs"
            >
              <RefreshCw className={`w-3 h-3 ${loadingNotifs ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleClearNotifications}
              className="p-1 px-2 border border-red-100 text-red-600 hover:bg-red-50 rounded text-[10px] flex items-center"
              title="Limpiar alertas"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-gray-500 mb-3 shrink-0">
          Mensajes enviados automáticamente al número registrado (por agendar o actualizar estatus, incluyendo el recordatorio de 1 hora antes).
        </p>

        {/* List of simulated messages */}
        <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-4">
              <AlertCircle className="w-8 h-8 text-gray-300 mb-2" />
              <p className="text-xs text-gray-400">Ningún mensaje enviado recientemente.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                className={`p-3 rounded-lg border text-xs relative overflow-hidden transition-all ${
                  notif.type === 'confirmacion'
                    ? 'bg-emerald-50/50 border-emerald-100'
                    : notif.type === 'recordatorio'
                    ? 'bg-amber-50/50 border-amber-100'
                    : 'bg-blue-50/50 border-blue-100'
                }`}
              >
                {/* Visual Label Tag */}
                <span className={`absolute top-0 right-0 px-2 py-0.5 text-[8px] font-bold rounded-bl uppercase border-l border-b ${
                  notif.type === 'confirmacion'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : notif.type === 'recordatorio'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-blue-100 text-blue-800 border-blue-200'
                }`}>
                  {notif.type === 'confirmacion' ? 'Reserva' : notif.type === 'recordatorio' ? 'Alerta 1h' : 'Estatus'}
                </span>

                <div className="font-semibold text-gray-900 flex items-center text-[11px]">
                  <Phone className="w-3.5 h-3.5 text-gray-400 mr-1" />
                  {notif.clientPhone} ({notif.clientName})
                </div>

                <div className="mt-1.5 text-gray-700 bg-white/70 p-2 rounded border border-gray-100 whitespace-pre-line text-[11px] leading-relaxed select-all">
                  {notif.message}
                </div>

                <div className="mt-1 text-[9px] text-gray-400 text-right flex items-center justify-end">
                  <Clock className="w-3 h-3 mr-1" />
                  {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
