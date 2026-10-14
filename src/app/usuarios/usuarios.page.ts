import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { IonContent } from "@ionic/angular";
import { firstValueFrom } from "rxjs";

import { StorageService, UsuarioGuardado } from "../services/storage";
import { NetworkService } from "../services/network";
import { ApiConfigService } from "../services/api-config";

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  role_id?: number;
  rol?: string;
  created_at?: string;
}

@Component({
  selector: "app-usuarios",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent],
  templateUrl: "./usuarios.page.html",
  styleUrls: ["./usuarios.page.scss"],
})
export class UsuariosPage {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private networkService = inject(NetworkService);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  usuarios: Usuario[] = [];
  usuarioActual: UsuarioGuardado | null = null;

  busqueda = "";
  cargando = false;
  error = "";
  usandoCache = false;
  conectado = true;
  cerrandoSesion = false;

  async ionViewWillEnter(): Promise<void> {
    this.busqueda = "";

    await this.cargarUsuarioActual();

    const token = await this.storage.obtenerToken();

    if (!this.usuarioActual || !token) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    await this.cargarUsuarios();
  }

  async cargarUsuarioActual(): Promise<void> {
    const usuario = await this.storage.obtenerUsuario();

    this.usuarioActual = usuario
      ? { ...usuario, role_id: Number(usuario.role_id) }
      : null;

    this.cdr.detectChanges();
  }

  async cargarUsuarios(): Promise<void> {
    if (this.cargando) return;

    this.cargando = true;
    this.error = "";
    this.usandoCache = false;
    this.cdr.detectChanges();

    try {
      const token = await this.storage.obtenerToken();

      if (!token) {
        await this.expirarSesion();
        return;
      }

      try {
        this.conectado = await this.networkService.hayConexion();
      } catch {
        this.conectado = false;
      }

      if (!this.conectado) {
        await this.cargarUsuariosDesdeCache(
          "Sin conexión. Mostrando los últimos datos guardados.",
        );
        return;
      }

      const apiUrl = await this.apiConfig.endpoint("users.php");

      const respuesta = await firstValueFrom(
        this.http.get<Usuario[]>(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );

      if (!Array.isArray(respuesta)) {
        throw new Error("La API no devolvió una lista de usuarios.");
      }

      this.usuarios = respuesta;
      this.usandoCache = false;

      try {
        await this.storage.guardarUsuariosCache(respuesta);
      } catch (cacheError) {
        console.warn("No se pudo actualizar la caché:", cacheError);
      }
    } catch (error: unknown) {
      console.error("Error cargando usuarios:", error);

      const status = this.obtenerEstadoHttp(error);

      if (status === 401) {
        await this.expirarSesion();
        return;
      }

      if (status === 403) {
        this.usuarios = [];
        this.error = "No tienes permisos para consultar usuarios.";
        return;
      }

      await this.cargarUsuariosDesdeCache(
        "No se pudo acceder al servidor. Mostrando los últimos datos guardados.",
      );
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  private obtenerEstadoHttp(error: unknown): number {
    if (typeof error === "object" && error !== null && "status" in error) {
      const status = (error as { status?: unknown }).status;
      return typeof status === "number" ? status : 0;
    }

    return 0;
  }

  private async cargarUsuariosDesdeCache(mensaje: string): Promise<void> {
    try {
      const cache = await this.storage.obtenerUsuariosCache();

      this.usuarios = Array.isArray(cache) ? (cache as Usuario[]) : [];

      this.usandoCache = this.usuarios.length > 0;

      this.error = this.usandoCache
        ? mensaje
        : "No se pudo acceder al servidor y no existen usuarios guardados localmente.";
    } catch {
      this.usuarios = [];
      this.usandoCache = false;
      this.error = "No fue posible cargar los usuarios guardados.";
    }

    this.cdr.detectChanges();
  }

  async actualizarUsuarios(): Promise<void> {
    await this.cargarUsuarios();
  }

  get usuariosFiltrados(): Usuario[] {
    const texto = this.busqueda.trim().toLowerCase();

    if (!texto) {
      return this.usuarios;
    }

    return this.usuarios.filter((usuario) => {
      return (
        (usuario.nombre || "").toLowerCase().includes(texto) ||
        (usuario.username || "").toLowerCase().includes(texto) ||
        (usuario.email || "").toLowerCase().includes(texto) ||
        (usuario.rol || "").toLowerCase().includes(texto)
      );
    });
  }

  obtenerInicial(nombre: string): string {
    return nombre?.trim().charAt(0).toUpperCase() || "?";
  }

  obtenerRol(usuario: Usuario): string {
    if (usuario.rol) return usuario.rol;

    switch (Number(usuario.role_id)) {
      case 1:
        return "Administrador";
      case 2:
        return "Editor";
      case 3:
        return "Usuario";
      default:
        return "Sin rol";
    }
  }

  esAdministrador(): boolean {
    return Number(this.usuarioActual?.role_id) === 1;
  }

  esEditor(): boolean {
    return Number(this.usuarioActual?.role_id) === 2;
  }

  esUsuario(): boolean {
    return Number(this.usuarioActual?.role_id) === 3;
  }

  puedeGestionarUsuarios(): boolean {
    return this.esAdministrador();
  }

  puedeVerActividad(): boolean {
    return this.esAdministrador();
  }

  private async expirarSesion(): Promise<void> {
    await this.storage.eliminarUsuario();

    this.usuarioActual = null;
    this.usuarios = [];

    await this.router.navigateByUrl("/login", {
      replaceUrl: true,
    });
  }

  async cerrarSesion(): Promise<void> {
    if (this.cerrandoSesion) return;

    this.cerrandoSesion = true;
    this.cdr.detectChanges();

    try {
      await this.storage.eliminarUsuario();

      this.usuarioActual = null;
      this.usuarios = [];

      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      this.error = "No se pudo cerrar la sesión.";
    } finally {
      this.cerrandoSesion = false;
      this.cdr.detectChanges();
    }
  }
}
