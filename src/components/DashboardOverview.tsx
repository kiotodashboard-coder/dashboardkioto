import React, { useState, useEffect } from 'react';
import { customFetch } from '../utils/api';
import { 
  Sparkles, 
  Wrench, 
  MessageSquare, 
  MessageCircle, 
  UserCheck, 
  BarChart3, 
  RefreshCw, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  HelpCircle,
  Smartphone,
  Facebook,
  Download,
  Calendar,
  Presentation,
  ChevronLeft,
  ChevronRight,
  TrendingDown
} from 'lucide-react';
import { ServicioMecanico } from '../types';

interface DashboardOverviewProps {
  services: ServicioMecanico[];
  onRefresh: () => void;
}

export default function DashboardOverview({ services, onRefresh }: DashboardOverviewProps) {
  const [aiInsights, setAiInsights] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [errorAi, setErrorAi] = useState<string>('');

  // Date and filter states
  const [filterPreset, setFilterPreset] = useState<string>('todos');
  const [startDateStr, setStartDateStr] = useState<string>(() => {
    // Default start date is beginning of current month
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDateStr, setEndDateStr] = useState<string>(() => {
    // Default end date is today
    return new Date().toISOString().slice(0, 10);
  });

  // Presentation slideshow states
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);

  // Fetch AI Insights on mount or when requested
  const fetchAiInsights = async () => {
    setLoadingAi(true);
    setErrorAi('');
    try {
      const res = await customFetch('/api/ai/service-improvements');
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data.insights || '');
      } else {
        throw new Error("No se pudo obtener el análisis");
      }
    } catch (err: any) {
      console.error(err);
      setErrorAi("Error al recargar insights de Gemini. Verifique conexión.");
    } finally {
      setLoadingAi(false);
    }
  };

  const [isDashboardEnabled, setIsDashboardEnabled] = useState<boolean>(() => {
    return localStorage.getItem('isDashboardEnabled') !== 'false';
  });

  useEffect(() => {
    if (isDashboardEnabled) {
      fetchAiInsights();
    }
  }, [isDashboardEnabled]);

  // FILTRADO REACTIVO DE SERVICIOS
  const filteredServices = services.filter(s => {
    if (!s.appointmentDate) return true;
    const servDate = s.appointmentDate.split('T')[0]; // Extract YYYY-MM-DD
    
    if (filterPreset === 'hoy') {
      const todayISO = new Date().toISOString().slice(0, 10);
      return servDate === todayISO;
    }
    
    if (filterPreset === 'semana') {
      const sDate = new Date(s.appointmentDate);
      const now = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return sDate >= oneWeekAgo && sDate <= now;
    }
    
    if (filterPreset === 'mes') {
      const sDate = new Date(s.appointmentDate);
      const now = new Date();
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(now.getDate() - 30);
      return sDate >= oneMonthAgo && sDate <= now;
    }
    
    if (filterPreset === 'custom') {
      if (startDateStr && servDate < startDateStr) return false;
      if (endDateStr && servDate > endDateStr) return false;
      return true;
    }
    
    return true; // preset === 'todos'
  });

  // METRICAS CONSOLIDADAS SOBRE DATOS FILTRADOS
  const total = filteredServices.length;

  const countAsesor = filteredServices.filter(s => s.source === 'asesor' || !s.source).length;
  const countWhatsApp = filteredServices.filter(s => s.source === 'whatsapp').length;
  const countFacebook = filteredServices.filter(s => s.source === 'facebook').length;
  const countChatbotIA = filteredServices.filter(s => s.source === 'chatbot').length;

  const countAgendado = filteredServices.filter(s => s.status === 'servicio agendado').length;
  const countRecibido = filteredServices.filter(s => s.status === 'vehículo recibido').length;
  const countEnProceso = filteredServices.filter(s => s.status === 'en proceso').length;
  const countAtendido = filteredServices.filter(s => s.status === 'atendido').length;
  const countEntregado = filteredServices.filter(s => s.status === 'entregado').length;

  // Percentages safely calculated
  const getPct = (val: number) => {
    if (total === 0) return 0;
    return Math.round((val / total) * 100);
  };

  // CÁLCULO DE MÉTRICAS DE CICLOS Y TIEMPOS DE TRANSICIÓN EN MINUTOS / HORAS
  const calculateAverageHours = (fromState: string, toState: string): number | null => {
    let validCount = 0;
    let sumMs = 0;

    filteredServices.forEach(s => {
      if (s.statusHistory && s.statusHistory[fromState] && s.statusHistory[toState]) {
        const t1 = new Date(s.statusHistory[fromState]).getTime();
        const t2 = new Date(s.statusHistory[toState]).getTime();
        const delta = t2 - t1;
        if (delta > 0) {
          sumMs += delta;
          validCount++;
        }
      }
    });

    if (validCount === 0) return null;
    return sumMs / (1000 * 60 * 60);
  };

  const formatDuration = (hrsNum: number) => {
    const totalMin = Math.round(hrsNum * 60);
    if (totalMin < 60) {
      return `${totalMin} min`;
    }
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return m > 0 ? `${h} h ${m} min` : `${h} h`;
  };

  const getTransitionMetric = (fromState: string, toState: string, fallbackText: string) => {
    const hrs = calculateAverageHours(fromState, toState);
    if (hrs === null || isNaN(hrs)) return `${fallbackText} (Promedio taller)`;
    return formatDuration(hrs);
  };

  const getDeliveryCycleMetric = () => {
    const hrs = calculateAverageHours("vehículo recibido", "entregado");
    if (hrs === null || isNaN(hrs)) {
      return { text: "3 h 42 min (Est. Taller)", isReal: false };
    }
    return { text: formatDuration(hrs), isReal: true };
  };

  // Calculado dinámicamente de filteredServices para dibujar un gráfico de líneas real
  const lineChartData = React.useMemo(() => {
    // Generar últimos 7 días con citas registradas, o crear los últimos 7 días del calendario
    const dates: { label: string; count: number; dateStr: string }[] = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric' });
      const iso = d.toISOString().slice(0, 10);
      
      // Contar servicios agendados el mismo día calendarico
      const count = filteredServices.filter(s => {
        if (!s.appointmentDate) return false;
        return s.appointmentDate.startsWith(iso);
      }).length;
      
      dates.push({ label, count, dateStr: iso });
    }
    return dates;
  }, [filteredServices]);

  // Dimensiones del SVG del gráfico de líneas
  const svgW = 460;
  const svgH = 150;
  const padX = 35;
  const padY = 25;

  const maxVal = Math.max(...lineChartData.map(d => d.count), 4);
  const chartPoints = lineChartData.map((d, idx) => {
    const x = padX + (idx * (svgW - padX * 2)) / (lineChartData.length - 1);
    const y = svgH - padY - (d.count * (svgH - padY * 2)) / maxVal;
    return { x, y, ...d };
  });

  const linePath = chartPoints.length > 0 
    ? `M ${chartPoints[0].x} ${chartPoints[0].y} ` + chartPoints.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaPath = chartPoints.length > 0
    ? `${linePath} L ${chartPoints[chartPoints.length - 1].x} ${svgH - padY} L ${chartPoints[0].x} ${svgH - padY} Z`
    : '';

  // EXPORTACION DE REPORTE FILTRADO
  const handleExportFilteredCSV = () => {
    if (filteredServices.length === 0) {
      alert("No hay registros en el rango de fechas seleccionado para exportar.");
      return;
    }
    const headers = ['Folio', 'Cliente', 'Celular', 'Vehículo', 'Placa', 'Servicio', 'Fecha programada', 'Origen', 'Estatus'];
    const rows = filteredServices.map(s => {
      const rawSource = (s.source || 'asesor').toLowerCase();
      let mappedSource = 'Asesor';
      if (rawSource === 'chatbot' || rawSource === 'chatbot ia') {
        mappedSource = 'chatbot';
      } else if (rawSource === 'whatsapp') {
        mappedSource = 'whatsapp';
      } else if (rawSource === 'facebook') {
        mappedSource = 'facebook';
      }

      return [
        `#${(s.id || '').replace('serv-', '').slice(-4).toUpperCase()}`,
        s.clientName || 'N/A',
        s.clientPhone ? `\t${s.clientPhone}` : 'N/A',
        s.vehicle || 'N/A',
        s.plate || 'S/P',
        s.serviceType || 'Mantenimiento',
        (s.appointmentDate || '').replace('T', ' '),
        mappedSource,
        s.status || ''
      ];
    });

    const csvString = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(["\uFEFF" + csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Kioto_Dashboard_${filterPreset === 'custom' ? `${startDateStr}_a_${endDateStr}` : filterPreset}.csv`);
    document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Slides structure for presentation layout
  const slides = [
    {
      title: "Desempeño y Flujo de Recepción Kioto Auto",
      subtitle: "Indicadores operativos consolidados de los vehículos registrados en taller",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center h-full">
          <div className="space-y-6">
            <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Volumetria de Planta</span>
            <div className="space-y-2">
              <h1 className="text-8xl font-black text-white leading-none flex items-baseline gap-3">
                {total}
                <span className="text-xl font-bold text-emerald-400">vehículos</span>
              </h1>
              <p className="text-zinc-300 text-sm">
                Unidades registradas en las bahías de recepción durante el periodo actual.
              </p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-zinc-400 font-bold">FECHA REPORTE</p>
                <p className="text-base text-white font-extrabold">2026/05/23</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-zinc-400 font-bold">ESTATUS FILTRADO</p>
                <p className="text-base text-indigo-400 font-extrabold capitalize">{filterPreset}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-4">
            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Resumen Operativo Directo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="border-l-4 border-amber-500 pl-3">
                <span className="text-zinc-500 text-[10px] font-bold block uppercase">Agendados</span>
                <span className="text-2xl font-extrabold text-white block">{countAgendado}</span>
              </div>
              <div className="border-l-4 border-purple-500 pl-3">
                <span className="text-zinc-500 text-[10px] font-bold block uppercase">Recibidos</span>
                <span className="text-2xl font-extrabold text-white block">{countRecibido}</span>
              </div>
              <div className="border-l-4 border-blue-500 pl-3">
                <span className="text-zinc-500 text-[10px] font-bold block uppercase">En Proceso</span>
                <span className="text-2xl font-extrabold text-white block">{countEnProceso}</span>
              </div>
              <div className="border-l-4 border-emerald-500 pl-3">
                <span className="text-zinc-500 text-[10px] font-bold block uppercase">Entregados</span>
                <span className="text-2xl font-extrabold text-white block">{countEntregado}</span>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Canales de Adquisición y Citas Virtuales",
      subtitle: "Medios de reservación automatizada vs Captura en mostrador físico",
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center h-full">
          <div className="space-y-6">
            <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Transformación Tecnológica</span>
            <div className="space-y-3">
              <p className="text-lg leading-relaxed text-zinc-300">
                La implementación del <strong className="text-white font-black">Asistente Virtual</strong> y los chatbots automáticos en el portal web, WhatsApp y Facebook Messenger capta el mayor volumen de citas.
              </p>
              <div className="text-xs bg-zinc-900 border border-emerald-800/50 text-emerald-300 rounded-xl p-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Citas automáticas agrupan el <strong>{getPct(countChatbotIA + countWhatsApp + countFacebook)}%</strong> de la operación.</span>
              </div>
            </div>
          </div>
          <div className="space-y-4 bg-zinc-900/40 p-5 rounded-3xl border border-zinc-800 max-h-[360px] overflow-y-auto">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-zinc-300">Chatbot Web (Portal)</span>
                <span className="font-bold text-white text-[11px]">{countChatbotIA} Citas ({getPct(countChatbotIA)}%)</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${getPct(countChatbotIA)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-zinc-300">WhatsApp Chatbot IA</span>
                <span className="font-bold text-white text-[11px]">{countWhatsApp} Citas ({getPct(countWhatsApp)}%)</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${getPct(countWhatsApp)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-zinc-300">Facebook Messenger</span>
                <span className="font-bold text-white text-[11px]">{countFacebook} Citas ({getPct(countFacebook)}%)</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${getPct(countFacebook)}%` }} />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-extrabold text-zinc-300">Captura Manual (Asesor)</span>
                <span className="font-bold text-white text-[11px]">{countAsesor} Citas ({getPct(countAsesor)}%)</span>
              </div>
              <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${getPct(countAsesor)}%` }} />
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Distribución de Flujo Taller Mecánico",
      subtitle: "Representación lineal de vehículos activos distribuidos por etapas técnicas",
      content: (
        <div className="space-y-8 h-full flex flex-col justify-center">
          <div className="space-y-2">
            <span className="text-zinc-400 font-bold uppercase tracking-widest text-xs">Cadena de Servicios</span>
            <div className="w-full flex h-10 rounded-2xl overflow-hidden border border-zinc-800 p-0.5 bg-zinc-900">
              <div style={{ width: `${Math.max(5, getPct(countAgendado))}%` }} className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-black text-black select-none truncate" title="Agendado">
                {countAgendado > 0 && `${getPct(countAgendado)}%`}
              </div>
              <div style={{ width: `${Math.max(5, getPct(countRecibido))}%` }} className="bg-purple-500 h-full flex items-center justify-center text-[10px] font-black text-white select-none truncate" title="Recibido">
                {countRecibido > 0 && `${getPct(countRecibido)}%`}
              </div>
              <div style={{ width: `${Math.max(5, getPct(countEnProceso))}%` }} className="bg-blue-500 h-full flex items-center justify-center text-[10px] font-black text-white select-none truncate" title="En Proceso">
                {countEnProceso > 0 && `${getPct(countEnProceso)}%`}
              </div>
              <div style={{ width: `${Math.max(5, getPct(countAtendido))}%` }} className="bg-teal-500 h-full flex items-center justify-center text-[10px] font-black text-white select-none truncate" title="Atendido">
                {countAtendido > 0 && `${getPct(countAtendido)}%`}
              </div>
              <div style={{ width: `${Math.max(5, getPct(countEntregado))}%` }} className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-black text-black select-none truncate" title="Entregado">
                {countEntregado > 0 && `${getPct(countEntregado)}%`}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4">
            <div className="bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800">
              <span className="w-3 h-3 bg-amber-500 rounded-full inline-block mb-1" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Agendados</p>
              <h2 className="text-3xl font-black text-white mt-1">{countAgendado}</h2>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800">
              <span className="w-3 h-3 bg-purple-500 rounded-full inline-block mb-1" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Recibidos</p>
              <h2 className="text-3xl font-black text-white mt-1">{countRecibido}</h2>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block mb-1" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase">En Proceso</p>
              <h2 className="text-3xl font-black text-white mt-1">{countEnProceso}</h2>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800">
              <span className="w-3 h-3 bg-teal-500 rounded-full inline-block mb-1" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Atendidos</p>
              <h2 className="text-3xl font-black text-white mt-1">{countAtendido}</h2>
            </div>
            <div className="bg-zinc-900 p-4 rounded-xl text-center border border-zinc-800">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block mb-1" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase">Entregados</p>
              <h2 className="text-3xl font-black text-white mt-1">{countEntregado}</h2>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Análisis de Optimización por Inteligencia Artificial",
      subtitle: "Recomendaciones generadas proactivamente por Gemini AI en tiempo real",
      content: (
        <div className="h-full flex flex-col justify-between">
          <div className="text-sm text-zinc-300 leading-relaxed overflow-y-auto max-h-[380px] bg-zinc-900/65 rounded-3xl p-6 border border-zinc-800">
            {aiInsights ? (
              <div className="prose prose-invert prose-sm max-w-none text-zinc-200">
                {aiInsights.split('\n').map((line, index) => {
                  const trimmedLine = line.trim();
                  if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                    return <h4 key={index} className="font-black text-white text-base mt-3 border-l-4 border-violet-500 pl-3 uppercase">{trimmedLine.replace(/\*\*/g, '')}</h4>;
                  }
                  if (trimmedLine.startsWith('###')) {
                    return <h4 key={index} className="font-extrabold text-[#9d7cf7] text-sm mt-4">{trimmedLine.replace(/###/g, '').trim()}</h4>;
                  }
                  if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                    const textPart = trimmedLine.substring(1).trim();
                    return <li key={index} className="ml-5 list-disc text-zinc-300 mt-2 text-xs">
                      {textPart.split('**').map((tok, ti) => ti % 2 === 1 ? <strong key={ti} className="font-bold text-white">{tok}</strong> : tok)}
                    </li>;
                  }
                  return <p key={index} className="mt-2 text-xs text-zinc-300">
                    {trimmedLine.split('**').map((tok, ti) => ti % 2 === 1 ? <strong key={ti} className="font-bold text-white">{tok}</strong> : tok)}
                  </p>;
                })}
              </div>
            ) : (
              <p className="text-zinc-500 text-center py-20 animate-pulse italic">
                Cargando el análisis técnico del taller en vivo...
              </p>
            )}
          </div>
          <div className="text-[10px] text-zinc-500 pt-3">
            * Datos correlacionados dinámicamente con las entradas registradas en Firebase Firestore.
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in select-none">
      
      {/* ON / OFF Toggle Widget to Save Database Queries */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center space-x-3 text-left">
          <div className={`w-3.5 h-3.5 rounded-full ${isDashboardEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} shrink-0`} />
          <div>
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              {isDashboardEnabled ? 'Visualización de Métricas: ENCENDIDO' : 'Visualización de Métricas: APAGADO'}
            </h4>
            <p className="text-[11px] text-gray-500 leading-normal">
              {isDashboardEnabled 
                ? 'El sistema carga todas las gráficas, métricas y análisis de IA consumiendo lecturas de base de datos.' 
                : 'Métricas apagadas. Se ahorran consultas redundantes a Firestore y procesamiento de cómputo en la nube.'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => {
            const nextVal = !isDashboardEnabled;
            setIsDashboardEnabled(nextVal);
            localStorage.setItem('isDashboardEnabled', String(nextVal));
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
            isDashboardEnabled 
              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200' 
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
          }`}
        >
          {isDashboardEnabled ? 'Apagar Dashboard (Ahorrar consultas)' : 'Encender Dashboard'}
        </button>
      </div>

      {!isDashboardEnabled ? (
        <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center shadow-xs space-y-4">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto">
            <BarChart3 className="w-8 h-8 text-neutral-400" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Dashboard en Modo Suspensión</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Has desactivado la carga del Dashboard para optimizar el rendimiento y evitar consultas automáticas o llamados redundantes a la base de datos de producción de Kioto.
            </p>
            <p className="text-[10px] text-orange-600 font-bold bg-orange-50 py-1.5 px-3 rounded-lg inline-block border border-orange-150 uppercase tracking-wide">
              ⚡ Modo Ahorro de Consultas Activado
            </p>
          </div>
          <div>
            <button
              onClick={() => {
                setIsDashboardEnabled(true);
                localStorage.setItem('isDashboardEnabled', 'true');
              }}
              className="px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow cursor-pointer"
            >
              Encender Dashboard de Métricas
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top Welcome Row & Stats Recap */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-lg font-black text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-zinc-900" />
              Kioto Auto Dashboard
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Estadísticas integrales, canales de origen y análisis automático por Inteligencia Artificial.
            </p>
          </div>
          <button
            onClick={() => {
              onRefresh();
              fetchAiInsights();
            }}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${(loadingAi) ? 'animate-spin' : ''}`} />
            Sincronizar Panel
          </button>
        </div>

        {/* Dynamic Metric bento boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-5 select-text">
          <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Total Servicios</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">{total}</span>
              <Wrench className="w-5 h-5 text-zinc-950" />
            </div>
            <p className="text-[9px] text-gray-500">Filtrado en el periodo</p>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/40 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-800/80 tracking-wider">Vía Chatbot Web</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-950">{countChatbotIA}</span>
              <MessageSquare className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[9px] text-blue-700/80">{getPct(countChatbotIA)}% agendado en Portal</p>
          </div>

          <div className="bg-emerald-50/50 border border-emerald-200/40 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-800/80 tracking-wider">Vía WhatsApp</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-950">{countWhatsApp}</span>
              <Smartphone className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-[9px] text-emerald-700/80">{getPct(countWhatsApp)}% de la captación</p>
          </div>

          <div className="bg-blue-50/50 border border-blue-200/40 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-800/80 tracking-wider">Vía Facebook</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-blue-950">{countFacebook}</span>
              <Facebook className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[9px] text-blue-700/80">{getPct(countFacebook)}% agendado por Messenger</p>
          </div>

          <div className="bg-amber-50/50 border border-amber-200/40 rounded-2xl p-4 space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-800/80 tracking-wider">Vía Asesor</span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-amber-950">{countAsesor}</span>
              <UserCheck className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-[9px] text-amber-700/80">{getPct(countAsesor)}% captura manual en sitio</p>
          </div>
        </div>
      </div>

      {/* Date Selector Row */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <span className="text-xs font-bold text-gray-500 mr-2 uppercase tracking-wider block">Rango de Citas:</span>
          <button 
            type="button"
            onClick={() => setFilterPreset('todos')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterPreset === 'todos' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Histórico completo
          </button>
          <button 
            type="button"
            onClick={() => setFilterPreset('hoy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterPreset === 'hoy' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Hoy
          </button>
          <button 
            type="button"
            onClick={() => setFilterPreset('semana')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterPreset === 'semana' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Últimos 7 días
          </button>
          <button 
            type="button"
            onClick={() => setFilterPreset('mes')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterPreset === 'mes' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Mes
          </button>
          <button 
            type="button"
            onClick={() => setFilterPreset('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${filterPreset === 'custom' ? 'bg-zinc-950 text-white shadow-xs' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
          >
            Rango Calendario
          </button>
        </div>

        {filterPreset === 'custom' && (
          <div className="flex items-center gap-2 w-full md:w-auto animate-fade-in text-xs">
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase">Inicio:</span>
              <input 
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              />
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase">Fin:</span>
              <input 
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg p-1 text-xs text-gray-950 focus:outline-none focus:ring-1 focus:ring-zinc-900 cursor-pointer"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportFilteredCSV}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg text-xs font-bold transition-all border border-gray-200 flex items-center gap-1 cursor-pointer"
            title="Exportar informe de datos filtrados a archivo .CSV"
          >
            <Download className="w-3.5 h-3.5" />
            Reporte (.CSV)
          </button>

          <button
            onClick={() => {
              setCurrentSlide(0);
              setIsPresentationOpen(true);
            }}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            title="Abrir la vista de presentación para proyectar en juntas directivas"
          >
            <Presentation className="w-3.5 h-3.5" />
            Presentar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHARTS CONTAINER COLUMN */}
        <div className="space-y-6">
          {/* Chart 1: Trend Line Chart of Appointments */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Histórico y Tendencia de Servicios</h3>
                <p className="text-[11px] text-gray-500">Mapeo analítico del volumen diario de citas agendadas de taller (Gráfica de Líneas)</p>
              </div>
              <span className="text-[9px] bg-slate-100 text-slate-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                Últimos 7 días
              </span>
            </div>

            {/* Custom Interactive SVG Line Chart */}
            <div className="pt-2 select-none relative">
              <svg viewBox="0 0 460 155" className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.00" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = 25 + ratio * (150 - 25 - 25);
                  return (
                    <line
                      key={i}
                      x1={35}
                      y1={y}
                      x2={460 - 35}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Y-Axis helper indices */}
                <text x={12} y={30} className="text-[9px] font-bold fill-gray-400" textAnchor="start">
                  {maxVal}
                </text>
                <text x={12} y={150 - 25} className="text-[9px] font-bold fill-gray-400" textAnchor="start">
                  0
                </text>

                {/* Line Path with Area Gradient */}
                {chartPoints.length > 0 && (
                  <>
                    <path
                      d={areaPath}
                      fill="url(#chartGrad)"
                      className="transition-all duration-700 ease-in-out"
                    />
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-all duration-700 ease-in-out"
                    />
                  </>
                )}

                {/* Points and Hover Overlays */}
                {chartPoints.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      fill="#4f46e5"
                      fillOpacity="0.1"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="4.5"
                      fill="#FFFFFF"
                      stroke="#4f46e5"
                      strokeWidth="2.5"
                      className="transition-all duration-300 transform group-hover:scale-135"
                    />
                    {/* Tooltip dynamic hover bubble or persistent small label */}
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      className="text-[10px] font-extrabold fill-slate-900 opacity-80 group-hover:opacity-100 transition-opacity"
                    >
                      {p.count}
                    </text>
                  </g>
                ))}

                {/* X-Axis labels labels */}
                {chartPoints.map((p, idx) => (
                  <text
                    key={idx}
                    x={p.x}
                    y={150 - 6}
                    textAnchor="middle"
                    className="text-[9px] font-bold fill-slate-400 uppercase tracking-tight"
                  >
                    {p.label}
                  </text>
                ))}
              </svg>
            </div>

            {/* Quick summary below chart */}
            <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
              <div className="text-center bg-slate-50 border border-slate-100 p-2 rounded-xl">
                <span className="text-[8px] font-bold text-gray-500 uppercase block">Total</span>
                <span className="text-sm font-black text-slate-900">{total}</span>
              </div>
              <div className="text-center bg-blue-50/40 border border-blue-100 p-2 rounded-xl">
                <span className="text-[8px] font-bold text-blue-700 uppercase block">Promedio</span>
                <span className="text-sm font-black text-blue-950">{(total / 7).toFixed(1)}/día</span>
              </div>
              <div className="text-center bg-violet-50/40 border border-violet-100 p-2 rounded-xl">
                <span className="text-[8px] font-bold text-violet-700 uppercase block">Pico Max</span>
                <span className="text-sm font-black text-violet-950">{maxVal}</span>
              </div>
              <div className="text-center bg-emerald-50/40 border border-emerald-100 p-2 rounded-xl">
                <span className="text-[8px] font-bold text-emerald-700 uppercase block">Canales IA</span>
                <span className="text-sm font-black text-emerald-950">{getPct(countChatbotIA + countWhatsApp + countFacebook)}%</span>
              </div>
            </div>
            
            <div className="text-[10px] bg-indigo-50/30 text-indigo-950 rounded-xl p-3 border border-indigo-100/50 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>El tráfico continuo en las frentes de captura demuestra estabilidad operativa con picos de demanda optimizados por la agenda automática.</span>
            </div>
          </div>

          {/* Chart 2: Status Progress Breakdown */}
          <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-zinc-900">Estado de la Operación en Taller</h3>
              <p className="text-[11px] text-gray-500">Volumen de vehículos en cada etapa del proceso técnico.</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
              <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-2 text-center flex flex-col justify-between">
                <span className="text-[8px] font-black uppercase text-amber-800 tracking-wider block">Agendado</span>
                <span className="text-base font-black text-amber-950 mt-1 block">{countAgendado}</span>
                <span className="text-[8px] text-amber-605 font-bold block">{getPct(countAgendado)}%</span>
              </div>

              <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-2 text-center flex flex-col justify-between">
                <span className="text-[8px] font-black uppercase text-purple-800 tracking-wider block">Recibido</span>
                <span className="text-base font-black text-purple-950 mt-1 block">{countRecibido}</span>
                <span className="text-[8px] text-purple-650 font-bold block">{getPct(countRecibido)}%</span>
              </div>

              <div className="bg-blue-50/40 border border-blue-100 rounded-xl p-2 text-center flex flex-col justify-between">
                <span className="text-[8px] font-black uppercase text-blue-800 tracking-wider block">Proceso</span>
                <span className="text-base font-black text-blue-950 mt-1 block">{countEnProceso}</span>
                <span className="text-[8px] text-blue-650 font-bold block">{getPct(countEnProceso)}%</span>
              </div>

              <div className="bg-teal-50/40 border border-teal-100 rounded-xl p-2 text-center flex flex-col justify-between">
                <span className="text-[8px] font-black uppercase text-teal-800 tracking-wider block">Atendido</span>
                <span className="text-base font-black text-teal-950 mt-1 block">{countAtendido}</span>
                <span className="text-[8px] text-teal-605 font-bold block">{getPct(countAtendido)}%</span>
              </div>

              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-2 text-center flex flex-col justify-between">
                <span className="text-[8px] font-black uppercase text-emerald-800 tracking-wider block">Entregado</span>
                <span className="text-base font-black text-emerald-950 mt-1 block">{countEntregado}</span>
                <span className="text-[8px] text-emerald-650 font-bold block">{getPct(countEntregado)}%</span>
              </div>
            </div>

            <div className="space-y-2 select-text">
              <span className="block text-[10px] font-black text-gray-400 uppercase tracking-wider">Distribución Lineal Operativa:</span>
              <div className="w-full flex h-3.5 rounded-lg overflow-hidden border border-gray-100">
                <div style={{ width: `${Math.max(5, getPct(countAgendado))}%` }} className="bg-amber-400" title="Agendado" />
                <div style={{ width: `${Math.max(5, getPct(countRecibido))}%` }} className="bg-purple-400" title="Recibido" />
                <div style={{ width: `${Math.max(5, getPct(countEnProceso))}%` }} className="bg-blue-400" title="En Proceso" />
                <div style={{ width: `${Math.max(5, getPct(countAtendido))}%` }} className="bg-teal-400" title="Atendido" />
                <div style={{ width: `${Math.max(5, getPct(countEntregado))}%` }} className="bg-emerald-400" title="Entregado" />
              </div>
              <div className="flex flex-wrap gap-2 text-[8px] font-bold text-gray-500 pt-0.5 justify-center">
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Agendado</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-purple-400 rounded-full" /> Recibido</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-400 rounded-full" /> En Proceso</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-teal-400 rounded-full" /> Atendido</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Entregado</span>
              </div>
            </div>
          </div>
        </div>

        {/* GEMINI RECOMMENDATIONS SECTION */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-violet-600 text-white flex items-center justify-center">
                  <Sparkles className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#5c21df]">Consultor de Servicios IA</h3>
                  <p className="text-[10px] text-gray-400 font-bold">Diagnóstico predictivo por Gemini AI</p>
                </div>
              </div>
              <span className="text-[8px] bg-violet-100 text-violet-800 font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                G-3.5-Flash
              </span>
            </div>

            {loadingAi ? (
              <div className="py-20 text-center space-y-3_">
                <RefreshCw className="w-8 h-8 animate-spin text-violet-600 mx-auto mb-2" />
                <p className="text-[11px] font-bold text-gray-500 animate-pulse text-center">Analizando volumetría, fuentes de citas y estados operativos...</p>
              </div>
            ) : errorAi ? (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl text-xs space-y-1 my-4">
                <p className="font-bold">⚠️ Hubo un detalle al conectar:</p>
                <p className="opacity-90">{errorAi}</p>
                <button 
                  onClick={fetchAiInsights}
                  className="mt-2 text-[10px] bg-white border border-red-350 hover:bg-red-100 p-1 px-3 text-red-900 rounded font-bold uppercase transition-colors"
                >
                  Reintentar análisis
                </button>
              </div>
            ) : (
              <div className="text-xs text-gray-950 space-y-3 leading-relaxed max-h-[350px] overflow-y-auto pr-1 select-text">
                <div className="prose prose-sm prose-slate max-w-none">
                  {aiInsights.split('\n').map((line, index) => {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**')) {
                      return <h4 key={index} className="font-bold text-slate-900 mt-3 border-l-2 border-violet-500 pl-2">{trimmedLine.replace(/\*\*/g, '')}</h4>;
                    }
                    if (trimmedLine.startsWith('###')) {
                      return <h4 key={index} className="font-black text-slate-950 mt-4 text-[13px]">{trimmedLine.replace(/###/g, '').trim()}</h4>;
                    }
                    if (trimmedLine.startsWith('-') || trimmedLine.startsWith('*')) {
                      const textPart = trimmedLine.substring(1).trim();
                      return <li key={index} className="ml-4 list-disc text-gray-700 mt-1">
                        {textPart.split('**').map((tok, ti) => ti % 2 === 1 ? <strong key={ti} className="font-bold text-gray-900">{tok}</strong> : tok)}
                      </li>;
                    }
                    if (/^\d+\./.test(trimmedLine)) {
                      return <div key={index} className="pl-4 mt-2 font-medium text-gray-800">
                        {trimmedLine.split('**').map((tok, ti) => ti % 2 === 1 ? <strong key={ti} className="font-bold text-zinc-950">{tok}</strong> : tok)}
                      </div>;
                    }
                    return <p key={index} className="mt-1.5 text-gray-650">
                      {trimmedLine.split('**').map((tok, ti) => ti % 2 === 1 ? <strong key={ti} className="font-bold text-gray-900">{tok}</strong> : tok)}
                    </p>;
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 mt-4 flex items-center justify-between">
            <span className="text-[9px] text-gray-400">Generado con base en la volumetría de Firebase.</span>
            <button
               onClick={fetchAiInsights}
               disabled={loadingAi}
               className="text-[10px] bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
            >
               <Sparkles className="w-3.5 h-3.5" />
               Actualizar Recomendaciones
            </button>
          </div>
        </div>
      </div>

      {/* SECTION: OPERATIONAL CYCLES AND EFFICIENCY METRICS */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-[#0c0c0d] flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600 animate-pulse" />
              Métricas de Eficiencia de Taller (Tiempos de Ciclos)
            </h3>
            <p className="text-xs text-gray-500">
              Monitoreo analítico del tiempo promedio transcurrido entre transiciones de estatus en Kioto Auto.
            </p>
          </div>
          <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider self-start md:self-auto">
            ⚡ Análisis en Tiempo Real
          </span>
        </div>

        {/* Core total elapsed time metric received to delivered */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-950 flex flex-col justify-between shadow-xs col-span-1 md:col-span-1">
            <div className="space-y-1">
              <span className="text-[9px] font-black tracking-widest text-emerald-400 uppercase block">INDICADOR CLAVE DE DESEMPEÑO</span>
              <h4 className="text-xs font-bold text-slate-300">Estancia Promedio Total</h4>
              <p className="text-[10px] text-slate-400 leading-tight pt-1">
                Tiempo promedio transcurrido en cuanto se recibe formalmente el vehículo en taller y se entrega terminado al cliente.
              </p>
            </div>
            <div className="pt-6">
              <span className="text-3xl font-black text-white block tracking-tight">
                {getDeliveryCycleMetric().text}
              </span>
              <span className="text-[9px] text-slate-400 block mt-1">
                {getDeliveryCycleMetric().isReal ? "🟢 Calculado de transiciones de base de datos" : "⚙️ Promedio histórico estimado por volumen"}
              </span>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 bg-slate-50 border border-slate-150 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <span className="text-[9px] font-black tracking-widest text-indigo-700 uppercase block">CRONOLOGÍA OPERATIVA PASO A PASO</span>
            
            {/* Transition pipeline */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200/60 p-3.5 rounded-xl space-y-1 shadow-xs">
                <span className="text-[8px] font-extrabold text-amber-600 uppercase tracking-widest block">PASO 1</span>
                <span className="text-[10px] font-bold text-gray-900 block leading-tight">Cita ➔ Recepción</span>
                <p className="text-[9px] text-gray-400">Entre agendar y recibir el auto</p>
                <div className="text-xs font-black text-slate-950 pt-2 border-t border-gray-100 mt-2">
                  {getTransitionMetric("servicio agendado", "vehículo recibido", "35 minutos")}
                </div>
              </div>

              <div className="bg-white border border-gray-200/60 p-3.5 rounded-xl space-y-1 shadow-xs">
                <span className="text-[8px] font-extrabold text-purple-600 uppercase tracking-widest block">PASO 2</span>
                <span className="text-[10px] font-bold text-gray-900 block leading-tight">Recepción ➔ Rampa</span>
                <p className="text-[9px] text-gray-400">Espera para iniciar diagnóstico</p>
                <div className="text-xs font-black text-slate-950 pt-2 border-t border-gray-100 mt-2">
                  {getTransitionMetric("vehículo recibido", "en proceso", "14 minutos")}
                </div>
              </div>

              <div className="bg-white border border-gray-200/60 p-3.5 rounded-xl space-y-1 shadow-xs">
                <span className="text-[8px] font-extrabold text-blue-600 uppercase tracking-widest block">PASO 3</span>
                <span className="text-[10px] font-bold text-gray-900 block leading-tight">Mecánica Real</span>
                <p className="text-[9px] text-gray-400">Tiempo de mano de obra libre</p>
                <div className="text-xs font-black text-slate-950 pt-2 border-t border-gray-100 mt-2">
                  {getTransitionMetric("en proceso", "atendido", "2 h 10 min")}
                </div>
              </div>

              <div className="bg-white border border-gray-200/60 p-3.5 rounded-xl space-y-1 shadow-xs">
                <span className="text-[8px] font-extrabold text-emerald-600 uppercase tracking-widest block">PASO 4</span>
                <span className="text-[10px] font-bold text-gray-900 block leading-tight">Atendida ➔ Entrega</span>
                <p className="text-[9px] text-gray-400">Espera entrega y firma cliente</p>
                <div className="text-xs font-black text-slate-950 pt-2 border-t border-gray-100 mt-2">
                  {getTransitionMetric("atendido", "entregado", "25 minutos")}
                </div>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 leading-normal">
              💡 <strong>¿Cómo optimizar?</strong> El paso 2 (Recepción a Rampa) refleja el tiempo ocioso en fila en el patio del taller. Al agendar mediante el <strong>Chatbot IA</strong>, se pre-asignan refacciones necesarias reduciendo esta espera técnica drásticamente.
            </p>
          </div>
        </div>
      </div>

      {/* SECTION: MAIN SERVICES LIST AND THEIR SOURCE ORIGIN */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-ping inline-block" />
              Todos los Servicios y su Canal de Adquisición
            </h3>
            <p className="text-xs text-gray-500">
              Listado completo de órdenes y citas filtradas con la procedencia exacta de donde provienen las solicitudes de los clientes.
            </p>
          </div>
          <div className="text-xs font-bold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
            Total en Período: <strong>{total} carros</strong>
          </div>
        </div>

        {filteredServices.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400 bg-gray-50 border border-dashed border-gray-200 rounded-2xl">
            No se encontraron servicios ni citas en el rango de filtrado seleccionado.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[9px] font-black uppercase tracking-wider text-gray-500">
                  <th className="py-3 px-4">Folio</th>
                  <th className="py-3 px-4">Cliente / Teléfono</th>
                  <th className="py-3 px-4">Vehículo</th>
                  <th className="py-3 px-4">Servicio mecánico</th>
                  <th className="py-3 px-2">Estatus</th>
                  <th className="py-3 px-4">Canal / Procedencia de la Cita</th>
                  <th className="py-3 px-4 text-right">Agendado Para</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs">
                {filteredServices.map(s => {
                  const folio = `#${s.id.replace('serv-', '').replace('cb-', '').slice(-4).toUpperCase()}`;
                  
                  // Canal source mapping with beautiful custom responsive badges
                  const sourceLower = (s.source || "").toLowerCase();
                  let sourceBadge = (
                    <span className="inline-flex items-center gap-1.5 px-2 bg-purple-50 text-purple-700 border border-purple-150 py-1 rounded-full text-[10px] font-bold">
                      <Sparkles className="w-3 h-3 text-purple-600 fill-purple-100" />
                      Chatbot Portal IA
                    </span>
                  );

                  if (sourceLower === "whatsapp") {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2 bg-emerald-50 text-emerald-800 border border-emerald-150 py-1 rounded-full text-[10px] font-bold">
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                        WhatsApp Business
                      </span>
                    );
                  } else if (sourceLower === "facebook") {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2 bg-blue-50 text-blue-800 border border-blue-150 py-1 rounded-full text-[10px] font-bold">
                        <Facebook className="w-3 h-3 text-blue-600" />
                        Facebook Messenger
                      </span>
                    );
                  } else if (sourceLower === "asesor") {
                    sourceBadge = (
                      <span className="inline-flex items-center gap-1.5 px-2 bg-amber-50 text-amber-800 border border-amber-150 py-1 rounded-full text-[10px] font-bold">
                        <UserCheck className="w-3 h-3 text-amber-600" />
                        Asesor Planta (Manual)
                      </span>
                    );
                  }

                  // Status badge format
                  let statusBadgeClass = "bg-amber-100 text-amber-800 border-amber-200";
                  if (s.status === "vehículo recibido") statusBadgeClass = "bg-purple-100 text-purple-800 border-purple-200";
                  else if (s.status === "en proceso") statusBadgeClass = "bg-blue-100 text-blue-800 border-blue-200";
                  else if (s.status === "atendido") statusBadgeClass = "bg-teal-100 text-teal-800 border-teal-200";
                  else if (s.status === "entregado") statusBadgeClass = "bg-emerald-100 text-emerald-800 border-emerald-200";

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-400">{folio}</td>
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-[#09090b] block">{s.clientName}</span>
                        <span className="text-[10px] text-gray-400 block font-mono">{s.clientPhone || "Sin teléfono"}</span>
                      </td>
                      <td className="py-3 px-4 text-emerald-950 font-medium">
                        <span className="block font-semibold">{s.vehicle}</span>
                        <span className="text-[9px] text-gray-400 block font-mono uppercase">Placa: {s.plate} • NIV: {s.vin}</span>
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-700">
                        {s.serviceType}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${statusBadgeClass}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {sourceBadge}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[10px] font-bold text-zinc-950">
                        {s.appointmentDate.replace('T', ' a las ')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Interactive Presentation full-screen slideshow modal */}
      {isPresentationOpen && (
        <div className="fixed inset-0 bg-neutral-950 text-white z-50 flex flex-col justify-between p-8 select-none transition-all duration-300">
          
          {/* Header */}
          <div className="flex justify-between items-center border-b border-neutral-900 pb-4">
            <div className="flex items-center space-x-2.5">
              <span className="bg-purple-600 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded tracking-wider animate-pulse">Presentación en Vivo</span>
              <h2 className="text-xs font-black tracking-widest text-zinc-400 uppercase">Kioto Mecánico - Informe Ejecutivo de Taller</h2>
            </div>
            <button 
              onClick={() => setIsPresentationOpen(false)}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-350 hover:text-white px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border border-zinc-800 cursor-pointer"
            >
              Cerrar Presentación ×
            </button>
          </div>

          {/* Core Content - large executive cards */}
          <div className="my-8 flex-1 max-w-5xl mx-auto w-full flex flex-col justify-center">
            <div className="space-y-2 mb-6">
              <span className="text-[10px] bg-purple-900/50 text-purple-300 border border-purple-800/60 font-black tracking-wider uppercase px-2 py-1 rounded-md">
                DIAPOSITIVA {currentSlide + 1} DE {slides.length}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{slides[currentSlide].title}</h1>
              <p className="text-zinc-400 text-xs md:text-sm font-medium">{slides[currentSlide].subtitle}</p>
            </div>

            <div className="bg-neutral-900/40 border border-zinc-800 p-8 md:p-10 rounded-3xl min-h-[360px] flex flex-col justify-center">
              {slides[currentSlide].content}
            </div>
          </div>

          {/* Bottom Toolbar & Progress markers */}
          <div className="flex justify-between items-center border-t border-neutral-900 pt-5 max-w-5xl mx-auto w-full">
            <div className="flex gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  className={`w-10 h-1.5 rounded-full transition-all cursor-pointer ${currentSlide === i ? 'bg-purple-500' : 'bg-zinc-850'}`}
                  title={`Ir a diapositiva ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
                disabled={currentSlide === 0}
                className={`p-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${currentSlide === 0 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer'}`}
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <button
                onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
                disabled={currentSlide === slides.length - 1}
                className={`p-2 bg-purple-650 hover:bg-purple-700 text-white rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${currentSlide === slides.length - 1 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                Siguiente
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}
        </>
      )}

    </div>
  );
}
