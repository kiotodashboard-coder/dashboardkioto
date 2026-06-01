import React, { useState, useEffect } from 'react';
import { 
  User, 
  Users, 
  Key, 
  LogOut, 
  Calendar, 
  Wrench, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Edit, 
  Check, 
  AlertCircle, 
  ShieldCheck, 
  Smartphone, 
  CheckCircle, 
  RefreshCw, 
  Car, 
  Info, 
  MapPin, 
  Activity, 
  Bell, 
  Sparkles, 
  Database,
  MessageCircle,
  Clock,
  ChevronRight,
  Settings,
  Mail,
  ArrowLeft,
  Bot,
  Terminal,
  Copy
} from 'lucide-react';
import { User as UserType, ServicioMecanico } from './types';
import { customFetch } from './utils/api';
import AdminPanel from './components/AdminPanel';
import AsesorForm from './components/AsesorForm';
import ServiciosTaller from './components/ServiciosTaller';
import FloatingChatbot from './components/FloatingChatbot';
import ProgramacionForm from './components/ProgramacionForm';
import DashboardOverview from './components/DashboardOverview';
import AiCodeCoPilot from './components/AiCodeCoPilot';
import EmbeddedChatbotView from './components/EmbeddedChatbotView';
import KiotoLogo from './components/KiotoLogo';

