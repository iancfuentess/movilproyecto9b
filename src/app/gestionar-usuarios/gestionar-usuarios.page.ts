import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { RouterLink } from "@angular/router";

interface Usuario {
  id: number;
  username: string;
  email: string;
  nombre: string;
  created_at?: string;
}

@Component({
  selector: "app-gestionar-usuarios",
  templateUrl: "./gestionar-usuarios.page.html",
  styleUrls: ["./gestionar-usuarios.page.scss"],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
})
export class GestionarUsuariosPage implements OnInit {
  private http = inject(HttpClient);

  private apiUrl = "http://localhost/ionic-api/users.php";

  usuarios: Usuario[] = [];

  username = "";
  email = "";
  nombre = "";
  password = "";

  mensaje = "";
  cargando = false;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando = true;

    this.http.get<Usuario[]>(this.apiUrl).subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta;
        this.cargando = false;
      },

      error: (error) => {
        console.error(error);
        this.mensaje = "Error al cargar los usuarios";
        this.cargando = false;
      },
    });
  }

  agregarUsuario(): void {
    if (
      !this.username.trim() ||
      !this.email.trim() ||
      !this.nombre.trim() ||
      !this.password.trim()
    ) {
      this.mensaje = "Completa todos los campos";
      return;
    }

    const nuevoUsuario = {
      username: this.username,
      email: this.email,
      nombre: this.nombre,
      password: this.password,
    };

    this.http.post(this.apiUrl, nuevoUsuario).subscribe({
      next: () => {
        this.mensaje = "Usuario agregado correctamente";

        this.username = "";
        this.email = "";
        this.nombre = "";
        this.password = "";

        this.cargarUsuarios();
      },

      error: (error) => {
        console.error(error);

        this.mensaje = error?.error?.message || "No se pudo agregar el usuario";
      },
    });
  }

  eliminarUsuario(id: number): void {
    const confirmar = confirm("¿Seguro que deseas eliminar este usuario?");

    if (!confirmar) {
      return;
    }

    this.http.delete(`${this.apiUrl}?id=${id}`).subscribe({
      next: () => {
        this.mensaje = "Usuario eliminado correctamente";

        this.cargarUsuarios();
      },

      error: (error) => {
        console.error(error);

        this.mensaje =
          error?.error?.message || "No se pudo eliminar el usuario";
      },
    });
  }
}
