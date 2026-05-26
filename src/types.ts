/**
 * Shared Type Definitions for Kioto Dashboard
 */

export type UserRole = 'Admin' | 'Servicio';

export interface User {
  id: string;
  username: string;
  password?: string; // Opt in password for login context
  role: UserRole;
  name: string;
  createdAt: string;
}

// Service model (Mechanical service)
export interface ServicioMecanico {
  id: string;
  clientName: string;
  clientPhone: string;
  vehicle: string; // vehicle details
  vin: string; // NIV (Número de Identificación Vehicular)
  plate: string; // Placa
  serviceType: string; // e.g., cambio de aceite, afinación, frenos
  appointmentDate: string; // YYYY-MM-DDTHH:mm representation
  assignedServiceUser: string; // service specialist doing the work
  status: 'servicio agendado' | 'vehículo recibido' | 'en proceso' | 'atendido' | 'entregado';
  source: 'asesor' | 'chatbot' | 'whatsapp' | 'facebook';
  notes: string;
  createdAt: string;

  // New evidence/validation fields for mechanical process
  recepcionFoto?: string; // Base64 picture of vehicle reception
  recepcionFirmaCliente?: string; // Base64 signature of vehicle reception matching client
  comentariosClienteRecepcion?: string; // Optional client comments on vehicle receipt

  deliveryFotoIdFront?: string; // Base64 identification photo front
  deliveryFotoIdBack?: string; // Base64 identification photo back
  deliveryFirmaAsesor?: string; // Base64 signature of advisor delivering
  deliveryFirmaCliente?: string; // Base64 signature of customer receiving

  checklist?: Record<string, boolean>; // Checklist of checked points
  comentariosMecanico?: string; // Description of mechanic actual execution
  recomendacionesMecanico?: string; // Future recommendations for car safety
  statusHistory?: Record<string, string>; // Status -> timestamp dictionary for transition duration metrics
  deliveredAt?: string; // Date and time when the service status is set to delivered
}

// Simulated notification sent via WhatsApp
export interface SimulatedNotification {
  id: string;
  clientPhone: string;
  clientName: string;
  type: 'confirmacion' | 'recordatorio' | 'cambio_estatus';
  message: string;
  timestamp: string;
  status: 'sent';
}

// Live interactive simulator session
export interface ChatMessage {
  id: string;
  sender: 'client' | 'bot' | 'system';
  text: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  platform: 'whatsapp' | 'facebook';
  clientPhoneOrId: string;
  clientName: string;
  appointmentType: 'prueba_manejo' | 'servicio_mecanico' | null;
  gatheredData: Record<string, string>;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
