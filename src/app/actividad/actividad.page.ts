import { ChangeDetectorRef, Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Router, RouterLink } from "@angular/router";
import { IonContent } from "@ionic/angular";
import { StorageService, UsuarioGuardado } from "../services/storage";
import { ApiConfigService } from "../services/api-config";

interface Actividad {
  id: number;
  usuario_id: number;
  username: string;
  nombre: string;
  email: string;
  role_id: number;
  rol: string;
  accion: string;
  descripcion: string;
  fecha: string;
}

@Component({
  selector: "app-actividad",
  templateUrl: "./actividad.page.html",
  styleUrls: ["./actividad.page.scss"],
  standalone: true,
  imports: [CommonModule, IonContent, RouterLink],
})
export class ActividadPage implements OnInit {
  // ==========================================
  // SERVICIOS
  // ==========================================

  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);
  private cdr = inject(ChangeDetectorRef);
  private apiConfig = inject(ApiConfigService);

  // ==========================================
  // API
  // ==========================================

  // ==========================================
  // VARIABLES
  // ==========================================

  actividades: Actividad[] = [];

  usuarioActual: UsuarioGuardado | null = null;

  cargando = false;

  error = "";

  // ==========================================
  // PRIMERA CARGA
  // ==========================================

  ngOnInit(): void {
    console.log("ActividadPage creada");
  }

  // ==========================================
  // CADA VEZ QUE ENTRAMOS A /actividad
  // ==========================================

  async ionViewWillEnter(): Promise<void> {
    console.log("Entrando a /actividad");

    await this.verificarPermisos();
  }

  // ==========================================
  // VERIFICAR SESIÓN Y PERMISOS
  // ==========================================

  async verificarPermisos(): Promise<void> {
    this.usuarioActual = await this.storage.obtenerUsuario();

    console.log("Usuario actual en actividad:", this.usuarioActual);

    // ========================================
    // NO EXISTE SESIÓN
    // ========================================

    if (!this.usuarioActual) {
      console.log("No existe una sesión activa.");

      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });

      return;
    }

    // ========================================
    // ASEGURAR QUE role_id SEA NÚMERO
    // ========================================

    this.usuarioActual.role_id = Number(this.usuarioActual.role_id);

    console.log("Role ID:", this.usuarioActual.role_id);

    // ========================================
    // SOLO ADMINISTRADOR
    // ========================================

    if (this.usuarioActual.role_id !== 1) {
      console.log("Acceso denegado. No es administrador.");

      await this.router.navigateByUrl("/usuarios", {
        replaceUrl: true,
      });

      return;
    }

    // ========================================
    // COMPROBAR TOKEN
    // ========================================

    const token = await this.storage.obtenerToken();

    if (!token) {
      console.log("No existe token de autenticación.");

      await this.storage.eliminarUsuario();

      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });

      return;
    }

    console.log("Acceso permitido a actividad: Administrador");

    // ========================================
    // CARGAR ACTIVIDAD
    // ========================================

    await this.cargarActividad();
  }

  // ==========================================
  // CREAR HEADERS CON BEARER TOKEN
  // ==========================================

  private async obtenerHeaders(): Promise<HttpHeaders | null> {
    const token = await this.storage.obtenerToken();

    if (!token) {
      this.error = "No existe una sesión de autenticación válida.";

      this.cdr.detectChanges();

      return null;
    }

    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    });
  }

  // ==========================================
  // CARGAR HISTORIAL DESDE actividad.php
  // ==========================================

  async cargarActividad(): Promise<void> {
    // ========================================
    // MOSTRAR CARGANDO
    // ========================================

    this.cargando = true;
    this.error = "";

    this.cdr.detectChanges();

    // ========================================
    // OBTENER TOKEN
    // ========================================

    const headers = await this.obtenerHeaders();

    if (!headers) {
      this.cargando = false;

      this.cdr.detectChanges();

      return;
    }

    const apiUrl = await this.apiConfig.endpoint("actividad.php");
    console.log("Solicitando actividad a:", apiUrl);

    // ========================================
    // PETICIÓN GET
    // ========================================

    this.http
      .get<Actividad[]>(apiUrl, {
        headers,
      })
      .subscribe({
        // ====================================
        // RESPUESTA CORRECTA
        // ====================================

        next: (respuesta) => {
          console.log("Actividad cargada desde XAMPP:", respuesta);

          // Guardamos los registros
          this.actividades = respuesta;

          // Quitamos el estado cargando
          this.cargando = false;

          console.log("Cantidad:", this.actividades.length);

          console.log("cargando:", this.cargando);

          // ==================================
          // FORZAR ACTUALIZACIÓN DEL HTML
          // ==================================

          this.cdr.detectChanges();
        },

        // ====================================
        // ERROR
        // ====================================

        error: async (error) => {
          console.error("Error al cargar actividad:", error);

          this.cargando = false;

          // ==================================
          // TOKEN INVÁLIDO O EXPIRADO
          // ==================================

          if (error.status === 401) {
            this.error = "Tu sesión ha expirado.";

            this.cdr.detectChanges();

            await this.storage.eliminarUsuario();

            await this.router.navigateByUrl("/login", {
              replaceUrl: true,
            });

            return;
          }

          // ==================================
          // USUARIO SIN PERMISOS
          // ==================================

          if (error.status === 403) {
            this.error = "No tienes permisos para consultar la actividad.";

            this.cdr.detectChanges();

            await this.router.navigateByUrl("/usuarios", {
              replaceUrl: true,
            });

            return;
          }

          // ==================================
          // OTRO ERROR
          // ==================================

          this.error =
            error?.error?.message ||
            "No se pudo cargar el historial de actividad.";

          this.cdr.detectChanges();
        },

        // ====================================
        // PETICIÓN TERMINADA
        // ====================================

        complete: () => {
          this.cargando = false;

          console.log("Petición de actividad finalizada.");

          this.cdr.detectChanges();
        },
      });
  }

  // ==========================================
  // ACTUALIZAR HISTORIAL
  // ==========================================

  actualizarActividad(): void {
    console.log("Actualizando historial...");

    void this.cargarActividad();
  }

  // ==========================================
  // VOLVER A USUARIOS
  // ==========================================

  async volverUsuarios(): Promise<void> {
    await this.router.navigateByUrl("/usuarios");
  }
}
