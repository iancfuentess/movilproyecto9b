import { ChangeDetectorRef, Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { IonContent } from "@ionic/angular";
import axios from "axios";

import { StorageService, UsuarioGuardado } from "../services/storage";

import { ApiConfigService } from "../services/api-config";

// ==========================================
// MODELO DE LIBRO
// ==========================================

interface Libro {
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  total_paginas: number | null;
  portada_url: string | null;
  descripcion: string | null;
  calificacion: number | null;
  created_at: string;

  // Solo se usa en la interfaz si una imagen falla
  portadaError?: boolean;
}

// ==========================================
// RESPUESTA DE LIBROS.PHP
// ==========================================

interface LibrosResponse {
  success: boolean;
  message?: string;
  libros?: Libro[];
}

@Component({
  selector: "app-biblioteca",
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IonContent],
  templateUrl: "./biblioteca.page.html",
  styleUrls: ["./biblioteca.page.scss"],
})
export class BibliotecaPage {
  // ========================================
  // SERVICIOS
  // ========================================

  private router = inject(Router);
  private storage = inject(StorageService);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  // ==========================================
  // MENÚ DE NAVEGACIÓN
  // ==========================================

  menuAbierto = false;
  cerrandoSesion = false;

  get esAdministrador(): boolean {
    return Number(this.usuarioActual?.role_id) === 1;
  }

  get puedeVerUsuarios(): boolean {
    const rol = Number(this.usuarioActual?.role_id);
    return rol === 1 || rol === 2;
  }

  alternarMenu(): void {
    this.menuAbierto = !this.menuAbierto;
    this.cdr.detectChanges();
  }

  cerrarMenu(): void {
    this.menuAbierto = false;
    this.cdr.detectChanges();
  }

  async cerrarSesion(): Promise<void> {
    if (this.cerrandoSesion) return;

    this.cerrandoSesion = true;

    try {
      await this.storage.eliminarUsuario();

      this.usuarioActual = null;
      this.menuAbierto = false;

      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("No se pudo cerrar sesión.");
    } finally {
      this.cerrandoSesion = false;
      this.cdr.detectChanges();
    }
  }

  // ========================================
  // USUARIO
  // ========================================

  usuarioActual: UsuarioGuardado | null = null;

  // ========================================
  // BUSCADOR Y FILTROS
  // ========================================

  busqueda = "";

  generoSeleccionado = "Todos";

  generos = ["Todos", "Fantasía", "Ciencia ficción", "Novela", "Misterio"];

  // ========================================
  // LIBROS
  // ========================================

  libros: Libro[] = [];

  loading = false;

  errorMessage = "";

  // ========================================
  // AL ENTRAR A BIBLIOTECA
  // ========================================

  async ionViewWillEnter(): Promise<void> {
    const [usuario, token] = await Promise.all([
      this.storage.obtenerUsuario(),
      this.storage.obtenerToken(),
    ]);

    if (!usuario || !token) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    this.usuarioActual = {
      ...usuario,
      role_id: Number(usuario.role_id),
    };

    // Mostrar Todos al entrar a Biblioteca
    this.generoSeleccionado = "Todos";
    this.busqueda = "";

    // Consultar el catálogo desde MariaDB
    await this.cargarLibros(token);

    // Actualizar la pantalla automáticamente
    this.cdr.detectChanges();
  }

  // ========================================
  // CARGAR LIBROS DESDE LIBROS.PHP
  // ========================================

  private async cargarLibros(token: string): Promise<void> {
    this.loading = true;

    this.errorMessage = "";

    try {
      // Construye automáticamente:
      //
      // PC:
      // http://localhost:80/ionic-api/libros.php
      //
      // Android:
      // http://192.168.x.x:80/ionic-api/libros.php

      const apiUrl = await this.apiConfig.endpoint("libros.php");

      console.log("Libros API:", apiUrl);

      const response = await axios.get<LibrosResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },

        timeout: 10000,
      });

      // ====================================
      // RESPUESTA CORRECTA
      // ====================================

      if (response.data.success && Array.isArray(response.data.libros)) {
        this.libros = response.data.libros;

        console.log("Libros cargados desde MariaDB:", this.libros);

        return;
      }

      // ====================================
      // RESPUESTA SIN LIBROS
      // ====================================

      this.libros = [];

      this.errorMessage =
        response.data.message || "No se pudieron cargar los libros.";
    } catch (error: unknown) {
      console.error("Error cargando libros:", error);

      this.libros = [];

      // ====================================
      // ERROR DE AXIOS
      // ====================================

      if (axios.isAxiosError(error)) {
        // Token inválido o expirado
        if (error.response?.status === 401) {
          console.log("Token inválido o expirado.");

          await this.storage.eliminarUsuario();

          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });

          return;
        }

        // Mensaje enviado por PHP
        const mensajeServidor = error.response?.data?.message;

        if (mensajeServidor) {
          this.errorMessage = mensajeServidor;

          return;
        }
      }

      // Error de conexión
      this.errorMessage = "No se pudo conectar con el catálogo de libros.";
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ========================================
  // FILTRAR LIBROS
  // ========================================

  get librosFiltrados(): Libro[] {
    const texto = this.busqueda.trim().toLowerCase();

    return this.libros.filter((libro) => {
      const coincideGenero =
        this.generoSeleccionado === "Todos" ||
        libro.genero === this.generoSeleccionado;

      const coincideBusqueda =
        !texto ||
        libro.titulo.toLowerCase().includes(texto) ||
        libro.autor.toLowerCase().includes(texto);

      return coincideGenero && coincideBusqueda;
    });
  }

  // ========================================
  // SELECCIONAR GÉNERO
  // ========================================

  seleccionarGenero(genero: string): void {
    this.generoSeleccionado = genero;
  }

  // ========================================
  // AGREGAR A MI LISTA
  // ========================================

  async agregarLibro(libro: Libro): Promise<void> {
    console.log("Agregando libro a Mi lista:", libro);

    try {
      // Obtener token guardado al iniciar sesión
      const token = await this.storage.obtenerToken();

      if (!token) {
        await this.router.navigateByUrl("/login", {
          replaceUrl: true,
        });

        return;
      }

      // Construir la URL según el servidor configurado
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      console.log("Usuario libros API:", apiUrl);

      // Guardar el libro para el usuario autenticado
      const response = await axios.post(
        apiUrl,
        {
          libro_id: libro.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        },
      );

      console.log("Libro agregado correctamente:", response.data);

      alert(`"${libro.titulo}" fue agregado a Mis lecturas.`);
    } catch (error: unknown) {
      console.error("Error agregando libro:", error);

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();

          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });

          return;
        }

        const mensaje =
          error.response?.data?.message ||
          "No se pudo agregar el libro a Mis lecturas.";

        alert(mensaje);

        return;
      }

      alert("Ocurrió un error al agregar el libro.");
    }
  }

  // ========================================
  // ERROR AL CARGAR PORTADA
  // ========================================

  portadaNoDisponible(libro: Libro): void {
    libro.portadaError = true;
  }
}
