import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  deleteDoc 
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase Client
const firebaseApp = initializeApp(firebaseConfig);
export const dbClient = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const DEFAULT_USERS = [
  { id: "u-admin", username: "ejemplo@kioto.com", password: "qwerty1", role: "Admin", name: "Jorge Administrador", isFirstLogin: false, createdAt: new Date().toISOString() }
];

const INITIAL_SERVICIOS = [
  {
    id: "s-1",
    clientName: "Roberto Gómez",
    clientPhone: "+52 81 2233 4455",
    vehicle: "Kioto SUV Prime 2024",
    vin: "KIO172938472910AS",
    plate: "LKN-992-A",
    serviceType: "Mantenimiento de 20,000 Km",
    appointmentDate: "2026-05-22T09:00",
    assignedServiceUser: "Carlos Taller (Técnico)",
    status: "servicio agendado",
    source: "asesor",
    notes: "Reporta ruido leve en balatas delanteras al frenar en frío.",
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
    statusHistory: {
      "servicio agendado": new Date(Date.now() - 36 * 3600 * 1000).toISOString()
    }
  },
  {
    id: "s-2",
    clientName: "Elena Villarreal",
    clientPhone: "+52 55 7766 5544",
    vehicle: "Kioto Compact LX",
    vin: "KIO993827183204YT",
    plate: "XYZ-123-B",
    serviceType: "Revisión de frenos y suspensión",
    appointmentDate: "2026-05-24T14:30",
    assignedServiceUser: "Carlos Taller (Técnico)",
    status: "en proceso",
    source: "chatbot",
    notes: "Cita completada por asistencia virtual. Validó placas y kilometraje.",
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    statusHistory: {
      "servicio agendado": new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      "vehículo recibido": new Date(Date.now() - 5.1 * 3600 * 1000).toISOString(),
      "en proceso": new Date(Date.now() - 4.5 * 3600 * 1000).toISOString()
    }
  },
  {
    id: "s-3",
    clientName: "Mariana Delgado",
    clientPhone: "+52 33 9876 5432",
    vehicle: "Kioto Hatchback Sport",
    vin: "KIO773829104825PL",
    plate: "GTO-881-C",
    serviceType: "Cambio de Bujías y Afinación",
    appointmentDate: "2026-05-23T11:00",
    assignedServiceUser: "Carlos Taller (Técnico)",
    status: "entregado",
    source: "whatsapp",
    notes: "Servicio agendado por WhatsApp y finalizado exitosamente.",
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
    statusHistory: {
      "servicio agendado": new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      "vehículo recibido": new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
      "en proceso": new Date(Date.now() - 11.2 * 3600 * 1000).toISOString(),
      "atendido": new Date(Date.now() - 9.1 * 3600 * 1000).toISOString(),
      "entregado": new Date(Date.now() - 8.5 * 3600 * 1000).toISOString()
    }
  },
  {
    id: "s-4",
    clientName: "Diego Alanís",
    clientPhone: "+52 55 4433 2211",
    vehicle: "Kioto Sedan Comfort",
    vin: "KIO662514283940LK",
    plate: "DFM-771-A",
    serviceType: "Alineación, Balanceo y Nitrógeno",
    appointmentDate: "2026-05-24T08:30",
    assignedServiceUser: "Carlos Taller (Técnico)",
    status: "entregado",
    source: "facebook",
    notes: "Entrega express autorizada.",
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    statusHistory: {
      "servicio agendado": new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
      "vehículo recibido": new Date(Date.now() - 7 * 3600 * 1000).toISOString(),
      "en proceso": new Date(Date.now() - 6.5 * 3600 * 1000).toISOString(),
      "atendido": new Date(Date.now() - 5.2 * 3600 * 1000).toISOString(),
      "entregado": new Date(Date.now() - 4.8 * 3600 * 1000).toISOString()
    }
  }
];

class MockResponse {
  ok: boolean;
  status: number;
  private data: any;

  constructor(data: any, status: number = 200) {
    this.data = data;
    this.status = status;
    this.ok = status >= 200 && status < 300;
  }

  async json() {
    return this.data;
  }
}

