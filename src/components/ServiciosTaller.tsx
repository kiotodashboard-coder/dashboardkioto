import React, { useState, useEffect, useRef } from 'react';
import { customFetch } from '../utils/api';
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
import KiotoLogo from './KiotoLogo';

// Helper to auto-crop the ID card image based on predicted coordinates
function cropBase64Image(base64Str: string, cropBox: { ymin: number; xmin: number; ymax: number; xmax: number }): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        // Handle both 0..1 and 0..100 ranges
        const isNormalized = Math.max(cropBox.ymin, cropBox.xmin, cropBox.ymax, cropBox.xmax) <= 1.05;
        const scale = isNormalized ? 1.0 : 100.0;

        const ymin = Math.max(0, Math.min(1.0, cropBox.ymin / scale));
        const xmin = Math.max(0, Math.min(1.0, cropBox.xmin / scale));
        const ymax = Math.max(0, Math.min(1.0, cropBox.ymax / scale));
        const xmax = Math.max(0, Math.min(1.0, cropBox.xmax / scale));

        const cropX = img.width * xmin;
        const cropY = img.height * ymin;
        const cropWidth = img.width * (xmax - xmin);
        const cropHeight = img.height * (ymax - ymin);

        // Sanity check
        if (cropWidth < 10 || cropHeight < 10) {
          resolve(base64Str);
          return;
        }

        canvas.width = cropWidth;
        canvas.height = cropHeight;

        // Draw image section
        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      } catch (err) {
        console.error("Error drawing cropped image:", err);
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
    img.src = base64Str;
  });
}

// ==========================================
// 1. SIGNATURE PAD CANVAS COMPONENT
// ==========================================
interface SignaturePadProps {
  title: string;
  onSave: (base64: string) => void;
  onClear: () => void;
  savedDataUrl?: string;
  heightClass?: string;
  heightAttr?: number;
}

function SignaturePad({ title, onSave, onClear, savedDataUrl, heightClass = 'h-52', heightAttr = 245 }: SignaturePadProps) {
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
    
    // Scale standard client coordinates to actual canvas resolution coordinates
    const scaleX = rect.width ? (canvas.width / rect.width) : 1;
    const scaleY = rect.height ? (canvas.height / rect.height) : 1;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
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
        width={600}
        height={heightAttr}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className={`w-full ${heightClass} bg-white border border-gray-300 rounded-lg cursor-crosshair touch-none`}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={clearCanvas}
          className="text-[10px] text-gray-500 hover:text-rose-600 font-bold uppercase transition-colors animate-fade-in"
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
  fluidMulti?: boolean;
}

