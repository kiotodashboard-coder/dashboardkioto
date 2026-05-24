import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, 
  Download, 
  Search, 
  Trash2, 
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  User,
  ExternalLink,
  Camera,
  Printer,
  X,
  Check,
  FileText
} from 'lucide-react';
import { ServicioMecanico, User as UserType } from '../types';

// ==========================================
// 1. SIGNATURE PAD CANVAS COMPONENT
// ==========================================
interface SignaturePadProps {
  title: string;
  onSave: (base64: string) => void;
  onClear: () => void;
  savedDataUrl?: string;
}

function SignaturePad({ title, onSave, onClear, savedDataUrl }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(!!savedDataUrl);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Configure defaults
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#131315';
    ctx.shadowBlur = 0.5;

    // Load existing signature if provided
    if (savedDataUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
      };
      img.src = savedDataUrl;
    }
  }, [savedDataUrl]);

  const getPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPosition(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getPosition(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas) {
        onSave(canvas.toDataURL('image/png'));
        setHasSigned(true);
      }
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onClear();
    setHasSigned(false);
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-gray-250/70 space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{title}</span>
        {hasSigned && <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">✓ FIRMADO</span>}
      </div>
      <canvas
        ref={canvasRef}
        width={350}
        height={130}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className="w-full h-28 bg-white border border-gray-300 rounded-lg cursor-crosshair touch-none"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-[10px] text-gray-500 hover:text-rose-600 font-bold uppercase transition-colors"
        >
          Borrar Firma
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 2. CAMERA AND FILE FALLBACK COMPONENT
// ==========================================
interface CameraCaptureProps {
  label: string;
  onCapture: (base64: string) => void;
  savedImage?: string;
  hideUpload?: boolean;
}

function CameraCapture({ label, onCapture, savedImage, hideUpload }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(savedImage || null);
  const [cameraError, setCameraError] = useState('');

  const startStreaming = async () => {
    setCameraError('');
    try {
      const activeStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(activeStream);
      if (videoRef.current) {
        videoRef.current.srcObject = activeStream;
      }
      setIsCameraActive(true);
    } catch (err) {
      console.warn("Camera media access blocked or unavailable:", err);
      setCameraError("La transmisión en vivo no es compatible en esta ventana de previsualización. Utilice la opción de 'Subir Archivo' para cargar la evidencia de inmediato.");
    }
  };

  const stopStreaming = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const snapPhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const b64 = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(b64);
    onCapture(b64);
    stopStreaming();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const result = loadEv.target?.result as string;
      setPreview(result);
      onCapture(result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-slate-50 p-3 rounded-xl border border-gray-250/70 space-y-2.5">
      <div className="flex justify-between items-center select-none">
        <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">{label}</span>
        {preview && <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-150">📷 CAPTURADA</span>}
      </div>

      {preview && (
        <div className="relative border border-gray-200 bg-neutral-900 rounded-lg overflow-hidden max-h-40 flex items-center justify-center">
          <img src={preview} alt="Vista previa" className="max-h-40 object-contain text-[10px] text-white italic" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onCapture('');
            }}
            className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 cursor-pointer transition-colors shadow-md"
            title="Eliminar foto"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!preview && !isCameraActive && (
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={startStreaming}
              className={`bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${hideUpload ? 'w-full flex-grow' : 'flex-1'}`}
            >
              <Camera className="w-4 h-4" />
              <span>Cámara en Vivo</span>
            </button>
            {!hideUpload && (
              <label className="flex-1 bg-white hover:bg-slate-50 border border-gray-250 text-gray-700 text-[11px] font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center">
                <Download className="w-4 h-4 rotate-180" />
                <span>Cargar Imagen</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
          {cameraError && <p className="text-[10px] leading-snug font-medium text-amber-700">{cameraError}</p>}
        </div>
      )}

      {isCameraActive && (
        <div className="space-y-2.5">
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={snapPhoto}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
            >
              Tomar Foto
            </button>
            <button
              type="button"
              onClick={stopStreaming}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold py-2 px-3 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// MAIN RECEPTACLE: SERVICIOSTALLER
// ==========================================
interface ServiciosTallerProps {
  services: ServicioMecanico[];
  onServiceUpdated: () => void;
  isAdmin: boolean;
}

export default function ServiciosTaller({ services, onServiceUpdated, isAdmin }: ServiciosTallerProps) {
  // Manual high-level creation form fields
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [vin, setVin] = useState('');
  const [plate, setPlate] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI status overlays
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Active validation modal states
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ServicioMecanico | null>(null);
  const [modalType, setModalType] = useState<'recepcion' | 'atendido' | 'entregado' | null>(null);

  // Recepcion input temporary storage
  const [recepcionFoto, setRecepcionFoto] = useState('');
  const [recepcionFirmaCliente, setRecepcionFirmaCliente] = useState('');

  // Diagnostic Checklist parts list
  const standardChecklistParts = [
    'Motor - Aceite',
    'Motor - Filtros',
    'Motor - Bujías',
    'Tren Motriz - Diferencial',
    'Tren Motriz - Transmisión',
    'Sistema de Frenos - Balatas',
    'Sistema de Frenos - Discos',
    'Suspensión',
    'Amortiguadores',
    'Sistema Eléctrico & Batería',
    'Luces & Faros',
    'Llantas - Presión de aire',
    'Llantas - Desgaste',
    'Niveles - Anticongelante',
    'Niveles - Líquido de frenos',
    'Bandas & Correas',
    'Mangueras',
    'Dirección',
    'Alineación',
    'Carrocería',
    'Pintura'
  ];
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [comentariosMecanico, setComentariosMecanico] = useState('');
  const [recomendacionesMecanico, setRecomendacionesMecanico] = useState('');

  // Delivery input temporary storage
  const [deliveryFotoIdFront, setDeliveryFotoIdFront] = useState('');
  const [deliveryFotoIdBack, setDeliveryFotoIdBack] = useState('');
  const [deliveryFirmaAsesor, setDeliveryFirmaAsesor] = useState('');
  const [deliveryFirmaCliente, setDeliveryFirmaCliente] = useState('');
  const [deliveryStep, setDeliveryStep] = useState<'documentos' | 'firmas'>('documentos');

  // Core printable viewer parameters
  const [printService, setPrintService] = useState<ServicioMecanico | null>(null);

  const [progConfig, setProgConfig] = useState<{
    maxServicesPerSlot: number;
    slotIntervalMinutes: number;
    openingTime: string;
    closingTime: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/config/programming')
      .then(res => res.json())
      .then(data => setProgConfig(data))
      .catch(err => console.error("Error loading prog parameters:", err));
  }, [services]);

  // Synchronize modal state inputs with the focused service files on launch
  useEffect(() => {
    if (selectedServiceForModal) {
      if (modalType === 'recepcion') {
        setRecepcionFoto(selectedServiceForModal.recepcionFoto || '');
        setRecepcionFirmaCliente(selectedServiceForModal.recepcionFirmaCliente || '');
      } else if (modalType === 'atendido') {
        setComentariosMecanico(selectedServiceForModal.comentariosMecanico || '');
        setRecomendacionesMecanico(selectedServiceForModal.recomendacionesMecanico || '');
        
        const initialCheck: Record<string, boolean> = {};
        standardChecklistParts.forEach(p => {
          initialCheck[p] = selectedServiceForModal.checklist?.[p] ?? false;
        });
        setChecklist(initialCheck);
      } else if (modalType === 'entregado') {
        setDeliveryFotoIdFront(selectedServiceForModal.deliveryFotoIdFront || '');
        setDeliveryFotoIdBack(selectedServiceForModal.deliveryFotoIdBack || '');
        setDeliveryFirmaAsesor(selectedServiceForModal.deliveryFirmaAsesor || '');
        setDeliveryFirmaCliente(selectedServiceForModal.deliveryFirmaCliente || '');
        setDeliveryStep('documentos');
      }
    } else {
      // Clear
      setRecepcionFoto('');
      setRecepcionFirmaCliente('');
      setChecklist({});
      setComentariosMecanico('');
      setRecomendacionesMecanico('');
      setDeliveryFotoIdFront('');
      setDeliveryFotoIdBack('');
      setDeliveryFirmaAsesor('');
      setDeliveryFirmaCliente('');
      setDeliveryStep('documentos');
    }
  }, [selectedServiceForModal, modalType]);

  // Handle manual, over-the-counter registration
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !vehicle || !vin || !plate || !serviceType || !appointmentDate) {
      setErrorMsg('Por favor, complete todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          clientPhone,
          vehicle,
          vin,
          plate,
          serviceType,
          appointmentDate,
          assignedServiceUser: 'Carlos Taller (Técnico)',
          notes: 'Ingreso manual por recepción de mostrador',
          source: 'asesor'
        })
      });

      if (res.ok) {
        setSuccessMsg('Servicio agendado de manera exitosa. Canalizadas las notificaciones por WhatsApp.');
        setClientName('');
        setClientPhone('');
        setVehicle('');
        setVin('');
        setPlate('');
        setServiceType('');
        setAppointmentDate('');
        onServiceUpdated();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Fallo de capacidad al agendar servicio.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // State Machine Flow updates dispatcher
  const dispatchStatusUpdate = async (id: string, newStatus: ServicioMecanico['status'], extraPayload: Partial<ServicioMecanico> = {}) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          ...extraPayload 
        })
      });
      if (res.ok) {
        setSuccessMsg(`Servicio actualizado con éxito a: [${newStatus.toUpperCase()}]`);
        onServiceUpdated();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || 'No se pudo guardar la transición en la base de datos.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red al registrar la transición.');
    } finally {
      setLoading(false);
    }
  };

  // Intermediate validation handler on Select input modification
  const handleStatusChangeRequest = (service: ServicioMecanico, newStatus: ServicioMecanico['status']) => {
    setErrorMsg('');
    setSuccessMsg('');

    const statusOrder: ServicioMecanico['status'][] = [
      'servicio agendado', 
      'vehículo recibido', 
      'en proceso', 
      'atendido', 
      'entregado'
    ];

    const currentIdx = statusOrder.indexOf(service.status);
    const targetIdx = statusOrder.indexOf(newStatus);

    if (currentIdx === targetIdx) return;

    // Backward transition check
    if (targetIdx < currentIdx) {
      if (!isAdmin) {
        setErrorMsg(`Solo el Administrador del sistema tiene autorización para revertir de [${service.status.toUpperCase()}] a [${newStatus.toUpperCase()}]. Operación bloqueada.`);
        setTimeout(() => setErrorMsg(''), 6000);
        return;
      }
      if (confirm(`⚠️ ¿Desea reconfigurar el servicio a un estado anterior? Los datos acumulados quedarán preservados.`)) {
        dispatchStatusUpdate(service.id, newStatus);
      }
      return;
    }

    // Skip prevention (targetIdx > currentIdx + 1)
    if (targetIdx > currentIdx + 1) {
      alert(`⚠️ Cambio de estado bloqueado. No se pueden saltar estatus en el flujo del taller. El siguiente estatus correspondiente para este vehículo es: [${statusOrder[currentIdx + 1].toUpperCase()}].`);
      return;
    }

    // Validate intermediate data or state prerequisites
    // 1. Moving to 'en proceso' (which is index 2, coming from index 1 'vehículo recibido')
    if (newStatus === 'en proceso') {
      if (!service.recepcionFoto || !service.recepcionFirmaCliente) {
        alert("⚠️ No puede cambiar el estado a 'En Proceso' porque el estatus anterior 'Vehículo Recibido' no está completo. Asegúrese de registrar primero la foto de recepción y firma del cliente.");
        return;
      }
    }

    // 2. Moving to 'atendido' (index 3, coming from index 2 'en proceso')
    if (newStatus === 'atendido') {
      setSelectedServiceForModal(service);
      setModalType('atendido');
      return;
    }

    // 3. Moving to 'entregado' (index 4, coming from index 3 'atendido')
    if (newStatus === 'entregado') {
      // Must have 'atendido' comments filled
      if (!service.comentariosMecanico || !service.comentariosMecanico.trim()) {
        alert("⚠️ No puede cambiar el estado a 'Entregado' porque la fase anterior 'Atendido' no está de alta o completa. El técnico de taller debe registrar primero el check list y comentarios del servicio.");
        return;
      }
      setSelectedServiceForModal(service);
      setModalType('entregado');
      return;
    }

    if (newStatus === 'vehículo recibido') {
      setSelectedServiceForModal(service);
      setModalType('recepcion');
      return;
    }

    // Direct change for other allowed states
    dispatchStatusUpdate(service.id, newStatus);
  };

  // Submissions validation
  const submitRecepcion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForModal) return;

    if (!recepcionFoto) {
      alert("⚠️ Debe capturar o cargar una fotografía frontal del vehículo como evidencia de recepción para continuar.");
      return;
    }
    if (!recepcionFirmaCliente) {
      alert("⚠️ Se requiere la firma de conformidad del cliente en la recepción.");
      return;
    }

    dispatchStatusUpdate(selectedServiceForModal.id, 'vehículo recibido', {
      recepcionFoto,
      recepcionFirmaCliente
    });
    setSelectedServiceForModal(null);
    setModalType(null);
  };

  const submitAtendido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForModal) return;

    if (!comentariosMecanico.trim()) {
      alert("⚠️ El técnico de taller debe describir obligatoriamente los trabajos realizados en el motor o carrocería.");
      return;
    }

    dispatchStatusUpdate(selectedServiceForModal.id, 'atendido', {
      checklist,
      comentariosMecanico,
      recomendacionesMecanico
    });
    setSelectedServiceForModal(null);
    setModalType(null);
  };

  const submitEntregado = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForModal) return;

    if (!deliveryFotoIdFront || !deliveryFotoIdBack) {
      alert("⚠️ Debe registrar la fotografía de una identificación oficial vigente por AMBOS LADOS (Frente y Reverso).");
      return;
    }
    if (!deliveryFirmaAsesor) {
      alert("⚠️ Se requiere la firma del Asesor Técnico que realiza la entrega de llaves.");
      return;
    }
    if (!deliveryFirmaCliente) {
      alert("⚠️ Se requiere la firma del Cliente que recibe y valida la conformidad del vehículo.");
      return;
    }

    dispatchStatusUpdate(selectedServiceForModal.id, 'entregado', {
      deliveryFotoIdFront,
      deliveryFotoIdBack,
      deliveryFirmaAsesor,
      deliveryFirmaCliente
    });
    setSelectedServiceForModal(null);
    setModalType(null);
  };

  const handleDeleteService = async (id: string) => {
    if (deleteConfirmId !== id) {
      setDeleteConfirmId(id);
      setTimeout(() => {
        setDeleteConfirmId(p => p === id ? null : p);
      }, 4000);
      return;
    }
    try {
      const res = await fetch(`/api/servicios/${id}`, { method: 'DELETE' });
      if (res.ok) {
        onServiceUpdated();
        const updated = new Set(selectedIds);
        updated.delete(id);
        setSelectedIds(updated);
        setDeleteConfirmId(null);
        setSuccessMsg("Registro eliminado de manera permanente.");
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredServices.map(s => s.id)));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) updated.delete(id);
    else updated.add(id);
    setSelectedIds(updated);
  };

  const filteredServices = services.filter((s) => {
    return (
      s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.vehicle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleExportExcel = () => {
    if (services.length === 0) {
      alert('No hay servicios registrados para exportar.');
      return;
    }
    const headers = ['Folio', 'Cliente', 'Celular', 'Vehículo', 'Placa', 'NIV', 'Servicio', 'Fecha programada', 'Origen', 'Estatus'];
    const rows = (selectedIds.size > 0 ? services.filter(s => selectedIds.has(s.id)) : services).map((s) => {
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
        s.clientName || '',
        s.clientPhone ? `\t${s.clientPhone}` : '',
        s.vehicle || '',
        s.plate || '',
        s.vin || '',
        s.serviceType || '',
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
    link.setAttribute("download", `Kioto_Mecanico_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'servicio agendado': 
        return 'bg-amber-50 text-amber-800 border-amber-200/60 hover:bg-amber-100/50';
      case 'vehículo recibido': 
        return 'bg-indigo-50 text-indigo-800 border-indigo-200/50 hover:bg-indigo-100/50';
      case 'en proceso': 
        return 'bg-blue-50 text-blue-800 border-blue-200/50 hover:bg-blue-100/50';
      case 'atendido': 
        return 'bg-cyan-50 text-cyan-800 border-cyan-200/50 hover:bg-cyan-100/50';
      case 'entregado': 
        return 'bg-emerald-50 text-emerald-800 border-emerald-200/50 hover:bg-emerald-100/50';
      default: 
        return 'bg-slate-50 text-slate-800 border-slate-200/60 hover:bg-slate-100/50';
    }
  };

  return (
    <div id="workshop-dashboard-section" className="space-y-6">
      
      {/* Interactive alert bars */}
      {successMsg && (
        <div id="success-service-banner" className="bg-emerald-700 text-white rounded-xl p-4 text-xs font-semibold flex items-center shadow-md animate-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-250 mr-2 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div id="error-service-banner" className="bg-rose-50 border border-rose-200 text-rose-950 rounded-xl p-4 text-xs font-medium flex items-center shadow-xs animate-fade">
          <AlertCircle className="w-4 h-4 text-rose-600 mr-2 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Form: Manual Booking */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">Enrolar Cita en Sucursal</h3>
            <form onSubmit={handleCreateService} className="space-y-4 pt-1">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Cliente</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre Completo"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Celular</label>
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Vehículo (Ficha/Modelo)</label>
                <input
                  type="text"
                  required
                  placeholder="Kioto Hybrid XL 2025"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                  className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">NIV (Serie)</label>
                  <input
                    type="text"
                    required
                    placeholder="17 Dígitos"
                    maxLength={17}
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs uppercase font-mono tracking-wider focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Placa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. GHY-210-C"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value.toUpperCase())}
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs uppercase font-mono tracking-wider focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Servicio Requerido</label>
                <input
                  type="text"
                  required
                  placeholder="Mantenimiento Mayor 10,000 KM"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Fecha Programada</label>
                <input
                  type="datetime-local"
                  required
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full bg-white border border-gray-250 text-gray-950 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#131315] hover:bg-neutral-800 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest py-3.5 rounded-xl transition-colors cursor-pointer text-center"
              >
                {loading ? 'Procesando...' : 'Dar de alta cita'}
              </button>

            </form>
          </div>
        </div>

        {/* Right Table: Mechanical Services List */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight text-gray-950 uppercase">Servicios Activos de Taller</h3>
                <p className="text-xs text-gray-500 mt-1">Sugerido para personal operativo y gerencial</p>
              </div>
              <button
                onClick={handleExportExcel}
                className="p-1.5 px-3.5 shadow-2xs hover:bg-slate-50 border border-gray-255 rounded-lg text-xs text-gray-800 flex items-center font-bold tracking-normal transition-colors cursor-pointer"
              >
                <Download className="w-4.5 h-4.5 mr-2 text-gray-500" />
                <span>Exportar XLS</span>
              </button>
            </div>

            <div className="px-5 py-3 bg-gray-50/50 border-b border-gray-100 relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-9" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar por nombre, placa o folio del servicio..."
                className="w-full bg-white border border-gray-200.5 rounded-xl py-2.5 pl-9 pr-3 text-xs text-gray-800 focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider font-bold select-none">
                    <th className="py-4 px-5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredServices.length > 0 && selectedIds.size === filteredServices.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-4">Folio / Vehículo</th>
                    <th className="py-4 px-4">Servicio Requerido</th>
                    <th className="py-4 px-4">Fecha Cita</th>
                    <th className="py-4 px-4">Origen</th>
                    <th className="py-4 px-4">Estatus</th>
                    <th className="py-4 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400 font-medium italic">
                        Sin coincidencias en Kioto Dashboard.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((service) => {
                      const simpleFolio = service.id.replace('serv-', '').slice(-4).toUpperCase();
                      const dateObj = new Date(service.appointmentDate);
                      const formattedDate = isNaN(dateObj.getTime())
                        ? service.appointmentDate.replace('T', ' ')
                        : `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()} - ${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')} hrs`;

                      return (
                        <tr 
                          key={service.id}
                          className={`hover:bg-slate-50/40 transition-colors ${selectedIds.has(service.id) ? 'bg-indigo-50/20' : ''}`}
                        >
                          <td className="py-4 px-5 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(service.id)}
                              onChange={() => handleToggleSelectOne(service.id)}
                              className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] text-zinc-650 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60 font-black">
                                #{simpleFolio}
                              </span>
                              <span className="font-bold text-gray-950">{service.vehicle}</span>
                            </div>
                            <div className="text-[10px] mt-1 text-gray-400 font-mono">
                              Placa: <strong className="text-gray-700">{service.plate}</strong>
                              <span className="mx-1">•</span>
                              NIV: <strong className="text-gray-700">{service.vin}</strong>
                            </div>
                          </td>

                          <td className="py-4 px-4">
                            <div className="font-bold text-gray-900">{service.serviceType}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{service.clientName} ({service.clientPhone})</div>
                          </td>

                          <td className="py-4 px-4 font-semibold text-gray-900">
                            {formattedDate}
                          </td>

                          <td className="py-4 px-4">
                            {(() => {
                              const src = service.source || 'asesor';
                              let badgeText = 'Asesor (Manual)';
                              let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
                              
                              if (src === 'chatbot') {
                                badgeText = 'Chatbot IA';
                                badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
                              } else if (src === 'whatsapp') {
                                badgeText = 'WhatsApp';
                                badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-250';
                              } else if (src === 'facebook') {
                                badgeText = 'Facebook';
                                badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
                              }

                              return (
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold border ${badgeStyle}`}>
                                  {badgeText}
                                </span>
                              );
                            })()}
                          </td>

                          <td className="py-4 px-4">
                            <select
                              value={service.status}
                              onChange={(e) => handleStatusChangeRequest(service, e.target.value as any)}
                              className={`text-[11px] font-black rounded-lg px-2.5 py-1.5 border cursor-pointer focus:outline-none transition-all uppercase tracking-wider ${getStatusBadgeStyles(service.status)}`}
                            >
                              <option value="servicio agendado" disabled={service.status !== 'servicio agendado' && !isAdmin}>Agendado</option>
                              <option value="vehículo recibido" disabled={service.status !== 'servicio agendado' && service.status !== 'vehículo recibido' && !isAdmin}>Recibido</option>
                              <option value="en proceso" disabled={service.status !== 'servicio agendado' && service.status !== 'vehículo recibido' && service.status !== 'en proceso' && !isAdmin}>En proceso</option>
                              <option value="atendido" disabled={service.status !== 'servicio agendado' && service.status !== 'vehículo recibido' && service.status !== 'en proceso' && service.status !== 'atendido' && !isAdmin}>Atendido</option>
                              <option value="entregado" disabled={service.status !== 'servicio agendado' && service.status !== 'vehículo recibido' && service.status !== 'en proceso' && service.status !== 'atendido' && service.status !== 'entregado' && !isAdmin}>Entregado</option>
                            </select>
                          </td>

                          <td className="py-4 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-2">
                              {/* PRINT REPORT BUTTON */}
                              <button
                                onClick={() => {
                                  if (service.status === 'entregado') {
                                    setPrintService(service);
                                  }
                                }}
                                disabled={service.status !== 'entregado'}
                                className={`p-1 px-2.5 rounded-md inline-flex items-center space-x-1 font-bold text-[10px] uppercase transition-all select-none ${
                                  service.status === 'entregado'
                                    ? "bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-2xs"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                                }`}
                                title={service.status === 'entregado' ? "Imprimir Reporte Técnico" : "Disponible únicamente cuando el servicio esté entregado"}
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>Imprimir</span>
                              </button>

                              <button
                                onClick={() => handleDeleteService(service.id)}
                                className={`p-1 border rounded-md transition-all font-semibold text-[10px] uppercase inline-flex items-center ${
                                  deleteConfirmId === service.id
                                    ? "bg-red-600 hover:bg-red-700 text-white border-red-700 px-2"
                                    : "bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 px-1.5"
                                }`}
                              >
                                {deleteConfirmId === service.id ? "Confirmar" : <Trash2 className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>

      {/* =======================================================
          MODAL 1: RECEPCION DE VEHICULO (AGENDADO -> RECIBIDO)
          ======================================================= */}
      {modalType === 'recepcion' && selectedServiceForModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 my-8">
            
            <div className="bg-neutral-950 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-400">Recepción Taller</h4>
                <p className="text-sm font-bold mt-1 text-slate-100">Fichajes y Evidencia: #{selectedServiceForModal.id.replace('serv-', '').slice(-4).toUpperCase()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                className="text-gray-400 hover:text-white rounded-full p-1.5 bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitRecepcion} className="p-6 space-y-5">
              
              <div className="bg-slate-50 p-3.5 rounded-xl border border-dashed border-slate-205 text-[11px] leading-relaxed select-text space-y-1">
                <div>🚙 <strong>Vehículo:</strong> {selectedServiceForModal.vehicle}</div>
                <div>👤 <strong>Cliente:</strong> {selectedServiceForModal.clientName} ({selectedServiceForModal.clientPhone})</div>
                <div>🏷 <strong>Placas:</strong> {selectedServiceForModal.plate} | 🛠 <strong>Servicio:</strong> {selectedServiceForModal.serviceType}</div>
              </div>

              {/* Photos */}
              <CameraCapture 
                label="Fotografía del estado de recepción del vehículo" 
                onCapture={(b64) => setRecepcionFoto(b64)}
                savedImage={recepcionFoto}
                hideUpload={true}
              />

              {/* Signatures */}
              <SignaturePad 
                title="Firma autógrafa del cliente recibiendo" 
                onSave={(b64) => setRecepcionFirmaCliente(b64)} 
                onClear={() => setRecepcionFirmaCliente('')}
                savedDataUrl={recepcionFirmaCliente}
              />

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Guardar y Cambiar a Recibido
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-gray-300 rounded-xl text-xs font-bold text-gray-650 tracking-wider"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL 2: ATENDIDO (DIAGNOSTICO Y CHECKLIST METICULOSO)
          ======================================================= */}
      {modalType === 'atendido' && selectedServiceForModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 my-8">
            
            <div className="bg-[#1c1d22] text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-[#00bcd4]">Reporte Técnico Taller</h4>
                <p className="text-sm font-bold mt-1 text-slate-100">Checklist Operativo: #{selectedServiceForModal.id.replace('serv-', '').slice(-4).toUpperCase()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                className="text-gray-400 hover:text-white rounded-full p-1.5 bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitAtendido} className="p-6 space-y-5">
              
              <div className="bg-slate-50 p-3 rounded-xl select-text text-[11px] flex justify-between gap-4">
                <div>🚗 <strong>Auto:</strong> {selectedServiceForModal.vehicle} ({selectedServiceForModal.plate})</div>
                <div>⚙️ <strong>Mantenimiento:</strong> {selectedServiceForModal.serviceType}</div>
              </div>

              {/* Checklist Section */}
              <div className="space-y-3">
                <span className="block text-[11px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-1.5 select-none">
                  ✔ Checklist de partes a revisar obligatoriamente:
                </span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2 select-none">
                  {standardChecklistParts.map((part) => (
                    <label 
                      key={part} 
                      className="flex items-center gap-2.5 p-2 border border-slate-200 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <input 
                        type="checkbox" 
                        checked={checklist[part] || false}
                        onChange={(e) => {
                          setChecklist(prev => ({ ...prev, [part]: e.target.checked }));
                        }}
                        className="rounded border-gray-300 w-4.5 h-4.5 text-neutral-900 focus:ring-neutral-800"
                      />
                      <span className="text-[11px] font-bold text-gray-800">{part}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Text Inputs */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Descripción de Trabajos Realizados (Obligatorio)</label>
                  <textarea
                    required
                    value={comentariosMecanico}
                    onChange={(e) => setComentariosMecanico(e.target.value)}
                    rows={2.5}
                    placeholder="Escriba aquí los detalles de la intervención (por ejemplo: cambio de aceite sintético, bujías de iridio nuevas, lavado de inyectores y purgado de líquido de frenos)..."
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-600 uppercase mb-1">Recomendaciones Futuras de Seguridad (Opcional)</label>
                  <textarea
                    value={recomendacionesMecanico}
                    onChange={(e) => setRecomendacionesMecanico(e.target.value)}
                    rows={2}
                    placeholder="Factores preventivos para futuras visitas (ej. reemplazar balatas traseras en 3,000 kilómetros)..."
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-[#131315] hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors cursor-pointer"
                >
                  Registrar Servicio Atendido
                </button>
                <button
                  type="button"
                  onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                  className="px-4 py-3 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-650"
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          MODAL 3: ENTREGADO (VALIDACION IDENTIFICACION Y FIRMAS)
          ======================================================= */}
      {modalType === 'entregado' && selectedServiceForModal && (
        <div className="fixed inset-0 bg-neutral-950/60 flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in select-none">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-101 my-8">
            
            <div className="bg-emerald-950 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">Entrega y Liberación de Llaves</h4>
                <p className="text-sm font-bold mt-1 text-slate-100">Filtros de Seguridad: #{selectedServiceForModal.id.replace('serv-', '').slice(-4).toUpperCase()}</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                className="text-gray-400 hover:text-white rounded-full p-1.5 bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={submitEntregado} className="p-6 space-y-4">
              
              <div className="bg-slate-50 p-3 rounded-lg select-text text-[11px] leading-relaxed flex justify-between items-center">
                <span>🚘 <strong>Auto a entregar:</strong> {selectedServiceForModal.vehicle} ({selectedServiceForModal.plate}) • 👤 <strong>Cliente:</strong> {selectedServiceForModal.clientName}</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">
                  Paso {deliveryStep === 'documentos' ? '1/2' : '2/2'}
                </span>
              </div>

              {deliveryStep === 'documentos' ? (
                <>
                  {/* ID Photos */}
                  <div className="space-y-3">
                    <span className="block text-[11px] font-black text-gray-500 uppercase tracking-widest select-none">
                      Paso 1: Documentos de Identificación (Captura Obligatoria Ambos Lados)
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <CameraCapture 
                        label="INE/ID Frente (Lado de Foto)" 
                        onCapture={(b64) => setDeliveryFotoIdFront(b64)}
                        savedImage={deliveryFotoIdFront}
                        hideUpload={true}
                      />
                      <CameraCapture 
                        label="INE/ID Reverso (Lado de Firma)" 
                        onCapture={(b64) => setDeliveryFotoIdBack(b64)}
                        savedImage={deliveryFotoIdBack}
                        hideUpload={true}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (!deliveryFotoIdFront || !deliveryFotoIdBack) {
                          alert("⚠️ Debe registrar la fotografía de una identificación oficial vigente por AMBOS LADOS (Frente y Reverso) antes de continuar.");
                          return;
                        }
                        setDeliveryStep('firmas');
                      }}
                      className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      Continuar a Firmas
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                      className="px-4 py-3 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-650"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-emerald-50 border border-emerald-200 p-2 text-emerald-800 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>✓ Identificaciones registradas correctamente. Proceda a ingresar las firmas de conformidad.</span>
                  </div>

                  {/* Delivery signatures */}
                  <div className="space-y-3 select-none">
                    <span className="block text-[11px] font-black text-gray-500 uppercase tracking-widest select-none font-bold">
                      Paso 2: Firmas Obligatorias de Descarga
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <SignaturePad 
                        title="Asesor Kioto Entregando" 
                        onSave={(b64) => setDeliveryFirmaAsesor(b64)} 
                        onClear={() => setDeliveryFirmaAsesor('')}
                        savedDataUrl={deliveryFirmaAsesor}
                      />
                      <SignaturePad 
                        title="Cliente Conforme Recibiendo" 
                        onSave={(b64) => setDeliveryFirmaCliente(b64)} 
                        onClear={() => setDeliveryFirmaCliente('')}
                        savedDataUrl={deliveryFirmaCliente}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Liberar y Marcar Como Entregado
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryStep('documentos')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-gray-700 transition-colors"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                      className="px-4 py-3 bg-white hover:bg-slate-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-650"
                    >
                      Cancelar
                    </button>
                  </div>
                </>
              )}

            </form>
          </div>
        </div>
      )}

      {/* =======================================================
          REPORT SERVICE PRINT LAYOUT VIEW OVERLAY
          ======================================================= */}
      {printService && (
        <div id="print-overlay-document" className="fixed inset-0 bg-neutral-900 bg-zinc-950 p-4 md:p-8 z-50 overflow-y-auto animate-fade-in flex flex-col justify-start items-center select-text">
          
          {/* Top controller actions - hidden on paper print */}
          <div className="w-full max-w-4xl bg-zinc-900 text-white rounded-t-2xl p-4 flex items-center justify-between border-b border-zinc-805 print:hidden">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider">Reporte Técnico e Historial de Entrega Oficial</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => window.print()}
                className="p-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold uppercase transition-all flex items-center space-x-1.5 shadow"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Reporte</span>
              </button>
              <button
                onClick={() => setPrintService(null)}
                className="p-2 px-3 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg text-xs transition-colors"
              >
                Cerrar Reporte
              </button>
            </div>
          </div>

          {/* Core Printable Sheet Content */}
          <div id="printable-service-sheet" className="w-full max-w-4xl bg-white text-stone-900 p-8 md:p-12 shadow-2xl relative rounded-b-2xl mb-8 print:m-0 print:p-0 print:shadow-none print:w-full">
            
            {/* Print Friendly CSS Injector */}
            <style>{`
              @media print {
                body {
                  background-color: white !important;
                  color: black !important;
                }
                #print-overlay-document {
                  position: static !important;
                  background-color: white !important;
                  color: black !important;
                  overflow: visible !important;
                  padding: 0 !important;
                }
                #printable-service-sheet {
                  margin: 0 !important;
                  padding: 0 !important;
                  max-width: 100% !important;
                  box-shadow: none !important;
                }
              }
            `}</style>

            {/* Header Block exactly matching professional agency standard */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
              <div>
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-lg bg-neutral-900 text-white flex items-center justify-center font-black text-xl select-none">
                    K
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight leading-none">Kioto Motors S.A. de C.V.</h2>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#666] mt-0.5 mt-1">Taller de Servicio Mecánico Autorizado</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2.5 font-medium leading-relaxed select-text">
                  Calzada del Hueso #382, Col. Villa Lázaro Cárdenas, CDMX, C.P. 14370.<br/>
                  Teléfono de Soporte: (55) 8372-9182 | Email: servicio@kioto.com.mx
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-md leading-none select-none">
                  Folio del Servicio
                </span>
                <div className="text-xl font-black font-mono mt-1 text-slate-900">
                  #{printService.id.replace('serv-', '').slice(-4).toUpperCase()}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-semibold">
                  Fecha Emisión: {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
                <div className="mt-2 text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-widest select-none inline-block pb-1">
                  Transacción: {printService.status.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Informative block: Cliente & Auto */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
              
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 flex items-center select-none">
                  👤 Información del Propietario
                </h4>
                <div className="text-xs space-y-1 text-gray-800">
                  <div><strong>Nombre del Cliente:</strong> <span className="font-semibold text-gray-950">{printService.clientName}</span></div>
                  <div><strong>Celular de Contacto:</strong> <span className="font-mono text-gray-950">{printService.clientPhone}</span></div>
                  <div><strong>Canal de Enlace:</strong> <span className="uppercase font-bold text-gray-650 font-mono text-[9px]">{printService.source || 'asesor'}</span></div>
                  <div><strong>Estatus de Notificación:</strong> <span className="text-emerald-800 font-extrabold text-[9px] uppercase">✓ Canalizado a WhatsApp</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 flex items-center select-none">
                  🚙 Ficha Técnica del Vehículo
                </h4>
                <div className="text-xs space-y-1 text-gray-800">
                  <div><strong>Ficha/Modelo:</strong> <span className="font-semibold text-gray-950">{printService.vehicle}</span></div>
                  <div><strong>Número de Placas:</strong> <span className="font-mono font-bold text-gray-950 bg-gray-100 rounded px-1">{printService.plate}</span></div>
                  <div><strong>NIV (Núm. Serie):</strong> <span className="font-mono text-gray-950">{printService.vin}</span></div>
                  <div><strong>Tipo de Servicio:</strong> <span className="font-semibold text-gray-950">{printService.serviceType}</span></div>
                </div>
              </div>

            </div>

            {/* Diagnostic checklist */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              
              {/* Checklist */}
              <div className="md:col-span-6 space-y-3">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 select-none">
                  📋 Diagnóstico y Estado del Checklist Técnico
                </h4>
                
                <div className="space-y-2 select-text">
                  {standardChecklistParts.map((part) => {
                    const isChecked = printService.checklist?.[part];
                    return (
                      <div key={part} className="flex items-center text-xs justify-between py-1.5 border-b border-gray-100 font-medium">
                        <span className="text-gray-800">{part}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          isChecked 
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-150 font-black' 
                            : 'bg-rose-50 text-rose-700 border border-rose-150'
                        }`}>
                          {isChecked ? '✓ Verificado y OK' : '✗ No Auditado / Corrección'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Remarks */}
              <div className="md:col-span-6 flex flex-col justify-between space-y-4">
                
                <div className="bg-slate-50 border border-gray-200 p-4 rounded-xl space-y-2 flex-grow">
                  <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 select-none">
                    ⚙️ Trabajos Desarrollados en Taller
                  </h4>
                  <p className="text-xs leading-relaxed text-gray-850 whitespace-pre-line italic font-serif">
                    {printService.comentariosMecanico || "Sin observaciones o comentarios de taller registrados todavía."}
                  </p>
                </div>

                <div className="bg-orange-50/50 border border-orange-150 p-4 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-black text-orange-800 tracking-widest uppercase border-b border-orange-200 pb-1 select-none">
                    ⚠️ Recomendaciones de Seguridad Futura
                  </h4>
                  <p className="text-xs leading-relaxed text-orange-950 whitespace-pre-line font-medium">
                    {printService.recomendacionesMecanico || "El vehículo se encuentra en condiciones mecánicas ideales. No requiere aditamentos preventivos de manera urgente."}
                  </p>
                </div>

              </div>

            </div>

            {/* Evidences (Reception & Delivery photos) */}
            <div className="border-t border-gray-200 pt-6 mb-6 select-none grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="text-center bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Evidencia Recepción</span>
                {printService.recepcionFoto ? (
                  <div className="border border-slate-250 bg-[#131315] max-h-36 rounded overflow-hidden flex items-center justify-center">
                    <img src={printService.recepcionFoto} alt="Recepción" className="max-h-36 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="border border-gray-200 h-28 bg-gray-100 flex items-center justify-center text-[11px] text-gray-400 italic font-medium">
                    No registrada
                  </div>
                )}
              </div>

              <div className="text-center bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">INE/ID Frente</span>
                {printService.deliveryFotoIdFront ? (
                  <div className="border border-slate-250 bg-[#131315] max-h-36 rounded overflow-hidden flex items-center justify-center">
                    <img src={printService.deliveryFotoIdFront} alt="ID Frente" className="max-h-36 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="border border-gray-200 h-28 bg-gray-100 flex items-center justify-center text-[11px] text-gray-400 italic font-medium">
                    No registrado
                  </div>
                )}
              </div>

              <div className="text-center bg-slate-50 p-3.5 rounded-xl border border-gray-200 space-y-2">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">INE/ID Reverso</span>
                {printService.deliveryFotoIdBack ? (
                  <div className="border border-slate-250 bg-[#131315] max-h-36 rounded overflow-hidden flex items-center justify-center">
                    <img src={printService.deliveryFotoIdBack} alt="ID Reverso" className="max-h-36 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="border border-gray-200 h-28 bg-gray-100 flex items-center justify-center text-[11px] text-gray-400 italic font-medium">
                    No registrado
                  </div>
                )}
              </div>

            </div>

            {/* Signature Block */}
            <div className="border-t border-gray-200 pt-6 mb-6 select-none grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              
              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-205">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tight">Firma Recepción Cliente</span>
                {printService.recepcionFirmaCliente ? (
                  <div className="flex justify-center max-h-20 max-w-full">
                    <img src={printService.recepcionFirmaCliente} alt="Firma Recibo" className="max-h-20 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-14 font-mono select-none text-[10px] text-zinc-350 italic flex items-center justify-center">Pendiente</div>
                )}
                <div className="border-t border-slate-350 text-[10px] font-extrabold text-[#333] pt-1 leading-none">{printService.clientName}</div>
              </div>

              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-205">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tight">Firma Entrega Asesor</span>
                {printService.deliveryFirmaAsesor ? (
                  <div className="flex justify-center max-h-20 max-w-full">
                    <img src={printService.deliveryFirmaAsesor} alt="Firma Asesor" className="max-h-20 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-14 font-mono select-none text-[10px] text-zinc-350 italic flex items-center justify-center">Pendiente</div>
                )}
                <div className="border-t border-slate-350 text-[10px] font-extrabold text-[#333] pt-1 leading-none">Asesor Técnico Kioto</div>
              </div>

              <div className="space-y-2 bg-slate-50/50 p-3.5 rounded-xl border border-dashed border-slate-205 col-span-1 lg:col-span-2">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-tight">Firma Liberación Cliente</span>
                {printService.deliveryFirmaCliente ? (
                  <div className="flex justify-center max-h-20 max-w-full">
                    <img src={printService.deliveryFirmaCliente} alt="Firma Entrega" className="max-h-20 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-14 font-mono select-none text-[10px] text-zinc-350 italic flex items-center justify-center">Pendiente</div>
                )}
                <div className="border-t border-slate-350 text-[10px] font-extrabold text-[#333] pt-1 leading-none">Propietario / Representante Legal</div>
              </div>

            </div>

            {/* Terms and footnotes indicating strict compliance of Kioto S.A. */}
            <div className="text-[9px] text-zinc-400 font-medium leading-relaxed mt-10 text-center select-text max-w-3xl mx-auto space-y-1">
              <p>
                Los componentes marcados como 'Verificados' han sido inspeccionados rigurosamente conforme a las directivas de seguridad nacional de Kioto Motors.
                Garantía oficial de 3 meses o 5,000 kilómetros aplicable exclusivamente en refacciones y mano de obra registradas en este reporte.
              </p>
              <p className="font-bold">
                Control de Calidad Kioto S.A. de C.V. • Folio de Transacción Digital: {printService.id.toUpperCase()}
              </p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