// Client-side persistent WhatsApp notification storage helpers
function getStoredNotifications(): any[] {
  try {
    const raw = localStorage.getItem("kioto_simulated_notifications");
    if (!raw) {
      // Initialize with default logs
      const defaultNotifs = [
        {
          id: "n-1",
          clientPhone: "+52 33 9876 5432",
          clientName: "Mariana Delgado",
          type: "confirmacion",
          message: "Hola Mariana Delgado, tu cita para una Visita en Kioto ha sido agendada con éxito para el 2026-05-23 a las 16:00. ¡Te esperamos!",
          timestamp: new Date().toISOString(),
          status: "sent"
        },
        {
          id: "n-2",
          clientPhone: "+52 55 7766 5544",
          clientName: "Elena Villarreal",
          type: "confirmacion",
          message: "Hola Elena Villarreal, tu cita para Servicio Mecánico en Kioto ha sido agendada con éxito para el 2026-05-24 a las 14:30. ¡Te esperamos!",
          timestamp: new Date().toISOString(),
          status: "sent"
        }
      ];
      localStorage.setItem("kioto_simulated_notifications", JSON.stringify(defaultNotifs));
      return defaultNotifs;
    }
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveNotifications(notifs: any[]) {
  localStorage.setItem("kioto_simulated_notifications", JSON.stringify(notifs));
}

function triggerClientWhatsAppLog(clientName: string, clientPhone: string, type: string, message: string) {
  const notifs = getStoredNotifications();
  const newNotif = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    clientName,
    clientPhone,
    type,
    message,
    timestamp: new Date().toISOString(),
    status: "sent"
  };
  notifs.unshift(newNotif);
  saveNotifications(notifs.slice(0, 100));
}

// Client-side simulated chat sessions
function getStoredChats(): Map<string, any> {
  try {
    const raw = localStorage.getItem("kioto_simulated_chats");
    if (!raw) return new Map();
    const arr = JSON.parse(raw);
    return new Map(arr);
  } catch (e) {
    return new Map();
  }
}

function saveChats(chats: Map<string, any>) {
  localStorage.setItem("kioto_simulated_chats", JSON.stringify(Array.from(chats.entries())));
}

// Hybrid database seeding helper
async function ensureClientSeeded() {
  try {
    const usersCol = collection(dbClient, "users");
    const usersSnap = await getDocs(usersCol);
    if (usersSnap.empty) {
      for (const u of DEFAULT_USERS) {
        await setDoc(doc(dbClient, "users", u.id), u);
      }
    }
    const configRef = doc(dbClient, "config", "programming");
    const configSnap = await getDoc(configRef);
    if (!configSnap.exists()) {
      await setDoc(configRef, {
        maxServicesPerSlot: 2,
        slotIntervalMinutes: 30,
        openingTime: "08:00",
        closingTime: "18:00"
      });
    }
    const serviciosCol = collection(dbClient, "servicios");
    const serviciosSnap = await getDocs(serviciosCol);
    if (serviciosSnap.empty) {
      for (const s of INITIAL_SERVICIOS) {
        await setDoc(doc(dbClient, "servicios", s.id), s);
      }
    }
  } catch (err) {
    console.error("Client seeding error:", err);
  }
}

// Execute core business services directly in browser
export async function executeClientRequest(url: string, init?: RequestInit): Promise<MockResponse> {
  await ensureClientSeeded();

  const method = init?.method?.toUpperCase() || "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : null;

  // 1. GET /api/servicios
  if (url === "/api/servicios" && method === "GET") {
    try {
      const snap = await getDocs(collection(dbClient, "servicios"));
      const servicios = snap.docs.map(d => d.data());
      servicios.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return new MockResponse(servicios);
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 2. POST /api/servicios
  if (url === "/api/servicios" && method === "POST") {
    try {
      const { clientName, clientPhone, vehicle, vin, plate, serviceType, appointmentDate, assignedServiceUser, notes, source } = body;
      if (!clientName || !clientPhone || !vehicle || !vin || !plate || !serviceType || !appointmentDate) {
        return new MockResponse({ error: "Faltan datos obligatorios del vehículo o servicio mecánico." }, 400);
      }

      const configRef = doc(dbClient, "config", "programming");
      const configSnap = await getDoc(configRef);
      const config = configSnap.exists() ? configSnap.data() : {
        maxServicesPerSlot: 2,
        slotIntervalMinutes: 30,
        openingTime: "08:00",
        closingTime: "18:00"
      };

      const maxServices = Number(config.maxServicesPerSlot) || 2;
      const intervalMinutes = Number(config.slotIntervalMinutes) || 30;
      const openTime = config.openingTime || "08:00";
      const closeTime = config.closingTime || "18:00";

      const matchTime = appointmentDate.split('T')[1];
      if (!matchTime) {
        return new MockResponse({ error: "Horario inválido." }, 400);
      }

      const [appHour, appMin] = matchTime.split(':').map(Number);
      const [openHour, openMin] = openTime.split(':').map(Number);
      const [closeHour, closeMin] = closeTime.split(':').map(Number);

      const appMinutesCombined = appHour * 60 + appMin;
      const openMinutesCombined = openHour * 60 + openMin;
      const closeMinutesCombined = closeHour * 60 + closeMin;

      if (appMinutesCombined < openMinutesCombined || appMinutesCombined >= closeMinutesCombined) {
        return new MockResponse({ 
          error: `El taller está cerrado a esa hora. Horario: ${openTime} a ${closeTime}.` 
        }, 400);
      }

      if (appMin % intervalMinutes !== 0) {
        return new MockResponse({ 
          error: `El intervalo seleccionado no es válido (citas cada ${intervalMinutes} minutos).` 
        }, 400);
      }

      const snap = await getDocs(collection(dbClient, "servicios"));
      const allServicios = snap.docs.map(d => d.data());
      const duplicateBookings = allServicios.filter(s => s.appointmentDate === appointmentDate);
      if (duplicateBookings.length >= maxServices) {
        return new MockResponse({ 
          error: `El cupo máximo para las ${matchTime} ya está completo (límite: ${maxServices} autos).` 
        }, 400);
      }

      const id = `serv-${Date.now()}`;
      const newServicio = {
        id,
        clientName,
        clientPhone,
        vehicle,
        vin,
        plate,
        serviceType,
        appointmentDate,
        assignedServiceUser: assignedServiceUser || "Carlos Taller (Técnico)",
        status: "servicio agendado",
        source: source || "asesor",
        notes: notes || "Agendado de manera regular.",
        createdAt: new Date().toISOString(),
        statusHistory: {
          "servicio agendado": new Date().toISOString()
        }
      };

      await setDoc(doc(dbClient, "servicios", id), newServicio);

      const formattedDate = appointmentDate.replace("T", " a las ");
      const confirmMsg = `🔧 *KIOTO SERVICIO MECÁNICO - CONFIRMACIÓN* 🔧\n\nEstimado(a) *${clientName}*,\nTu servicio de taller Kioto ha sido agendado exitosamente:\n\n🚙 *Vehículo*: ${vehicle}\n🏷️ *Placas*: ${plate}\n📆 *Hora*: ${formattedDate}\n🛠️ *Servicio*: *${serviceType}*\n\n¡Te esperamos!`;
      triggerClientWhatsAppLog(clientName, clientPhone, "confirmacion", confirmMsg);

      return new MockResponse({ success: true, servicio: newServicio }, 200);
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 3. PUT /api/servicios/:id
  if (url.startsWith("/api/servicios/") && method === "PUT") {
    try {
      const id = url.replace("/api/servicios/", "");
      const docRef = doc(dbClient, "servicios", id);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return new MockResponse({ error: "Servicio no encontrado." }, 404);
      }

      const prevServ = snap.data();
      const oldStatus = prevServ.status;
      const { status, assignedServiceUser, notes } = body;
      const newStatus = status || oldStatus;

      const updatedHistory = {
        ...(prevServ.statusHistory || {}),
        [newStatus]: new Date().toISOString()
      };

      const updatedServ = {
        ...prevServ,
        ...body,
        status: newStatus,
        assignedServiceUser: assignedServiceUser || prevServ.assignedServiceUser,
        notes: notes || prevServ.notes,
        statusHistory: updatedHistory
      };

      await setDoc(docRef, updatedServ);

      if (oldStatus !== newStatus) {
        const updateMsg = `🔄 *ESTATUS KIOTO* 🔄\n\nEstimado(a) *${prevServ.clientName}*,\nTu vehículo *${prevServ.vehicle}* cambio de estatus a: *${newStatus.toUpperCase()}*.\n🛠️ Técnico: ${updatedServ.assignedServiceUser}`;
        triggerClientWhatsAppLog(prevServ.clientName, prevServ.clientPhone, "cambio_estatus", updateMsg);
      }

      return new MockResponse({ success: true, servicio: updatedServ });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 4. DELETE /api/servicios/:id
  if (url.startsWith("/api/servicios/") && method === "DELETE") {
    try {
      const id = url.replace("/api/servicios/", "");
      await deleteDoc(doc(dbClient, "servicios", id));
      return new MockResponse({ success: true, message: "Eliminado." });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 5. POST /api/auth/check-email
  if (url === "/api/auth/check-email" && method === "POST") {
    try {
      const { email } = body;
      if (!email) {
        return new MockResponse({ success: false, message: "El correo es requerido." }, 400);
      }

      const snap = await getDocs(collection(dbClient, "users"));
      const users = snap.docs.map(d => d.data());
      const user = users.find((u: any) => u.username.toLowerCase() === email.trim().toLowerCase());

      if (!user) {
        return new MockResponse({ success: false, message: "El correo no se encuentra registrado." }, 404);
      }

      const isFirstLogin = !user.password || user.password === "";
      return new MockResponse({
        success: true,
        exists: true,
        isFirstLogin,
        name: user.name,
        role: user.role
      });
    } catch (err: any) {
      return new MockResponse({ success: false, error: err.message }, 500);
    }
  }

  // 6. POST /api/auth/set-password
  if (url === "/api/auth/set-password" && method === "POST") {
    try {
      const { email, password } = body;
      const usersCol = collection(dbClient, "users");
      const usersSnap = await getDocs(usersCol);
      const userDoc = usersSnap.docs.find(d => d.data().username.toLowerCase() === email.trim().toLowerCase());

      if (!userDoc) {
        return new MockResponse({ success: false, message: "Usuario no encontrado." }, 404);
      }

      const updatedUser = {
        ...userDoc.data(),
        password: password,
        isFirstLogin: false
      };

      await setDoc(userDoc.ref, updatedUser);
      const { password: pw, ...safeUser } = updatedUser;

      return new MockResponse({ success: true, user: safeUser });
    } catch (err: any) {
      return new MockResponse({ success: false, error: err.message }, 500);
    }
  }

  // 7. POST /api/auth/login
  if (url === "/api/auth/login" && method === "POST") {
    try {
      const { username, password } = body;
      if (username === "ejemplo@kioto.com" && password === "qwerty1") {
        return new MockResponse({
          success: true,
          user: DEFAULT_USERS[0]
        });
      }

      const snap = await getDocs(collection(dbClient, "users"));
      const users = snap.docs.map(d => d.data());
      const user = users.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

      if (user) {
        const { password: pw, ...safeUser } = user;
        return new MockResponse({ success: true, user: safeUser });
      } else {
        return new MockResponse({ success: false, message: "Contraseña incorrecta." }, 401);
      }
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 8. GET /api/users
  if (url === "/api/users" && method === "GET") {
    try {
      const snap = await getDocs(collection(dbClient, "users"));
      return new MockResponse(snap.docs.map(d => d.data()));
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 9. POST /api/users
  if (url === "/api/users" && method === "POST") {
    try {
      const { username, password, role, name } = body;
      const snap = await getDocs(collection(dbClient, "users"));
      const exists = snap.docs.some(d => d.data().username.toLowerCase() === username.toLowerCase());
      if (exists) {
        return new MockResponse({ error: "El correo ya está registrado." }, 400);
      }

      const id = `u-${Date.now()}`;
      const newUser = {
        id,
        username,
        password: password || "",
        role,
        name,
        isFirstLogin: true,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(dbClient, "users", id), newUser);
      return new MockResponse({ success: true, user: newUser });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 10. PUT /api/users/:id
  if (url.startsWith("/api/users/") && method === "PUT") {
    try {
      const id = url.replace("/api/users/", "");
      const ref = doc(dbClient, "users", id);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        return new MockResponse({ error: "No encontrado" }, 404);
      }
      const updated = { ...snap.data(), ...body };
      await setDoc(ref, updated);
      return new MockResponse({ success: true, user: updated });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 11. DELETE /api/users/:id
  if (url.startsWith("/api/users/") && method === "DELETE") {
    try {
      const id = url.replace("/api/users/", "");
      if (id === "u-admin") {
        return new MockResponse({ error: "No se puede eliminar el de planta." }, 400);
      }
      await deleteDoc(doc(dbClient, "users", id));
      return new MockResponse({ success: true });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 12. GET /api/config/programming
  if (url === "/api/config/programming" && method === "GET") {
    try {
      const ref = doc(dbClient, "config", "programming");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new MockResponse(snap.data());
      }
      return new MockResponse({
        maxServicesPerSlot: 2,
        slotIntervalMinutes: 30,
        openingTime: "08:00",
        closingTime: "18:00"
      });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 13. POST /api/config/programming
  if (url === "/api/config/programming" && method === "POST") {
    try {
      const ref = doc(dbClient, "config", "programming");
      const updated = {
        maxServicesPerSlot: Number(body.maxServicesPerSlot) || 2,
        slotIntervalMinutes: Number(body.slotIntervalMinutes) || 30,
        openingTime: body.openingTime || "08:00",
        closingTime: body.closingTime || "18:00"
      };
      await setDoc(ref, updated);
      return new MockResponse({ success: true, config: updated });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 14. GET /api/notifications
  if (url === "/api/notifications" && method === "GET") {
    return new MockResponse(getStoredNotifications());
  }

  // 15. DELETE /api/notifications
  if (url === "/api/notifications" && method === "DELETE") {
    saveNotifications([]);
    return new MockResponse({ success: true });
  }

  // 16. GET /api/chats/session
  if (url.startsWith("/api/chats/session") && method === "GET") {
    const params = new URLSearchParams(url.split("?")[1] || "");
    const clientPhoneOrId = params.get("clientPhoneOrId") || "cli-anon";
    const clientName = params.get("clientName") || "Invitado";

    const chats = getStoredChats();
    let session = chats.get(clientPhoneOrId);

    // Fetch all services to detect if they already have an appointment
    const serviciosSnap = await getDocs(collection(dbClient, "servicios"));
    const allServicios = serviciosSnap.docs.map(d => d.data());

    const cleanSessionPhone = clientPhoneOrId.replace(/\D/g, "");
    let matchedService: any = null;
    if (cleanSessionPhone.length >= 10) {
      const targetLast10 = cleanSessionPhone.slice(-10);
      matchedService = allServicios.find((s: any) => {
        if (!s.clientPhone) return false;
        const sPhoneCleaned = s.clientPhone.replace(/\D/g, "");
        return sPhoneCleaned.endsWith(targetLast10);
      });
    }

    if (!session) {
      const gatheredData: any = {};
      let welcomeText = `¡Hola! Te atiende el **Asistente Kioto** 🤖. Estoy aquí para guiarte de forma sencilla, paso por paso, en el registro de tu cita de servicio mecánico en nuestro taller. Para comenzar, ¿cuál es tu nombre completo?`;

      if (matchedService) {
        gatheredData.clientName = matchedService.clientName;
        gatheredData.clientPhone = matchedService.clientPhone;
        gatheredData.alreadyRegistered = "true";
        welcomeText = `¡Hola de nuevo, **${matchedService.clientName}**! Qué gusto saludarte 🤖. He detectado de manera intuitiva que tu número celular (${matchedService.clientPhone}) ya se encuentra registrado con nosotros.\n\nPara agendar un nuevo servicio, **no es necesario que vuelvas a indicar tu nombre ni teléfono/celular**.\n\n¿Qué tipo de servicio o mantenimiento mecánico requiere tu vehículo en esta ocasión? (Ej. Afinación, Cambio de aceite o Pastillas de freno).`;
      }

      session = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName: matchedService ? matchedService.clientName : clientName,
        createdAt: new Date().toISOString(),
        gatheredData,
        messages: [
          {
            id: `msg-welcome-${Date.now()}`,
            sender: "bot",
            text: welcomeText,
            timestamp: new Date().toISOString()
          }
        ]
      };
      chats.set(clientPhoneOrId, session);
      saveChats(chats);
    }
    return new MockResponse({ success: true, session });
  }

  // 17. POST /api/chats/message
  if (url === "/api/chats/message" && method === "POST") {
    const { clientPhoneOrId, clientName, message: userText } = body;
    const chats = getStoredChats();
    let session = chats.get(clientPhoneOrId);

    if (!session) {
      session = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName,
        createdAt: new Date().toISOString(),
        gatheredData: {},
        messages: []
      };
    }

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: "client",
      text: userText,
      timestamp: new Date().toISOString()
    };
    session.messages.push(userMsg);

    // 1. Fetch current Programming Config from client Firestore
    const configRef = doc(dbClient, "config", "programming");
    const configSnap = await getDoc(configRef);
    const config = configSnap.exists() ? configSnap.data() : {
      maxServicesPerSlot: 2,
      slotIntervalMinutes: 30,
      openingTime: "08:00",
      closingTime: "18:00"
    };

    const maxServices = Number(config.maxServicesPerSlot) || 2;
    const intervalMinutes = Number(config.slotIntervalMinutes) || 30;
    const openTime = config.openingTime || "08:00";
    const closeTime = config.closingTime || "18:00";

    // 2. Fetch current Servicios to prevent slot overbooking
    const serviciosSnap = await getDocs(collection(dbClient, "servicios"));
    const allServicios = serviciosSnap.docs.map(d => d.data());

    const generateSlots = (openT: string, closeT: string, intervalMin: number): string[] => {
      const slots: string[] = [];
      const [startHour, startMin] = openT.split(':').map(Number);
      const [endHour, endMin] = closeT.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;
      const step = intervalMin <= 0 ? 30 : intervalMin;
      for (let m = startTotalMinutes; m <= endTotalMinutes; m += step) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
      return slots;
    };

    const getAvailableSlots = (dateStr: string, list: any[]): string[] => {
      const basicSlots = generateSlots(openTime, closeTime, intervalMinutes);
      return basicSlots.filter(s => {
        const slotDateTime = `${dateStr}T${s}`;
        const count = list.filter((serv: any) => serv.appointmentDate === slotDateTime).length;
        return count < maxServices;
      });
    };

    const gathered = session.gatheredData || {};
    let botReply = "";
    let bookingOutcome = false;

    const textLower = userText.toLowerCase();

    // Check if client phone matches any active service
    const cleanSessionPhone = clientPhoneOrId.replace(/\D/g, "");
    let activeServiceFound: any = null;
    let matchedService: any = null;
    if (cleanSessionPhone.length >= 10) {
      const targetLast10 = cleanSessionPhone.slice(-10);
      matchedService = allServicios.find((s: any) => {
        if (!s.clientPhone) return false;
        const sPhoneCleaned = s.clientPhone.replace(/\D/g, "");
        return sPhoneCleaned.endsWith(targetLast10);
      });
      activeServiceFound = allServicios.find((s: any) => {
        if (!s.clientPhone) return false;
        const sPhoneCleaned = s.clientPhone.replace(/\D/g, "");
        return sPhoneCleaned.endsWith(targetLast10) && s.status !== "entregado";
      });
    }

    if (matchedService && !gathered.clientName) {
      gathered.clientName = matchedService.clientName;
      gathered.clientPhone = matchedService.clientPhone;
      gathered.alreadyRegistered = "true";
    }

    if (activeServiceFound && !gathered.serviceCheckedAlready) {
      botReply = `¡Hola! He verificado tu número en nuestro sistema Kioto Auto y encontré que tienes un servicio activo/agendado con nosotros:
      
🚗 *Vehículo*: ${activeServiceFound.vehicle}
🏷 *Placas*: ${activeServiceFound.plate || "No registradas"}
🛠 *Servicio*: ${activeServiceFound.serviceType}
📅 *Fecha*: ${activeServiceFound.appointmentDate.replace("T", " a las ")}
📈 *Estatus*: 🟢 ${activeServiceFound.status.toUpperCase()}

¿Te gustaría agendar **otro servicio adicional** para este o para algún otro automóvil? (Por favor responde **SÍ** para iniciar el nuevo registro).`;
      gathered.serviceCheckedAlready = "true";
      gathered.awaitingNewBookingConfirmation = "true";
    } else if (gathered.awaitingNewBookingConfirmation === "true") {
      delete gathered.awaitingNewBookingConfirmation;
      if (textLower.includes("sí") || textLower.includes("si") || textLower.includes("ok") || textLower.includes("correcto") || textLower.includes("claro") || textLower.includes("otro")) {
        botReply = `¡Excelente! Vamos a registrar tu nueva cita de servicio mecánico. ¿Cuál es tu nombre completo para esta nueva cita?`;
      } else {
        botReply = `Entendido. Te confirmamos que tu cita ya registrada sigue activa y programada con éxito en nuestro taller Kioto Auto. ¡Te esperamos!`;
      }
    } else if (!gathered.clientName) {
      gathered.clientName = userText;
      if (clientPhoneOrId && clientPhoneOrId.startsWith("cli-")) {
        botReply = `Mucho gusto, *${userText}*. ¿Me indicas también tu número de Teléfono Celular/WhatsApp de 10 dígitos para enviarte la confirmación?`;
      } else {
        gathered.clientPhone = clientPhoneOrId;
        botReply = `Mucho gusto, *${userText}*. ¿Qué tipo de servicio o mantenimiento mecánico requiere su vehículo? (Por ejemplo: afinación, cambio de aceite o revisión de frenos).`;
      }
    } else if (!gathered.clientPhone && clientPhoneOrId && clientPhoneOrId.startsWith("cli-")) {
      gathered.clientPhone = userText;
      botReply = `Gracias por registrar tu número: *${userText}*.\n\n¿Qué tipo de servicio o mantenimiento mecánico requiere su vehículo? (Por ejemplo: afinación, cambio de aceite o revisión de frenos).`;
    } else if (!gathered.serviceType) {
      gathered.serviceType = userText;
      botReply = `Entendido, servicio para *${userText}*.\n\nAhora por favor proporcione los datos de su vehículo: **Marca, Modelo y Año** (por ejemplo: Kioto Hybrid 2025).`;
    } else if (!gathered.vehicle) {
      gathered.vehicle = userText;
      botReply = `Registrado: *${userText}*.\n\nPor favor proporcione el número de **Placa** de circulación del vehículo.`;
    } else if (!gathered.plate) {
      gathered.plate = userText.toUpperCase();
      botReply = `Placa *${gathered.plate}* registrada.\n\nAhora, indique el **NIV** de 17 caracteres (Número de Identificación Vehicular) para el registro completo.`;
    } else if (!gathered.vin) {
      gathered.vin = userText.toUpperCase();
      botReply = `NIV registrado con éxito.\n\nPor último, por favor proporcione la **fecha** deseada para su servicio mecánico (en formato AÑO-MES-DÍA, por ejemplo: \`2026-05-25\`).`;
    } else if (!gathered.tempDate && !gathered.appointmentDate) {
      const dateMatch = userText.match(/(\d{4}-\d{2}-\d{2})/);
      const dateStr = dateMatch ? dateMatch[1] : userText.trim();
      
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        botReply = `Por favor proporcione una fecha válida en formato AÑO-MES-DÍA, como \`2026-05-25\`.`;
      } else {
        const availableSlots = getAvailableSlots(dateStr, allServicios);
        if (availableSlots.length > 0) {
          gathered.tempDate = dateStr;
          botReply = `Para la fecha **${dateStr}** tenemos los siguientes horarios disponibles en nuestro taller:\n\n${availableSlots.map((s, i) => `• Opción ${i+1}: *${s}*`).join('\n')}\n\n¿Cuál de estos horarios te queda mejor? Por favor escríbeme la hora propuesta.`;
        } else {
          let nextDate = new Date(dateStr);
          let foundDateStr = "";
          let nextAvailableSlots: string[] = [];
          for (let i = 1; i <= 7; i++) {
            nextDate.setDate(nextDate.getDate() + 1);
            const tryDateStr = nextDate.toISOString().slice(0, 10);
            const trySlots = getAvailableSlots(tryDateStr, allServicios);
            if (trySlots.length > 0) {
              foundDateStr = tryDateStr;
              nextAvailableSlots = trySlots;
              break;
            }
          }
          if (foundDateStr) {
            gathered.tempDate = foundDateStr;
            botReply = `Disculpa, nuestro taller ya cuenta con sobrecupo de citas asignadas para el día **${dateStr}**.\n\nSin embargo, la fecha disponible más cercana es el **${foundDateStr}**, con estos horarios libres:\n\n${nextAvailableSlots.map((s, i) => `• Opción ${i+1}: *${s}*`).join('\n')}\n\n¿Te parecería elegir uno de estos horarios? Escríbeme la hora propuesta.`;
          } else {
            gathered.tempDate = dateStr;
            botReply = `Para la fecha propuesta el cupo está reservado temporalmente. Intentemos proponerlo a las *${openTime}*. ¿Está de acuerdo, o prefiere otra hora?`;
          }
        }
      }
    } else if (gathered.tempDate && !gathered.appointmentDate) {
      const availableSlots = getAvailableSlots(gathered.tempDate, allServicios);
      let chosenTime: string | null = null;
      const textClean = userText.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

      const numberMatches = textClean.match(/\b\d+\b/);
      const isTimeFormat = /:\d{2}/.test(textClean) || /\b\d{1,2}\s+\d{2}\b/.test(textClean) || /\b\d{1,2}\.\d{2}\b/.test(textClean);

      let indexFromText = -1;
      if (numberMatches && !isTimeFormat) {
        const num = parseInt(numberMatches[0], 10);
        if (num >= 1 && num <= availableSlots.length) {
          indexFromText = num - 1;
        }
      }

      if (indexFromText !== -1) {
        chosenTime = availableSlots[indexFromText];
      } else {
        const timeColonMatch = textClean.replace(/\s/g, '').match(/(\d{1,2}):(\d{2})/);
        if (timeColonMatch) {
          chosenTime = `${timeColonMatch[1].padStart(2, '0')}:${timeColonMatch[2]}`;
        } else {
          const timeDotMatch = textClean.replace(/\s/g, '').match(/(\d{1,2})\.(\d{2})/);
          if (timeDotMatch) {
            chosenTime = `${timeDotMatch[1].padStart(2, '0')}:${timeDotMatch[2]}`;
          } else {
            const plainMatch = textClean.replace(/\s/g, '').match(/(\d{3,4})/);
            if (plainMatch) {
              const val = plainMatch[1];
              chosenTime = val.length === 3 ? `0${val[0]}:${val.slice(1)}` : `${val.slice(0, 2)}:${val.slice(2)}`;
            } else {
              const spaceMatch = textClean.match(/\b(\d{1,2})\s+(\d{2})\b/);
              if (spaceMatch) {
                chosenTime = `${spaceMatch[1].padStart(2, '0')}:${spaceMatch[2]}`;
              }
            }
          }
        }
      }

      if (!chosenTime || !/^\d{2}:\d{2}$/.test(chosenTime) || !availableSlots.includes(chosenTime)) {
        botReply = `Por favor indique la opción de horario preferida (por ejemplo: \`Opción 4\`, \`08:20\` o \`8:20\`). Las opciones libres son:\n\n${availableSlots.map((s, i) => `• Opción ${i+1}: *${s}*`).join('\n')}`;
      } else {
        const proposedFull = `${gathered.tempDate}T${chosenTime}`;
        gathered.appointmentDate = proposedFull;

        // Register service appointment into database
        const id = `serv-${Date.now()}`;
        const newServicio = {
          id,
          clientName: gathered.clientName,
          clientPhone: gathered.clientPhone || clientPhoneOrId,
          vehicle: gathered.vehicle,
          vin: gathered.vin || "S/NIV",
          plate: gathered.plate || "S/PLACA",
          serviceType: gathered.serviceType,
          appointmentDate: proposedFull,
          assignedServiceUser: "Carlos Taller (Técnico)",
          status: "servicio agendado",
          source: "chatbot",
          notes: "Cita agendada automáticamente por asistente virtual en Vercel.",
          createdAt: new Date().toISOString(),
          statusHistory: {
            "servicio agendado": new Date().toISOString()
          }
        };

        await setDoc(doc(dbClient, "servicios", id), newServicio);
        bookingOutcome = true;

        // Format WhatsApp notification details
        const formattedDate = proposedFull.replace("T", " a las ");
        const confirmMsg = `🔧 *KIOTO SERVICIO MECÁNICO - CONFIRMACIÓN* 🔧\n\nEstimado(a) *${gathered.clientName}*,\nTu servicio de taller Kioto ha sido agendado exitosamente:\n\n🚙 *Vehículo*: ${gathered.vehicle}\n🏷️ *Placas*: ${gathered.plate}\n📆 *Hora*: ${formattedDate}\n🛠️ *Servicio*: *${gathered.serviceType}*\n\n¡Te esperamos!`;
        triggerClientWhatsAppLog(gathered.clientName, gathered.clientPhone || clientPhoneOrId, "confirmacion", confirmMsg);

        botReply = `¡Felicidades, **${gathered.clientName}**! Tu cita para **${gathered.serviceType}** ha sido registrada con éxito para el día y hora seleccionados:\n\n📅 **${formattedDate}**\n🚗 **Auto**: ${gathered.vehicle}\n🏷️ **Placa**: ${gathered.plate}\n⚙️ Estatus: *Servicio Agendado*\n\nTe acabamos de enviar una confirmación automática completa a tu WhatsApp con los detalles del técnico asignado y las garantías oficiales. ¿Puedo ayudarte en alguna otra consulta hoy?`;
      }
    } else {
      botReply = `¡Hola! Tu cita de taller ya está programada. Deseas información de precios o de alguna otra orden de servicio técnica?`;
    }

    session.gatheredData = gathered;

    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: "bot",
      text: botReply,
      timestamp: new Date().toISOString()
    };
    session.messages.push(botMsg);
    chats.set(clientPhoneOrId, session);
    saveChats(chats);

    return new MockResponse({ success: true, session, bookingOutcome });
  }

  // 18. GET /api/ai/service-improvements
  if (url === "/api/ai/service-improvements") {
    const snap = await getDocs(collection(dbClient, "servicios"));
    const count = snap.size;
    const insights = `✅ *ANÁLISIS COGNITIVO KIOTO EN VIVO* (Análisis Local)\n\n• *Eficiencia General*: Se detectan ${count} unidades registradas en fosa.\n• *Recomendación*: Sincronizar recambio de refacciones para optimizar el tiempo muerto en rampa.\n• *Estatus Promedio*: Operando en condiciones óptimas.`;
    return new MockResponse({ success: true, insights });
  }

  // 19. GET /api/db/reset
  if (url === "/api/db/reset") {
    try {
      const collections = ["users", "servicios"];
      for (const colName of collections) {
        const snap = await getDocs(collection(dbClient, colName));
        for (const d of snap.docs) {
          await deleteDoc(d.ref);
        }
      }
      saveNotifications([]);
      const chats = getStoredChats();
      chats.clear();
      saveChats(chats);

      await ensureClientSeeded();
      return new MockResponse({ message: "Base de datos restaurada con éxito sobre Firebase." });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  return new MockResponse({ error: "Endpoint no contemplado." }, 404);
}

export async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === "string" ? input : (input as any).url || String(input);

  if (url.startsWith("/api/")) {
    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    const isLocalOrSandbox = hostname === "localhost" || hostname === "127.0.0.1" || hostname.includes("run.app");

    // If hosted externally (like on Vercel), route directly to live Firestore client simulator
    if (!isLocalOrSandbox) {
      return executeClientRequest(url, init) as any;
    }

    // Otherwise, try standard fetch and fallback on failure
    try {
      const res = await fetch(url, init);
      return res;
    } catch (err) {
      console.warn("API Server unavailable. Falling back to live Frontend Firestore client:", err);
      return executeClientRequest(url, init) as any;
    }
  }

  return fetch(input, init);
}

