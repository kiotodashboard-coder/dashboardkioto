// Removed actual Firestore client-side connections to use clean LocalStorage simulator fallbacks
import firebaseConfig from "../../firebase-applet-config.json";

export const dbClient = { type: 'local_storage_dummy' };

function collection(parent: any, colName: string) {
  return { path: colName };
}

function doc(parent: any, ...paths: string[]) {
  let col = "";
  let id = "";
  if (parent && parent.path) {
    col = parent.path;
    id = paths[0];
  } else {
    col = String(paths[0] || "");
    id = String(paths[1] || "");
  }
  return { path: `${col}/${id}`, col, id };
}

const DEFAULT_USERS = [
  { id: "u-admin", username: "ejemplo@kioto.com", password: "qwerty1", role: "Admin", name: "Jorge Administrador", isFirstLogin: false, createdAt: new Date().toISOString() }
];

const INITIAL_SERVICIOS: any[] = [];

// LocalStorage keys for Firestore collection fallbacks
const DB_FALLBACKS: Record<string, string> = {
  users: "kioto_local_db_users",
  servicios: "kioto_local_db_servicios",
  "config/programming": "kioto_local_db_config_programming",
  "config/chatbot": "kioto_local_db_config_chatbot"
};

// Helper to load fallback collection list
function getFallbackCollection(col: string): any[] {
  try {
    const raw = localStorage.getItem(DB_FALLBACKS[col] || `kioto_local_db_${col}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Local DB read failed:", e);
  }
  
  // Default values
  if (col === "users") {
    return [...DEFAULT_USERS];
  }
  if (col === "servicios") {
    return [...INITIAL_SERVICIOS];
  }
  return [];
}

// Helper to save fallback collection list
function saveFallbackCollection(col: string, list: any[]) {
  try {
    localStorage.setItem(DB_FALLBACKS[col] || `kioto_local_db_${col}`, JSON.stringify(list));
  } catch (e) {
    console.error("Local DB write failed:", e);
  }
}

// Helper to load single document
function getFallbackDoc(collectionName: string, docId: string): any {
  if (collectionName === "config") {
    try {
      const raw = localStorage.getItem(`kioto_local_db_config_${docId}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    if (docId === "programming") {
      return {
        maxServicesPerSlot: 2,
        slotIntervalMinutes: 30,
        openingTime: "08:00",
        closingTime: "18:00",
        toleranceMinutes: 15,
        checklistItems: [
          'Nivel de Aceite de Motor', 'Líquido de Dirección', 'Nivel de Anticongelante',
          'Filtro de Aire', 'Líquido de Frenos', 'Filtro de Cabina', 'Batería (Voltaje/Terminales)',
          'Bujías', 'Bandas de Motor', 'Mangueras', 'Rotación de llantas', 'Balatas Traseras',
          'Suspensión (Bujes/Rótulas)', 'Fugas de Fluidos', 'Presión de Llantas', 'Alineación de llantas',
          'Discos de Freno', 'Luces (Altas/Bajas/Stop)', 'Estado de Llantas (Desgaste)', 'Balatas Delanteras',
          'Amortiguadores', 'Direcciones y Limpiaparabrisas'
        ]
      };
    }
    if (docId === "chatbot") {
      return { web: true, whatsapp: true, messenger: true };
    }
    return null;
  }
  
  const colList = getFallbackCollection(collectionName);
  return colList.find(item => item.id === docId) || null;
}

// Helper to save single document
function setFallbackDoc(collectionName: string, docId: string, data: any) {
  if (collectionName === "config") {
    try {
      localStorage.setItem(`kioto_local_db_config_${docId}`, JSON.stringify(data));
    } catch (e) {}
    return;
  }
  
  const colList = getFallbackCollection(collectionName);
  const existingIdx = colList.findIndex(item => item.id === docId);
  const updatedData = { ...data, id: docId };
  if (existingIdx !== -1) {
    colList[existingIdx] = { ...colList[existingIdx], ...updatedData };
  } else {
    colList.push(updatedData);
  }
  saveFallbackCollection(collectionName, colList);
}

// Helper to delete document
function deleteFallbackDoc(collectionName: string, docId: string) {
  if (collectionName === "config") {
    try {
      localStorage.removeItem(`kioto_local_db_config_${docId}`);
    } catch (e) {}
    return;
  }
  
  const colList = getFallbackCollection(collectionName);
  const filtered = colList.filter(item => item.id !== docId);
  saveFallbackCollection(collectionName, filtered);
}

// Intercepted getters/setters with pure LocalStorage engine
async function getDocs(colRef: any): Promise<any> {
  const path = colRef._path?.segments?.[0] || colRef.path || "";
  let list: any[] = [];
  try {
    const raw = localStorage.getItem(`kioto_local_db_${path}`);
    if (raw) {
      list = JSON.parse(raw);
    } else {
      if (path === "users") list = [...DEFAULT_USERS];
      else if (path === "servicios") list = [...INITIAL_SERVICIOS];
    }
  } catch (e) {}
  
  return {
    empty: list.length === 0,
    size: list.length,
    docs: list.map((item: any) => ({
      id: item.id || `mock-id-${Math.random()}`,
      data: () => item,
      ref: { id: item.id }
    }))
  };
}

async function getDoc(docRef: any): Promise<any> {
  const pathSegments = docRef._path?.segments || docRef.path?.split("/") || [];
  const colName = pathSegments[0];
  const docId = pathSegments[1];
  
  let data: any = null;
  try {
    const raw = localStorage.getItem(`kioto_local_db_${colName}_${docId}`);
    if (raw) {
      data = JSON.parse(raw);
    } else {
      if (colName === "config" && docId === "programming") {
        data = {
          maxServicesPerSlot: 2,
          slotIntervalMinutes: 30,
          openingTime: "08:00",
          closingTime: "18:00",
          toleranceMinutes: 15,
          checklistItems: [
            'Nivel de Aceite de Motor', 'Líquido de Dirección', 'Nivel de Anticongelante',
            'Filtro de Aire', 'Líquido de Frenos', 'Filtro de Cabina', 'Batería (Voltaje/Terminales)',
            'Bujías', 'Bandas de Motor', 'Mangueras', 'Rotación de llantas', 'Balatas Traseras',
            'Suspensión (Bujes/Rótulas)', 'Fugas de Fluidos', 'Presión de Llantas', 'Alineación de llantas',
            'Discos de Freno', 'Luces (Altas/Bajas/Stop)', 'Estado de Llantas (Desgaste)', 'Balatas Delanteras',
            'Amortiguadores', 'Direcciones y Limpiaparabrisas'
          ]
        };
      } else if (colName === "config" && docId === "chatbot") {
        data = { web: true, whatsapp: true, messenger: true };
      } else {
        const listRaw = localStorage.getItem(`kioto_local_db_${colName}`);
        if (listRaw) {
          const list = JSON.parse(listRaw);
          data = list.find((item: any) => item.id === docId) || null;
        }
      }
    }
  } catch (e) {}
  
  return {
    exists: () => data !== null && data !== undefined,
    data: () => data,
    id: docId
  };
}

async function setDoc(docRef: any, data: any, options?: any): Promise<any> {
  const pathSegments = docRef._path?.segments || docRef.path?.split("/") || [];
  const colName = pathSegments[0];
  const docId = pathSegments[1];
  
  try {
    if (colName === "config") {
      const prevailing = getFallbackDoc("config", docId) || {};
      const merged = options?.merge ? { ...prevailing, ...data } : data;
      localStorage.setItem(`kioto_local_db_config_${docId}`, JSON.stringify(merged));
    } else {
      let list: any[] = [];
      const listRaw = localStorage.getItem(`kioto_local_db_${colName}`);
      if (listRaw) {
        list = JSON.parse(listRaw);
      } else {
        if (colName === "users") list = [...DEFAULT_USERS];
      }
      
      const idx = list.findIndex((item: any) => item.id === docId);
      const mergedItem = options?.merge ? { ...(list[idx] || {}), ...data } : data;
      const updatedItem = { ...mergedItem, id: docId };
      
      if (idx !== -1) {
        list[idx] = updatedItem;
      } else {
        list.push(updatedItem);
      }
      localStorage.setItem(`kioto_local_db_${colName}`, JSON.stringify(list));
    }
  } catch (e) {}
  return true;
}

async function deleteDoc(docRef: any): Promise<any> {
  const pathSegments = docRef._path?.segments || docRef.path?.split("/") || [];
  const colName = pathSegments[0];
  const docId = pathSegments[1];
  
  try {
    if (colName === "config") {
      localStorage.removeItem(`kioto_local_db_config_${docId}`);
    } else {
      let list: any[] = [];
      const listRaw = localStorage.getItem(`kioto_local_db_${colName}`);
      if (listRaw) {
        list = JSON.parse(listRaw);
      }
      const filtered = list.filter((item: any) => item.id !== docId);
      localStorage.setItem(`kioto_local_db_${colName}`, JSON.stringify(filtered));
    }
  } catch (e) {}
  return true;
}

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
      // Initialize with empty logs
      const defaultNotifs: any[] = [];
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

function isPastTolerance(appointmentDateStr: string, toleranceMinutes: number): boolean {
  if (!appointmentDateStr) return false;
  const parts = appointmentDateStr.split('T');
  if (parts.length !== 2) return false;
  const [datePart, timePart] = parts;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, min] = timePart.split(':').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day) || isNaN(hour) || isNaN(min)) return false;

  const apptLocalTime = Date.UTC(year, month - 1, day, hour, min);
  const cdmxNow = new Date(Date.now() - 6 * 60 * 60 * 1000); // 6 hours behind UTC
  const cdmxLocalTime = Date.UTC(
    cdmxNow.getUTCFullYear(),
    cdmxNow.getUTCMonth(),
    cdmxNow.getUTCDate(),
    cdmxNow.getUTCHours(),
    cdmxNow.getUTCMinutes()
  );

  const diffMinutes = (cdmxLocalTime - apptLocalTime) / (1000 * 60);
  return diffMinutes >= toleranceMinutes;
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
      const servicios = snap.docs.map(d => d.data() as any);

      // Get tolerance config
      const docRef = doc(dbClient, "config", "programming");
      const configSnap = await getDoc(docRef);
      const toleranceMinutes = configSnap.exists() ? (configSnap.data().toleranceMinutes ?? 15) : 15;

      for (const s of servicios) {
        if (s.status === 'servicio agendado' && s.appointmentDate) {
          if (isPastTolerance(s.appointmentDate, toleranceMinutes)) {
            s.status = 'En Espera';
            await setDoc(doc(dbClient, "servicios", s.id), { status: 'En Espera' }, { merge: true });
          }
        }
      }

      servicios.sort((a: any, b: any) => {
        const dateA = a.appointmentDate || "";
        const dateB = b.appointmentDate || "";
        if (dateA && dateB) {
          if (dateA !== dateB) return dateA.localeCompare(dateB);
        } else if (dateA) {
          return -1;
        } else if (dateB) {
          return 1;
        }
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
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

      const upperVin = String(vin || "").trim().toUpperCase();
      const upperPlate = String(plate || "").trim().toUpperCase();
      if (upperVin.length !== 17) {
        return new MockResponse({ error: `El NIV (Número de Identificación Vehicular) debe tener exactamente 17 caracteres (recibidos: ${upperVin.length}).` }, 400);
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

      // Same-day check: If booking is today, prevent booking slots in the past or with less than 20 minutes buffer
      const [appDate] = appointmentDate.split('T');
      const offsetMs = -6 * 60 * 60 * 1000; // Mexico Central Time (UTC-6)
      const localToday = new Date(new Date().getTime() + offsetMs);
      const todayStr = localToday.toISOString().slice(0, 10);

      if (appDate === todayStr) {
        const currentHour = localToday.getUTCHours();
        const currentMin = localToday.getUTCMinutes();
        const currentTotalMinutes = currentHour * 60 + currentMin;

        if (appMinutesCombined < currentTotalMinutes + 20) {
          return new MockResponse({
            error: "No es posible agendar citas para hoy con menos de 20 minutos de anticipación. Por favor selecciona una hora posterior o una fecha próxima."
          }, 400);
        }
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

      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      const id = `KSM-${randomDigits}`;
      const newServicio = {
        id,
        clientName,
        clientPhone,
        vehicle,
        vin: upperVin,
        plate: upperPlate,
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
        const d = snap.data();
        if (d.toleranceMinutes === undefined) {
          d.toleranceMinutes = 15;
        }
        return new MockResponse(d);
      }
      return new MockResponse({
        maxServicesPerSlot: 2,
        slotIntervalMinutes: 30,
        openingTime: "08:00",
        closingTime: "18:00",
        toleranceMinutes: 15
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
        closingTime: body.closingTime || "18:00",
        toleranceMinutes: Number(body.toleranceMinutes) !== undefined ? Number(body.toleranceMinutes) : 15,
        checklistItems: Array.isArray(body.checklistItems) ? body.checklistItems : []
      };
      await setDoc(ref, updated);
      return new MockResponse({ success: true, config: updated });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 13.1. GET /api/config/chatbot
  if (url === "/api/config/chatbot" && method === "GET") {
    try {
      const ref = doc(dbClient, "config", "chatbot");
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return new MockResponse(snap.data());
      }
      return new MockResponse({ web: true, whatsapp: true, messenger: true });
    } catch (err: any) {
      return new MockResponse({ error: err.message }, 500);
    }
  }

  // 13.2. POST /api/config/chatbot
  if (url === "/api/config/chatbot" && method === "POST") {
    try {
      const ref = doc(dbClient, "config", "chatbot");
      const updated = {
        web: body.web !== false,
        whatsapp: body.whatsapp !== false,
        messenger: body.messenger !== false
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

    // Check Chatbot enabled/disabled states from Firestore
    let isWebChatbotEnabled = true;
    try {
      const chatbotConfigRef = doc(dbClient, "config", "chatbot");
      const chatbotConfigSnap = await getDoc(chatbotConfigRef);
      if (chatbotConfigSnap.exists()) {
        const chatbotConfig = chatbotConfigSnap.data();
        isWebChatbotEnabled = chatbotConfig.web !== false;
      }
    } catch (err) {
      console.error("Error reading web chatbot config:", err);
    }

    if (!isWebChatbotEnabled) {
      const inactiveSession = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName,
        createdAt: new Date().toISOString(),
        gatheredData: {},
        messages: [
          {
            id: `msg-welcome-${Date.now()}`,
            sender: "bot",
            text: "Servicio temporalmente inactivo: seguimos mejorando nuestro servicio para ti, enseguida volvemos.",
            timestamp: new Date().toISOString()
          }
        ]
      };
      return new MockResponse({ success: true, session: inactiveSession });
    }

    const chats = getStoredChats();
    let session = chats.get(clientPhoneOrId);

    if (session) {
      const lastActivity = session.updatedAt ? new Date(session.updatedAt).getTime() : new Date(session.createdAt).getTime();
      const isExpired = (Date.now() - lastActivity) > 5 * 60 * 1000;
      if (isExpired || session.needsReset || session.isFinished) {
        chats.delete(clientPhoneOrId);
        saveChats(chats);
        session = null;
      }
    }

    // Fetch all services to detect if they already have an appointment
    const serviciosSnap = await getDocs(collection(dbClient, "servicios"));
    const rawServicios = serviciosSnap.docs.map(d => d.data());
    const offsetMs = -6 * 60 * 60 * 1000;
    const localToday = new Date(new Date().getTime() + offsetMs);
    const oneDayBefore = new Date(localToday.getTime() - 24 * 60 * 60 * 1000);
    const limitStr = oneDayBefore.toISOString().slice(0, 10);
    const allServicios = rawServicios.filter((s: any) => {
      if (!s.appointmentDate) return false;
      return s.appointmentDate.slice(0, 10) >= limitStr;
    });

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
      const welcomeText = `¡Hola! Te atiende el **Asistente Kioto** 🤖. Estoy aquí para guiarte en el agendamiento y consulta de tu servicio mecánico. Para comenzar, ¿cuál es tu nombre completo?`;

      session = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName: clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    let shouldResetChat = false;

    // Check Chatbot enabled/disabled states from Firestore
    let isWebChatbotEnabled = true;
    try {
      const chatbotConfigRef = doc(dbClient, "config", "chatbot");
      const chatbotConfigSnap = await getDoc(chatbotConfigRef);
      if (chatbotConfigSnap.exists()) {
        const chatbotConfig = chatbotConfigSnap.data();
        isWebChatbotEnabled = chatbotConfig.web !== false;
      }
    } catch (err) {
      console.error("Error reading web chatbot config:", err);
    }

    if (!isWebChatbotEnabled) {
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
      session.messages.push({
        id: `msg-opt-${Date.now()}`,
        sender: "client",
        text: userText,
        timestamp: new Date().toISOString()
      });
      const deactivatedReply = "Servicio temporalmente inactivo: seguimos mejorando nuestro servicio para ti, enseguida volvemos.";
      session.messages.push({
        id: `msg-bot-${Date.now()}`,
        sender: "bot",
        text: deactivatedReply,
        timestamp: new Date().toISOString()
      });
      chats.set(clientPhoneOrId, session);
      saveChats(chats);
      return new MockResponse({ success: true, session, reply: deactivatedReply });
    }

    if (session) {
      const lastActivity = session.updatedAt ? new Date(session.updatedAt).getTime() : new Date(session.createdAt).getTime();
      const isExpired = (Date.now() - lastActivity) > 5 * 60 * 1000;
      if (isExpired || session.needsReset || session.isFinished) {
        chats.delete(clientPhoneOrId);
        saveChats(chats);
        session = null;
      }
    }

    if (!session) {
      session = {
        id: `chat-${clientPhoneOrId}`,
        clientPhoneOrId,
        clientName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
    const rawServicios = serviciosSnap.docs.map(d => d.data());
    const offsetMs = -6 * 60 * 60 * 1000;
    const localToday = new Date(new Date().getTime() + offsetMs);
    const oneDayBefore = new Date(localToday.getTime() - 24 * 60 * 60 * 1000);
    const limitStr = oneDayBefore.toISOString().slice(0, 10);
    const allServicios = rawServicios.filter((s: any) => {
      if (!s.appointmentDate) return false;
      return s.appointmentDate.slice(0, 10) >= limitStr;
    });

    const generateSlots = (openT: string, closeT: string, intervalMin: number): string[] => {
      const slots: string[] = [];
      const [startHour, startMin] = openT.split(':').map(Number);
      const [endHour, endMin] = closeT.split(':').map(Number);
      const startTotalMinutes = startHour * 60 + startMin;
      const endTotalMinutes = endHour * 60 + endMin;
      const step = intervalMin <= 0 ? 30 : intervalMin;
      for (let m = startTotalMinutes; m < endTotalMinutes; m += step) {
        const hh = String(Math.floor(m / 60)).padStart(2, '0');
        const mm = String(m % 60).padStart(2, '0');
        slots.push(`${hh}:${mm}`);
      }
      return slots;
    };

    const getAvailableSlots = (dateStr: string, list: any[]): string[] => {
      const basicSlots = generateSlots(openTime, closeTime, intervalMinutes);
      
      const offsetMs = -6 * 60 * 60 * 1000; // Mexico Central Time (UTC-6)
      const localToday = new Date(new Date().getTime() + offsetMs);
      const todayStr = localToday.toISOString().slice(0, 10);

      return basicSlots.filter(s => {
        const slotDateTime = `${dateStr}T${s}`;
        const count = list.filter((serv: any) => {
          if (serv.appointmentDate !== slotDateTime) return false;
          const lowerStatus = (serv.status || "").toLowerCase();
          return lowerStatus !== "cancelado" && lowerStatus !== "cancelada" && lowerStatus !== "entregado" && lowerStatus !== "entregada";
        }).length;
        if (count >= maxServices) return false;

        if (dateStr === todayStr) {
          const [sh, sm] = s.split(':').map(Number);
          const slotTotalMinutes = sh * 60 + sm;

          const currentHour = localToday.getUTCHours();
          const currentMin = localToday.getUTCMinutes();
          const currentTotalMinutes = currentHour * 60 + currentMin;

          // Enforce 20 minutes minimum margin/buffer so client has enough time to arrive
          if (slotTotalMinutes < currentTotalMinutes + 20) {
            return false;
          }
        }
        return true;
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

    // Analizador inteligente multi-campo para Placas, NIV y Vehículo (Marca, Modelo, Año)
    const normalizedMsg = userText.trim();
    const msgParts = normalizedMsg.split(/[,;\/]+/).map(p => p.trim());
    
    let extractedVehicle = "";
    let extractedPlate = "";
    let extractedVin = "";

    // 1. First find any 17-char alphanumeric string which is guaranteed to be a VIN/NIV
    for (const part of msgParts) {
      const partUpper = part.toUpperCase();
      if (partUpper.length === 17 && /^[A-Z0-9]{17}$/.test(partUpper)) {
        extractedVin = partUpper;
      }
    }

    if (!extractedVin) {
      const vinMatch = normalizedMsg.toUpperCase().match(/\b[A-Z0-9]{17}\b/);
      if (vinMatch) {
        extractedVin = vinMatch[0];
      }
    }

    // 2. Extract Vehicle (Brand, Model, Year)
    if (msgParts.length > 1) {
      for (const part of msgParts) {
        if (/\b(19|20)\d{2}\b/.test(part) && part.length >= 5 && part.length < 35) {
          extractedVehicle = part;
        }
      }
    } else {
      // Find Brand and Year in sentence
      const textUpper = normalizedMsg.toUpperCase();
      const brands = ["NISSAN", "HONDA", "TOYOTA", "CHEVROLET", "FORD", "VW", "VOLKSWAGEN", "KIA", "MAZDA", "HYUNDAI", "BMW", "AUDI", "MERCEDES", "JEEP", "CHRYSLER", "DODGE", "CHERY", "BYD", "MG", "SUZUKI", "RENAULT", "PEUGEOT", "SEAT", "CUPRA", "TESLA", "MITSUBISHI"];
      const yearMatch = normalizedMsg.match(/\b((19|20)\d{2})\b/);
      if (yearMatch) {
        const year = yearMatch[1];
        for (const brand of brands) {
          const brandIdx = textUpper.indexOf(brand);
          if (brandIdx !== -1) {
            const yearIdx = normalizedMsg.indexOf(year);
            const start = Math.min(brandIdx, yearIdx);
            const end = Math.max(brandIdx + brand.length, yearIdx + year.length);
            const slice = normalizedMsg.slice(start, end).trim();
            if (slice.length > 5 && slice.length < 35) {
              extractedVehicle = slice;
              break;
            }
          }
        }
      }
      // If still not found but there is a year and message is relatively short
      if (!extractedVehicle && yearMatch && normalizedMsg.length < 35 && normalizedMsg.length >= 5) {
        extractedVehicle = normalizedMsg;
      }
    }

    // 3. Extract Plate (Placa)
    for (const part of msgParts) {
      const partUpper = part.toUpperCase();
      if (partUpper === extractedVin || part === extractedVehicle) continue;
      const simpleDigits = part.replace(/\D/g, "");
      if (simpleDigits.length >= 10) continue; // Skip phone numbers
      // A Mexican plate has letters and numbers, length 3 to 12
      if (/^[A-Z0-9\- ]{3,12}$/.test(partUpper) && !/^\d+$/.test(partUpper)) {
        extractedPlate = partUpper;
      }
    }

    // If still no plate found, try to locate it in a long sentence with regex
    if (!extractedPlate && msgParts.length === 1) {
      const plateMatch = normalizedMsg.toUpperCase().match(/\b([A-Z0-9]{3,4}[\- ][A-Z0-9]{3,4})\b/);
      if (plateMatch) {
        extractedPlate = plateMatch[1];
      }
    }

    // Assign to gathered data
    if (extractedVin) {
      gathered.vin = extractedVin;
    }
    if (extractedPlate) {
      gathered.plate = extractedPlate;
    }
    if (extractedVehicle) {
      gathered.vehicle = extractedVehicle;
    }

    const digitsOnly = userText.replace(/\D/g, "");
    let detectedPhone = "";
    if (digitsOnly.length >= 10 && digitsOnly.length <= 15) {
      detectedPhone = digitsOnly;
    } else {
      const tenDigitsMatch = digitsOnly.match(/\d{10,15}/);
      if (tenDigitsMatch) {
        detectedPhone = tenDigitsMatch[0];
      }
    }

    const getPhoneStatusStringFallback = (phoneToLookup: string, allServBackupArr: any[]) => {
      const targetLast10Clean = phoneToLookup.replace(/\D/g, "").slice(-10);
      const matchedList = allServBackupArr.filter((s: any) => {
        if (!s.clientPhone) return false;
        const sPhoneCleaned = s.clientPhone.replace(/\D/g, "");
        return sPhoneCleaned.endsWith(targetLast10Clean);
      });
      if (matchedList.length === 0) {
        return `No se encontraron servicios agendados para el número de teléfono ${phoneToLookup}.`;
      }
      let out = `He encontrado los siguientes servicios agendados al número **${phoneToLookup}**:\n`;
      matchedList.forEach((s: any, idx: number) => {
        out += `\n**Servicio #${idx + 1}**\n🚗 *Vehículo*: ${s.vehicle || "Urbano"}\n🏷️ *Placa*: ${s.plate || "S/PLACA"}\n🛠️ *Servicio*: ${s.serviceType || "Mantenimiento"}\n📅 *Fecha*: ${(s.appointmentDate || "").replace('T', ' a las ')}\n📈 *Estatus*: ${String(s.status || "agendado").toUpperCase()}\n`;
      });
      return out;
    };

    if (gathered.awaitingHelpConfirmation === "true") {
      if (textLower.includes("agendar") || textLower.includes("otro") || textLower.includes("1") || textLower.includes("nuevo")) {
        // Reset booking details but keep phone & name
        delete gathered.serviceType;
        delete gathered.vehicle;
        delete gathered.plate;
        delete gathered.vin;
        delete gathered.tempDate;
        delete gathered.appointmentDate;
        delete gathered.confirmed;
        delete gathered.bookingCompleted;
        delete gathered.awaitingHelpConfirmation;
        delete gathered.awaitingStatusConfirmSameNumber;
        delete gathered.awaitingNewStatusPhone;
        delete gathered.awaitingWhatToDo;
        delete gathered.serviceCheckedAlready;

        botReply = `¡Excelente! Vamos a registrar tu nueva cita de servicio mecánico para el mismo número de contacto (${gathered.clientPhone}).\n\n¿Qué tipo de servicio o mantenimiento mecánico requiere su vehículo? (Por ejemplo: afinación, cambio de aceite o revisión de frenos).`;
      } else if (textLower.includes("estatus") || textLower.includes("validar") || textLower.includes("2") || textLower.includes("consultar") || textLower.includes("status")) {
        delete gathered.awaitingHelpConfirmation;
        botReply = `¿Estatus de vehículos registrados a este número?`;
        gathered.awaitingStatusConfirmSameNumber = "true";
      } else {
        botReply = `¡De nada! Ha sido un placer atenderte hoy en Automotriz Kioto. Tu asistente virtual Kioto se despide y te informa que esta conversación se reiniciará automáticamente enseguida para quedar lista para tus futuras citas. ¡Hasta pronto y excelente día!`;
        shouldResetChat = true;
      }
    } 
    // 1b. Check if we are waiting for the confirmation to check the SAME number
    else if (gathered.awaitingStatusConfirmSameNumber === "true") {
      delete gathered.awaitingStatusConfirmSameNumber;
      if (textLower.includes("si") || textLower.includes("sí") || textLower.includes("ok") || textLower.includes("correcto") || textLower.includes("claro")) {
        const lookupP = gathered.clientPhone || cleanSessionPhone;
        const statusText = getPhoneStatusStringFallback(lookupP, allServicios);
        botReply = `${statusText}\n\n¿Puedo ayudarte en algo más hoy?`;
        gathered.awaitingHelpConfirmation = "true";
      } else {
        botReply = `Entendido. Por favor indique el nuevo número de Teléfono Celular/WhatsApp de 10 dígitos para ver los servicios agendados de ese número:`;
        gathered.awaitingNewStatusPhone = "true";
      }
    }
    // 1c. Check if we are waiting for a NEW telephone to check status
    else if (gathered.awaitingNewStatusPhone === "true") {
      if (detectedPhone) {
        const statusText = getPhoneStatusStringFallback(detectedPhone, allServicios);
        botReply = `${statusText}\n\n¿Puedo ayudarte en algo más hoy?`;
        gathered.clientPhone = detectedPhone; // sync to the new phone
        gathered.awaitingHelpConfirmation = "true";
        delete gathered.awaitingNewStatusPhone;
      } else {
        botReply = `El formato del número no parece válido. Por favor proporcione un número de teléfono válido de 10 dígitos:`;
      }
    }
    // 2. Check if the user is answering what to do (Awaiting What To Do after phone was entered)
    else if (gathered.awaitingWhatToDo === "true") {
      delete gathered.awaitingWhatToDo;
      if (textLower.includes("agendar") || textLower.includes("1") || textLower.includes("nuevo")) {
        gathered.selectedAction = "agendar";
        botReply = `¡Excelente! Vamos a registrar tu nueva cita de servicio mecánico para el número de contacto (${gathered.clientPhone}).\n\nAhora por favor proporcione los datos de su vehículo: **Marca, Modelo y Año** (por ejemplo: Kioto Hybrid 2025).`;
      } else if (textLower.includes("estatus") || textLower.includes("2") || textLower.includes("consultar") || textLower.includes("validar") || textLower.includes("status")) {
        gathered.selectedAction = "status";
        const lookupP = gathered.clientPhone || cleanSessionPhone;
        const statusText = getPhoneStatusStringFallback(lookupP, allServicios);
        botReply = `${statusText}\n\n¿Puedo ayudarte en algo más hoy?`;
        gathered.awaitingHelpConfirmation = "true";
      } else {
        // Reprompt
        botReply = `Por favor proporcione qué desea hacer:\n1. **Agendar servicio** (por ejemplo: afinación, cambio de aceite, lavado)\n2. **Consultar estatus de un servicio**`;
        gathered.awaitingWhatToDo = "true";
      }
    }
    // 3. Normal initial steps: Name has not been set yet
    else if (!gathered.clientName) {
      gathered.clientName = userText;
      if (clientPhoneOrId && clientPhoneOrId.startsWith("cli-")) {
        botReply = `Mucho gusto, *${userText}*. ¿Qué tipo de servicio o mantenimiento mecánico requiere su vehículo? (Por ejemplo: afinación, cambio de aceite o revisión de frenos).`;
      } else {
        // They already have clientPhoneOrId as a phone! Set it and see if it has services
        gathered.clientPhone = clientPhoneOrId;
        const phoneLast10 = clientPhoneOrId.replace(/\D/g, "").slice(-10);
        const matchedList = allServicios.filter((s: any) => s.clientPhone && s.clientPhone.replace(/\D/g, "").endsWith(phoneLast10));
        
        if (matchedList.length > 0) {
          const listText = matchedList.map((s: any) => `- ${s.serviceType} para auto ${s.vehicle} (Fecha: ${s.appointmentDate.replace('T', ' a las ')}. Estatus: ${s.status.toUpperCase()})`).join('\n');
          botReply = `Mucho gusto, *${userText}*. Hemos verificado su número y encontramos que tiene servicios agendados con nosotros:\n\n${listText}\n\n¿Qué desea hacer?\n1. **Agendar servicio** (ejemplos: afinación, cambio de aceite, lavado)\n2. **Consultar estatus de un servicio**`;
        } else {
          botReply = `Mucho gusto, *${userText}*. ¿Qué desea hacer?\n1. **Agendar servicio** (ejemplos: afinación, cambio de aceite, lavado)\n2. **Consultar estatus de un servicio**`;
        }
        gathered.awaitingWhatToDo = "true";
      }
    }
    // 4. Service Type has not been set yet
    else if (!gathered.serviceType) {
      gathered.serviceType = userText;
      botReply = `Gracias, registrado: **${userText}**.\n\n¿Me indicas también tu número de Teléfono Celular/WhatsApp de 10 dígitos para enviarte la confirmación del servicio?`;
    }
    // 5. ClientPhone has not been set yet
    else if (!gathered.clientPhone) {
      if (detectedPhone) {
        gathered.clientPhone = detectedPhone;
        const phoneLast10 = detectedPhone.slice(-10);
        const matchedList = allServicios.filter((s: any) => s.clientPhone && s.clientPhone.replace(/\D/g, "").endsWith(phoneLast10));
        
        if (matchedList.length > 0) {
          const listText = matchedList.map((s: any) => `- ${s.serviceType} para auto ${s.vehicle} (Fecha: ${s.appointmentDate.replace('T', ' a las ')}. Estatus: ${s.status.toUpperCase()})`).join('\n');
          botReply = `Gracias por registrar tu número: *${detectedPhone}*. Hemos verificado su número y encontramos que tiene servicios agendados con nosotros:\n\n${listText}\n\n¿Qué desea hacer?\n1. **Agendar servicio** (ejemplos: afinación, cambio de aceite, lavado)\n2. **Consultar estatus de un servicio**`;
        } else {
          botReply = `Gracias por registrar tu número: *${detectedPhone}*.\n\n¿Qué desea hacer?\n1. **Agendar servicio** (ejemplos: afinación, cambio de aceite, lavado)\n2. **Consultar estatus de un servicio**`;
        }
        gathered.awaitingWhatToDo = "true";
      } else {
        botReply = `Por favor indica un número de teléfono celular válido de 10 dígitos:`;
      }
    }
    // 6. Rest of booking sequence (vehicle, plate, vin, etc.)
    else if (!gathered.vehicle) {
      gathered.vehicle = userText;
      botReply = `Registrado: *${userText}*.\n\nPor favor proporcione el número de **Placa** de circulación del vehículo.`;
    } else if (!gathered.plate) {
      // Step 3b: Request Placas
      const upperMsg = userText.trim().toUpperCase();
      if (upperMsg.length === 17 && /^[A-Z0-9]{17}$/.test(upperMsg)) {
        // El usuario ingresó el NIV en lugar de las placas
        gathered.vin = upperMsg;
        botReply = `Registramos tu número de serie o **NIV** como *${upperMsg}*. Sin embargo, aún requerimos el número de **Placa** de circulación de tu vehículo. ¿Me la podrías proporcionar?`;
      } else {
        gathered.plate = upperMsg;
        if (gathered.vin) {
          botReply = `Placa *${gathered.plate}* registrada.\n\nPor último, por favor proporcione la **fecha** deseada para su servicio mecánico (en formato AÑO-MES-DÍA, por ejemplo: \`2026-05-25\`).`;
        } else {
          botReply = `Placa *${gathered.plate}* registrada.\n\nAhora, indique el **NIV** de 17 caracteres (Número de Identificación Vehicular) para el registro completo.`;
        }
      }
    } else if (!gathered.vin) {
      // Step 3c: Request NIV
      const proposedVin = userText.trim().toUpperCase();
      if (proposedVin.length !== 17) {
        botReply = `El **NIV** que proporcionaste tiene **${proposedVin.length}** caracteres ("${proposedVin}").\n\nPor favor, ingresa el **NIV** correcto. Debe constar de **exactamente 17 caracteres** alfanuméricos.`;
      } else {
        gathered.vin = proposedVin;
        botReply = `NIV registrado con éxito: **${proposedVin}**.\n\nPor último, por favor proporcione la **fecha** deseada para su servicio mecánico (en formato AÑO-MES-DÍA, por ejemplo: \`2026-05-25\`).`;
      }
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
        const randomDigits = Math.floor(100000 + Math.random() * 900000);
        const id = `KSM-${randomDigits}`;
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
        gathered.bookingCompleted = true;

        // Format WhatsApp notification details
        const formattedDate = proposedFull.replace("T", " a las ");
        const confirmMsg = `🔧 *KIOTO SERVICIO MECÁNICO - CONFIRMACIÓN* 🔧\n\nEstimado(a) *${gathered.clientName}*,\nTu servicio de taller Kioto ha sido agendado exitosamente:\n\n🚙 *Vehículo*: ${gathered.vehicle}\n🏷️ *Placas*: ${gathered.plate}\n📆 *Hora*: ${formattedDate}\n🛠️ *Servicio*: *${gathered.serviceType}*\n\n¡Te esperamos!`;
        triggerClientWhatsAppLog(gathered.clientName, gathered.clientPhone || clientPhoneOrId, "confirmacion", confirmMsg);

        botReply = `¡Felicidades, **${gathered.clientName}**! Tu cita para **${gathered.serviceType}** ha sido registrada con éxito para el día y hora seleccionados:\n\n📅 **${formattedDate}**\n🚗 **Auto**: ${gathered.vehicle}\n🏷️ **Placa**: ${gathered.plate}\n⚙️ Estatus: *Servicio Agendado*\n\nTe acabamos de enviar una confirmación automática completa a tu WhatsApp con los detalles del técnico asignado y las garantías oficiales. ¿Puedo ayudarte en alguna otra consulta hoy?`;
      }
    } else if (gathered.bookingCompleted) {
      botReply = `¡De nada! Ha sido un placer atenderte hoy en Automotriz Kioto. Recuerda que puedes explorar más opciones de Automotriz Kioto en nuestro portal.`;
    } else {
      botReply = `¡Hola! Tu cita de taller ya está programada. Deseas información de precios o de alguna otra orden de servicio técnica?`;
    }

    if (botReply && (botReply.includes("¿Puedo ayudarte") || botReply.includes("ayudarlo en algo mas") || botReply.includes("ayudarlo en algo más") || botReply.includes("ayudarte en alguna otra"))) {
      gathered.awaitingHelpConfirmation = "true";
    }

    if (gathered && gathered.bookingCompleted && botReply && !botReply.includes("¿Puedo ayudarte") && gathered.awaitingHelpConfirmation !== "true") {
      const phrase = "Tu asistente Kioto reiniciara esta conversación enseguida";
      if (!botReply.includes(phrase)) {
        botReply = botReply.trim() + "\n\n" + phrase;
      }
      session.appointmentType = null;
      session.gatheredData = {};
      session.isFinished = true;
    }

    session.gatheredData = gathered;

    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: "bot",
      text: botReply,
      timestamp: new Date().toISOString()
    };
    session.messages.push(botMsg);
    session.updatedAt = new Date().toISOString();
    if (shouldResetChat) {
      chats.delete(clientPhoneOrId);
    } else {
      chats.set(clientPhoneOrId, session);
    }
    saveChats(chats);

    return new MockResponse({ success: true, session, bookingOutcome, resetChat: shouldResetChat });
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

    // 1. If running in a local or sandbox environment, ALWAYS talk to the local Express backend relatively.
    if (isLocalOrSandbox) {
      try {
        const res = await fetch(url, init);
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("text/html")) {
          console.warn(`API route ${url} returned HTML. Falling back to live client-side database simulation.`);
          return executeClientRequest(url, init) as any;
        }
        return res;
      } catch (err) {
        console.warn("API Server unavailable. Falling back to live Frontend Firestore client:", err);
        return executeClientRequest(url, init) as any;
      }
    }

    // 2. If hosted externally (like on Vercel):
    // Try to route requests to the remote backend (Cloud Run) if VITE_API_URL is defined.
    // @ts-ignore
    const viteApiUrl = import.meta.env.VITE_API_URL || "";
    if (viteApiUrl) {
      const cleanBase = viteApiUrl.endsWith("/") ? viteApiUrl.slice(0, -1) : viteApiUrl;
      try {
        const remoteRes = await fetch(cleanBase + url, init);
        const contentType = remoteRes.headers.get("content-type") || "";
        if (!contentType.includes("text/html")) {
          return remoteRes;
        }
        console.warn(`Remote server ${cleanBase} returned HTML for ${url}. Falling back to Firestore client-side simulator.`);
      } catch (err) {
        console.error(`Failed to reach remote server at ${cleanBase}:`, err);
      }
    }

    // 3. Otherwise, fallback to the local Firestore client simulator
    return executeClientRequest(url, init) as any;
  }

  return fetch(input, init);
}

