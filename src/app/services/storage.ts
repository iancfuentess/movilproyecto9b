import { Injectable } from "@angular/core";
import { Preferences } from "@capacitor/preferences";

export interface UsuarioGuardado {
  id: number;
  username: string;
  email: string;
  nombre?: string;
}

@Injectable({
  providedIn: "root",
})
export class StorageService {
  async guardarUsuario(usuario: UsuarioGuardado): Promise<void> {
    await Preferences.set({
      key: "usuario",
      value: JSON.stringify(usuario),
    });
  }

  async obtenerUsuario(): Promise<UsuarioGuardado | null> {
    const resultado = await Preferences.get({
      key: "usuario",
    });

    if (!resultado.value) {
      return null;
    }

    return JSON.parse(resultado.value) as UsuarioGuardado;
  }

  async eliminarUsuario(): Promise<void> {
    await Preferences.remove({
      key: "usuario",
    });
  }
}
