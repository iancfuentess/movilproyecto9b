import { Component, inject } from "@angular/core";
import { CommonModule, NgClass } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { IonContent } from "@ionic/angular";
import { Router } from "@angular/router";
import axios from "axios";
import { StorageService } from "../services/storage";

interface LoginUser {
  id: number;
  username: string;
  email: string;
  nombre?: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user?: LoginUser;
}

@Component({
  selector: "app-login",
  templateUrl: "./login.page.html",
  styleUrls: ["./login.page.scss"],
  imports: [IonContent, CommonModule, NgClass, FormsModule],
})
export class LoginPage {
  // Router usando inject()
  private router = inject(Router);

  // Servicio para guardar información localmente
  private storage = inject(StorageService);

  // URL de tu API PHP
  private readonly apiUrl = "http://localhost/ionic-api/login.php";

  username = "";
  password = "";

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

  async login(): Promise<void> {
    // Evitar múltiples intentos simultáneos
    if (this.loading) return;

    this.errorMessage = "";

    // Validar campos
    if (!this.username.trim() || !this.password) {
      this.errorMessage = "Username and password are required.";
      return;
    }

    // Iniciar animación
    this.startAnimation();

    this.loading = true;

    try {
      const response = await axios.post<LoginResponse>(
        this.apiUrl,
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

      // Si la API responde que el login no fue correcto
      if (!response.data.success) {
        this.showError(response.data.message || "Invalid credentials.");
        return;
      }

      // Login correcto
      console.log("LOGIN EXITOSO");
      console.log("Status HTTP:", response.status);
      console.log("Respuesta completa:", response.data);
      console.log("Usuario autenticado:", response.data.user);

      if (response.data.user) {
        this.authenticatedUser = response.data.user;

        // Guardar el usuario localmente
        await this.storage.guardarUsuario(response.data.user);

        console.log("Usuario guardado en Preferences");
      }

      // Ejecutar animación de éxito
      this.finishSuccess();
    } catch (error: unknown) {
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

    // Navegar automáticamente a usuarios
    setTimeout(() => {
      console.log("REDIRECCIONANDO A /usuarios");
      this.router.navigateByUrl("/usuarios");
    }, 1200);
  }

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
