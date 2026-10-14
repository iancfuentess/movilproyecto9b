import { Component, inject } from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonContent } from "@ionic/angular";
import { Router } from "@angular/router";
import axios from "axios";

import { StorageService } from "../services/storage";
import { ApiConfigService } from "../services/api-config";

//  storage en un servicio para guardar usuario y token de autenticacion

//definen como debe verse el usuario dentro de ts
interface LoginUser {
  id: number;
  username: string;
  email: string;
  nombre?: string;
  role_id: number;
  rol: string;
}

//interfaz que describe lo que espera recibir desde login.php
interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  expires_at?: string;
  user?: LoginUser;
}

//decorador
@Component({
  selector: "app-login",
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
  imports: [IonContent, CommonModule, NgClass, FormsModule],
})

//dos servicios, router nos lleva a usuarios, storage para guardar la sesion
export class LoginPage {
  // ==========================================
  // SERVICIOS
  // ==========================================

  private router = inject(Router);
  private storage = inject(StorageService);
  private apiConfig = inject(ApiConfigService);

  // ==========================================
  // API PHP
  // ==========================================

  // ==========================================
  // CAMPOS DEL LOGIN
  // ==========================================

  servidor = "localhost:80";
  username = "";
  password = "";

  // ==========================================
  // ESTADOS DE LA INTERFAZ
  // ==========================================

  userFocus = false;
  passFocus = false;

  isTest = false;
  isTestTwo = false;

  showFields = true;
  showSuccess = false;

  authentDisplay = "none";
  authentRight = 90;
  authentOpacity = 0;

  isAuthentVisible = false;

  loading = false;

  errorMessage = "";

  authenticatedUser: LoginUser | null = null;

  // ==========================================
  // CADA VEZ QUE ENTRAMOS AL LOGIN
  // ==========================================

  async ionViewWillEnter(): Promise<void> {
    console.log("Entrando a /login");

    // Recuperar la última IP/host configurada.
    this.servidor = await this.apiConfig.obtenerHost();

    // Limpiar campos
    this.username = "";
    this.password = "";

    // Reiniciar estados del formulario
    this.userFocus = false;
    this.passFocus = false;

    // Reiniciar animaciones
    this.isTest = false;
    this.isTestTwo = false;

    // Volver a mostrar el formulario
    this.showFields = true;
    this.showSuccess = false;

    // Reiniciar autenticación visual
    this.authentDisplay = "none";
    this.authentRight = 90;
    this.authentOpacity = 0;

    this.isAuthentVisible = false;

    // Reiniciar estados
    this.loading = false;
    this.errorMessage = "";

    // Limpiar usuario temporal
    this.authenticatedUser = null;
  }

  // ==========================================
  // INICIAR SESIÓN
  // ==========================================

  async login(): Promise<void> {
    // Evitar varios intentos al mismo tiempo
    if (this.loading) {
      return;
    }

    this.errorMessage = "";

    // ========================================
    // VALIDAR CAMPOS
    // ========================================

    if (!this.servidor.trim()) {
      this.errorMessage =
        "Debes indicar la IP del servidor, por ejemplo 192.168.1.120:80.";
      return;
    }

    if (!this.username.trim() || !this.password) {
      this.errorMessage = "Username and password are required.";

      return;
    }

    // ========================================
    // INICIAR ANIMACIÓN
    // ========================================

    this.startAnimation();

    this.loading = true;

    try {
      // ======================================
      // PETICIÓN AL LOGIN.PHP
      // ======================================

      // Guardar el origen de datos elegido y construir login.php dinámicamente.
      await this.apiConfig.guardarHost(this.servidor);
      const apiUrl = await this.apiConfig.endpoint("login.php");
      console.log("Login API:", apiUrl);

      const response = await axios.post<LoginResponse>(
        apiUrl,
        {
          username: this.username.trim(),
          password: this.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      // ======================================
      // LOGIN RECHAZADO POR LA API
      // ======================================

      if (!response.data.success) {
        this.showError(response.data.message || "Invalid credentials.");

        return;
      }

      // ======================================
      // COMPROBAR USUARIO Y TOKEN
      // ======================================

      if (!response.data.user || !response.data.token) {
        this.showError(
          "El servidor no devolvió los datos completos de autenticación.",
        );
        return;
      }

      // ======================================
      // LOGIN CORRECTO
      // ======================================

      console.log("LOGIN EXITOSO");

      console.log("Status HTTP:", response.status);

      console.log("Respuesta completa:", response.data);

      console.log("Usuario autenticado:", response.data.user);

      // ======================================
      // NORMALIZAR USUARIO
      // ======================================

      const usuario: LoginUser = {
        ...response.data.user,
        role_id: Number(response.data.user.role_id),
      };

      this.authenticatedUser = usuario;

      console.log("Usuario normalizado:", usuario);

      console.log("Role ID:", usuario.role_id);

      console.log("Rol:", usuario.rol);

      // ======================================
      // GUARDAR SESIÓN EN PREFERENCES
      // ======================================

      // Guardar los datos del usuario
      await this.storage.guardarUsuario(usuario);

      // Guardar el token generado por login.php
      await this.storage.guardarToken(response.data.token);

      console.log("Usuario guardado en Preferences");
      console.log("Token de autenticación guardado en Preferences");

      // ======================================
      // ANIMACIÓN Y REDIRECCIÓN
      // ======================================

      this.finishSuccess();
    } catch (error: unknown) {
      console.error("ERROR DURANTE EL LOGIN:", error);

      if (axios.isAxiosError(error)) {
        this.showError(
          error.response?.data?.message ||
            "Could not connect to the authentication server.",
        );
      } else {
        this.showError("An unexpected error occurred.");
      }
    } finally {
      this.loading = false;
    }
  }

  // ==========================================
  // ANIMACIÓN DE INICIO
  // ==========================================

  private startAnimation(): void {
    this.isTest = true;

    setTimeout(() => {
      this.isTestTwo = true;
    }, 300);

    setTimeout(() => {
      this.authentDisplay = "block";

      this.authentRight = -320;

      this.authentOpacity = 1;

      this.isAuthentVisible = true;
    }, 500);
  }

  // ==========================================
  // ANIMACIÓN DE LOGIN EXITOSO
  // ==========================================

  private finishSuccess(): void {
    setTimeout(() => {
      this.authentRight = 90;

      this.authentOpacity = 0;

      this.isTestTwo = false;
    }, 400);

    setTimeout(() => {
      this.isTest = false;

      this.showFields = false;

      this.authentDisplay = "none";
    }, 700);

    setTimeout(() => {
      this.showSuccess = true;
    }, 900);

    // ========================================
    // REDIRECCIÓN A USUARIOS
    // ========================================

    setTimeout(async () => {
      console.log("REDIRECCIONANDO A /usuarios");

      await this.router.navigateByUrl("/biblioteca", {
        replaceUrl: true,
      });
    }, 1200);
  }

  // ==========================================
  // MOSTRAR ERROR
  // ==========================================

  private showError(message: string): void {
    this.errorMessage = message;

    this.isTest = false;
    this.isTestTwo = false;

    this.authentDisplay = "none";

    this.authentRight = 90;
    this.authentOpacity = 0;

    this.isAuthentVisible = false;
  }
}

//si el login falla, la interfaz vuelve a un estado en el que el usuario puede corregir sus datos e intentarlo nuevamente.
