import { Component, OnInit, ChangeDetectorRef, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import {
  HttpClient,
  HttpHeaders,
  HttpErrorResponse,
} from "@angular/common/http";

import { Router, RouterLink } from "@angular/router";
import { IonContent } from "@ionic/angular";
import { firstValueFrom } from "rxjs";

import { StorageService, UsuarioGuardado } from "../services/storage";

import { ApiConfigService } from "../services/api-config";

// ==========================================
// INTERFAZ DE USUARIO
// ==========================================

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  role_id: number;
  rol: string;
  created_at?: string;
}

@Component({
  selector: "app-gestionar-usuarios",
  templateUrl: "./gestionar-usuarios.page.html",
  styleUrls: ["./gestionar-usuarios.page.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent],
})
export class GestionarUsuariosPage implements OnInit {
  // ==========================================
  // SERVICIOS
  // ==========================================

  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // VARIABLES
  // ==========================================

  usuarios: Usuario[] = [];

  usuarioActual: UsuarioGuardado | null = null;

  username = "";
  email = "";
  nombre = "";
  password = "";

  // Rol predeterminado: Usuario
  role_id = 3;

  mensaje = "";

  cargando = false;
  agregando = false;

  // ==========================================
  // INICIO DE LA PÁGINA
  // ==========================================

  async ngOnInit(): Promise<void> {
    await this.verificarPermisos();
  }

  // ==========================================
  // VERIFICAR PERMISOS
  // ==========================================

  async verificarPermisos(): Promise<void> {
    this.usuarioActual = await this.storage.obtenerUsuario();

    // Comprobar sesión
    if (!this.usuarioActual) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });

      return;
    }

    // Solo administradores
    if (this.usuarioActual.role_id !== 1) {
      await this.router.navigateByUrl("/usuarios", {
        replaceUrl: true,
      });

      return;
    }

    // Comprobar token
    const token = await this.storage.obtenerToken();

    if (!token) {
      await this.storage.eliminarUsuario();

      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });

      return;
    }

    console.log("Administrador autenticado correctamente");
  }

  // ==========================================
  // HEADERS DE AUTENTICACIÓN
  // ==========================================

  private async obtenerHeaders(): Promise<HttpHeaders | null> {
    const token = await this.storage.obtenerToken();

    if (!token) {
      this.mensaje = "No existe una sesión de autenticación válida.";

      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
  }

  // ==========================================
  // OBTENER MENSAJE DE ERROR
  // ==========================================

  private obtenerMensajeError(
    error: unknown,
    mensajePredeterminado: string,
  ): string {
    if (error instanceof HttpErrorResponse) {
      const respuesta: unknown = error.error;

      if (
        typeof respuesta === "object" &&
        respuesta !== null &&
        "message" in respuesta &&
        typeof respuesta.message === "string"
      ) {
        return respuesta.message;
      }
    }

    return mensajePredeterminado;
  }

  // ==========================================
  // CARGAR USUARIOS
  // ==========================================

  async cargarUsuarios(): Promise<void> {
    this.cargando = true;

    try {
      const headers = await this.obtenerHeaders();

      if (!headers) {
        return;
      }

      const apiUrl = await this.apiConfig.endpoint("users.php");

      const respuesta = await firstValueFrom(
        this.http.get<Usuario[]>(apiUrl, {
          headers,
        }),
      );

      this.usuarios = respuesta;

      console.log("Usuarios cargados:", this.usuarios);
    } catch (error: unknown) {
      console.error("Error al cargar usuarios:", error);

      this.mensaje = this.obtenerMensajeError(
        error,
        "Error al cargar los usuarios",
      );
    } finally {
      this.cargando = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // AGREGAR USUARIO
  // ==========================================

  async agregarUsuario(): Promise<void> {
    // Evitar registros duplicados por varios clics
    if (this.agregando) {
      return;
    }

    this.mensaje = "";

    // ========================================
    // VALIDAR CAMPOS
    // ========================================

    if (
      !this.username.trim() ||
      !this.email.trim() ||
      !this.nombre.trim() ||
      !this.password.trim()
    ) {
      this.mensaje = "Completa todos los campos";
      this.cdr.detectChanges();

      return;
    }

    // ========================================
    // VALIDAR ROL
    // ========================================

    if (this.role_id !== 1 && this.role_id !== 2 && this.role_id !== 3) {
      this.mensaje = "Selecciona un rol válido";
      this.cdr.detectChanges();

      return;
    }

    // ========================================
    // INICIAR REGISTRO
    // ========================================

    this.agregando = true;
    this.cdr.detectChanges();

    try {
      const headers = await this.obtenerHeaders();

      if (!headers) {
        return;
      }

      // ======================================
      // DATOS DEL NUEVO USUARIO
      // ======================================

      const nuevoUsuario = {
        username: this.username.trim(),
        email: this.email.trim(),
        nombre: this.nombre.trim(),
        password: this.password,
        role_id: this.role_id,
      };

      const apiUrl = await this.apiConfig.endpoint("users.php");

      // ======================================
      // ENVIAR DATOS A PHP
      // ======================================

      const respuesta = await firstValueFrom(
        this.http.post(apiUrl, nuevoUsuario, {
          headers,
        }),
      );

      console.log("Usuario creado:", respuesta);

      // ======================================
      // LIMPIAR FORMULARIO
      // ======================================

      this.username = "";
      this.email = "";
      this.nombre = "";
      this.password = "";

      // Regresar al rol Usuario
      this.role_id = 3;

      // ======================================
      // MOSTRAR CONFIRMACIÓN
      // ======================================

      this.mensaje = "Usuario agregado correctamente";
    } catch (error: unknown) {
      console.error("Error al crear usuario:", error);

      this.mensaje = this.obtenerMensajeError(
        error,
        "No se pudo agregar el usuario",
      );
    } finally {
      // Siempre desbloquear el botón
      this.agregando = false;

      // Actualizar inmediatamente el formulario
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // ELIMINAR USUARIO
  // ==========================================

  async eliminarUsuario(id: number): Promise<void> {
    // No permitir eliminar la cuenta actual
    if (this.usuarioActual?.id === id) {
      this.mensaje =
        "No puedes eliminar tu propia cuenta mientras tienes la sesión iniciada.";

      this.cdr.detectChanges();

      return;
    }

    const confirmar = confirm("¿Seguro que deseas eliminar este usuario?");

    if (!confirmar) {
      return;
    }

    try {
      const headers = await this.obtenerHeaders();

      if (!headers) {
        return;
      }

      const apiUrl = await this.apiConfig.endpoint("users.php");

      // ======================================
      // ELIMINAR EN LA BASE DE DATOS
      // ======================================

      await firstValueFrom(
        this.http.delete(`${apiUrl}?id=${id}`, {
          headers,
        }),
      );

      // Actualizar datos locales
      this.usuarios = this.usuarios.filter((usuario) => usuario.id !== id);

      this.mensaje = "Usuario eliminado correctamente";
    } catch (error: unknown) {
      console.error("Error al eliminar usuario:", error);

      this.mensaje = this.obtenerMensajeError(
        error,
        "No se pudo eliminar el usuario",
      );
    } finally {
      this.cdr.detectChanges();
    }
  }
}