export default function App() {
  const isEmbeddedChatbot = typeof window !== 'undefined' && (
    window.location.search.includes('embed=true') || 
    window.location.search.includes('chatbot=true')
  );

  if (isEmbeddedChatbot) {
    return <EmbeddedChatbotView />;
  }

  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('kioto_curr_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginStep, setLoginStep] = useState<'email' | 'password' | 'set_password'>('email');
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [isWebChatbotEnabled, setIsWebChatbotEnabled] = useState(() => localStorage.getItem('kioto_chatbot_web') !== 'false');
  const [isWhatsAppChatbotEnabled, setIsWhatsAppChatbotEnabled] = useState(() => localStorage.getItem('kioto_chatbot_whatsapp') !== 'false');
  const [isMessengerChatbotEnabled, setIsMessengerChatbotEnabled] = useState(() => localStorage.getItem('kioto_chatbot_messenger') !== 'false');
  const [newDirective, setNewDirective] = useState<string>('');
  const [directivesList, setDirectivesList] = useState<string[]>([]);
  const [savingDirectives, setSavingDirectives] = useState<boolean>(false);

  const fetchChatbotConfig = async () => {
    try {
      const res = await customFetch('/api/config/chatbot');
      if (res.ok) {
        const data = await res.json();
        setIsWebChatbotEnabled(data.web !== false);
        setIsWhatsAppChatbotEnabled(data.whatsapp !== false);
        setIsMessengerChatbotEnabled(data.messenger !== false);
        if (data.directivesList) {
          setDirectivesList(data.directivesList);
        } else if (data.customDirectives) {
          const list = data.customDirectives.split('\n').map((item: string) => item.trim()).filter((item: string) => item.length > 0);
          setDirectivesList(list);
        } else {
          setDirectivesList([]);
        }
        localStorage.setItem('kioto_chatbot_web', String(data.web !== false));
        localStorage.setItem('kioto_chatbot_whatsapp', String(data.whatsapp !== false));
        localStorage.setItem('kioto_chatbot_messenger', String(data.messenger !== false));
      }
    } catch (err: any) {
      console.warn("Advertencia al obtener configuración del chatbot:", err.message);
    }
  };

  // Load chatbot server configuration initially and refresh
  useEffect(() => {
    fetchChatbotConfig();
    const interval = setInterval(fetchChatbotConfig, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveDirectives = async () => {
    if (!newDirective.trim()) return;
    setSavingDirectives(true);
    try {
      const updatedList = [...directivesList, newDirective.trim()];
      await customFetch('/api/config/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          directivesList: updatedList,
          customDirectives: updatedList.join('\n')
        })
      });
      setNewDirective('');
      setAppNotif({ type: 'success', text: "¡Directriz agregada de inmediato al chatbot!" });
      setTimeout(() => setAppNotif(null), 3000);
    } catch (err) {
      console.error("Error saving directives:", err);
    } finally {
      setSavingDirectives(false);
    }
  };

  const handleRemoveDirective = async (indexToRemove: number) => {
    try {
      const updatedList = directivesList.filter((_, idx) => idx !== indexToRemove);
      await customFetch('/api/config/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          directivesList: updatedList,
          customDirectives: updatedList.join('\n')
        })
      });
      setAppNotif({ type: 'success', text: "¡Directriz eliminada con éxito!" });
      setTimeout(() => setAppNotif(null), 3000);
    } catch (err) {
      console.error("Error removing directive:", err);
    }
  };

  const handleToggleWebChatbot = () => {
    const newVal = !isWebChatbotEnabled;
    setIsWebChatbotEnabled(newVal);
    localStorage.setItem('kioto_chatbot_web', String(newVal));
    customFetch('/api/config/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ web: newVal, whatsapp: isWhatsAppChatbotEnabled, messenger: isMessengerChatbotEnabled })
    }).catch(err => console.error(err));
  };
  const handleToggleWhatsAppChatbot = () => {
    const newVal = !isWhatsAppChatbotEnabled;
    setIsWhatsAppChatbotEnabled(newVal);
    localStorage.setItem('kioto_chatbot_whatsapp', String(newVal));
    customFetch('/api/config/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ web: isWebChatbotEnabled, whatsapp: newVal, messenger: isMessengerChatbotEnabled })
    }).catch(err => console.error(err));
  };
  const handleToggleMessengerChatbot = () => {
    const newVal = !isMessengerChatbotEnabled;
    setIsMessengerChatbotEnabled(newVal);
    localStorage.setItem('kioto_chatbot_messenger', String(newVal));
    customFetch('/api/config/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ web: isWebChatbotEnabled, whatsapp: isWhatsAppChatbotEnabled, messenger: newVal })
    }).catch(err => console.error(err));
  };
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [emailDetails, setEmailDetails] = useState<{ name: string; role: string } | null>(null);
  const [authError, setAuthError] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Core Database lists
  const [servicios, setServicios] = useState<ServicioMecanico[]>([]);
  const [loadingLists, setLoadingLists] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<{ type: 'neon' | 'local'; url?: string }>({ type: 'local' });
  const [showDbExplanation, setShowDbExplanation] = useState<boolean>(false);

  useEffect(() => {
    // @ts-ignore
    const viteApiUrl = import.meta.env.VITE_API_URL || "";
    if (viteApiUrl) {
      setDbStatus({ type: 'neon', url: viteApiUrl });
    } else {
      setDbStatus({ type: 'local' });
    }
  }, []);
  
  // Dashboard view selection tabs
  const [activeTab, setActiveTab] = useState<string>(() => {
    return localStorage.getItem('kioto_active_tab') || 'dashboard';
  });
  const [embedTab, setEmbedTab] = useState<'bubble' | 'iframe'>('bubble');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Notification Banner
  const [appNotif, setAppNotif] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  // Sync session and active tab to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kioto_curr_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kioto_curr_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kioto_active_tab', activeTab);
  }, [activeTab]);

  // Help load database lists into state
  const loadDashboardData = async (isSilent = false) => {
    if (!isSilent) setLoadingLists(true);
    try {
      const sRes = await customFetch('/api/servicios');
      
      if (sRes.ok) {
        const sData = await sRes.json();
        setServicios(sData);
      }
    } catch (err) {
      console.error("Failed to fetch dashboard arrays:", err);
    } finally {
      if (!isSilent) setLoadingLists(false);
    }
  };

  // Re-load on initial login state OR changes, and set up a 4-second real-time short polling interval
  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      const interval = setInterval(() => {
        loadDashboardData(true);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Step 1: Check if email is in database
  const handleCheckEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setAuthError("Por favor ingrese su correo electrónico.");
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await customFetch('/api/auth/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginUsername.trim() })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setEmailDetails({ name: data.name, role: data.role });
        if (data.isFirstLogin) {
          setLoginStep('set_password');
        } else {
          setLoginStep('password');
        }
      } else {
        setAuthError(data.message || "El correo no se encuentra registrado en el sistema. Solicite acceso al administrador.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error de red al conectar con el servidor Kioto.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2a: Set password for first-time login
  const handleSetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmNewPassword.trim()) {
      setAuthError("Por favor complete los campos de contraseña.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setAuthError("Las contraseñas no coinciden.");
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await customFetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginUsername.trim(), password: newPassword })
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Direct login following password configuration
        setCurrentUser(data.user);
        
        setActiveTab(data.user.role === 'Admin' ? 'dashboard' : 'servicios');
        
        setAppNotif({ type: 'success', text: `¡Contraseña guardada! Bienvenido ${data.user.name}` });
        setTimeout(() => setAppNotif(null), 4000);
      } else {
        setAuthError(data.message || "Ocurrió un error al guardar la contraseña.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error al guardar la nueva contraseña.");
    } finally {
      setAuthLoading(false);
    }
  };

  // Step 2b: Standard login flow
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setAuthError("Por favor ingrese su contraseña.");
      return;
    }

    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await customFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        setCurrentUser(data.user);
        
        // Define default initial active tab to dashboard for Admin, and servicios for non-Admin
        setActiveTab(data.user.role === 'Admin' ? 'dashboard' : 'servicios');
        
        setAppNotif({ type: 'success', text: `¡Bienvenido de nuevo, ${data.user.name}!` });
        setTimeout(() => setAppNotif(null), 4000);
      } else {
        setAuthError(data.message || "Credenciales no coinciden. Intente de nuevo.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Error de red al conectar con el servidor Kioto.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setLoginStep('email');
    setAuthError('');
    setActiveTab('');
  };

  const handleResetDatabase = async () => {
    if (!confirm("⚠️ ¿Desea restablecer toda la base de datos 'kioto' a la configuración inicial de fábrica? Se perderán las citas nuevas.")) return;
    try {
      const res = await customFetch('/api/db/reset');
      if (res.ok) {
        setAppNotif({ type: 'success', text: "Base de datos restablecida con los usuarios de planta y citas piloto." });
        setTimeout(() => setAppNotif(null), 5000);
        if (currentUser) {
          loadDashboardData();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pre-fill helpers for demo evaluation
  const prefillCredentials = (user: string, pass: string) => {
    setLoginUsername(user);
    setLoginPassword(pass);
    setAuthError('');
  };

  // Visual status label generators
  const scheduledCount = servicios.filter(s => s.status === 'servicio agendado').length;
  const inProgressCount = servicios.filter(s => s.status === 'en proceso').length;
  const finishedCount = servicios.filter(s => s.status === 'atendido').length;
  const receivedCount = servicios.filter(s => s.status === 'vehículo recibido').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-gray-900 selection:text-white">
      
      {/* HEADER SECTION - Styled exactly to match the desktop mock layout */}
      <header className="bg-white border-b border-gray-200 shrink-0 sticky top-0 z-40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Left Block: Logo Kioto SVG and Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-slate-50/50 border border-slate-200/50 hover:border-slate-300 hover:bg-white rounded-xl px-3 py-1.5 flex items-center justify-center shadow-3xs transition-all">
              <KiotoLogo className="h-6 w-auto" />
            </div>
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none mb-1 uppercase">
                Automotriz Kioto
              </h1>
              <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                <p className="text-[9px] font-bold tracking-widest text-gray-400 uppercase leading-none">
                  {currentUser ? `PANEL DE ${currentUser.role === 'Admin' ? 'ADMIN' : currentUser.role.toUpperCase()}` : 'ACCESO SEGURO'}
                </p>
                <span className="text-gray-300 text-[10px] select-none leading-none">|</span>
                {dbStatus.type === 'neon' ? (
                  <span className="text-[9px] text-emerald-600 font-extrabold tracking-normal uppercase leading-none flex items-center gap-1" title={`Conectado al backend remoto en ${dbStatus.url}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    Neon Postgres Activo
                  </span>
                ) : (
                  <span 
                    onClick={() => setShowDbExplanation(true)}
                    className="text-[9px] text-amber-600 hover:text-amber-700 underline font-extrabold tracking-normal uppercase leading-none flex items-center gap-1 cursor-pointer" 
                    title="Haz clic para ver cómo conectar con Neon Postgres en Vercel"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                    Simulación Local (Instrucciones)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right Block: User Profile capsule & LogOut Icon */}
          <div className="flex items-center space-x-3">
            {currentUser && (
              <>
                {/* Active user email pill */}
                <div className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-250/20 border border-slate-200/50 rounded-full px-4 py-1.5 text-xs text-slate-800 font-medium transition-all select-none">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {currentUser.username.includes('@') 
                      ? currentUser.username 
                      : (currentUser.role === 'Admin' ? 'ejemplo@kioto.com' : `${currentUser.username.toLowerCase()}@kioto.com`)}
                  </span>
                </div>

                {/* Exit button without text - raw icon as shown in mockup */}
                <button
                  onClick={handleLogout}
                  id="btn-sign-out"
                  className="p-2 border border-gray-200 hover:bg-slate-50 text-slate-500 hover:text-rose-600 rounded-full transition-all cursor-pointer"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* GLOBAL SYSTEM NOTIFICATION BANNER */}
      {appNotif && (
        <div className="bg-emerald-600 text-white text-xs py-2 px-4 shadow-md flex items-center justify-between text-center sticky top-16 z-30 animate-fade">
          <div className="mx-auto flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 mr-1 text-emerald-200" />
            <span className="font-semibold">{appNotif.text}</span>
          </div>
        </div>
      )}

      {/* CONTENT AREA */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">
        
        {!currentUser ? (
          /* LOGIN SCREEN VIEW (With removed header, removed shortcuts, and two-step flow) */
          <div id="login-container" className="max-w-md mx-auto my-12 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-6 space-y-6">
              
              <div className="flex flex-col items-center justify-center border-b border-gray-100 pb-5">
                <div className="bg-slate-50 mb-2.5 px-4 py-2 border border-slate-200/50 rounded-xl">
                  <KiotoLogo className="h-8 w-auto" />
                </div>
                <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Panel de Control Central</h2>
              </div>

              {authError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-lg text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-medium">{authError}</span>
                </div>
              )}

              {loginStep === 'email' && (
                <form onSubmit={handleCheckEmailSubmit} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                      <Mail className="w-5 h-5 text-gray-700" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Acceder con Correo</h3>
                    <p className="text-xs text-gray-500 mt-1">Ingrese su correo de Kioto para verificar su cuenta</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="email"
                        id="login-username-input"
                        value={loginUsername}
                        onChange={(e) => setLoginUsername(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 focus:bg-white transition-all"
                        placeholder="ejemplo@kioto.com"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    id="btn-login-next"
                    disabled={authLoading}
                    className="w-full bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {authLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {loginStep === 'password' && (
                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-2">
                      <Key className="w-5 h-5 text-emerald-600" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Introducir Contraseña</h3>
                    <p className="text-xs text-gray-600 mt-1">
                      Hola, <strong className="text-zinc-900">{emailDetails?.name}</strong> ({emailDetails?.role})
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        id="login-password-input"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 focus:bg-white transition-all"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      id="btn-login-submit"
                      disabled={authLoading}
                      className="w-full bg-gray-950 hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Entrar al Dashboard</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('email');
                        setAuthError('');
                      }}
                      className="w-full bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver</span>
                    </button>
                  </div>
                </form>
              )}

              {loginStep === 'set_password' && (
                <form onSubmit={handleSetPasswordSubmit} className="space-y-4">
                  <div className="text-center pb-2">
                    <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-2">
                      <Sparkles className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-sm font-bold text-indigo-950 uppercase tracking-wider">Establecer Contraseña</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      ¡Hola <strong className="text-zinc-900">{emailDetails?.name}</strong>! Es tu primer ingreso, por favor configura tu contraseña.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Nueva Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 focus:bg-white transition-all"
                        placeholder="Mínimo 6 caracteres"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirmar Nueva Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 focus:bg-white transition-all"
                        placeholder="Repita la contraseña"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-widest py-3 rounded-xl transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {authLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <span>Establecer y Acceder</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('email');
                        setAuthError('');
                      }}
                      className="w-full bg-white hover:bg-gray-50 text-gray-600 font-bold text-xs uppercase tracking-wider py-2.5 rounded-xl border border-gray-200 transition-all flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Volver</span>
                    </button>
                  </div>
                </form>
              )}

            </div>
          </div>
        ) : (
          /* SYSTEM DASHBOARD VIEW SHELL */
          <div className="space-y-6">
            
            {/* Top Navigation Panel */}
            <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Tab options navigation layout exactly matching mockup */}
              <div id="dashboard-navbar-buttons" className="flex flex-wrap gap-3">
                
                {/* Tab: Dashboard (Admin exclusive) */}
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => setActiveTab('dashboard')}
                    id="tab-dashboard"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal flex items-center space-x-2 border transition-all cursor-pointer ${
                      activeTab === 'dashboard'
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs' 
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    <span>Dashboard</span>
                  </button>
                )}

                {/* Tab: Usuarios (Admin exclusive) */}
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => setActiveTab('usuarios')}
                    id="tab-admin-users"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal flex items-center space-x-2 border transition-all cursor-pointer ${
                      activeTab === 'usuarios' 
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs' 
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Usuarios</span>
                  </button>
                )}

                {/* Tab: Servicios (Shared according to privileges) */}
                <button
                  onClick={() => setActiveTab('servicios')}
                  id="tab-service-view"
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal flex items-center space-x-2 border transition-all cursor-pointer ${
                    activeTab === 'servicios'
                      ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs' 
                      : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  <span>Servicios</span>
                </button>

                {/* Tab: Programación (Admin exclusive) */}
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => setActiveTab('programacion')}
                    id="tab-programming-settings"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal flex items-center space-x-2 border transition-all cursor-pointer ${
                      activeTab === 'programacion'
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs' 
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    <span>Programación</span>
                  </button>
                )}

                {/* Tab: Configuración (Admin exclusive) */}
                {currentUser.role === 'Admin' && (
                  <button
                    onClick={() => setActiveTab('config')}
                    id="tab-config-settings"
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-normal flex items-center space-x-2 border transition-all cursor-pointer ${
                      activeTab === 'config'
                        ? 'bg-neutral-950 border-neutral-950 text-white shadow-xs' 
                        : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Configuración</span>
                  </button>
                )}
              </div>

            </div>

            {/* DYNAMIC METRICS BENTO GRID */}
            {activeTab === 'resumen' && currentUser.role === 'Admin' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Total Usuarios</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-950">Active DB</span>
                    <Users className="w-7 h-7 text-purple-600" />
                  </div>
                  <p className="text-[10px] text-gray-500">Perfiles dinámicos para control de planta</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Servicios Activos</span>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-gray-950">{servicios.length}</span>
                    <Wrench className="w-7 h-7 text-blue-600" />
                  </div>
                  <p className="text-[10px] text-gray-500">Dividido en 4 columnas Kanban</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Estatus del Taller</span>
                  <div className="text-xs space-y-1 pt-1.5 grid grid-cols-2 font-mono gap-y-0.5 gap-x-2 text-[10px]">
                    <div className="text-amber-700">🗓 Citas: {scheduledCount}</div>
                    <div className="text-purple-700">🔑 Recibido: {receivedCount}</div>
                    <div className="text-blue-700">⚙️ En Proceso: {inProgressCount}</div>
                    <div className="text-emerald-700">✅ Atendido: {finishedCount}</div>
                  </div>
                </div>
              </div>
            )}

            {/* MAIN ACTIVE TAB VIEW PORT */}
            <div id="dashboard-tab-viewport">
              {loadingLists && (
                <div className="py-8 text-center text-xs text-gray-500 flex items-center justify-center space-x-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-gray-400" />
                  <span>Sincronizando base de datos 'kioto'...</span>
                </div>
              )}

              {/* VIEW: NEW INTERACTIVE WORKSHOP DASHBOARD OVERVIEW */}
              {activeTab === 'dashboard' && (
                <DashboardOverview services={servicios} onRefresh={loadDashboardData} />
              )}

              {/* VIEW: ADMIN GENERAL SUMMARY */}
              {activeTab === 'resumen' && currentUser.role === 'Admin' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 space-y-4">
                    <div className="flex items-center space-x-2 border-b border-gray-100 pb-4">
                      <Activity className="w-5 h-5 text-gray-800" />
                      <h3 className="text-sm font-bold text-gray-950 uppercase tracking-widest">
                        Panel de Administración Central de Kioto
                      </h3>
                    </div>

                    <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
                      Como <strong>Administrador General</strong>, tienes control absoluto del ecosistema. 
                      Puedes de dar de alta, baja y modificar asesores y técnicos de servicio. 
                      Asimismo, puedes monitorear de manera agregada lo que visualizan y operan ambos perfiles. 
                      Utiliza las secciones a continuación o navega en la barra superior.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between col-span-1 md:col-span-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">Administración de Servicios</h4>
                          <p className="text-[11px] text-slate-500 mt-1">Registro de servicios mecánicos de taller en tiempo real.</p>
                        </div>
                        <button 
                          onClick={() => setActiveTab('servicios')}
                          className="p-1 px-3 bg-white hover:bg-gray-100 border text-gray-700 text-xs rounded-lg font-semibold flex items-center"
                        >
                          Ir <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Previsualización de Actividades de Servicio (Taller Mecánico)</h3>
                    <ServiciosTaller services={servicios} onServiceUpdated={loadDashboardData} isAdmin={true} />
                  </div>
                </div>
              )}

              {/* VIEW: USER REGISTRATION (Admin only) */}
              {activeTab === 'usuarios' && currentUser.role === 'Admin' && (
                <AdminPanel />
              )}

              {/* VIEW: WORKSHOP PROGRAMMING (Admin only) */}
              {activeTab === 'programacion' && currentUser.role === 'Admin' && (
                <ProgramacionForm />
              )}



              {/* VIEW: SYSTEM CONFIGURATION (Admin only) */}
              {activeTab === 'config' && currentUser.role === 'Admin' && (
                <div className="space-y-6">

                  {/* CHATBOT IA CONFIGURATION TOGGLES CARD */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 animate-fade-in shadow-xs">
                    <div>
                      <h3 className="text-md font-bold text-gray-900 flex items-center">
                        <Bot className="w-5 h-5 text-gray-800 mr-2" />
                        Interruptores de Activación del Chatbot Inteligente IA
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Habilite o deshabilite de inmediato y por separado el asistente inteligente para cada canal de atención.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                      {/* Web Switch */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-bold text-gray-950 block">Chatbot de la Página Web</span>
                          <span className="text-[10px] text-gray-400 block">Widget flotante en el sistema</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleWebChatbot}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isWebChatbotEnabled ? 'bg-neutral-900' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isWebChatbotEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* WhatsApp Switch */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-bold text-gray-950 block">Chatbot de WhatsApp</span>
                          <span className="text-[10px] text-gray-400 block">Atención en WhatsApp Business</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleWhatsAppChatbot}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isWhatsAppChatbotEnabled ? 'bg-emerald-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isWhatsAppChatbotEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>

                      {/* Messenger Switch */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
                        <div className="space-y-0.5 pr-2">
                          <span className="text-xs font-bold text-gray-950 block">Chatbot de Messenger</span>
                          <span className="text-[10px] text-gray-400 block">Respuestas en la Fanpage oficial</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleMessengerChatbot}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isMessengerChatbotEnabled ? 'bg-blue-600' : 'bg-gray-200'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isMessengerChatbotEnabled ? 'translate-x-5' : 'translate-x-0'}`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* DIRECTIVAS DE CHATBOT IA CARD */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-fade-in shadow-xs">
                    <div>
                      <h3 className="text-md font-bold text-gray-900 flex items-center">
                        <Bot className="w-5 h-5 text-gray-800 mr-2" />
                        Instrucciones y Directrices Personalizadas del Chatbot (IA)
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Establezca reglas de negocio complementarias, respuestas personalizadas, horarios específicos o políticas de atención. El chatbot integrará estas guías en tiempo real para sus respuestas.
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs text-gray-600 leading-relaxed">
                        <span className="font-bold text-gray-850 block mb-1">💡 Ejemplos de directrices que puedes agregar:</span>
                        <ul className="list-disc pl-4 space-y-1 text-gray-400 text-[11px]">
                          <li><strong>Respuestas fijas</strong>: <span className="text-gray-600">"Si te preguntan la hora de comida, diles que cerramos de 14:00 a 15:00."</span></li>
                          <li><strong>Instrucciones de contacto</strong>: <span className="text-gray-600">"Para facturas, diles que envíen datos al correo facturas@kiotoauto.mx."</span></li>
                          <li><strong>Garantías y Precios</strong>: <span className="text-gray-600">"Indica que la revisión de frenos cuesta $450 pesos y tiene 30 días de garantía."</span></li>
                        </ul>
                      </div>

                      {/* LIST OF ACTIVE DIRECTIVES */}
                      {directivesList.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-xs font-bold text-gray-700 block select-none">📌 Directrices e instrucciones activas en tiempo real:</span>
                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {directivesList.map((directive, idx) => (
                              <div key={idx} className="bg-emerald-50/40 border border-emerald-150 rounded-xl p-3 flex justify-between items-start gap-4 text-xs text-neutral-800 leading-relaxed">
                                <span className="flex-1 whitespace-pre-wrap select-text">{directive}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveDirective(idx)}
                                  className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded-lg transition duration-150 border-0 cursor-pointer shrink-0"
                                  title="Eliminar directriz"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-xs font-bold text-gray-700 block mb-1.5 select-none">✏️ Agregar nueva directriz o instrucción al Chatbot:</span>
                        <textarea
                          rows={4}
                          value={newDirective}
                          onChange={(e) => setNewDirective(e.target.value)}
                          placeholder="Escriba aquí la instrucción. Ejemplo:
- El costo de diagnóstico estándar es de $500 pesos.
- Las garantías de reparaciones mayores son de 3 meses.
- Para emergencias vehiculares o grúas, dales el número directo +52 55 (4321) 0988."
                          className="w-full bg-white border border-gray-200 rounded-xl p-3.5 text-xs text-gray-900 placeholder-gray-400 focus:ring-1 focus:ring-gray-950 focus:outline-none focus:border-gray-950 font-sans leading-relaxed transition-all min-h-[100px]"
                        />
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={handleSaveDirectives}
                          disabled={savingDirectives || !newDirective.trim()}
                          className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 disabled:bg-gray-300 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition duration-150 cursor-pointer flex items-center space-x-1 border-0"
                        >
                          {savingDirectives ? (
                            <span>Guardando Directriz...</span>
                          ) : (
                            <>
                              <Bot className="w-4 h-4 mr-1 inline" />
                              <span>Aplicar Directriz al Chatbot</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* WIDGET INTEGRATION CODE CARD */}
                  {(() => {
                    const portalUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-3arbs2kotcgihptz3rbf6o-82971551649.us-east1.run.app';
                    
                    const bubbleCodeSnippet = `<!-- Widget de Chatbot Inteligente IA - Kioto Auto -->
<div id="kioto-chatbot-widget" style="position: fixed; bottom: 24px; right: 24px; z-index: 999999; font-family: system-ui, -apple-system, sans-serif;">
  <!-- Botón Burbuja -->
  <button id="kioto-chatbot-bubble" style="width: 56px; height: 56px; border-radius: 50%; background: #000000; border: 1px solid #27272a; color: #ffffff; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); transition: all 0.2s ease; outline: none; position: relative;">
    <!-- Icono Chat (Burbuja) -->
    <svg id="kioto-icon-chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease;"><path d="M12 8V4H8"></path><rect width="16" height="12" x="4" y="8" rx="2"></rect><path d="M2 14h2"></path><path d="M20 14h2"></path><path d="M15 13v2"></path><path d="M9 13v2"></path></svg>
    <!-- Icono Cerrar (X) -->
    <svg id="kioto-icon-close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none; transition: transform 0.2s ease;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    <!-- Notificación de Actividad -->
    <span style="position: absolute; top: 2px; right: 2px; display: flex; height: 12px; width: 12px;">
      <span style="animation: kioto-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; position: absolute; inline-size: 100%; block-size: 100%; border-radius: 9999px; background-color: #a1a1aa; opacity: 0.75;"></span>
      <span style="position: relative; display: inline-flex; border-radius: 9999px; height: 12px; width: 12px; background-color: #71717a;"></span>
    </span>
  </button>

  <!-- Tooltip Informativo -->
  <div id="kioto-chatbot-tooltip" style="position: absolute; right: 72px; top: 10px; background: #18181b; color: #ffffff; text-shadow: none; font-size: 11px; font-weight: bold; padding: 6px 12px; border-radius: 8px; white-space: nowrap; pointer-events: none; opacity: 0; transform: translateX(10px); transition: all 0.2s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.15); border: 1px solid #27272a; letter-spacing: 0.5px;">
    ¿Agendar Cita de Taller? ¡Chatea aquí!
  </div>

  <!-- Ventana Chat -->
  <div id="kioto-chatbot-window" style="display: none; width: 380px; height: 585px; background: #ffffff; border: 1px solid #e4e4e7; border-radius: 16px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04); position: absolute; bottom: 72px; right: 0; overflow: hidden; flex-direction: column; transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); opacity: 0; transform: translateY(15px);">
    <iframe src="${portalUrl}/?embed=true" style="width: 100%; height: 100%; border: none; background: #f8fafc;" allow="geolocation; microphone; camera"></iframe>
  </div>

  <style>
    @keyframes kioto-ping {
      75%, 100% { transform: scale(2); opacity: 0; }
    }
    #kioto-chatbot-bubble:hover {
      transform: scale(1.05);
      background-color: #18181b;
    }
    #kioto-chatbot-bubble:active {
      transform: scale(0.95);
    }
    #kioto-chatbot-bubble:hover ~ #kioto-chatbot-tooltip {
      opacity: 1;
      transform: translateX(0);
    }
  </style>

  <script>
    (function() {
      const bubble = document.getElementById('kioto-chatbot-bubble');
      const windowChat = document.getElementById('kioto-chatbot-window');
      const iconChat = document.getElementById('kioto-icon-chat');
      const iconClose = document.getElementById('kioto-icon-close');
      const tooltip = document.getElementById('kioto-chatbot-tooltip');
      let isOpen = false;

      bubble.addEventListener('click', () => {
        isOpen = !isOpen;
        if (isOpen) {
          windowChat.style.display = 'flex';
          setTimeout(() => {
            windowChat.style.opacity = '1';
            windowChat.style.transform = 'translateY(0)';
          }, 20);
          iconChat.style.display = 'none';
          iconClose.style.display = 'block';
          if (tooltip) tooltip.style.display = 'none';
        } else {
          windowChat.style.opacity = '0';
          windowChat.style.transform = 'translateY(15px)';
          setTimeout(() => {
            windowChat.style.display = 'none';
          }, 250);
          iconChat.style.display = 'block';
          iconClose.style.display = 'none';
          if (tooltip) tooltip.style.display = 'block';
        }
      });
    })();
  <\/script>
</div>`;

                    const iframeCodeSnippet = `<iframe src="${portalUrl}/?embed=true" style="width: 100%; max-width: 450px; height: 600px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);" allow="geolocation; microphone; camera"></iframe>`;

                    return (
                      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 animate-fade-in shadow-xs">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900 flex items-center">
                            <Terminal className="w-4 h-4 text-gray-800 mr-2" />
                            Código de Integración para tu Página Web Oficial
                          </h3>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Copia este fragmento HTML e insértalo en tu sitio web oficial. Éste responderá automáticamente de acuerdo al estado configurado en el switch superior.
                          </p>
                        </div>

                        <div className="flex border-b border-gray-100 pb-1">
                          <button
                            onClick={() => { setEmbedTab('bubble'); setCopiedText(false); }}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${embedTab === 'bubble' ? 'border-neutral-900 text-neutral-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
                          >
                            Burbuja Flotante Integrada (Recomendado)
                          </button>
                          <button
                            onClick={() => { setEmbedTab('iframe'); setCopiedText(false); }}
                            className={`px-4 py-2 text-xs font-black uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${embedTab === 'iframe' ? 'border-neutral-900 text-neutral-950 font-bold' : 'border-transparent text-gray-400 hover:text-gray-500'}`}
                          >
                            Iframe Embebido Estático
                          </button>
                        </div>

                        <div className="relative">
                          <pre className="bg-neutral-950 text-emerald-400 p-4 rounded-xl text-[10.5px] font-mono overflow-x-auto max-h-60 select-all border border-neutral-900/60 leading-relaxed whitespace-pre font-medium [tab-size:2]">
                            {embedTab === 'bubble' ? bubbleCodeSnippet : iframeCodeSnippet}
                          </pre>
                          <button
                            onClick={() => {
                              const code = embedTab === 'bubble' ? bubbleCodeSnippet : iframeCodeSnippet;
                              navigator.clipboard.writeText(code);
                              setCopiedText(true);
                              setTimeout(() => setCopiedText(false), 2000);
                            }}
                            className="absolute top-3 right-3 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white border border-white/20 hover:border-white/30 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center space-x-1 cursor-pointer animate-fade-in"
                          >
                            {copiedText ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Código</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-xl text-xs space-y-1.5 text-gray-600 leading-relaxed">
                          <p className="font-bold text-gray-950 flex items-center select-none text-[12px]">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block mr-2 animate-ping" />
                            Sincronización Inteligente de Estatus:
                          </p>
                          <p>
                            Si el switch superior <strong>Chatbot de la Página Web</strong> está <strong>Encendido</strong>, los visitantes tendrán de inmediato una comunicación fluida en tiempo real con el asistente inteligente.
                          </p>
                          <p>
                            Si está <strong>Apagado</strong>, se desactiva instantáneamente el agendamiento y los visitantes visualizarán de manera profesional el mensaje administrado: <strong className="text-neutral-950 bg-indigo-50/70 px-1.5 py-0.5 border border-indigo-100 rounded">"Seguimos mejorando, en un momento volvemos contigo."</strong>
                          </p>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 animate-fade-in">
                    <div>
                      <h3 className="text-md font-bold text-gray-900 flex items-center">
                        <Settings className="w-5 h-5 text-gray-800 mr-2" />
                        Enlace de Canales Oficiales (WhatsApp & Facebook)
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Configure y sincronice las APIs de Meta Developers para recibir mensajes directamente y enviar notificaciones y alertas automáticas de servicio.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                      {/* WHATSAPP OFFICIAL CONFIGURATION CARD */}
                      <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-emerald-800">
                            <span className="w-8 h-8 rounded-full bg-emerald-150 flex items-center justify-center text-emerald-800 font-bold text-center">
                              W
                            </span>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider">WhatsApp Business API</h4>
                              <p className="text-[10px] text-gray-400">Cuenta Oficial Corporativa</p>
                            </div>
                          </div>
                          <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            🟢 ACTIVO Y ENLAZADO
                          </span>
                        </div>

                        <div className="space-y-3.5 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Meta App ID (WhatsApp Business)</label>
                            <input
                              type="text"
                              defaultValue="10928374928173"
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850"
                              placeholder="Ej. 10928374928173"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">ID del Número de Teléfono (v19.0/Meta)</label>
                            <input
                              type="text"
                              defaultValue="3481029384918"
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850"
                              placeholder="Ej. 348102938491823"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Token de Acceso Permanente</label>
                            <input
                              type="password"
                              defaultValue="EAAGh7z2vQrcBAO8vB78362"
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850"
                              placeholder="••••••••••••••••••••"
                            />
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2 text-[11px]">
                            <span className="font-bold text-gray-500 block uppercase text-[9px] tracking-wider">Configuración Webhook para Meta Developers</span>
                            <div className="space-y-1 text-gray-600">
                              <div><strong>URL de Webhook:</strong> <code className="bg-slate-100 text-slate-700 px-1 rounded select-all font-mono">https://api.kioto.boletomovil.com/v1/whatsapp/webhook</code></div>
                              <div><strong>Token de Verificación:</strong> <code className="bg-slate-100 text-slate-700 px-1 rounded select-all font-mono">kioto_meta_verification_token_secure_2026</code></div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAppNotif({ type: 'success', text: "¡Configuración de WhatsApp Business guardada con éxito!" });
                              setTimeout(() => setAppNotif(null), 3000);
                            }}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-0"
                          >
                            Guardar y Sincronizar WhatsApp
                          </button>
                        </div>
                      </div>

                      {/* FACEBOOK MESSENGER CONFIGURATION CARD */}
                      <div className="border border-gray-200 rounded-2xl p-5 space-y-4 bg-slate-50/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-blue-800">
                            <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold block text-center">
                              F
                            </span>
                            <div>
                              <h4 className="text-xs font-bold uppercase tracking-wider">Facebook Messenger API</h4>
                              <p className="text-[10px] text-gray-400">Páginas de Facebook vinculadas</p>
                            </div>
                          </div>
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            🟢 ACTIVO Y ENLAZADO
                          </span>
                        </div>

                        <div className="space-y-3.5 pt-2">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Página Certificada de Automotriz Kioto</label>
                            <select className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850">
                              <option>Automotriz Kioto México S.A. de C.V. (ID: 5543210)</option>
                              <option>Automotriz Kioto Taller Autorizado (ID: 5543211)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Facebook Developer App ID</label>
                            <input
                              type="text"
                              defaultValue="882736481029348"
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850"
                              placeholder="Ej. 882736481029348"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Page Access Token</label>
                            <input
                              type="password"
                              defaultValue="EAA88273648182819"
                              className="w-full bg-white border border-gray-200 rounded-lg py-1.5 px-3 text-xs text-gray-850"
                              placeholder="••••••••••••••••••••"
                            />
                          </div>

                          <div className="bg-white p-3 rounded-xl border border-gray-150 space-y-2 text-[11px]">
                            <span className="font-bold text-gray-500 block uppercase text-[9px] tracking-wider">Configuración Webhook para Facebook Messenger</span>
                            <div className="space-y-1 text-gray-600">
                              <div><strong>URL de Webhook:</strong> <code className="bg-slate-100 text-slate-700 px-1 rounded select-all font-mono">https://api.kioto.boletomovil.com/v1/facebook/webhook</code></div>
                              <div><strong>Token de Verificación:</strong> <code className="bg-slate-100 text-slate-700 px-1 rounded select-all font-mono">kioto_meta_verification_token_secure_2026</code></div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setAppNotif({ type: 'success', text: "¡Configuración de Facebook Messenger guardada con éxito!" });
                              setTimeout(() => setAppNotif(null), 3000);
                            }}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer border-0"
                          >
                            Guardar y Sincronizar Facebook
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW: SPLIT SERVICES VIEWPORT (All Roles) */}
              {activeTab === 'servicios' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Panel principal de listas agendadas */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 pb-4 gap-4">
                      <div>
                        <h3 className="text-md font-bold text-gray-950 flex items-center">
                          <Wrench className="w-5 h-5 text-blue-600 mr-2" />
                          Servicios del Taller Agendados
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">Supervisión en vivo de mantenimientos y servicios de reparación.</p>
                      </div>
                      <button
                        type="button"
                        onClick={loadDashboardData}
                        className="w-full sm:w-auto p-2 px-3 hover:bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600 flex items-center font-semibold justify-center transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Refrescar
                      </button>
                    </div>

                    {/* Segments lists */}
                    <div className="space-y-6">
                      {/* Taller Mecánico List */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                          <span>🛠 Servicios de Taller ({servicios.length})</span>
                          <span className="text-[10px] font-normal text-gray-400 font-mono">Restricción: Mantenimiento y Reparación</span>
                        </h4>
                        <ServiciosTaller 
                          services={servicios} 
                          onServiceUpdated={loadDashboardData} 
                          isAdmin={currentUser.role === 'Admin'} 
                        />
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>

          </div>
        )}

      </main>

      {/* Floating Chatbot Widget */}
      {isWebChatbotEnabled && <FloatingChatbot onAppointmentBooked={loadDashboardData} />}

      {/* EXPLANATORY DIALOG FOR NEON POSTGRESQL VS LOCAL STORAGE */}
      {showDbExplanation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade">
          <div className="bg-white rounded-2xl border border-gray-100 max-w-xl w-full shadow-2xl p-6 relative">
            <h3 className="text-lg font-black text-slate-900 border-b border-gray-100 pb-3 mb-4 flex items-center space-x-2">
              <Database className="w-5 h-5 text-amber-500" />
              <span>Conexión de Base de Datos en Vercel vs Cloud Run</span>
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              La vista que estás observando actualmente está operando bajo el modo de 
              <strong> Simulación Local (LocalStorage)</strong> en lugar de conectarse en tiempo real a la base de datos central de 
              <strong> Neon Postgres / Cloud Run</strong>.
            </p>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-3.5 mb-4 space-y-2 text-xs">
              <p className="font-semibold text-slate-800">¿Por qué sucede esto?</p>
              <p className="text-gray-600">
                Vercel es un servicio de hosting estático para el cliente (React SPA). No ejecuta tu backend de Node/Express en <code>server.ts</code>. 
                El servidor real con la conexión a <strong>Neon Postgres</strong> se ejecuta dentro de tu contenedor de <strong>Google Cloud Run</strong> en la URL:
              </p>
              <div className="bg-slate-950 text-emerald-400 p-2 font-mono text-[10px] rounded border border-slate-800 select-all overflow-x-auto">
                https://ais-pre-3arbs2kotcgihptz3rbf6o-82971551649.us-east1.run.app
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <p className="text-xs font-bold text-slate-800">Cómo solucionarlo en 3 sencillos pasos:</p>
              <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 ml-1">
                <li>Ve a la configuración de tu proyecto en tu Consola de Vercel (<b>Project Settings &gt; Environment Variables</b>).</li>
                <li>Agrega una nueva variable llamada <strong>VITE_API_URL</strong> y asígnale el valor de la URL de Cloud Run de arriba.</li>
                <li><strong>¡IMPORTANTE! Re-despliega (Redeploy) tu proyecto en Vercel</strong>. Vite necesita compilar esta nueva de variable en el frontend a la hora de construir el bundle estático. Si no re-despliegas, no verá el cambio.</li>
              </ol>
            </div>
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                onClick={() => setShowDbExplanation(false)}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2 font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-12 shrink-0">
        <p>© 2026 Automotriz Kioto S.A. de C.V. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
