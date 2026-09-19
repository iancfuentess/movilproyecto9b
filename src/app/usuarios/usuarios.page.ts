import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router, RouterLink } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import { StorageService } from "../services/storage";

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  created_at?: string;
}

@Component({
  selector: "app-usuarios",
  templateUrl: "./usuarios.page.html",
  styleUrls: ["./usuarios.page.scss"],
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class UsuariosPage implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private apiUrl = "http://localhost/ionic-api/users.php";

  usuarios: Usuario[] = [];

  cargando = false;
  error = "";

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;
    this.error = "";

    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta;
        this.cargando = false;
      },

      error: (error) => {
        console.error(error);

        this.error =
          "No se pudieron cargar los usuarios desde la base de datos.";

        this.cargando = false;
      },
    });
  }

  obtenerInicial(nombre: string): string {
    if (!nombre) {
      return "?";
    }

    return nombre.charAt(0).toUpperCase();
  }

  async cerrarSesion(): Promise<void> {
    await this.storage.eliminarUsuario();

    console.log("Sesión eliminada de Preferences");

    await this.router.navigateByUrl("/login");
  }
}
