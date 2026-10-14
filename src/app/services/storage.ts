// Función: administrar la información que Ionic guarda
// localmente usando Capacitor Preferences.

import { Injectable } from "@angular/core";
import { Preferences } from "@capacitor/preferences";

// ==========================================
// USUARIO GUARDADO
// ==========================================

export interface UsuarioGuardado {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  role_id: number;
  rol: string;
}

// ==========================================
// STORAGE SERVICE
// ==========================================

@Injectable({
  providedIn: "root",
})
export class StorageService {
  // ==========================================
  // USUARIO
  // ==========================================

  async guardarUsuario(usuario: UsuarioGuardado): Promise<void> {
    await Preferences.set({
      key: "usuario",
      value: JSON.stringify(usuario),
    });

    console.log("Usuario guardado en Preferences:", usuario);
  }

  async obtenerUsuario(): Promise<UsuarioGuardado | null> {
    const resultado = await Preferences.get({
      key: "usuario",
    });

    if (!resultado.value) {
      return null;
    }

    try {
      const usuario = JSON.parse(resultado.value) as UsuarioGuardado;

      // Aseguramos que role_id siempre sea número
      usuario.role_id = Number(usuario.role_id);

      return usuario;
    } catch (error) {
      console.error("Error al leer el usuario guardado:", error);

      await Preferences.remove({
        key: "usuario",
      });

      return null;
    }
  }

  // ==========================================
  // TOKEN
  // ==========================================

  async guardarToken(token: string): Promise<void> {
    await Preferences.set({
      key: "auth_token",
      value: token,
    });

    console.log("Token guardado en Preferences");
  }

  async obtenerToken(): Promise<string | null> {
    const resultado = await Preferences.get({
      key: "auth_token",
    });

    return resultado.value ?? null;
  }

  async eliminarToken(): Promise<void> {
    await Preferences.remove({
      key: "auth_token",
    });

    console.log("Token eliminado de Preferences");
  }

  // ==========================================
  // CACHÉ DE USUARIOS
  // ==========================================

  async guardarUsuariosCache(usuarios: unknown[]): Promise<void> {
    await Preferences.set({
      key: "usuarios_cache",
      value: JSON.stringify(usuarios),
    });

    console.log("Usuarios guardados en caché:", usuarios);
  }

  async obtenerUsuariosCache(): Promise<unknown[]> {
    const resultado = await Preferences.get({
      key: "usuarios_cache",
    });

    // Si nunca se ha guardado caché
    if (!resultado.value) {
      console.log("No existe caché de usuarios.");

      return [];
    }

    try {
      const usuarios = JSON.parse(resultado.value);

      console.log("Usuarios recuperados desde caché:", usuarios);

      return usuarios;
    } catch (error) {
      console.error("Error al leer la caché de usuarios:", error);

      return [];
    }
  }

  // ==========================================
  // ELIMINAR CACHÉ DE USUARIOS
  // ==========================================

  async eliminarUsuariosCache(): Promise<void> {
    await Preferences.remove({
      key: "usuarios_cache",
    });

    console.log("Caché de usuarios eliminada.");
  }

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  async eliminarUsuario(): Promise<void> {
    await Preferences.remove({
      key: "usuario",
    });

    await Preferences.remove({
      key: "auth_token",
    });

    console.log("Usuario y token eliminados de Preferences");
  }
}
