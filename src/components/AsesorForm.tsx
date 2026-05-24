import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  User, 
  Phone, 
  Car,
  Tag, 
  Hash, 
  Plus, 
  Check, 
  AlertCircle,
  Clock,
  Share2
} from 'lucide-react';
import { User as UserType } from '../types';

interface AsesorFormProps {
  currentUser: UserType;
  onBookingSuccess: () => void;
}

export default function AsesorForm({ currentUser, onBookingSuccess }: AsesorFormProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Mechanical Service Appointment State
  const [sClientName, setSClientName] = useState<string>('');
  const [sClientPhone, setSClientPhone] = useState<string>('');
  const [sVehicle, setSVehicle] = useState<string>('');
  const [sVin, setSVin] = useState<string>('');
  const [sPlate, setSPlate] = useState<string>('');
  const [sServiceType, setSServiceType] = useState<string>('');
  const [sDate, setSDate] = useState<string>('');
  const [sNotes, setSNotes] = useState<string>('');
  const [sSource, setSSource] = useState<'asesor' | 'chatbot' | 'whatsapp' | 'facebook'>('asesor');

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 5000);
  };

  // Handle booking service
  const handleBookService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sClientName || !sClientPhone || !sVehicle || !sVin || !sPlate || !sServiceType || !sDate) {
      showError("Complete todos los campos del vehículo y plan del taller.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: sClientName,
          clientPhone: sClientPhone,
          vehicle: sVehicle,
          vin: sVin.toUpperCase(),
          plate: sPlate.toUpperCase(),
          serviceType: sServiceType,
          appointmentDate: sDate,
          assignedServiceUser: "Carlos Taller (Técnico)",
          notes: sNotes,
          source: sSource
        })
      });

      if (res.ok || res.status === 211) {
        showSuccess(`Servicio de taller agendado con éxito para ${sClientName}. Notificación de WhatsApp enviada.`);
        
        // Reset Servicio Form
        setSClientName('');
        setSClientPhone('');
        setSVehicle('');
        setSVin('');
        setSPlate('');
        setSServiceType('');
        setSDate('');
        setSNotes('');
        setSSource('asesor');

        onBookingSuccess();
      } else {
        showError("Imposible registrar el servicio mecánico. Verifique los parámetros.");
      }
    } catch (err) {
      console.error(err);
      showError("Fallo del servidor de citas mecánicas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="asesor-booking-box" className="bg-white rounded-xl overflow-hidden">
      <div className="space-y-4">
        
        {/* Alerts status */}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-3 text-xs flex items-center shadow-xs">
            <Check className="w-4 h-4 text-emerald-600 mr-2 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        
        {errorMsg && (
          <div className="bg-rose-50 text-rose-900 border border-rose-200 rounded-lg p-3 text-xs flex items-center shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MECH SERVICE APPOINTMENT FORM */}
        <form onSubmit={handleBookService} className="space-y-4">


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Nombre Completo del Cliente</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="s-form-name"
                  value={sClientName}
                  onChange={(e) => setSClientName(e.target.value)}
                  placeholder="Ej. Sofía Rivera"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Celular para Alertas WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="s-form-phone"
                  value={sClientPhone}
                  onChange={(e) => setSClientPhone(e.target.value)}
                  placeholder="Ej. +52 8198304928"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Vehículo (Marca, Modelo, Año)</label>
              <div className="relative">
                <Car className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="s-form-vehicle"
                  value={sVehicle}
                  onChange={(e) => setSVehicle(e.target.value)}
                  placeholder="Ej. Kioto Sedan LX 2024"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Control Placa de Auto</label>
              <div className="relative">
                <Tag className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="s-form-plate"
                  value={sPlate}
                  onChange={(e) => setSPlate(e.target.value)}
                  placeholder="Ej. GHY-332-A"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">NIV (17 dígitos)</label>
              <div className="relative">
                <Hash className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  id="s-form-vin"
                  value={sVin}
                  onChange={(e) => setSVin(e.target.value)}
                  placeholder="NIV de 17 caracteres"
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none uppercase"
                  maxLength={17}
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Tipo de Servicio Mecánico</label>
              <select
                id="s-form-service-type"
                value={sServiceType}
                onChange={(e) => setSServiceType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                required
              >
                <option value="">-- Elija opción --</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Servicio de reparación">Servicio de reparación</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Origen / Canal de Reservación</label>
              <div className="relative">
                <Share2 className="absolute left-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  id="s-form-source"
                  value={sSource}
                  onChange={(e) => setSSource(e.target.value as any)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                  required
                >
                  <option value="asesor">Asesor de Planta (Manual)</option>
                  <option value="chatbot">Chatbot (General)</option>
                  <option value="whatsapp">WhatsApp / Asistente Virtual</option>
                  <option value="facebook">Facebook Messenger</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Fecha y Hora de Recepción</label>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="datetime-local"
                  id="s-form-date"
                  value={sDate}
                  onChange={(e) => setSDate(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-950 rounded-lg py-2 pl-9 pr-3 text-xs focus:ring-1 focus:ring-gray-950 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Notas del Diagnóstico Inicial</label>
            <textarea
              id="s-form-notes"
              value={sNotes}
              onChange={(e) => setSNotes(e.target.value)}
              placeholder="Fallas reportadas, kilometraje inicial, pertenencias dejadas en el vehículo, etc."
              className="w-full bg-gray-50 border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs h-20 focus:ring-1 focus:ring-gray-950 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            id="btn-submit-s-form"
            disabled={loading}
            className="w-full bg-neutral-950 text-white hover:bg-neutral-800 font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-colors flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Agendar Servicio Taller</span>
          </button>
        </form>

      </div>
    </div>
  );
}
