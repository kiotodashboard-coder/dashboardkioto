import React, { useState } from 'react';
import { customFetch } from '../utils/api';
import { 
  Wrench, 
  User, 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle, 
  FileText,
  Trash2,
  Tag,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { ServicioMecanico } from '../types';

interface KanbanBoardProps {
  services: ServicioMecanico[];
  onServiceUpdated: () => void;
  isAdmin: boolean;
}

export default function KanbanBoard({ services, onServiceUpdated, isAdmin }: KanbanBoardProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const statuses: Array<'servicio agendado' | 'vehículo recibido' | 'en proceso' | 'atendido'> = [
    'servicio agendado',
    'vehículo recibido',
    'en proceso',
    'atendido'
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'servicio agendado': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'vehículo recibido': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'en proceso': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'atendido': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'servicio agendado': return '🗓 Servicio Agendado';
      case 'vehículo recibido': return '🔑 Vehículo Recibido';
      case 'en proceso': return '⚙️ En Proceso';
      case 'atendido': return '✅ Atendido/Entregado';
      default: return status;
    }
  };

  const updateStatus = async (id: string, newStatus: typeof statuses[number]) => {
    setUpdatingId(id);
    try {
      const res = await customFetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onServiceUpdated();
      }
    } catch (err) {
      console.error("Failed to update status on server:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(prev => prev === id ? null : prev);
      }, 4000); // 4 seconds confirmation window
      return;
    }

    try {
      const res = await customFetch(`/api/servicios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onServiceUpdated();
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="kanban-service-container" className="space-y-4">
      
      {/* Horizontal grid board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {statuses.map((columnStatus) => {
          const filteredServices = services.filter((s) => {
            if (columnStatus === 'servicio agendado') {
              return s.status === 'servicio agendado' || s.status === 'En Espera';
            }
            return s.status === columnStatus;
          });
          
          return (
            <div 
              key={columnStatus}
              id={`kanban-col-${columnStatus.replace(' ', '-')}`}
              className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 min-h-[400px] flex flex-col"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200/80 shrink-0">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  {getStatusTitle(columnStatus)}
                </span>
                <span className="bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {filteredServices.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="flex-1 space-y-3 overflow-y-auto max-h-[500px]">
                {filteredServices.length === 0 ? (
                  <div className="h-28 border border-dashed border-gray-200 rounded-lg flex items-center justify-center p-4 text-center">
                    <span className="text-[10px] text-gray-400">Sin órdenes en esta etapa</span>
                  </div>
                ) : (
                  filteredServices.map((service) => (
                    <div 
                      key={service.id}
                      className={`bg-white rounded-lg border p-3.5 shadow-xs space-y-3 hover:shadow-xs transition-colors relative ${
                        service.status === 'En Espera' 
                          ? 'border-rose-300 bg-rose-50/10' 
                          : 'border-gray-200'
                      }`}
                    >
                      {/* Status/Source indicator */}
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                        {service.status === 'En Espera' && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold bg-rose-150 text-rose-700 border border-rose-350 animate-pulse uppercase tracking-wider">
                            En Espera ⏱️
                          </span>
                        )}
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-semibold tracking-wider uppercase border ${
                          service.source === 'chatbot' 
                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                        }`}>
                          {service.source}
                        </span>
                      </div>

                      <div className="pt-1">
                        <h4 className="font-bold text-xs text-gray-950 pr-20 line-clamp-1">{service.clientName}</h4>
                        <p className="text-[10px] font-mono text-gray-500 mt-0.5">{service.clientPhone}</p>
                      </div>

                      {/* Vehicle properties details */}
                      <div className="bg-gray-50/70 p-2 rounded text-[10.5px] border border-gray-100 hover:bg-gray-50 transition-colors space-y-1">
                        <div className="font-medium text-gray-900 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-1.5 shrink-0"></span>
                          🚗 Model: {service.vehicle}
                        </div>
                        <div className="text-gray-600 pl-3">
                          Placa: <strong className="font-mono text-gray-900 select-all">{service.plate}</strong>
                        </div>
                        <div className="text-gray-600 pl-3">
                          NIV: <strong className="font-mono text-gray-900 select-all text-[9.5px]">{service.vin}</strong>
                        </div>
                      </div>

                      {/* Service Details */}
                      <div>
                        <div className="text-[10.5px] text-gray-800 font-semibold flex items-center">
                          <Wrench className="w-3.5 h-3.5 text-blue-600 mr-1 shrink-0" />
                          <span className="truncate">{service.serviceType}</span>
                        </div>
                        {service.notes && (
                          <p className="text-[10px] text-gray-500 italic mt-1 bg-gray-50 p-1.5 rounded border border-gray-100/50 line-clamp-2">
                            "{service.notes}"
                          </p>
                        )}
                      </div>

                      {/* Date & staff */}
                      <div className="border-t border-gray-100/60 pt-3 flex items-center justify-between text-[10px] text-gray-500">
                        <span className="flex items-center text-gray-900 font-medium">
                          <Calendar className="w-3 h-3 text-gray-400 mr-1 shrink-0" />
                          {service.appointmentDate.replace("T", " ")}
                        </span>
                        <span className="truncate max-w-[100px]" title={`Asignado: ${service.assignedServiceUser}`}>
                          👤 {service.assignedServiceUser.split(' ')[0]}
                        </span>
                      </div>

                      {/* Quick Move States Controls */}
                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between gap-1">
                        <div className="flex space-x-1 w-full">
                          {/* Go Backward */}
                          {columnStatus !== statuses[0] && (
                            <button
                              onClick={() => {
                                const prevIdx = statuses.indexOf(columnStatus) - 1;
                                updateStatus(service.id, statuses[prevIdx]);
                              }}
                              disabled={updatingId === service.id}
                              className="p-1 px-2 hover:bg-gray-100 border border-gray-200 rounded text-[10px] text-gray-600 flex items-center justify-center shrink-0"
                              title="Regresar estatus"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                          )}

                          {/* Quick label change indicator */}
                          <div className="flex-1 text-center py-1 rounded bg-gray-50 border border-gray-100 text-[9px] text-gray-400 font-mono tracking-tighter truncate">
                            {updatingId === service.id ? "Guardando..." : "Mover etapa →"}
                          </div>

                          {/* Go Forward */}
                          {columnStatus !== statuses[statuses.length - 1] && (
                            <button
                              onClick={() => {
                                const nextIdx = statuses.indexOf(columnStatus) + 1;
                                updateStatus(service.id, statuses[nextIdx]);
                              }}
                              disabled={updatingId === service.id}
                              className="p-1 px-3 bg-gray-900 hover:bg-gray-800 text-white rounded text-[10px] flex items-center justify-center space-x-1 flex-1 shrink-0 font-semibold"
                            >
                              <span>Avanzar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Admin delete capability with double-click safety */}
                        {(isAdmin || service.source === 'chatbot') && (
                          <button
                            onClick={() => handleDelete(service.id)}
                            className={`p-1 border rounded transition-all shrink-0 cursor-pointer font-bold text-[9px] select-none flex items-center space-x-1 ${
                              deleteConfirmId === service.id
                                ? "bg-red-600 hover:bg-red-700 text-white border-red-700 px-2"
                                : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 px-1.5"
                            }`}
                            title={deleteConfirmId === service.id ? "Clic otra vez" : "Eliminar registro"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleteConfirmId === service.id && <span>¿Seguro?</span>}
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
