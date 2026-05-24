import React, { useState } from 'react';
import { customFetch } from '../utils/api';
import { Code, Cpu, Sparkles, CheckCircle, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface AiCodeCoPilotProps {
  onSuccessNotification: (text: string) => void;
}

export default function AiCodeCoPilot({ onSuccessNotification }: AiCodeCoPilotProps) {
  const [selectedFile, setSelectedFile] = useState<string>('server.ts');
  const [customFile, setCustomFile] = useState<string>('');
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileOptions = [
    { value: 'server.ts', label: 'Backend Server (server.ts)' },
    { value: 'src/App.tsx', label: 'Estructura Principal (src/App.tsx)' },
    { value: 'src/components/DashboardOverview.tsx', label: 'Dashboard Resumen (DashboardOverview.tsx)' },
    { value: 'src/components/ServiciosTaller.tsx', label: 'Admin Servicios (ServiciosTaller.tsx)' },
    { value: 'src/components/ChatbotSimulator.tsx', label: 'Simulador Chatbot (ChatbotSimulator.tsx)' },
    { value: 'src/components/FloatingChatbot.tsx', label: 'Widget Flotante (FloatingChatbot.tsx)' },
    { value: 'custom', label: '-- Escribir ruta de archivo personalizada --' }
  ];

  const handleApplyModification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) {
      setStatusMsg({ type: 'error', text: 'Por favor, escribe las modificaciones o cambios que deseas aplicar.' });
      return;
    }

    const targetFile = selectedFile === 'custom' ? customFile.trim() : selectedFile;
    if (!targetFile) {
      setStatusMsg({ type: 'error', text: 'Por favor, especifica un archivo válido.' });
      return;
    }

    setLoading(true);
    setStatusMsg(null);

    try {
      const res = await customFetch('/api/ai/edit-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: targetFile, userPrompt })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Ocurrió un error inesperado al aplicar los cambios.');
      }

      setStatusMsg({
        type: 'success',
        text: `¡Cambios aplicados con éxito! El archivo ${targetFile} fue editado de manera inmediata.`
      });
      onSuccessNotification(`Archivo ${targetFile} editado exitosamente con IA.`);
      setUserPrompt('');
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Error de conexión con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-zinc-200 rounded-2xl bg-white p-6 shadow-xs space-y-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-950 uppercase tracking-wider flex items-center gap-1.5">
              Co-Piloto Editor de Código IA <Sparkles className="w-4 h-4 text-indigo-500 fill-indigo-100" />
            </h4>
            <p className="text-[11px] text-gray-400">Modifica el comportamiento y diseño de la aplicación en tiempo real con IA</p>
          </div>
        </div>
        <span className="bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
          💡 Hot-Reload Activo
        </span>
      </div>

      <div className="text-xs text-zinc-600 bg-zinc-50 border border-zinc-150 p-4 rounded-xl leading-relaxed space-y-1.5">
        <p>
          <strong>¿Cómo funciona?</strong> Cuando ingresas una instrucción descriptiva en español, el servidor le solicita a 
          <strong> Gemini 3.5 Flash</strong> que reescriba el archivo seleccionado preservando la arquitectura general del taller. 
          Los cambios se guardan físicamente en el contenedor, permitiendo iterar el chatbot, tableros o flujos al instante.
        </p>
        <p className="font-semibold text-indigo-600 flex items-center gap-1">
          <Terminal className="w-3.5 h-3.5" /> Ej: "Cambia el saludo del asistente de bienvenida y di que nos ubicamos en Av. Vallarta."
        </p>
      </div>

      <form onSubmit={handleApplyModification} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Archivo a Modificar</label>
            <select
              value={selectedFile}
              onChange={(e) => {
                setSelectedFile(e.target.value);
                setStatusMsg(null);
              }}
              className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-medium"
            >
              {fileOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {selectedFile === 'custom' && (
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Ruta del Archivo (Ej: server.ts)</label>
              <input
                type="text"
                value={customFile}
                onChange={(e) => setCustomFile(e.target.value)}
                placeholder="Ej. src/components/DashboardOverview.tsx"
                className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs text-gray-800 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">
            Instrucciones para la IA (Cambio deseado)
          </label>
          <textarea
            rows={4}
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Describe claramente los cambios. Ej: 'Agrega un botón para vaciar todos los servicios inactivos en el tablero' o 'Traduce la sección de webhook a inglés'."
            className="w-full bg-white border border-gray-200 rounded-xl py-2.5 px-3.5 text-xs text-gray-850 placeholder:text-gray-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 leading-relaxed font-sans"
          />
        </div>

        {statusMsg && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start space-x-2.5 border ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-tight font-medium">{statusMsg.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            loading ? 'opacity-70 cursor-not-allowed bg-zinc-700' : ''
          }`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Programando Modificaciones y Recompilando...</span>
            </>
          ) : (
            <>
              <Code className="w-4 h-4" />
              <span>Aplicar Cambios con Inteligencia Artificial</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
