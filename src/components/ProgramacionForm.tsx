import React, { useState, useEffect } from 'react';
import { customFetch } from '../utils/api';
import { Clock, Save, Calculator, Sparkles, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface ProgrammingConfig {
  maxServicesPerSlot: number;
  slotIntervalMinutes: number;
  openingTime: string;
  closingTime: string;
  checklistItems?: string[];
  toleranceMinutes?: number;
}

export default function ProgramacionForm() {
  const [config, setConfig] = useState<ProgrammingConfig>({
    maxServicesPerSlot: 2,
    slotIntervalMinutes: 30,
    openingTime: '08:00',
    closingTime: '18:00',
    checklistItems: [],
    toleranceMinutes: 15
  });
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(false);
  const [savingCapacity, setSavingCapacity] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
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
        if (data.checklistItems && Array.isArray(data.checklistItems)) {
          setChecklistItems(data.checklistItems);
        } else {
          // Default fallbacks matching the checklist standard
          setChecklistItems([
            'Nivel de Aceite de Motor',
            'Líquido de Dirección',
            'Nivel de Anticongelante',
            'Filtro de Aire',
            'Líquido de Frenos',
            'Filtro de Cabina',
            'Batería (Voltaje/Terminales)',
            'Bujías',
            'Bandas de Motor',
            'Mangueras',
            'Rotación de llantas',
            'Balatas Traseras',
            'Suspensión (Bujes/Rótulas)',
            'Fugas de Fluidos',
            'Presión de Llantas',
            'Alineación de llantas',
            'Discos de Freno',
            'Luces (Altas/Bajas/Stop)',
            'Estado de Llantas (Desgaste)',
            'Balatas Delanteras',
            'Amortiguadores',
            'Direcciones y Limpiaparabrisas'
          ]);
        }
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

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    if (checklistItems.includes(trimmed)) {
      setErrorMsg('Ese elemento ya se encuentra en el checklist.');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    setChecklistItems([...checklistItems, trimmed]);
    setNewItemText('');
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setChecklistItems(checklistItems.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCapacity(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await customFetch('/api/config/programming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          checklistItems: checklistItems
        })
      });

      if (res.ok) {
        setSuccessMsg('¡Parámetros de capacidad y horarios guardados con éxito!');
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg('Ocurrió un error al actualizar los parámetros de capacidad.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red. Verifique la conexión.');
    } finally {
      setSavingCapacity(false);
    }
  };

  const handleSaveChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingChecklist(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await customFetch('/api/config/programming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...config,
          checklistItems: checklistItems
        })
      });

      if (res.ok) {
        setSuccessMsg('¡Checklist técnico guardado con éxito! Los mecánicos verán este checklist actualizado de inmediato.');
        setTimeout(() => setSuccessMsg(''), 6000);
      } else {
        setErrorMsg('Ocurrió un error al guardar el checklist.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red. Verifique la conexión.');
    } finally {
      setSavingChecklist(false);
    }
  };

  return (
    <div id="prog-view-container" className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 animate-fade-in">
      <div>
        <h3 className="text-md font-bold text-gray-900 flex items-center select-none">
          <Clock className="w-5 h-5 text-gray-800 mr-2" />
          Programación y Capacidad de Citas de Taller
        </h3>
        <p className="text-xs text-gray-500 mt-1 leading-relaxed select-none">
          Defina la política operativa de recepción en fosa. Configure los horarios de servicio, la frecuencia en minutos de cada turno de recepción, la capacidad de autos, y administre el Checklist Meticuloso que los mecánicos llenan al momento de atender el servicio.
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
          <div className="lg:col-span-7 space-y-6">
            
            {/* Form 1: Capacidad y Horarios */}
            <form onSubmit={handleSaveCapacity} className="bg-slate-50 border border-gray-250 rounded-2xl p-5 space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest text-neutral-800 flex items-center mb-1">
                <Clock className="w-4 h-4 mr-2 text-indigo-600" />
                1. Capacidad y Horarios de Citas
              </h4>
              <p className="text-[10px] text-gray-500 pb-2 border-b border-gray-150">
                Configure el límite de autos atendidos por slot y el horario general de atención.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Servicios aceptados simultáneamente por Slot
                  </label>
                  <select
                    id="prog-max-services"
                    value={config.maxServicesPerSlot}
                    onChange={(e) => setConfig({ ...config, maxServicesPerSlot: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-250 text-gray-950 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all"
                  >
                    <option value={1}>1 Servicio (Capacidad mínima)</option>
                    <option value={2}>2 Servicios (Recomendado)</option>
                    <option value={3}>3 Servicios</option>
                    <option value={4}>4 Servicios</option>
                    <option value={5}>5 Servicios</option>
                    <option value={8}>8 Servicios (Taller grande)</option>
                    <option value={10}>10 Servicios (Máximo operativo)</option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1">Límite de vehículos que caben en fosas/rampas en el mismo lapso de tiempo.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Intervalo entre citas (Minutos)
                  </label>
                  <select
                    id="prog-slot-interval"
                    value={config.slotIntervalMinutes}
                    onChange={(e) => setConfig({ ...config, slotIntervalMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-250 text-gray-950 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all"
                  >
                    <option value={10}>Cada 10 minutos</option>
                    <option value={15}>Cada 15 minutos</option>
                    <option value={20}>Cada 20 minutos</option>
                    <option value={25}>Cada 25 minutos</option>
                    <option value={30}>Cada 30 minutos</option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1">Frecuencia en minutos con la que el sistema o el chatbot asigna citas.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Hora de Apertura del Taller
                  </label>
                  <input
                    type="time"
                    id="prog-open-time"
                    required
                    value={config.openingTime}
                    onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
                    className="w-full bg-white border border-gray-250 text-gray-950 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    Hora de Cierre del Taller
                  </label>
                  <input
                    type="time"
                    id="prog-close-time"
                    required
                    value={config.closingTime}
                    onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
                    className="w-full bg-white border border-gray-250 text-gray-950 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5">
                    ⏱️ Minutos de tolerancia de llegada
                  </label>
                  <select
                    id="prog-tolerance-mins"
                    value={config.toleranceMinutes ?? 15}
                    onChange={(e) => setConfig({ ...config, toleranceMinutes: Number(e.target.value) })}
                    className="w-full bg-white border border-gray-250 text-gray-950 rounded-xl py-2.5 px-3.5 text-xs focus:ring-1 focus:ring-zinc-900 focus:outline-none transition-all"
                  >
                    <option value={5}>5 Minutos (Estricta)</option>
                    <option value={10}>10 Minutos</option>
                    <option value={15}>15 Minutos (Recomendada)</option>
                    <option value={20}>20 Minutos</option>
                    <option value={30}>30 Minutos (Flexible)</option>
                    <option value={45}>45 Minutos</option>
                    <option value={60}>60 Minutos (1 Hora)</option>
                  </select>
                  <p className="text-[9px] text-gray-400 mt-1">
                    Tiempo de gracia antes de que las citas pasen automáticamente de "Agendado" a estatus "En Espera".
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  id="btn-save-capacity"
                  disabled={savingCapacity}
                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center space-x-2 cursor-pointer select-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingCapacity ? 'Guardando Capacidad...' : 'Guardar Horarios y Capacidad'}</span>
                </button>
              </div>
            </form>

            {/* Form 2: Checklist Manager */}
            <form onSubmit={handleSaveChecklist} className="bg-slate-50 border border-gray-250 rounded-2xl p-5 space-y-4">
              <div className="flex justify-between items-start pb-2 border-b border-gray-150">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#131315] flex items-center">
                    <Sparkles className="w-4 h-4 mr-2 text-indigo-600 font-black" />
                    2. Checklist Técnico Obligatorio
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Establezca los componentes que el mecánico verificará para este checklist al pasar a estatus Atendido.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    placeholder="Ej. Líquido de Frenos, Bandas de Accesorios..."
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    className="flex-1 bg-white border border-gray-250 text-gray-950 rounded-xl py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-950 focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="p-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold px-4 flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 p-3 max-h-52 overflow-y-auto shadow-inner">
                  <span className="block text-[10px] font-black uppercase text-gray-400 mb-2 select-none">Componentes a Verificar ({checklistItems.length})</span>
                  {checklistItems.length === 0 ? (
                    <p className="text-xs text-gray-400 italic text-center py-6">Ningún elemento configurado. Llene la lista para iniciar.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {checklistItems.map((item, index) => (
                        <div key={index} className="flex justify-between items-center bg-gray-50/70 p-2 rounded-lg border border-gray-200 text-xs">
                          <span className="font-bold text-gray-650 truncate max-w-[150px]">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="text-gray-450 hover:text-rose-600 transition p-0.5"
                            title="Eliminar elemento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-200 flex justify-end">
                <button
                  type="submit"
                  id="btn-save-checklist"
                  disabled={savingChecklist}
                  className="px-5 py-2.5 bg-neutral-950 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors flex items-center space-x-2 cursor-pointer select-none"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingChecklist ? 'Guardando Checklist...' : 'Guardar Checklist'}</span>
                </button>
              </div>
            </form>
          </div>

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
                <span className="font-bold text-gray-900 font-mono">{slots} slots</span>
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
                  El chatbot de Kioto está conectado al servidor. El asistente simulará la conversación solicitando estos datos paso a paso y validando que los horarios caigan dentro del rango operativo establecido de acuerdo a los slots libres.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
