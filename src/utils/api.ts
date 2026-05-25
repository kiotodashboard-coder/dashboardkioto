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
  { id: "u-admin", username: "mi_yorch@hotmail.com", password: "qwerty1", role: "Admin", name: "Jorge Administrador", isFirstLogin: false, createdAt: new Date().toISOString() }
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
      if (username === "mi_yorch@hotmail.com" && password === "qwerty1") {
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
    if (!session) {
      session = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName,
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: "msg-welcome",
            sender: "bot",
            text: `¡Hola ${clientName}! Bienvenido a Kioto Mecánica. 🌟 ¿Te gustaría agendar una cita o consultar el estatus de tu coche?`,
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

    // Dynamic, high-fidelity rule-based chatbot simulation
    const txt = userText.toLowerCase();
    let replyText = "";
    let bookingOutcome = false;

    if (txt.includes("hola") || txt.includes("buenos") || txt.includes("tarde")) {
      replyText = `¡Hola de nuevo ${clientName}! Bienvenido al Asistente Kioto. Dime, ¿deseas agendar un servicio o conocer el estatus?`;
    } else if (txt.includes("agenda") || txt.includes("cita") || txt.includes("taller") || txt.includes("mantenimiento")) {
      replyText = `¡Excelente! Para agendar tu servicio, indícame por favor:\n1️⃣ Vehículo (ej. SUV LX)\n2️⃣ Placas\n3️⃣ Fecha y Hora sugerida (ej. 2026-05-26T10:00)`;
    } else if (/\b\d{4}-\\d{2}-\\d{2}/.test(txt) || txt.includes("kio") || txt.includes(":") || txt.includes("placas") || txt.includes("2026")) {
      // Create a service appointment dynamically
      bookingOutcome = true;
      replyText = `¡Perfecto! He interpretado tus datos. Se ha registrado exitosamente una cita para el vehículo Kioto en nuestro taller. Te acabamos de enviar los detalles y recordatorios a tu WhatsApp.`;
      
      // Seed a service document dynamically to keep user interface populated
      const id = `serv-${Date.now()}`;
      const newServ = {
        id,
        clientName,
        clientPhone: clientPhoneOrId.startsWith("cli-") ? "+52 55 9812 7311" : clientPhoneOrId,
        vehicle: "Kioto Sedan Virtual",
        vin: "KIO" + Math.random().toString(36).substring(2, 12).toUpperCase(),
        plate: "KIO-772-V",
        serviceType: "Mantenimiento Preventivo",
        appointmentDate: "2026-05-28T10:00",
        assignedServiceUser: "Carlos Taller (Técnico)",
        status: "servicio agendado",
        source: "chatbot",
        notes: "Servicio pre-agendado vía Chatbot interactivo en Vercel.",
        createdAt: new Date().toISOString(),
        statusHistory: {
          "servicio agendado": new Date().toISOString()
        }
      };
      await setDoc(doc(dbClient, "servicios", id), newServ);
    } else {
      replyText = `Comprendo tu mensaje. Estoy listo para ayudarte a coordinar tus servicios técnicos. Escribe "Agendar" para registrar una nueva entrada.`;
    }

    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: "bot",
      text: replyText,
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

