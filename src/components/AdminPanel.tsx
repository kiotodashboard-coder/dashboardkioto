import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  ShieldCheck, 
  RefreshCw, 
  AlertCircle, 
  Check, 
  X,
  UserCheck
} from 'lucide-react';
import { User, UserRole } from '../types';

interface AdminPanelProps {
  onUsersChanged?: () => void;
}

export default function AdminPanel({ onUsersChanged }: AdminPanelProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Form State
  const [userId, setUserId] = useState<string>(''); // empty means creating new user
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Servicio');
  const [name, setName] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setErrorMsg("Error al conectar con la api de usuarios.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al obtener la lista de usuarios.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setUserId('');
    setUsername('');
    setPassword('');
    setRole('Servicio');
    setName('');
    setIsEditing(false);
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setTimeout(() => setErrorMsg(''), 4000);
  };

  const handleCreateOrUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !name.trim()) {
      showError("Por favor complete todos los campos obligatorios.");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && userId) {
        // UPDATE
        const res = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, role, name })
        });
        const data = await res.json();
        if (res.ok) {
          showSuccess(`Usuario "${name}" actualizado exitosamente.`);
          fetchUsers();
          resetForm();
          if (onUsersChanged) onUsersChanged();
        } else {
          showError(data.error || "Fallo al actualizar el perfil.");
        }
      } else {
        // CREATE / ALTA
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password: "", role, name })
        });
        const data = await res.json();
        if (res.ok || res.status === 211) {
          showSuccess(`Usuario "${name}" registrado exitosamente.`);
          fetchUsers();
          resetForm();
          if (onUsersChanged) onUsersChanged();
        } else {
          showError(data.error || "Error al crear el perfil.");
        }
      }
    } catch (err) {
      console.error(err);
      showError("Sucedió un error al contactar el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (user: User) => {
    setUserId(user.id);
    setUsername(user.username);
    setPassword(user.password || '');
    setRole(user.role);
    setName(user.name);
    setIsEditing(true);
  };

  const handleDeleteUser = async (id: string, nameToDelete: string) => {
    if (id === 'u-admin') {
      showError("No es posible eliminar el usuario Admin principal de kioto.");
      return;
    }
    if (!confirm(`¿Está seguro de que desea eliminar a "${nameToDelete}"?`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        showSuccess(`El usuario "${nameToDelete}" ha sido removido con éxito.`);
        fetchUsers();
        if (onUsersChanged) onUsersChanged();
      } else {
        showError(data.error || "No se pudo eliminar el usuario.");
      }
    } catch (err) {
      console.error(err);
      showError("Ocurrió un error al despachar la baja.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="admin-perfiles-section" className="space-y-6">
      
      {/* Notifications bar */}
      {successMsg && (
        <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-lg p-3 text-xs flex items-center shadow-xs animate-fade">
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

      {/* Side-by-side Layout identical to screenshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Enrolar Usuario */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <div className="flex items-center space-x-2 text-gray-900">
                <UserCheck className="w-5 h-5 text-gray-800" />
                <h3 className="text-md font-bold tracking-tight text-gray-900">
                  {isEditing ? "Modificar Usuario" : "Enrolar Usuario"}
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-1 leading-normal">
                {isEditing 
                  ? "Modifique los accesos y roles del colaborador a continuación" 
                  : "Da de alta nuevo personal de administración o servicio"}
              </p>
            </div>

            <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 pt-1">
              {/* Field: Nombre Completo */}
              <div>
                <label className="block text-xs font-bold text-gray-850 mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  id="admin-user-full-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Jorge Villanueva"
                  className="w-full bg-white border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2.5 px-3 text-xs focus:ring-1 focus:ring-gray-800 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Field: Correo Electrónico (binds to username) */}
              <div>
                <label className="block text-xs font-bold text-gray-850 mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  id="admin-user-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-white border border-gray-200 text-gray-950 placeholder-gray-400 rounded-lg py-2.5 px-3 text-xs focus:ring-1 focus:ring-gray-800 focus:outline-none transition-all"
                  required
                />
              </div>

              {/* Field: Rol Dropdown identical to screenshot select */}
              <div>
                <label className="block text-xs font-bold text-gray-850 mb-1.5">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full bg-white border border-gray-200 text-gray-950 rounded-lg py-2.5 px-3 text-xs focus:ring-1 focus:ring-gray-800 focus:outline-none cursor-pointer transition-all"
                >
                  <option value="Servicio">Servicio</option>
                  <option value="Admin">Administrador</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  id="btn-submit-user-form"
                  disabled={loading}
                  className="w-full bg-neutral-950 hover:bg-neutral-800 text-white font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors text-center cursor-pointer shadow-xs"
                >
                  {isEditing ? "Guardar Modificaciones" : "Enrolar Usuario"}
                </button>
                {isEditing && (
                  <button
                    type="button"
                    id="btn-cancel-user-edit"
                    onClick={resetForm}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-3.5 rounded-lg text-xs"
                    title="Cancelar edición"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Gestión de Usuarios */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-md font-bold tracking-tight text-gray-900">
                  Gestión de Usuarios
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Lista de personal autorizado en Kioto
                </p>
              </div>
              <button
                onClick={fetchUsers}
                className="p-1.5 px-3 border border-gray-200 hover:bg-gray-50 rounded-lg text-xs text-gray-600 flex items-center font-medium transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Actualizar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs text-gray-900 font-bold tracking-normal">
                    <th className="py-4 px-6">Nombre</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Rol</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        Cargando personal autorizado...
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-gray-50/50 transition-colors ${
                          user.id === userId ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Name */}
                        <td className="py-3.5 px-6 font-semibold text-gray-900">
                          {user.name}
                        </td>
                        
                        {/* Email */}
                        <td className="py-3.5 px-6 font-mono font-medium text-gray-600">
                          {user.username.includes('@') ? user.username : `${user.username.toLowerCase()}@boletomovil.com`}
                        </td>
                        
                        {/* Role tag */}
                        <td className="py-3.5 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                            user.role === 'Admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-150'
                              : 'bg-blue-50 text-blue-700 border-blue-150'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        
                        {/* Estado */}
                        <td className="py-3.5 px-6">
                          <span className="inline-flex items-center text-xs font-medium text-emerald-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                            Activo
                          </span>
                        </td>
                        
                        {/* Actions */}
                        <td className="py-3.5 px-6 text-right space-x-1.5">
                          <button
                            type="button"
                            id={`btn-edit-user-${user.id}`}
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 hover:bg-gray-100 text-slate-700 hover:text-slate-900 rounded-md inline-flex items-center transition-colors"
                            title="Editar usuario"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            id={`btn-delete-user-${user.id}`}
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            disabled={user.username === 'Admin'}
                            className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-md inline-flex items-center disabled:opacity-30 transition-colors"
                            title="Eliminar usuario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>


          </div>
        </div>

      </div>
    </div>
  );
}
