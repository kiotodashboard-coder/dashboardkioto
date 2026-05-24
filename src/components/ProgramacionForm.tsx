import React, { useState, useEffect } from 'react';
import { customFetch } from '../utils/api';
import { Clock, Save, Calculator, Sparkles, Check, AlertCircle } from 'lucide-react';

interface ProgrammingConfig {
  maxServicesPerSlot: number;
  slotIntervalMinutes: number;
  openingTime: string;
  closingTime: string;
}

export default function ProgramacionForm() {
  const [config, setConfig] = useState<ProgrammingConfig>({
    maxServicesPerSlot: 2,
    slotIntervalMinutes: 30,
    openingTime: '08:00',
    closingTime: '18:00'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch current config on load
  const loadConfig = async () => {
    setLoading(true);
    try {
      const res = await customFetch('/api/config/programming');
      if (res.ok) {
        const data = await res.json();
        setConfig(data);
      }
    } catch (err) {
      console.error("Failed to load programming config:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  // Calculate dynamic stats
  const calculateStats = () => {
    const [opH, opM] = config.openingTime.split(':').map(Number);
    const [clH, clM] = config.closingTime.split(':').map(Number);

    if (isNaN(opH) || isNaN(opM) || isNaN(clH) || isNaN(clM)) {
      return { totalMinutes: 0, hoursText: '0h', slots: 0, totalCapacity: 0 };
    }

    const startMinutes = opH * 60 + opM;
    const endMinutes = clH * 60 + clM;
    const totalMinutes = Math.max(0, endMinutes - startMinutes);

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const hoursText = `${hours}h ${mins > 0 ? `${mins}m` : ''}`;

    const slots = config.slotIntervalMinutes > 0 
      ? Math.floor(totalMinutes / config.slotIntervalMinutes) 
      : 0;
    
    const totalCapacity = slots * config.maxServicesPerSlot;

    return { totalMinutes, hoursText, slots, totalCapacity };
  };

  const { hoursText, slots, totalCapacity } = calculateStats();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await customFetch('/api/config/programming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      });

      if (res.ok) {
        setSuccessMsg('¡Parámetros de programación guardados con éxito! El chatbot y sistema de citas ahora respetarán estas restricciones.');
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg('Ocurrió un error al actualizar los parámetros de capacidad.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red. Verifique la conexión.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="prog-view-container" className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 animate-fade-in">
      <div>
        <h3 className="text-md font-bold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 text-gray-800 mr-2" />
          Programación y Capacidad de Citas de Taller
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
          Defina la política operativa de recepción en fosa. Configure los horarios de servicio, la frecuencia en minutos de cada turno de recepción, y la cantidad máxima de vehículos que se permite agendar simultáneamente por slot para prevenir sobrecupos.
        </p>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl p-4 text-xs flex items-center shadow-xs">
          <Check className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 text-rose-950 border border-rose-150 rounded-xl p-4 text-xs flex items-center shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 mr-2.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-xs text-gray-400 font-medium">
          Cargando configuración de programación...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side Form fields */}
          <form onSubmit={handleSave} className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Servicios aceptados simultáneamente por Slot
                </label>
                <select
                  id="prog-max-services"
                  value={config.maxServicesPerSlot}
                  onChange={(e) => setConfig({ ...config, maxServicesPerSlot: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-250 text-gray-950 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all"
                >
                  <option value={1}>1 Servicio (Capacidad mínima)</option>
                  <option value={2}>2 Servicios (Recomendado)</option>
                  <option value={3}>3 Servicios</option>
                  <option value={4}>4 Servicios</option>
                  <option value={5}>5 Servicios</option>
                  <option value={8}>8 Servicios (Taller grande)</option>
                  <option value={10}>10 Servicios (Máximo operativo)</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Límite de vehículos que caben en fosas/rampas en el mismo lapso de tiempo.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Intervalo entre citas (Minutos)
                </label>
                <select
                  id="prog-slot-interval"
                  value={config.slotIntervalMinutes}
                  onChange={(e) => setConfig({ ...config, slotIntervalMinutes: Number(e.target.value) })}
                  className="w-full bg-gray-50 border border-gray-250 text-gray-950 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all"
                >
                  <option value={10}>Cada 10 minutos</option>
                  <option value={15}>Cada 15 minutos</option>
                  <option value={20}>Cada 20 minutos</option>
                  <option value={25}>Cada 25 minutos</option>
                  <option value={30}>Cada 30 minutos</option>
                </select>
                <p className="text-[10px] text-gray-400 mt-1">Frecuencia en minutos con la que el sistema o el chatbot asigna citas.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Hora de Apertura del Taller
                </label>
                <input
                  type="time"
                  id="prog-open-time"
                  required
                  value={config.openingTime}
                  onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-250 text-gray-950 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Hora de Cierre del Taller
                </label>
                <input
                  type="time"
                  id="prog-close-time"
                  required
                  value={config.closingTime}
                  onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-250 text-gray-950 rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                id="btn-save-programming"
                disabled={saving}
                className="w-full md:w-auto px-6 py-3.5 bg-neutral-950 hover:bg-neutral-800 text-white hover:text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors flex items-center justify-center space-x-2 cursor-pointer select-none"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Guardando...' : 'Guardar Configuración'}</span>
              </button>
            </div>
          </form>

          {/* Right Side summary calculation cards */}
          <div className="lg:col-span-5 bg-neutral-50 rounded-2xl border border-neutral-150 p-6 space-y-5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-zinc-600" />
              Cálculo de Capacidad Diaria
            </h4>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-gray-200">
                <span className="text-gray-500">Horas operativas por día:</span>
                <span className="font-bold text-gray-900 font-mono">De {config.openingTime} a {config.closingTime} ({hoursText})</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-gray-200">
                <span className="text-gray-500">Intervalo de citas:</span>
                <span className="font-bold text-gray-900 font-mono">Cada {config.slotIntervalMinutes} min</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-gray-200">
                <span className="text-gray-500">Espacios:</span>
                <span className="font-bold text-gray-900 font-mono">{totalCapacity} espacios</span>
              </div>

              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-gray-200">
                <span className="text-gray-500">Capacidad simultánea:</span>
                <span className="font-bold text-gray-900 font-mono">Max {config.maxServicesPerSlot} autos/slot</span>
              </div>

              {/* Box display for the total capacity */}
              <div className="bg-neutral-900 text-white rounded-xl p-4 text-center space-y-1 shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#a1a1aa]">TOTAL SERVICIOS PERMITIDOS POR DÍA</span>
                <div className="text-3xl font-black text-white font-mono tracking-tight">{totalCapacity}</div>
                <p className="text-[10px] text-zinc-400 mt-0.5 px-2">
                  No se permitirán más de {totalCapacity} vehículos agendados al día respetando los espacios asignados de {config.slotIntervalMinutes} minutos.
                </p>
              </div>

              <div className="bg-zinc-100 border border-zinc-200 rounded-lg p-3 text-[11px] text-zinc-650 space-y-1.5 leading-relaxed">
                <div className="flex items-center text-zinc-800 font-semibold space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Sincronización del Asistente IA</span>
                </div>
                <p>
                  El chatbot de Kioto está conectado al servidor. El asistente simulará la conversación solicitando estos datos paso a paso y validando que los horarios caigan dentro de las {config.openingTime} y las {config.closingTime} de acuerdo a los slots libres.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