function CameraCapture({ label, onCapture, savedImage, hideUpload, fluidMulti }: CameraCaptureProps) {
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

  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn("Could not autoplay video stream:", err);
      });
    }
  }, [isCameraActive, stream]);

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
    
    if (fluidMulti) {
      // Rapid fire! Call callback directly, do not close or set preview element
      onCapture(b64);
      
      // Flash effect for premium feedback on capture
      const container = video.parentElement;
      if (container) {
        container.classList.add('brightness-150');
        setTimeout(() => {
          container.classList.remove('brightness-150');
        }, 120);
      }
    } else {
      setPreview(b64);
      onCapture(b64);
      stopStreaming();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEv) => {
      const result = loadEv.target?.result as string;
      if (fluidMulti) {
        onCapture(result);
      } else {
        setPreview(result);
        onCapture(result);
      }
    };
    reader.readAsDataURL(file);
  };

  // When fluidMulti is true, we never render the local "preview" in the capture component itself,
  // as the list of thumbnails is rendered directly below in the parent container layout.
  const hasLocalPreview = !fluidMulti && preview;

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-gray-250/70 space-y-3.5 shadow-sm">
      <div className="flex justify-between items-center select-none animate-fade-in">
        <span className="text-xs font-black text-slate-800 uppercase tracking-wider">{label}</span>
        {hasLocalPreview && <span className="text-[10px] text-emerald-850 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shadow-xs">📷 CAPTURADA</span>}
        {fluidMulti && isCameraActive && <span className="text-[10px] text-indigo-800 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200 animate-pulse">🔴 EN VIVO</span>}
      </div>

      {hasLocalPreview && (
        <div className="relative border border-gray-300 bg-neutral-900 rounded-xl overflow-hidden min-h-[260px] md:min-h-[360px] flex items-center justify-center shadow-md animate-fade-in">
          <img src={preview!} alt="Vista previa" className="max-h-[380px] md:max-h-[500px] w-full object-contain text-[10px] text-white italic" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => {
              setPreview(null);
              onCapture('');
            }}
            className="absolute top-3 right-3 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg z-10 hover:scale-105 active:scale-95 duration-100"
            title="Eliminar foto"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!hasLocalPreview && !isCameraActive && (
        <div className="flex flex-col gap-2.5">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={startStreaming}
              className={`bg-slate-950 hover:bg-slate-850 text-white text-[11px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow cursor-pointer ${hideUpload ? 'w-full flex-grow' : 'flex-1'}`}
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Cámara en Vivo</span>
            </button>
            {!hideUpload && (
              <label className="flex-1 bg-white hover:bg-slate-50 border border-gray-250 text-gray-700 text-[11px] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all hover:shadow cursor-pointer text-center">
                <Download className="w-4 h-4 rotate-180 text-indigo-505" />
                <span>Cargar Imagen</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
          {cameraError && <p className="text-[10px] leading-snug font-medium text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-100">{cameraError}</p>}
        </div>
      )}

      {isCameraActive && (
        <div className="space-y-3 animate-fade-in">
          <div className="relative bg-black rounded-xl overflow-hidden aspect-[4/3] w-full min-h-[300px] md:min-h-[440px] shadow-inner flex items-center justify-center border border-slate-350">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-white/20 m-4 rounded-lg"></div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={snapPhoto}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3.5 rounded-xl transition-all cursor-pointer shadow-md uppercase tracking-wider hover:scale-[1.01] active:scale-98"
            >
              Tomar Foto
            </button>
            <button
              type="button"
              onClick={stopStreaming}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold py-3.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              Cerrar Cámara
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

  // Premium Custom Alert Popup State
  const [alertPop, setAlertPop] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'error' | 'info';
  } | null>(null);

  const triggerAlertPop = (message: string, title = 'Notificación', type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setAlertPop({
      show: true,
      title,
      message,
      type
    });
  };

  // Active validation modal states
  const [selectedServiceForModal, setSelectedServiceForModal] = useState<ServicioMecanico | null>(null);
  const [modalType, setModalType] = useState<'recepcion' | 'atendido' | 'entregado' | null>(null);

  // Recepcion input temporary storage
  const [recepcionFoto, setRecepcionFoto] = useState('');
  const [recepcionFirmaCliente, setRecepcionFirmaCliente] = useState('');
  const [recepcionStep, setRecepcionStep] = useState<'fotos' | 'comentarios' | 'firma'>('fotos');
  const [recepcionFotos, setRecepcionFotos] = useState<string[]>([]);

  // Diagnostic Checklist parts list
  const standardChecklistParts = [
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
  ];
  
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [comentariosMecanico, setComentariosMecanico] = useState('');
  const [recomendacionesMecanico, setRecomendacionesMecanico] = useState('');

  // Recepcion dynamic customer comments state
  const [comentariosClienteRecepcion, setComentariosClienteRecepcion] = useState('');

  // Dynamic config & collapsible states
  const [isCreateFormExpanded, setIsCreateFormExpanded] = useState(false);
  const [checklistParts, setChecklistParts] = useState<string[]>([]);

  // Delivery input temporary storage
  const [deliveryFotoIdFront, setDeliveryFotoIdFront] = useState('');
  const [deliveryFotoIdBack, setDeliveryFotoIdBack] = useState('');
  const [deliveryFirmaAsesor, setDeliveryFirmaAsesor] = useState('');
  const [deliveryFirmaCliente, setDeliveryFirmaCliente] = useState('');
  const [deliveryStep, setDeliveryStep] = useState<'doc-front' | 'doc-back' | 'firma-cliente' | 'firma-asesor'>('doc-front');
  const [isValidatingFront, setIsValidatingFront] = useState(false);
  const [isValidatingBack, setIsValidatingBack] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [tempB64, setTempB64] = useState('');

  // Core printable viewer parameters
  const [printService, setPrintService] = useState<ServicioMecanico | null>(null);

  const [progConfig, setProgConfig] = useState<{
    maxServicesPerSlot: number;
    slotIntervalMinutes: number;
    openingTime: string;
    closingTime: string;
    checklistItems?: string[];
  } | null>(null);

  useEffect(() => {
    customFetch('/api/config/programming')
      .then(res => res.json())
      .then(data => {
        setProgConfig(data);
        if (data && data.checklistItems && Array.isArray(data.checklistItems)) {
          setChecklistParts(data.checklistItems);
        } else {
          setChecklistParts(standardChecklistParts);
        }
      })
      .catch(err => console.error("Error loading prog parameters:", err));
  }, [services]);

  // Synchronize modal state inputs with the focused service files on launch
  useEffect(() => {
    if (selectedServiceForModal) {
      // Fetch latest configuration programmatically on modal launch
      customFetch('/api/config/programming')
        .then(res => res.json())
        .then(data => {
          setProgConfig(data);
          if (data && data.checklistItems && Array.isArray(data.checklistItems)) {
            setChecklistParts(data.checklistItems);
            if (modalType === 'atendido') {
              const initialCheck: Record<string, boolean> = {};
              data.checklistItems.forEach((p: string) => {
                initialCheck[p] = selectedServiceForModal.checklist?.[p] ?? false;
              });
              setChecklist(initialCheck);
            }
          }
        })
        .catch(err => console.error("Error updating config on modal view:", err));

      if (modalType === 'recepcion') {
        const photoVal = selectedServiceForModal.recepcionFoto || '';
        setRecepcionFoto(photoVal);
        setRecepcionFirmaCliente(selectedServiceForModal.recepcionFirmaCliente || '');
        setComentariosClienteRecepcion(selectedServiceForModal.comentariosClienteRecepcion || '');
        setRecepcionStep('fotos');
        
        // Parse multi photos if applicable
        let initialFotos: string[] = [];
        if (photoVal) {
          if (photoVal.startsWith('[')) {
            try {
              initialFotos = JSON.parse(photoVal);
            } catch (pErr) {
              initialFotos = [photoVal];
            }
          } else {
            initialFotos = [photoVal];
          }
        }
        setRecepcionFotos(initialFotos);
      } else if (modalType === 'atendido') {
        setComentariosMecanico(selectedServiceForModal.comentariosMecanico || '');
        setRecomendacionesMecanico(selectedServiceForModal.recomendacionesMecanico || '');
        
        const initialCheck: Record<string, boolean> = {};
        const activeParts = checklistParts.length > 0 ? checklistParts : standardChecklistParts;
        activeParts.forEach(p => {
          initialCheck[p] = selectedServiceForModal.checklist?.[p] ?? false;
        });
        setChecklist(initialCheck);
      } else if (modalType === 'entregado') {
        setDeliveryFotoIdFront(selectedServiceForModal.deliveryFotoIdFront || '');
        setDeliveryFotoIdBack(selectedServiceForModal.deliveryFotoIdBack || '');
        setDeliveryFirmaAsesor(selectedServiceForModal.deliveryFirmaAsesor || '');
        setDeliveryFirmaCliente(selectedServiceForModal.deliveryFirmaCliente || '');
        setDeliveryStep('doc-front');
        setValidationError('');
      }
    } else {
      // Clear
      setRecepcionFoto('');
      setRecepcionFirmaCliente('');
      setComentariosClienteRecepcion('');
      setRecepcionStep('fotos');
      setRecepcionFotos([]);
      setChecklist({});
      setComentariosMecanico('');
      setRecomendacionesMecanico('');
      setDeliveryFotoIdFront('');
      setDeliveryFotoIdBack('');
      setDeliveryFirmaAsesor('');
      setDeliveryFirmaCliente('');
      setDeliveryStep('doc-front');
      setValidationError('');
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
      const res = await customFetch('/api/servicios', {
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
      const payload: Partial<ServicioMecanico> = {
        status: newStatus,
        ...extraPayload
      };
      if (newStatus === 'entregado' && !payload.deliveredAt) {
        payload.deliveredAt = new Date().toISOString();
      }
      const res = await customFetch(`/api/servicios/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

    // Backward transition check - Strictly Forbid Reversing Status
    if (targetIdx < currentIdx) {
      triggerAlertPop(
        `No está permitido regresar a un estatus anterior una vez que el flujo del taller ha avanzado. No se puede revertir de [${service.status.toUpperCase()}] a [${newStatus.toUpperCase()}].`,
        "Operación Bloqueada",
        "error"
      );
      return;
    }

    // Skip prevention (targetIdx > currentIdx + 1)
    if (targetIdx > currentIdx + 1) {
      triggerAlertPop(
        `No es posible saltar estatus en el flujo del taller. El siguiente estatus correspondiente para este vehículo es: [${statusOrder[currentIdx + 1].toUpperCase()}].`,
        "Cambio de Estatus Bloqueado",
        "warning"
      );
      return;
    }

    // Validate intermediate data or state prerequisites
    // 1. Moving to 'en proceso' (which is index 2, coming from index 1 'vehículo recibido')
    if (newStatus === 'en proceso') {
      if (!service.recepcionFoto || !service.recepcionFirmaCliente) {
        triggerAlertPop(
          "No puede avanzar el estado a 'En Proceso' porque la fase anterior de 'Vehículo Recibido' no está completa. Se requiere primero capturar evidencia de fotos y la firma del cliente.",
          "Faltan Requisitos de Recepción",
          "warning"
        );
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
        triggerAlertPop(
          "No se puede avanzar a 'Entregado' porque la fase anterior de 'Atendido' no está completa. El técnico mecánico debe ingresar el reporte técnico del servicio primero.",
          "Falta Reporte Mecánico",
          "warning"
        );
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
      triggerAlertPop(
        "Debe capturar o cargar una fotografía frontal del vehículo como evidencia de recepción para continuar.",
        "Evidencia Requerida",
        "warning"
      );
      return;
    }
    if (!recepcionFirmaCliente) {
      triggerAlertPop(
        "Se requiere la firma de conformidad autógrafa del cliente en la recepción del vehículo.",
        "Firma Requerida",
        "warning"
      );
      return;
    }

    dispatchStatusUpdate(selectedServiceForModal.id, 'vehículo recibido', {
      recepcionFoto,
      recepcionFirmaCliente,
      comentariosClienteRecepcion
    });
    setSelectedServiceForModal(null);
    setModalType(null);
  };

  const submitAtendido = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceForModal) return;

    if (!comentariosMecanico.trim()) {
      triggerAlertPop(
        "El técnico de taller debe describir obligatoriamente los trabajos realizados en el motor o carrocería del vehículo.",
        "Descripción Requerida",
        "warning"
      );
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
      triggerAlertPop(
        "Debe registrar la fotografía de una identificación oficial vigente por AMBOS LADOS (Frente y Reverso) para validar la entrega.",
        "Identificación Requerida",
        "warning"
      );
      return;
    }
    if (!deliveryFirmaAsesor) {
      triggerAlertPop(
        "Se requiere la firma del Asesor Técnico de Kioto que realiza la entrega formal de llaves.",
        "Firma del Asesor Faltante",
        "warning"
      );
      return;
    }
    if (!deliveryFirmaCliente) {
      triggerAlertPop(
        "Se requiere la firma del Cliente que recibe y valida la entera conformidad del vehículo reparado.",
        "Firma del Cliente Faltante",
        "warning"
      );
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
      const res = await customFetch(`/api/servicios/${id}`, { method: 'DELETE' });
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
      triggerAlertPop("No hay registros de servicios disponibles en este momento para realizar la exportación.", "Sin Datos para Exportar", "info");
      return;
    }
    const headers = ['Folio', 'Cliente', 'Celular', 'Vehículo', 'Placa', 'NIV', 'Servicio', 'Fecha programada', 'Origen', 'Estatus', 'Hora de entrega'];
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
        s.status || '',
        s.deliveredAt ? s.deliveredAt.replace('T', ' ') : ''
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
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
            <div 
              onClick={() => setIsCreateFormExpanded(!isCreateFormExpanded)} 
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="space-y-0.5">
                <h3 className="text-xs font-black tracking-widest text-neutral-800 uppercase flex items-center gap-1.5">
                  📝 Nuevo Servicio
                </h3>
                <p className="text-[10px] text-gray-500 font-medium font-sans">Click para agendar y capturar cita</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition" id="services-form-toggle-btn">
                {isCreateFormExpanded ? (
                  <span className="text-md font-bold text-gray-800">−</span>
                ) : (
                  <span className="text-md font-bold text-gray-800">+</span>
                )}
              </div>
            </div>

            {isCreateFormExpanded && (
              <form onSubmit={handleCreateService} className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in" id="workshop-manual-booking-form">
                
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Cliente</label>
                    <input
                      type="text"
                      required
                      placeholder="Nombre Completo"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Celular</label>
                    <input
                      type="text"
                      required
                      placeholder="WhatsApp (10 dig)"
                      maxLength={10}
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Vehículo (Ficha/Modelo)</label>
                  <input
                    type="text"
                    required
                    placeholder="Kioto Hybrid XL 2025"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                    className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-lg py-2 px-3 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">NIV (Serie)</label>
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
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Placa</label>
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Servicio Requerido</label>
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
                  <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 select-none">Fecha Programada</label>
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
            )}
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
              <table className="w-full text-left border-collapse min-w-[750px] lg:min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 text-[10px] text-gray-500 uppercase tracking-wider font-bold select-none">
                    <th className="py-4 px-3 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={filteredServices.length > 0 && selectedIds.size === filteredServices.length}
                        onChange={handleToggleSelectAll}
                        className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="py-4 px-2.5">Folio / Vehículo</th>
                    <th className="py-4 px-2.5">Servicio Requerido</th>
                    <th className="py-4 px-2.5">Fecha Cita</th>
                    <th className="py-4 px-2.5">Hora de Entrega</th>
                    <th className="py-4 px-2.5">Origen</th>
                    <th className="py-4 px-2.5">Estatus</th>
                    <th className="py-4 px-2.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-16 text-center text-gray-400 font-medium italic">
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
                          <td className="py-3.5 px-3 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(service.id)}
                              onChange={() => handleToggleSelectOne(service.id)}
                              className="rounded border-gray-300 w-4 h-4 cursor-pointer"
                            />
                          </td>

                          <td className="py-3.5 px-2.5">
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

                          <td className="py-3.5 px-2.5">
                            <div className="font-bold text-gray-900">{service.serviceType}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5 font-mono">{service.clientName} ({service.clientPhone})</div>
                          </td>

                          <td className="py-3.5 px-2.5 font-semibold text-gray-900">
                            {formattedDate}
                          </td>

                          <td className="py-3.5 px-2.5 font-semibold text-emerald-800 font-sans">
                            {service.deliveredAt ? (
                              (() => {
                                const dDateObj = new Date(service.deliveredAt);
                                return isNaN(dDateObj.getTime())
                                  ? service.deliveredAt.replace('T', ' ')
                                  : `${String(dDateObj.getDate()).padStart(2, '0')}/${String(dDateObj.getMonth() + 1).padStart(2, '0')}/${dDateObj.getFullYear()} - ${String(dDateObj.getHours()).padStart(2, '0')}:${String(dDateObj.getMinutes()).padStart(2, '0')} hrs`;
                              })()
                            ) : (
                              <span className="text-gray-300 font-normal italic">No entregado aún</span>
                            )}
                          </td>

                          <td className="py-3.5 px-2.5">
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

                          <td className="py-3.5 px-2.5">
                            {(() => {
                              const statusOrder = ['servicio agendado', 'vehículo recibido', 'en proceso', 'atendido', 'entregado'];
                              const curIdx = statusOrder.indexOf(service.status);
                              return (
                                <select
                                  value={service.status}
                                  onChange={(e) => handleStatusChangeRequest(service, e.target.value as any)}
                                  className={`text-[11px] font-black rounded-lg px-2 py-1.5 border cursor-pointer focus:outline-none transition-all uppercase tracking-wider ${getStatusBadgeStyles(service.status)}`}
                                >
                                  <option value="servicio agendado" disabled={0 < curIdx || 0 > curIdx + 1}>Agendado</option>
                                  <option value="vehículo recibido" disabled={1 < curIdx || 1 > curIdx + 1}>Recibido</option>
                                  <option value="en proceso" disabled={2 < curIdx || 2 > curIdx + 1}>En proceso</option>
                                  <option value="atendido" disabled={3 < curIdx || 3 > curIdx + 1}>Atendido</option>
                                  <option value="entregado" disabled={4 < curIdx || 4 > curIdx + 1}>Entregado</option>
                                </select>
                              );
                            })()}
                          </td>

                          <td className="py-3.5 px-2.5 text-right whitespace-nowrap">
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
                <p className="text-sm font-bold mt-1 text-slate-100">Evidencia de Fichaje: #{selectedServiceForModal.id.replace('serv-', '').slice(-4).toUpperCase()}</p>
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
              
              {recepcionStep !== 'fotos' && (
                <div className="bg-slate-50 p-3 rounded-xl text-[11.5px] leading-relaxed select-text space-y-0.5">
                  <div>🚙 <strong>Vehículo:</strong> {selectedServiceForModal.vehicle} | Placas: <strong>{selectedServiceForModal.plate}</strong></div>
                  <div>👤 <strong>Cliente:</strong> {selectedServiceForModal.clientName} | Estatus: <span className="bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.2 rounded uppercase text-[9px]">Paso {recepcionStep === 'comentarios' ? '2/3: Comentarios' : '3/3: Firma'}</span></div>
                </div>
              )}

              {recepcionStep === 'fotos' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-indigo-950 text-[10.5px] leading-relaxed">
                    <strong>Paso 1: Captura Técnica de Inventario</strong>
                    <p className="text-gray-600 mt-0.5">Por favor, capture al menos <strong>6 fotografías</strong> que evidencien todo el contorno y el estado inicial del vehículo. Se ha optimizado para que las capture una tras otra de forma integrada y veloz.</p>
                  </div>

                  {/* Camera */}
                  <CameraCapture 
                    label="Lente de Captura Continuo (Tome fotos seguidas)" 
                    onCapture={(b64) => {
                      if (b64) {
                        setRecepcionFotos(prev => {
                          const updated = [...prev, b64];
                          setRecepcionFoto(JSON.stringify(updated));
                          return updated;
                        });
                      }
                    }}
                    hideUpload={true}
                    fluidMulti={true}
                  />

                  {/* Thumbnail lists */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase text-gray-500 tracking-wider">
                      <span>Imágenes Registradas:</span>
                      <span className={recepcionFotos.length < 6 ? 'text-rose-600 font-extrabold' : 'text-emerald-700'}>
                        {recepcionFotos.length} de 6 requeridas
                      </span>
                    </div>

                    {recepcionFotos.length === 0 ? (
                      <div className="border-2 border-dashed border-gray-200 rounded-xl py-6 text-center text-xs text-gray-400 font-medium">
                        Ninguna fotografía capturada aún
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-48 p-1 border border-slate-100 rounded-xl">
                        {recepcionFotos.map((f, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video bg-neutral-900 group">
                            <img src={f} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => {
                                const updated = recepcionFotos.filter((_, i) => i !== idx);
                                setRecepcionFotos(updated);
                                setRecepcionFoto(updated.length > 0 ? JSON.stringify(updated) : '');
                              }}
                              className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 cursor-pointer shadow-md transition-colors"
                              title="Retirar fotografía"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                            <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[8px] font-bold px-1 py-0.2 rounded select-none">
                              F-{idx + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (recepcionFotos.length < 6) {
                          triggerAlertPop(
                            `Debe capturar un mínimo obligatorio de 6 fotografías que cubran los 4 costados, odómetro y motor para fines de inventario del vehículo. Lleva registradas: ${recepcionFotos.length} de 6.`,
                            "Falta Evidencia Fotográfica",
                            "warning"
                          );
                          return;
                        }
                        setRecepcionStep('comentarios');
                      }}
                      className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      Continuar a Comentarios
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                      className="px-4 py-3 bg-white hover:bg-slate-50 border border-gray-350 rounded-xl text-xs font-bold text-gray-650"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {recepcionStep === 'comentarios' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-indigo-50 border border-indigo-100 p-3 rounded-xl text-indigo-950 text-[10.5px] leading-relaxed">
                    <strong>Paso 2: Especificaciones y Detalles del Cliente</strong>
                    <p className="text-gray-600 mt-0.5">Indique detalladamente si el cliente reporta algún ruido, falla específica o si desea que se preste especial atención a algún componente del vehículo.</p>
                  </div>

                  {/* Customer reception comments input */}
                  <div className="space-y-2 pt-1.5">
                    <label className="block text-[11px] font-black text-gray-700 uppercase tracking-wider select-none">
                      📝 Comentarios / Solicitudes particulares del cliente:
                    </label>
                    <textarea
                      value={comentariosClienteRecepcion}
                      onChange={(e) => setComentariosClienteRecepcion(e.target.value)}
                      rows={6}
                      placeholder="Ingrese indicaciones especiales del cliente (ej. revisar ruido en suspensión delantera izquierda al pasar topes, testigo encendido de bolsas de aire)..."
                      className="w-full bg-white border border-gray-250 text-gray-950 placeholder-gray-400 rounded-2xl p-3.5 text-xs focus:ring-1 focus:ring-neutral-900 focus:outline-none focus:border-neutral-900 shadow-xs"
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setRecepcionStep('firma')}
                      className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      Continuar a Firma del Cliente
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecepcionStep('fotos')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-250 rounded-xl text-xs font-bold text-gray-700 transition"
                    >
                      Atrás
                    </button>
                  </div>
                </div>
              )}

              {recepcionStep === 'firma' && (
                <div className="space-y-4 animate-fade-in">
                  {/* Signatures (Make pad significantly larger for easier signing) */}
                  <SignaturePad 
                    title="Firma autógrafa del cliente recibiendo" 
                    onSave={(b64) => setRecepcionFirmaCliente(b64)} 
                    onClear={() => setRecepcionFirmaCliente('')}
                    savedDataUrl={recepcionFirmaCliente}
                    heightClass="h-64 md:h-72"
                    heightAttr={320}
                  />

                  <div className="flex gap-3 pt-3 border-t border-gray-100">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      {loading ? 'Procesando...' : 'Guardar y Cambiar a Recibido'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRecepcionStep('comentarios')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-250 rounded-xl text-xs font-bold text-gray-700 transition"
                    >
                      Atrás
                    </button>
                  </div>
                </div>
              )}

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
                
                <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 max-h-56 overflow-y-auto shadow-inner select-none">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                     {(checklistParts.length > 0 ? checklistParts : standardChecklistParts).map((part) => (
                      <label 
                        key={part} 
                        className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-350 rounded-lg cursor-pointer transition-colors"
                      >
                        <input 
                          type="checkbox" 
                          checked={checklist[part] || false}
                          onChange={(e) => {
                            setChecklist(prev => ({ ...prev, [part]: e.target.checked }));
                          }}
                          className="rounded border-gray-300 w-4 h-4 text-neutral-900 focus:ring-neutral-800"
                        />
                        <span className="text-[11px] font-bold text-gray-600">{part}</span>
                      </label>
                    ))}
                  </div>
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
                <span>🚘 <strong>Auto:</strong> {selectedServiceForModal.vehicle} | Placas: <strong>{selectedServiceForModal.plate}</strong></span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-1 rounded-full uppercase shrink-0">
                  {deliveryStep === 'doc-front' && 'Paso 1/4: Foto Frente'}
                  {deliveryStep === 'doc-back' && 'Paso 2/4: Foto Reverso'}
                  {deliveryStep === 'firma-cliente' && 'Paso 3/4: Firma Cliente'}
                  {deliveryStep === 'firma-asesor' && 'Paso 4/4: Firma Asesor'}
                </span>
              </div>

              {/* Step 1: Front ID */}
              {deliveryStep === 'doc-front' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-neutral-900 text-[10.5px] leading-relaxed">
                    <strong>Paso 1: Foto Frontal de Identificación Oficial</strong>
                    <p className="text-gray-500 mt-0.5">Capture una identificación oficial vigente del titular (INE, Licencia de Conducir, Cédula Profesional o Cartilla Militar).</p>
                  </div>

                  {isValidatingFront ? (
                    <div className="border border-emerald-150 rounded-xl py-12 bg-emerald-50/20 text-center space-y-3 animate-pulse">
                      <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-emerald-800">Verificando validez del ID con Inteligencia Artificial...</p>
                    </div>
                  ) : (
                    <CameraCapture 
                      label="Capturar ID Frente (Lado Foto)" 
                      onCapture={async (b64) => {
                        if (!b64) {
                          setDeliveryFotoIdFront('');
                          setTempB64('');
                          return;
                        }
                        setTempB64(b64);
                        setIsValidatingFront(true);
                        setValidationError('');
                        try {
                          const res = await fetch('/api/ai/validate-id', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image64: b64, side: 'front' })
                          });
                          const data = await res.json();
                          if (data.isValid) {
                            let processedB64 = b64;
                            if (data.cropBox) {
                              try {
                                processedB64 = await cropBase64Image(b64, data.cropBox);
                              } catch (cropErr) {
                                console.warn("Auto-cropping failed, using original", cropErr);
                              }
                            }
                            setDeliveryFotoIdFront(processedB64);
                            setTempB64('');
                            triggerAlertPop(`Identificación Válida: Lado Frontal de ${data.idType || 'INE'}.\n\nEstatus: ${data.message || 'Se verificó con éxito y se recortó automáticamente para centrar la credencial.'}`, "Verificación Exitosa", "success");
                            setDeliveryStep('doc-back');
                          } else {
                            setDeliveryFotoIdFront('');
                            setValidationError(`⚠️ No es una identificación oficial válida. ${data.message}`);
                            triggerAlertPop(`Documento Inválido\n\n${data.message || 'Asegúrese de capturar un ID oficial válido (INE, Licencia, Cédula o Cartilla).'}`, "Identificación Inválida", "error");
                          }
                        } catch (err) {
                          console.warn("API Error validation fallback: ", err);
                          setDeliveryFotoIdFront('');
                          setValidationError("⚠️ ID inválida: No se pudo verificar como identificación oficial. Asegúrese de capturar un ID oficial vigente (INE, Licencia, Cédula o Cartilla) con iluminación delantera nítida.");
                          triggerAlertPop("No fue posible validar el documento como una identificación oficial mexicana válida.", "ID Inválida", "error");
                        } finally {
                          setIsValidatingFront(false);
                        }
                      }}
                      savedImage={deliveryFotoIdFront}
                      hideUpload={true}
                    />
                  )}

                  {validationError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg text-[10.5px] leading-relaxed font-semibold">
                      {validationError}
                    </div>
                  )}

                  {validationError && tempB64 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-2.5 shadow-sm animate-fade-in">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>¿La identificación es correcta pero la IA la rechaza?</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryFotoIdFront(tempB64);
                          setTempB64('');
                          setValidationError('');
                          triggerAlertPop("Identificación frontal aprobada manualmente por el Asesor.", "Aprobación Manual", "success");
                          setDeliveryStep('doc-back');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-lg transition-colors text-[10.5px] uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        Aprobar Captura Manualmente de Frente y Avanzar
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isValidatingFront}
                      onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-650"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Back ID */}
              {deliveryStep === 'doc-back' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-neutral-900 text-[10.5px] leading-relaxed">
                    <strong>Paso 2: Foto Reverso de Identificación Oficial</strong>
                    <p className="text-gray-500 mt-0.5">Capture el reverso de la identificación oficial (donde se observa la firma autógrafa, sello o código de barras).</p>
                  </div>

                  {isValidatingBack ? (
                    <div className="border border-emerald-150 rounded-xl py-12 bg-emerald-50/20 text-center space-y-3 animate-pulse">
                      <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-emerald-800">Validando autenticidad del reverso...</p>
                    </div>
                  ) : (
                    <CameraCapture 
                      label="Capturar ID Reverso (Lado Firma)" 
                      onCapture={async (b64) => {
                        if (!b64) {
                          setDeliveryFotoIdBack('');
                          setTempB64('');
                          return;
                        }
                        setTempB64(b64);
                        setIsValidatingBack(true);
                        setValidationError('');
                        try {
                          const res = await fetch('/api/ai/validate-id', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ image64: b64, side: 'back' })
                          });
                          const data = await res.json();
                          if (data.isValid) {
                            let processedB64 = b64;
                            if (data.cropBox) {
                              try {
                                processedB64 = await cropBase64Image(b64, data.cropBox);
                              } catch (cropErr) {
                                console.warn("Auto-cropping failed, using original", cropErr);
                              }
                            }
                            setDeliveryFotoIdBack(processedB64);
                            setTempB64('');
                            triggerAlertPop(`Identificación Válida: Lado Reverso verificado correctamente. El fondo se ha recortado automáticamente para centrar la credencial.`, "Verificación Exitosa", "success");
                            setDeliveryStep('firma-cliente');
                          } else {
                            setDeliveryFotoIdBack('');
                            setValidationError(`⚠️ Reverso no válido. ${data.message}`);
                            triggerAlertPop(`Reverso Inválido\n\n${data.message || 'Asegúrese de tomar foto al lado reverso del documento de identidad.'}`, "Reverso no Válido", "error");
                          }
                        } catch (err) {
                          console.warn("API Error validation back fallback: ", err);
                          setDeliveryFotoIdBack('');
                          setValidationError("⚠️ ID inválida: No se pudo verificar el reverso como identificación oficial. Asegúrese de capturar la parte trasera del documento con iluminación nítida.");
                          triggerAlertPop("No fue posible validar el reverso del documento como una identificación oficial mexicana válida.", "ID Reverso Inválida", "error");
                        } finally {
                          setIsValidatingBack(false);
                        }
                      }}
                      savedImage={deliveryFotoIdBack}
                      hideUpload={true}
                    />
                  )}

                  {validationError && (
                    <div className="bg-rose-50 border border-rose-100 text-rose-800 p-3 rounded-lg text-[10.5px] leading-relaxed font-semibold">
                      {validationError}
                    </div>
                  )}

                  {validationError && tempB64 && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-xl text-xs space-y-2.5 shadow-sm animate-fade-in">
                      <p className="font-semibold flex items-center gap-1.5">
                        <span>⚠️</span>
                        <span>¿El reverso es correcto pero la IA lo rechaza?</span>
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDeliveryFotoIdBack(tempB64);
                          setTempB64('');
                          setValidationError('');
                          triggerAlertPop("Reverso de identificación aprobado manualmente por el Asesor.", "Aprobación Manual", "success");
                          setDeliveryStep('firma-cliente');
                        }}
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 px-3 rounded-lg transition-colors text-[10.5px] uppercase tracking-wider cursor-pointer shadow-xs"
                      >
                        Aprobar Captura Manualmente de Reverso y Avanzar
                      </button>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryStep('doc-front')}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-gray-700 transition"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSelectedServiceForModal(null); setModalType(null); }}
                      className="flex-1 py-2.5 bg-white hover:bg-slate-50 border border-gray-300 rounded-lg text-xs font-bold text-gray-650"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Client Signature */}
              {deliveryStep === 'firma-cliente' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 text-emerald-800 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1.5 shrink-0">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Identificación Oficial Validada por Ambos Lados</span>
                  </div>

                  <SignaturePad 
                    title="Firma autógrafa del cliente conforme recibiendo" 
                    onSave={(b64) => setDeliveryFirmaCliente(b64)} 
                    onClear={() => setDeliveryFirmaCliente('')}
                    savedDataUrl={deliveryFirmaCliente}
                  />

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!deliveryFirmaCliente) {
                          triggerAlertPop("Debe registrar la firma de conformidad autógrafa del cliente antes de avanzar.", "Firma Requerida", "warning");
                          return;
                        }
                        setDeliveryStep('firma-asesor');
                      }}
                      className="flex-1 py-3 bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-all cursor-pointer text-center"
                    >
                      Guardar y Continuar a Firma de Asesor
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryStep('doc-back')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-gray-700 transition"
                    >
                      Atrás
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Advisor Signature */}
              {deliveryStep === 'firma-asesor' && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-2 text-emerald-800 text-[10px] font-bold rounded-lg uppercase flex items-center gap-1.5 shrink-0 animate-fade-in">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>✓ Identificación y Firma del Cliente Registradas</span>
                  </div>

                  <SignaturePad 
                    title="Firma autógrafa del Asesor Técnico autorizando entrega" 
                    onSave={(b64) => setDeliveryFirmaAsesor(b64)} 
                    onClear={() => setDeliveryFirmaAsesor('')}
                    savedDataUrl={deliveryFirmaAsesor}
                  />

                  <div className="flex gap-3 pt-2 animate-fade-in">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-emerald-800 hover:bg-emerald-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-md transition-colors cursor-pointer"
                    >
                      Liberar y Marcar Como Entregado
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryStep('firma-cliente')}
                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-gray-700 transition"
                    >
                      Atrás
                    </button>
                  </div>
                </div>
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
                <div className="flex items-center space-x-3.5">
                  <KiotoLogo className="h-11 w-auto" />
                  <div>
                    <h2 className="text-xl font-black text-neutral-900 tracking-tight leading-none">Kioto Motors S.A. de C.V.</h2>
                    <p className="text-[9px] font-extrabold uppercase tracking-widest text-[#666] mt-1">Taller de Servicio Mecánico Autorizado</p>
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 mt-2.5 font-medium leading-relaxed select-text">
                  Dirección: Av Instituto Politécnico Nacional 1999, Lindavista Nte., Gustavo A. Madero, 07300 Ciudad de México, CDMX<br/>
                  Teléfono: 5574897163 | Email: 118.coord.bdc@nissankioto.com.mx
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
                <div className="mt-2 flex flex-col items-end gap-1.5">
                  <div className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 uppercase tracking-widest select-none inline-block pb-1">
                    Estatus: {printService.status === 'entregado' ? 'Entregado' : printService.status.toUpperCase()}
                  </div>
                  {(() => {
                    const deliveryTimeStr = printService.deliveredAt || printService.statusHistory?.entregado;
                    if (deliveryTimeStr) {
                      const dObj = new Date(deliveryTimeStr);
                      const formattedDelivered = isNaN(dObj.getTime())
                        ? deliveryTimeStr
                        : `${String(dObj.getDate()).padStart(2, '0')}/${String(dObj.getMonth() + 1).padStart(2, '0')}/${dObj.getFullYear()} - ${String(dObj.getHours()).padStart(2, '0')}:${String(dObj.getMinutes()).padStart(2, '0')} hrs`;
                      return (
                        <div className="text-[9.5px] font-black text-emerald-800 bg-emerald-50/80 px-2 py-1.5 rounded border border-emerald-250 uppercase tracking-wide select-none inline-block shadow-3xs leading-none">
                          🕒 Entregado: {formattedDelivered}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>
            </div>

            {/* Informative block: Cliente & Auto */}
            <div className="bg-slate-50 border border-gray-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-5">
              
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 flex items-center select-none">
                  👤 Información del Propietario
                </h4>
                <div className="text-xs space-y-1 text-gray-800">
                  <div><strong>Nombre del Cliente:</strong> <span className="font-semibold text-gray-950">{printService.clientName}</span></div>
                  <div><strong>Celular de Contacto:</strong> <span className="font-mono text-gray-950">{printService.clientPhone}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1 flex items-center select-none">
                  🚙 Ficha Técnica del Vehículo
                </h4>
                <div className="text-xs space-y-1 text-gray-850">
                  <div><strong>Ficha/Modelo:</strong> <span className="font-semibold text-gray-950">{printService.vehicle}</span></div>
                  <div><strong>Número de Placas:</strong> <span className="font-mono font-bold text-gray-950 bg-gray-100 rounded px-1">{printService.plate}</span></div>
                  <div><strong>NIV (Núm. Serie):</strong> <span className="font-mono text-gray-950">{printService.vin}</span></div>
                  <div><strong>Tipo de Servicio:</strong> <span className="font-semibold text-gray-950">{printService.serviceType}</span></div>
                </div>
              </div>

            </div>

            {/* Firma de Recepción del Cliente (Enseguida de los datos) */}
            <div className="border border-gray-200 rounded-xl p-4 bg-slate-50/50 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase select-none">
                  ✍️ Firma de Recepción de la Unidad
                </h4>
                <p className="text-[10px] text-gray-500 leading-relaxed max-w-sm">
                  Firma estampada por el cliente al ingresar el auto, autorizando el diagnóstico del checklist y avalando el inventario fotográfico inicial.
                </p>
              </div>
              <div className="shrink-0 w-56 border border-dashed border-gray-300 p-2 rounded-lg bg-white text-center">
                {printService.recepcionFirmaCliente ? (
                  <div className="flex justify-center max-h-16">
                    <img src={printService.recepcionFirmaCliente} alt="Firma Recepción" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-10 text-[9px] text-zinc-350 italic flex items-center justify-center font-mono">Pendiente</div>
                )}
                <div className="border-t border-slate-200 text-[9px] font-extrabold text-[#333] pt-1 mt-1 leading-none">
                  {printService.clientName}
                </div>
              </div>
            </div>

            {/* Comentarios particulares de recepción (per requirement 6: "Añade comentarios del cliente al recibir el vehiculo, despues de la firma del cliente, por si quiere que se revise algo en especifico") */}
            {printService.comentariosClienteRecepcion && (
              <div className="border border-indigo-200 rounded-xl p-4 mb-5 bg-indigo-50/25">
                <h4 className="text-[11px] font-black text-indigo-850 tracking-widest uppercase border-b border-indigo-200 pb-1.5 mb-2 select-none">
                  📝 Instrucciones Especiales y Síntomas Reportados por el Cliente
                </h4>
                <p className="text-xs text-gray-800 font-medium italic leading-relaxed whitespace-pre-line select-text">
                  "{printService.comentariosClienteRecepcion}"
                </p>
              </div>
            )}

            {/* Evidencia fotográfica de recepción (Ampliada y más visible!) */}
            <div className="border border-gray-200 rounded-xl p-5 mb-5 bg-slate-50">
              <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1.5 mb-3.5 select-none">
                📸 Evidencia Fotográfica de Recepción (Inventario Detallado del Vehículo)
              </h4>
              {printService.recepcionFoto ? (
                (() => {
                  let images: string[] = [];
                  if (printService.recepcionFoto.startsWith('[')) {
                    try {
                      images = JSON.parse(printService.recepcionFoto);
                    } catch (e) {
                      images = [printService.recepcionFoto];
                    }
                  } else {
                    images = [printService.recepcionFoto];
                  }
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {images.map((imgUrl, idx) => (
                        <div key={idx} className="border border-slate-200 bg-black rounded-xl overflow-hidden aspect-video flex items-center justify-center shadow-sm">
                          <img src={imgUrl} alt={`Recepción ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="border border-slate-200 py-10 bg-slate-100 flex items-center justify-center text-xs text-gray-400 italic rounded-xl">
                  Ninguna fotografía de inventario registrada.
                </div>
              )}
            </div>

            {/* Checklist Técnico acomodado a lo ancho de la hoja (3-Column Grid) */}
            <div className="border border-gray-200 rounded-xl p-5 mb-5 bg-white shadow-xs">
              <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1.5 mb-3.5 select-none">
                📋 Diagnóstico Completo y Checklist Técnico Vehicular
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1.5 select-text text-xs">
                {(() => {
                  const configured = checklistParts.length > 0 ? checklistParts : standardChecklistParts;
                  const customizedKeys = Object.keys(printService.checklist || {});
                  const allKeys = Array.from(new Set([...configured, ...customizedKeys]));
                  return allKeys.map((part) => {
                    const isChecked = printService.checklist?.[part];
                    return (
                      <div key={part} className="flex items-center space-x-2.5 py-1.5 border-b border-slate-50 select-text">
                        {isChecked ? (
                          <div className="w-4.5 h-4.5 rounded-full border-2 border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <span className="text-[10px] font-extrabold leading-none">✓</span>
                          </div>
                        ) : (
                          <div className="w-4.5 h-4.5 rounded-full border border-slate-250 bg-white shrink-0" />
                        )}
                        <span className={`text-[11.5px] leading-tight tracking-tight ${isChecked ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
                          {part}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Trabajos desarrollados en taller (Sección debajo del checklist) */}
            <div className="border border-gray-200 rounded-xl p-5 mb-5 bg-slate-50/50">
              <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-1.5 mb-2.5 select-none">
                ⚙️ Trabajos Desarrollados en Taller
              </h4>
              <div className="text-xs leading-relaxed text-gray-850 whitespace-pre-line font-medium italic min-h-[4rem] px-1 select-text">
                {printService.comentariosMecanico || "Sin observaciones o bitácora de intervenciones mecánicas registrada."}
              </div>
            </div>

            {/* Recomendaciones */}
            <div className="border border-orange-200 rounded-xl p-5 mb-5 bg-orange-50/20">
              <h4 className="text-[11px] font-black text-orange-800 tracking-widest uppercase border-b border-orange-200 pb-1.5 mb-2.5 select-none">
                ⚠️ Recomendaciones de Seguridad Futura
              </h4>
              <div className="text-xs leading-relaxed text-orange-950 whitespace-pre-line font-semibold select-text">
                {printService.recomendacionesMecanico || "El vehículo se encuentra en óptimas condiciones. Se recomienda programar su próximo chequeo en 5,000 km o 6 meses."}
              </div>
            </div>

            {/* Fotografías de Identificación de Cliente (Frente y Reverso) */}
            <div className="border border-gray-200 rounded-xl p-5 mb-6 bg-slate-50">
              <h4 className="text-[11px] font-black text-slate-500 tracking-widest uppercase border-b border-gray-200 pb-2 mb-4 select-none">
                🪪 Fotografías de Identificación Oficial (Vigente para Entrega)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificación Oficial - Frente</span>
                  {printService.deliveryFotoIdFront ? (
                    <div className="border border-slate-200 bg-neutral-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                      <img src={printService.deliveryFotoIdFront} alt="ID Frente" className="max-h-36 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="border border-gray-150 py-10 bg-gray-50 flex items-center justify-center text-[11px] text-gray-400 italic">No capturado</div>
                  )}
                </div>

                <div className="text-center bg-white p-3 rounded-xl border border-gray-200 space-y-2">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificación Oficial - Reverso</span>
                  {printService.deliveryFotoIdBack ? (
                    <div className="border border-slate-200 bg-neutral-900 rounded-xl overflow-hidden aspect-video flex items-center justify-center">
                      <img src={printService.deliveryFotoIdBack} alt="ID Reverso" className="max-h-36 object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="border border-gray-150 py-10 bg-gray-50 flex items-center justify-center text-[11px] text-gray-400 italic">No capturado</div>
                  )}
                </div>
              </div>
            </div>

            {/* Signatures of Client and Adviser */}
            <div className="border-t border-gray-200 pt-5 mb-5 select-none grid grid-cols-2 gap-6 text-center">
              
              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Firma Entrega Asesor</span>
                {printService.deliveryFirmaAsesor ? (
                  <div className="flex justify-center max-h-16">
                    <img src={printService.deliveryFirmaAsesor} alt="Firma Asesor" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-10 text-[9px] text-zinc-350 italic flex items-center justify-center font-mono">Pendiente</div>
                )}
                <div className="border-t border-slate-200 text-[9px] font-black text-[#333] pt-1 leading-none uppercase tracking-wide">
                  Asesor de Servicio Técnico Kioto
                </div>
              </div>

              <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-300">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Firma Liberación Cliente</span>
                {printService.deliveryFirmaCliente ? (
                  <div className="flex justify-center max-h-16">
                    <img src={printService.deliveryFirmaCliente} alt="Firma Liberación" className="max-h-16 object-contain" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="h-10 text-[9px] text-zinc-350 italic flex items-center justify-center font-mono">Pendiente</div>
                )}
                <div className="border-t border-slate-200 text-[9px] font-black text-[#333] pt-1 leading-none uppercase tracking-wide">
                  Propietario / Representante Legal
                </div>
              </div>

            </div>

            {/* Terms and footnotes indicating digital receipt and privacy */}
            <div className="text-[9.5px] text-zinc-400 font-medium leading-relaxed mt-10 text-center select-text max-w-3xl mx-auto space-y-1">
              <p>
                Este documento es un comprobante digital generado por el sistema Kioto Dashboard. La información contenida es confidencial y para uso exclusivo de la agencia y el cliente. Al firmar, el cliente acepta de conformidad los trabajos realizados y la recepción de su unidad.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* =======================================================
          PREMIUM CUSTOM POPUP MODAL (tipo pop) 
          ======================================================= */}
      {alertPop && alertPop.show && (
        <div 
          id="custom-dialog-popup" 
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in"
        >
          <div 
            id="custom-dialog-card" 
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 flex flex-col items-center text-center p-6 space-y-4 animate-scale-up"
          >
            {/* Conditional Premium Icon Backdrop */}
            <div className="flex items-center justify-center">
              {alertPop.type === 'success' && (
                <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
              )}
              {alertPop.type === 'warning' && (
                <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center border border-amber-100">
                  <AlertCircle className="w-8 h-8" />
                </div>
              )}
              {alertPop.type === 'error' && (
                <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center border border-rose-100">
                  <AlertCircle className="w-8 h-8 text-rose-600" />
                </div>
              )}
              {alertPop.type === 'info' && (
                <div className="w-14 h-14 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center border border-sky-100">
                  <AlertCircle className="w-8 h-8 text-sky-500" />
                </div>
              )}
            </div>

            {/* Typography pairings */}
            <div className="space-y-1.5 w-full select-text">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest leading-none">
                {alertPop.title}
              </h4>
              <p className="text-xs font-medium text-slate-500 leading-relaxed max-h-48 overflow-y-auto px-2">
                {alertPop.message}
              </p>
            </div>

            {/* Accept action button */}
            <button
              type="button"
              id="close-dialog-btn"
              onClick={() => setAlertPop(null)}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
