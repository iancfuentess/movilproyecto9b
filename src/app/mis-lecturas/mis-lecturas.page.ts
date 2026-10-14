import { Component, ChangeDetectorRef, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { IonContent } from "@ionic/angular";
import axios from "axios";

import { StorageService, UsuarioGuardado } from "../services/storage";
import { ApiConfigService } from "../services/api-config";

interface LibroLectura {
  usuario_libro_id: number;
  estado: "pendiente" | "leyendo" | "terminado";
  pagina_actual: number;
  fecha_agregado: string;
  fecha_inicio: string | null;
  fecha_finalizacion: string | null;
  id: number;
  titulo: string;
  autor: string;
  genero: string;
  total_paginas: number | null;
  portada_url: string | null;
  descripcion: string | null;
  calificacion: number | null;
  portadaError?: boolean;
}

interface UsuarioLibrosResponse {
  success: boolean;
  message?: string;
  libros?: LibroLectura[];
}

interface ActualizarLecturaResponse {
  success: boolean;
  message?: string;
  usuario_libro_id?: number;
  estado?: "pendiente" | "leyendo" | "terminado";
  pagina_actual?: number;
  total_paginas?: number | null;
}

interface EliminarLecturaResponse {
  success: boolean;
  message?: string;
  usuario_libro_id?: number;
}

@Component({
  selector: "app-mis-lecturas",
  standalone: true,
  imports: [CommonModule, RouterLink, IonContent],
  templateUrl: "./mis-lecturas.page.html",
  styleUrls: ["./mis-lecturas.page.scss"],
})
export class MisLecturasPage {
  private router = inject(Router);
  private storage = inject(StorageService);
  private apiConfig = inject(ApiConfigService);
  private cdr = inject(ChangeDetectorRef);

  usuarioActual: UsuarioGuardado | null = null;

  estado: "pendientes" | "leyendo" | "terminados" = "pendientes";

  libros: LibroLectura[] = [];
  loading = false;
  errorMessage = "";

  actualizandoLibroId: number | null = null;
  progresoMensaje: Record<number, string> = {};
  progresoError: Record<number, string> = {};

  // Libro pendiente de confirmación para eliminar
  libroParaEliminar: LibroLectura | null = null;

  // ==========================================
  // CARGAR MIS LECTURAS
  // ==========================================

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

    await this.cargarMisLecturas(token);
  }

  private async cargarMisLecturas(token: string): Promise<void> {
    this.loading = true;
    this.errorMessage = "";

    try {
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      const response = await axios.get<UsuarioLibrosResponse>(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      if (response.data.success && Array.isArray(response.data.libros)) {
        this.libros = response.data.libros;
        return;
      }

      this.libros = [];
      this.errorMessage =
        response.data.message || "No se pudieron cargar tus lecturas.";
    } catch (error: unknown) {
      this.libros = [];

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();
          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });
          return;
        }

        this.errorMessage =
          error.response?.data?.message ||
          "No se pudieron cargar tus lecturas.";
      } else {
        this.errorMessage = "No se pudo conectar con Mis lecturas.";
      }
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // COMENZAR LECTURA
  // ==========================================

  async comenzarLectura(libro: LibroLectura): Promise<void> {
    if (this.actualizandoLibroId !== null) return;

    this.errorMessage = "";

    const token = await this.storage.obtenerToken();

    if (!token) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    const id = libro.usuario_libro_id;
    this.actualizandoLibroId = id;

    try {
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      const response = await axios.put<ActualizarLecturaResponse>(
        apiUrl,
        {
          usuario_libro_id: id,
          estado: "leyendo",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (!response.data.success) {
        this.errorMessage =
          response.data.message || "No se pudo iniciar la lectura.";
        return;
      }

      this.libros = this.libros.map((item) =>
        item.usuario_libro_id === id
          ? {
              ...item,
              estado: "leyendo" as const,
              fecha_inicio: new Date().toISOString(),
            }
          : item,
      );

      this.estado = "leyendo";
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();
          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });
          return;
        }

        this.errorMessage =
          error.response?.data?.message || "No se pudo iniciar la lectura.";
      } else {
        this.errorMessage = "No se pudo conectar con el servidor.";
      }
    } finally {
      this.actualizandoLibroId = null;
    }
  }

  // ==========================================
  // GUARDAR PROGRESO
  // ==========================================

  async guardarProgreso(libro: LibroLectura, valor: string): Promise<void> {
    if (this.actualizandoLibroId !== null) return;

    const id = libro.usuario_libro_id;

    this.progresoError[id] = "";
    this.progresoMensaje[id] = "";

    const texto = valor.trim();

    if (!/^\d+$/.test(texto) || !Number.isSafeInteger(Number(texto))) {
      this.progresoError[id] = "Introduce un número entero de página válido.";
      return;
    }

    const pagina = Number(texto);

    if (libro.total_paginas !== null && pagina > libro.total_paginas) {
      this.progresoError[id] =
        `Este libro tiene ${libro.total_paginas} páginas como máximo.`;
      return;
    }

    const token = await this.storage.obtenerToken();

    if (!token) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    this.actualizandoLibroId = id;

    try {
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      const response = await axios.put<ActualizarLecturaResponse>(
        apiUrl,
        {
          usuario_libro_id: id,
          pagina_actual: pagina,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (!response.data.success) {
        this.progresoError[id] =
          response.data.message || "No se pudo guardar el progreso.";
        return;
      }

      const paginaGuardada = response.data.pagina_actual ?? pagina;

      this.libros = this.libros.map((item) =>
        item.usuario_libro_id === id
          ? {
              ...item,
              pagina_actual: paginaGuardada,
            }
          : item,
      );

      this.progresoMensaje[id] = `Progreso guardado: página ${paginaGuardada}.`;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();
          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });
          return;
        }

        this.progresoError[id] =
          error.response?.data?.message || "No se pudo guardar el progreso.";
      } else {
        this.progresoError[id] = "No se pudo conectar con el servidor.";
      }
    } finally {
      this.actualizandoLibroId = null;
    }
  }

  // ==========================================
  // TERMINAR LECTURA
  // ==========================================

  async terminarLectura(libro: LibroLectura): Promise<void> {
    if (this.actualizandoLibroId !== null || libro.estado !== "leyendo") {
      return;
    }

    const id = libro.usuario_libro_id;

    this.progresoError[id] = "";
    this.progresoMensaje[id] = "";

    const token = await this.storage.obtenerToken();

    if (!token) {
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    this.actualizandoLibroId = id;

    try {
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      const response = await axios.put<ActualizarLecturaResponse>(
        apiUrl,
        {
          usuario_libro_id: id,
          estado: "terminado",
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        },
      );

      if (!response.data.success) {
        this.progresoError[id] =
          response.data.message || "No se pudo terminar la lectura.";
        return;
      }

      this.libros = this.libros.map((item) =>
        item.usuario_libro_id === id
          ? {
              ...item,
              estado: "terminado" as const,
              pagina_actual:
                response.data.pagina_actual ??
                item.total_paginas ??
                item.pagina_actual,
              fecha_finalizacion: new Date().toISOString(),
            }
          : item,
      );

      this.estado = "terminados";
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();
          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });
          return;
        }

        this.progresoError[id] =
          error.response?.data?.message || "No se pudo terminar la lectura.";
      } else {
        this.progresoError[id] = "No se pudo conectar con el servidor.";
      }
    } finally {
      this.actualizandoLibroId = null;
    }
  }

  // ==========================================
  // ELIMINAR DE MI LISTA - NUEVO
  // ==========================================

  solicitarEliminar(libro: LibroLectura): void {
    if (this.actualizandoLibroId !== null) return;

    this.libroParaEliminar = libro;
  }

  cancelarEliminar(): void {
    if (this.actualizandoLibroId !== null) return;

    this.libroParaEliminar = null;
  }

  async confirmarEliminar(): Promise<void> {
    const libro = this.libroParaEliminar;

    if (!libro || this.actualizandoLibroId !== null) return;

    const id = libro.usuario_libro_id;

    const token = await this.storage.obtenerToken();

    if (!token) {
      this.libroParaEliminar = null;
      await this.router.navigateByUrl("/login", {
        replaceUrl: true,
      });
      return;
    }

    this.actualizandoLibroId = id;
    this.errorMessage = "";

    try {
      const apiUrl = await this.apiConfig.endpoint("usuario-libros.php");

      const response = await axios.delete<EliminarLecturaResponse>(apiUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          usuario_libro_id: id,
        },
        timeout: 10000,
      });

      if (!response.data.success) {
        this.progresoError[id] =
          response.data.message || "No se pudo eliminar el libro.";
        this.libroParaEliminar = null;
        return;
      }

      // Quitar la tarjeta sin recargar la página
      // Eliminar inmediatamente la tarjeta de la pantalla
      this.libros = this.libros.filter((item) => item.usuario_libro_id !== id);

      // Limpiar mensajes del libro eliminado
      delete this.progresoError[id];
      delete this.progresoMensaje[id];

      // Cerrar ventana de confirmación
      this.libroParaEliminar = null;

      // Forzar actualización visual de Angular
      this.cdr.detectChanges();

      console.log("Libro eliminado de Mi lista:", libro.titulo);
    } catch (error: unknown) {
      this.libroParaEliminar = null;

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          await this.storage.eliminarUsuario();
          await this.router.navigateByUrl("/login", {
            replaceUrl: true,
          });
          return;
        }

        this.progresoError[id] =
          error.response?.data?.message || "No se pudo eliminar el libro.";
      } else {
        this.progresoError[id] = "No se pudo conectar con el servidor.";
      }
    } finally {
      this.actualizandoLibroId = null;
      this.cdr.detectChanges();
    }
  }

  // ==========================================
  // FILTRAR LIBROS POR ESTADO
  // ==========================================

  get librosFiltrados(): LibroLectura[] {
    if (this.estado === "pendientes") {
      return this.libros.filter((libro) => libro.estado === "pendiente");
    }

    if (this.estado === "leyendo") {
      return this.libros.filter((libro) => libro.estado === "leyendo");
    }

    return this.libros.filter((libro) => libro.estado === "terminado");
  }

  seleccionarEstado(estado: "pendientes" | "leyendo" | "terminados"): void {
    this.estado = estado;
    this.errorMessage = "";
  }

  get tituloVacio(): string {
    if (this.estado === "pendientes") {
      return "No tienes libros pendientes";
    }

    if (this.estado === "leyendo") {
      return "No estás leyendo ningún libro";
    }

    return "Todavía no has terminado libros";
  }

  get descripcionVacia(): string {
    if (this.estado === "pendientes") {
      return "Agrega libros desde la Biblioteca para comenzar tu lista.";
    }

    if (this.estado === "leyendo") {
      return "Cuando comiences una lectura aparecerá aquí.";
    }

    return "Los libros que termines aparecerán en esta sección.";
  }

  portadaNoDisponible(libro: LibroLectura): void {
    libro.portadaError = true;
  }
}
